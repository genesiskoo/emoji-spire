import { describe, it, expect } from 'vitest';
import {
  dealDamage,
  addBlock,
  playCard,
  endPlayerTurn,
} from '../logic/battle';
import type { BattleState, Card, Enemy, EnemyAction } from '../types';
import { dealDamageToPlayer } from '../logic/battle';

// ===== 픽스처 팩토리 =====

function makeAttackAction(damage: number): EnemyAction {
  return {
    intent: { type: 'attack', value: damage },
    execute: (state, selfIndex) => dealDamageToPlayer(state, damage, selfIndex),
    weight: 1,
  };
}

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  const action = makeAttackAction(5);
  return {
    id: 'enemy-1',
    name: 'Slime',
    emoji: '🟢',
    maxHp: 20,
    hp: 20,
    block: 0,
    statusEffects: [],
    actions: [action],
    currentIntent: action.intent,
    ...overrides,
  };
}

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    name: 'Strike',
    type: 'attack',
    cost: 1,
    description: '6 damage',
    requiresTarget: true,
    effect: (state, targetIndex = 0) => dealDamage(state, targetIndex, 6),
    ...overrides,
  };
}

function makeState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    player: { hp: 30, maxHp: 30, block: 0, statusEffects: [], gold: 0 },
    enemies: [makeEnemy()],
    deck: [],
    hand: [],
    discardPile: [],
    energy: 3,
    maxEnergy: 3,
    turn: 1,
    ...overrides,
  };
}

// ===== dealDamage =====

describe('dealDamage', () => {
  it('기본 데미지만큼 적 HP가 감소한다', () => {
    const state = makeState();
    const result = dealDamage(state, 0, 6);
    expect(result.enemies[0].hp).toBe(14);
  });

  it('적 블록이 데미지를 먼저 흡수한다', () => {
    const state = makeState({ enemies: [makeEnemy({ block: 4 })] });
    const result = dealDamage(state, 0, 6);
    expect(result.enemies[0].block).toBe(0);
    expect(result.enemies[0].hp).toBe(18); // 20 - (6 - 4)
  });

  it('블록이 데미지 이상이면 HP는 깎이지 않는다', () => {
    const state = makeState({ enemies: [makeEnemy({ block: 10 })] });
    const result = dealDamage(state, 0, 6);
    expect(result.enemies[0].block).toBe(4);
    expect(result.enemies[0].hp).toBe(20);
  });

  it('플레이어 strength가 데미지에 더해진다', () => {
    const state = makeState({
      player: {
        hp: 30, maxHp: 30, block: 0, gold: 0,
        statusEffects: [{ type: 'strength', stacks: 3 }],
      },
    });
    const result = dealDamage(state, 0, 6);
    expect(result.enemies[0].hp).toBe(11); // 20 - (6 + 3)
  });

  it('플레이어 weakness가 데미지를 75%로 낮춘다', () => {
    const state = makeState({
      player: {
        hp: 30, maxHp: 30, block: 0, gold: 0,
        statusEffects: [{ type: 'weakness', stacks: 1 }],
      },
    });
    const result = dealDamage(state, 0, 8);
    expect(result.enemies[0].hp).toBe(14); // 20 - floor(8 * 0.75) = 20 - 6
  });

  it('적 vulnerable이 데미지를 150%로 올린다', () => {
    const state = makeState({
      enemies: [makeEnemy({ statusEffects: [{ type: 'vulnerable', stacks: 1 }] })],
    });
    const result = dealDamage(state, 0, 6);
    expect(result.enemies[0].hp).toBe(11); // 20 - floor(6 * 1.5) = 20 - 9
  });

  it('이미 죽은 적(hp <= 0)에게는 데미지가 적용되지 않는다', () => {
    const state = makeState({ enemies: [makeEnemy({ hp: 0 })] });
    const result = dealDamage(state, 0, 6);
    expect(result.enemies[0].hp).toBe(0);
  });

  it('존재하지 않는 인덱스로는 상태가 변하지 않는다', () => {
    const state = makeState();
    const result = dealDamage(state, 99, 6);
    expect(result).toBe(state);
  });
});

// ===== addBlock =====

describe('addBlock', () => {
  it('플레이어 블록을 증가시킨다', () => {
    const state = makeState();
    const result = addBlock(state, 5);
    expect(result.player.block).toBe(5);
  });

  it('기존 블록에 누적된다', () => {
    const state = makeState({
      player: { hp: 30, maxHp: 30, block: 3, statusEffects: [], gold: 0 },
    });
    const result = addBlock(state, 5);
    expect(result.player.block).toBe(8);
  });

  it('플레이어 외 다른 상태는 변하지 않는다', () => {
    const state = makeState();
    const result = addBlock(state, 5);
    expect(result.enemies).toBe(state.enemies);
    expect(result.hand).toBe(state.hand);
  });
});

// ===== playCard =====

describe('playCard', () => {
  it('카드가 핸드에서 제거된다', () => {
    const card = makeCard();
    const state = makeState({ hand: [card] });
    const result = playCard(state, 'card-1');
    expect(result.hand).toHaveLength(0);
  });

  it('사용한 카드가 버리기 더미로 이동한다', () => {
    const card = makeCard();
    const state = makeState({ hand: [card] });
    const result = playCard(state, 'card-1');
    expect(result.discardPile).toHaveLength(1);
    expect(result.discardPile[0].id).toBe('card-1');
  });

  it('카드 비용만큼 에너지가 소모된다', () => {
    const card = makeCard({ cost: 2 });
    const state = makeState({ hand: [card], energy: 3 });
    const result = playCard(state, 'card-1');
    expect(result.energy).toBe(1);
  });

  it('카드 effect가 실행된다 (공격 카드가 적 HP를 깎는다)', () => {
    const card = makeCard(); // 6 damage, cost 1
    const state = makeState({ hand: [card] });
    const result = playCard(state, 'card-1', 0);
    expect(result.enemies[0].hp).toBe(14);
  });

  it('에너지가 부족하면 상태가 변하지 않는다', () => {
    const card = makeCard({ cost: 3 });
    const state = makeState({ hand: [card], energy: 1 });
    const result = playCard(state, 'card-1');
    expect(result).toBe(state);
  });

  it('핸드에 없는 카드 ID는 상태가 변하지 않는다', () => {
    const state = makeState({ hand: [] });
    const result = playCard(state, 'nonexistent');
    expect(result).toBe(state);
  });

  it('비용 0 카드는 에너지를 소모하지 않는다', () => {
    const card = makeCard({ cost: 0 });
    const state = makeState({ hand: [card], energy: 3 });
    const result = playCard(state, 'card-1');
    expect(result.energy).toBe(3);
    expect(result.hand).toHaveLength(0);
  });

  it('여러 장 중 해당 카드만 제거된다', () => {
    const card1 = makeCard({ id: 'card-1' });
    const card2 = makeCard({ id: 'card-2', name: 'Defend' });
    const state = makeState({ hand: [card1, card2] });
    const result = playCard(state, 'card-1');
    expect(result.hand).toHaveLength(1);
    expect(result.hand[0].id).toBe('card-2');
  });
});

// ===== endPlayerTurn =====

describe('endPlayerTurn', () => {
  it('턴 종료 시 핸드가 버리기 더미로 이동한다', () => {
    const card = makeCard();
    const state = makeState({ hand: [card], deck: [] });
    const result = endPlayerTurn(state);
    // startPlayerTurn 후 hand가 비어있을 수 있으므로 discard 확인
    // 단, startPlayerTurn이 deck에서 다시 드로우하므로 card는 discard → deck 재활용
    // 여기서는 총 카드 수로 보존 여부를 검증
    const totalCards = result.hand.length + result.deck.length + result.discardPile.length;
    expect(totalCards).toBe(1);
  });

  it('적이 플레이어를 공격한다 (enemy attack 5)', () => {
    const state = makeState(); // 적: attack 5
    const result = endPlayerTurn(state);
    expect(result.player.hp).toBe(25); // 30 - 5
  });

  it('플레이어 블록이 적 공격을 흡수한다', () => {
    const state = makeState({
      player: { hp: 30, maxHp: 30, block: 3, statusEffects: [], gold: 0 },
    });
    const result = endPlayerTurn(state);
    expect(result.player.hp).toBe(28); // 30 - (5 - 3)
  });

  it('턴 카운터가 1 증가한다', () => {
    const state = makeState({ turn: 1 });
    const result = endPlayerTurn(state);
    expect(result.turn).toBe(2);
  });

  it('다음 플레이어 턴 시작 시 에너지가 회복된다', () => {
    const state = makeState({ energy: 0, maxEnergy: 3 });
    const result = endPlayerTurn(state);
    expect(result.energy).toBe(3);
  });

  it('다음 플레이어 턴 시작 시 플레이어 블록이 0으로 리셋된다', () => {
    // 블록은 턴 종료 후 새 플레이어 턴 시작 시 리셋 (Slay the Spire 규칙)
    const state = makeState({
      player: { hp: 30, maxHp: 30, block: 10, statusEffects: [], gold: 0 },
    });
    const result = endPlayerTurn(state);
    expect(result.player.block).toBe(0);
  });

  it('덱에 카드가 있으면 5장을 드로우한다', () => {
    const deck = Array.from({ length: 10 }, (_, i) =>
      makeCard({ id: `card-${i}`, cost: 0, requiresTarget: false, effect: s => s })
    );
    const state = makeState({ deck });
    const result = endPlayerTurn(state);
    expect(result.hand).toHaveLength(5);
  });

  it('이미 죽은 적(hp <= 0)은 행동하지 않는다', () => {
    const state = makeState({ enemies: [makeEnemy({ hp: 0 })] });
    const result = endPlayerTurn(state);
    expect(result.player.hp).toBe(30); // 공격받지 않음
  });
});
