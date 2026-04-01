import type { BattleState, Card, EnemyAction, StatusEffect } from '../types';

// ===== 데미지 계산 =====
function getStrength(effects: StatusEffect[]): number {
  return effects.find(e => e.type === 'strength')?.stacks ?? 0;
}

function isVulnerable(effects: StatusEffect[]): boolean {
  return (effects.find(e => e.type === 'vulnerable')?.stacks ?? 0) > 0;
}

function isWeak(effects: StatusEffect[]): boolean {
  return (effects.find(e => e.type === 'weakness')?.stacks ?? 0) > 0;
}

function calcDamage(baseDamage: number, attackerEffects: StatusEffect[], defenderEffects: StatusEffect[]): number {
  let dmg = baseDamage + getStrength(attackerEffects);
  if (isWeak(attackerEffects)) dmg = Math.floor(dmg * 0.75);
  if (isVulnerable(defenderEffects)) dmg = Math.floor(dmg * 1.5);
  return Math.max(0, dmg);
}

// ===== 상태이상 적용 =====
function updateStatusEffect(effects: StatusEffect[], type: StatusEffect['type'], amount: number): StatusEffect[] {
  const existing = effects.find(e => e.type === type);
  if (existing) {
    return effects.map(e => e.type === type ? { ...e, stacks: e.stacks + amount } : e);
  }
  return [...effects, { type, stacks: amount }];
}

function decrementStatusEffects(effects: StatusEffect[]): StatusEffect[] {
  return effects
    .map(e => ({ ...e, stacks: e.stacks - 1 }))
    .filter(e => e.stacks > 0);
}

// ===== 전투 액션 =====
export function dealDamage(state: BattleState, enemyIndex: number, baseDamage: number): BattleState {
  const enemy = state.enemies[enemyIndex];
  if (!enemy || enemy.hp <= 0) return state;

  const finalDmg = calcDamage(baseDamage, state.player.statusEffects, enemy.statusEffects);
  const blockAbsorbed = Math.min(enemy.block, finalDmg);
  const hpDmg = finalDmg - blockAbsorbed;

  const updatedEnemy = {
    ...enemy,
    block: enemy.block - blockAbsorbed,
    hp: enemy.hp - hpDmg,
  };

  return {
    ...state,
    enemies: state.enemies.map((e, i) => i === enemyIndex ? updatedEnemy : e),
  };
}

// attackerIndex: 공격하는 적의 인덱스 (strength/weakness 계산에 사용)
export function dealDamageToPlayer(state: BattleState, baseDamage: number, attackerIndex = 0): BattleState {
  const attacker = state.enemies[attackerIndex];
  const attackerEffects = attacker?.statusEffects ?? [];
  const finalDmg = calcDamage(baseDamage, attackerEffects, state.player.statusEffects);
  const blockAbsorbed = Math.min(state.player.block, finalDmg);
  const hpDmg = finalDmg - blockAbsorbed;

  return {
    ...state,
    player: {
      ...state.player,
      block: state.player.block - blockAbsorbed,
      hp: Math.max(0, state.player.hp - hpDmg),
    },
  };
}

export function addBlock(state: BattleState, amount: number): BattleState {
  return {
    ...state,
    player: { ...state.player, block: state.player.block + amount },
  };
}

export function addBlockToEnemy(state: BattleState, enemyIndex: number, amount: number): BattleState {
  const enemy = state.enemies[enemyIndex];
  if (!enemy) return state;
  return {
    ...state,
    enemies: state.enemies.map((e, i) =>
      i === enemyIndex ? { ...e, block: e.block + amount } : e
    ),
  };
}

export function applyStatusEffect(
  state: BattleState,
  target: 'player' | 'enemy',
  type: StatusEffect['type'],
  amount: number,
  enemyIndex = 0
): BattleState {
  if (target === 'player') {
    return {
      ...state,
      player: {
        ...state.player,
        statusEffects: updateStatusEffect(state.player.statusEffects, type, amount),
      },
    };
  } else {
    const enemy = state.enemies[enemyIndex];
    if (!enemy) return state;
    return {
      ...state,
      enemies: state.enemies.map((e, i) =>
        i === enemyIndex
          ? { ...e, statusEffects: updateStatusEffect(e.statusEffects, type, amount) }
          : e
      ),
    };
  }
}

// ===== 카드 처리 =====
export function drawCards(state: BattleState, count: number): BattleState {
  let deck = [...state.deck];
  let discard = [...state.discardPile];
  let hand = [...state.hand];

  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffle(discard);
      discard = [];
    }
    const [drawn, ...rest] = deck;
    hand = [...hand, drawn];
    deck = rest;
  }

  return { ...state, deck, discardPile: discard, hand };
}

export function playCard(state: BattleState, cardId: string, targetIndex = 0): BattleState {
  const card = state.hand.find(c => c.id === cardId);
  if (!card || state.energy < card.cost) return state;

  const afterRemove: BattleState = {
    ...state,
    hand: state.hand.filter(c => c.id !== cardId),
    discardPile: [...state.discardPile, card],
    energy: state.energy - card.cost,
  };

  return card.effect(afterRemove, targetIndex);
}

export function discardHand(state: BattleState): BattleState {
  return {
    ...state,
    discardPile: [...state.discardPile, ...state.hand],
    hand: [],
  };
}

// ===== 턴 처리 =====
export function startPlayerTurn(state: BattleState): BattleState {
  // 플레이어 블록은 플레이어 턴 시작 시 리셋 (Slay the Spire 규칙)
  const reset = {
    ...state,
    energy: state.maxEnergy,
    player: { ...state.player, block: 0 },
  };
  return drawCards(reset, 5);
}

export function endPlayerTurn(state: BattleState): BattleState {
  const afterDiscard = discardHand(state);
  return executeEnemyTurns(afterDiscard);
}

function executeEnemyTurns(state: BattleState): BattleState {
  let current = state;

  // 적 블록은 적 턴 시작 시 리셋 (Slay the Spire 규칙)
  current = {
    ...current,
    enemies: current.enemies.map(e => ({ ...e, block: 0 })),
  };

  for (let i = 0; i < current.enemies.length; i++) {
    if (current.player.hp <= 0) break;
    const enemy = current.enemies[i];
    if (enemy.hp <= 0) continue;

    // currentIntent와 일치하는 액션을 실행 — 예고된 행동 = 실제 실행 행동 보장
    const action = current.enemies[i].actions.find(
      a => a.intent.type === enemy.currentIntent.type &&
           a.intent.value === enemy.currentIntent.value
    ) ?? pickEnemyAction(current.enemies[i].actions);

    current = action.execute(current, i);

    // 실행 후 다음 턴 인텐트를 새로 결정
    current = {
      ...current,
      enemies: current.enemies.map((e, idx) =>
        idx === i
          ? {
              ...e,
              currentIntent: pickEnemyAction(e.actions).intent,
              statusEffects: decrementStatusEffects(e.statusEffects),
            }
          : e
      ),
    };
  }

  current = {
    ...current,
    player: {
      ...current.player,
      statusEffects: decrementStatusEffects(current.player.statusEffects),
    },
    turn: current.turn + 1,
  };

  return startPlayerTurn(current);
}

function pickEnemyAction(actions: EnemyAction[]): EnemyAction {
  const total = actions.reduce((sum, a) => sum + a.weight, 0);
  let rand = Math.random() * total;
  for (const action of actions) {
    rand -= action.weight;
    if (rand <= 0) return action;
  }
  return actions[0];
}

// ===== 유틸 =====
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function isBattleOver(state: BattleState): 'win' | 'lose' | null {
  if (state.player.hp <= 0) return 'lose';
  if (state.enemies.every(e => e.hp <= 0)) return 'win';
  return null;
}

export function initBattle(
  deck: Card[],
  enemies: import('../types').Enemy[],
  playerHp: number,
  playerMaxHp: number,
  playerGold: number
): BattleState {
  const shuffledDeck = shuffle(deck);
  const initialState: BattleState = {
    player: {
      hp: playerHp,
      maxHp: playerMaxHp,
      block: 0,
      statusEffects: [],
      gold: playerGold,
    },
    enemies,
    deck: shuffledDeck,
    hand: [],
    discardPile: [],
    energy: 3,
    maxEnergy: 3,
    turn: 1,
  };
  return drawCards(initialState, 5);
}
