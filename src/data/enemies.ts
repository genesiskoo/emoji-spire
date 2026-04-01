import type { Enemy, EnemyAction, BattleState } from '../types';
import { dealDamageToPlayer, addBlockToEnemy, applyStatusEffect } from '../logic/battle';

function pickAction(actions: EnemyAction[]): EnemyAction {
  const total = actions.reduce((sum, a) => sum + a.weight, 0);
  let rand = Math.random() * total;
  for (const action of actions) {
    rand -= action.weight;
    if (rand <= 0) return action;
  }
  return actions[0];
}

export function createSlime(): Enemy {
  const actions: EnemyAction[] = [
    {
      intent: { type: 'attack', value: 8 },
      execute: (state: BattleState, selfIndex: number) => dealDamageToPlayer(state, 8, selfIndex),
      weight: 2,
    },
    {
      intent: { type: 'defend' },
      execute: (state: BattleState, selfIndex: number) => addBlockToEnemy(state, selfIndex, 6),
      weight: 1,
    },
  ];
  const first = pickAction(actions);
  return {
    id: `slime_${crypto.randomUUID()}`,
    name: '슬라임',
    emoji: '🟢',
    maxHp: 20,
    hp: 20,
    block: 0,
    statusEffects: [],
    actions,
    currentIntent: first.intent,
  };
}

export function createGoblin(): Enemy {
  const actions: EnemyAction[] = [
    {
      intent: { type: 'attack', value: 10 },
      execute: (state: BattleState, selfIndex: number) => dealDamageToPlayer(state, 10, selfIndex),
      weight: 3,
    },
    {
      intent: { type: 'buff' },
      execute: (state: BattleState, selfIndex: number) => applyStatusEffect(state, 'enemy', 'strength', 1, selfIndex),
      weight: 1,
    },
  ];
  const first = pickAction(actions);
  return {
    id: `goblin_${crypto.randomUUID()}`,
    name: '고블린',
    emoji: '👺',
    maxHp: 28,
    hp: 28,
    block: 0,
    statusEffects: [],
    actions,
    currentIntent: first.intent,
  };
}

export function createSkeleton(): Enemy {
  const actions: EnemyAction[] = [
    {
      intent: { type: 'attack', value: 12 },
      execute: (state: BattleState, selfIndex: number) => dealDamageToPlayer(state, 12, selfIndex),
      weight: 2,
    },
    {
      // 이중타격: 인텐트 value를 6(1회분)으로 구분 — 총 12 피해지만 2회로 표시
      intent: { type: 'attack', value: 6 },
      execute: (state: BattleState, selfIndex: number) => {
        const s1 = dealDamageToPlayer(state, 6, selfIndex);
        return dealDamageToPlayer(s1, 6, selfIndex);
      },
      weight: 2,
    },
  ];
  const first = pickAction(actions);
  return {
    id: `skeleton_${crypto.randomUUID()}`,
    name: '해골',
    emoji: '💀',
    maxHp: 24,
    hp: 24,
    block: 0,
    statusEffects: [],
    actions,
    currentIntent: first.intent,
  };
}

export function createElite(): Enemy {
  const actions: EnemyAction[] = [
    {
      intent: { type: 'attack', value: 15 },
      execute: (state: BattleState, selfIndex: number) => dealDamageToPlayer(state, 15, selfIndex),
      weight: 2,
    },
    {
      intent: { type: 'defend' },
      execute: (state: BattleState, selfIndex: number) => addBlockToEnemy(state, selfIndex, 12),
      weight: 1,
    },
    {
      intent: { type: 'buff' },
      execute: (state: BattleState, selfIndex: number) => applyStatusEffect(state, 'enemy', 'strength', 2, selfIndex),
      weight: 1,
    },
  ];
  const first = pickAction(actions);
  return {
    id: `elite_${crypto.randomUUID()}`,
    name: '엘리트 오크',
    emoji: '👹',
    maxHp: 50,
    hp: 50,
    block: 0,
    statusEffects: [],
    actions,
    currentIntent: first.intent,
  };
}

export function createBoss(): Enemy {
  const actions: EnemyAction[] = [
    {
      intent: { type: 'attack', value: 20 },
      execute: (state: BattleState, selfIndex: number) => dealDamageToPlayer(state, 20, selfIndex),
      weight: 3,
    },
    {
      intent: { type: 'defend' },
      execute: (state: BattleState, selfIndex: number) => addBlockToEnemy(state, selfIndex, 15),
      weight: 1,
    },
    {
      intent: { type: 'buff' },
      execute: (state: BattleState, selfIndex: number) => applyStatusEffect(state, 'enemy', 'strength', 3, selfIndex),
      weight: 1,
    },
  ];
  const first = pickAction(actions);
  return {
    id: `boss_${crypto.randomUUID()}`,
    name: '대마왕',
    emoji: '👿',
    maxHp: 120,
    hp: 120,
    block: 0,
    statusEffects: [],
    actions,
    currentIntent: first.intent,
  };
}

export function pickRandomEnemies(enemyCount: number, isElite: boolean): Enemy[] {
  if (isElite) return [createElite()];
  const pool = [createSlime, createGoblin, createSkeleton];
  return Array.from({ length: enemyCount }, () => {
    const fn = pool[Math.floor(Math.random() * pool.length)];
    return fn();
  });
}
