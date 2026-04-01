import type { Card, BattleState } from '../types';
import { dealDamage, addBlock, applyStatusEffect } from '../logic/battle';

export const ALL_CARDS: Omit<Card, 'id'>[] = [
  {
    name: '스트라이크',
    type: 'attack',
    cost: 1,
    description: '적에게 6 피해를 입힌다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => dealDamage(state, targetIndex, 6),
  },
  {
    name: '디펜드',
    type: 'defense',
    cost: 1,
    description: '블록 5를 얻는다.',
    requiresTarget: false,
    effect: (state: BattleState) => addBlock(state, 5),
  },
  {
    name: '강타',
    type: 'attack',
    cost: 2,
    description: '적에게 14 피해를 입힌다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => dealDamage(state, targetIndex, 14),
  },
  {
    name: '이중 공격',
    type: 'attack',
    cost: 1,
    description: '적에게 3 피해를 2번 입힌다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => {
      const s1 = dealDamage(state, targetIndex, 3);
      return dealDamage(s1, targetIndex, 3);
    },
  },
  {
    name: '방어막',
    type: 'defense',
    cost: 1,
    description: '블록 8을 얻는다.',
    requiresTarget: false,
    effect: (state: BattleState) => addBlock(state, 8),
  },
  {
    name: '전투 의지',
    type: 'skill',
    cost: 1,
    description: '힘 2를 얻는다.',
    requiresTarget: false,
    effect: (state: BattleState) => applyStatusEffect(state, 'player', 'strength', 2),
  },
  {
    name: '약점 노출',
    type: 'skill',
    cost: 1,
    description: '적에게 취약 2를 부여한다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => applyStatusEffect(state, 'enemy', 'vulnerable', 2, targetIndex),
  },
  {
    name: '분쇄',
    type: 'attack',
    cost: 2,
    description: '적에게 18 피해를 입힌다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => dealDamage(state, targetIndex, 18),
  },
  {
    name: '철벽',
    type: 'defense',
    cost: 2,
    description: '블록 14를 얻는다.',
    requiresTarget: false,
    effect: (state: BattleState) => addBlock(state, 14),
  },
  {
    name: '약화',
    type: 'skill',
    cost: 1,
    description: '적에게 약화 2를 부여한다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => applyStatusEffect(state, 'enemy', 'weakness', 2, targetIndex),
  },
  {
    name: '화염구',
    type: 'attack',
    cost: 2,
    description: '적에게 12 피해를 입힌다.',
    requiresTarget: true,
    effect: (state: BattleState, targetIndex = 0) => dealDamage(state, targetIndex, 12),
  },
];

export function createCard(template: Omit<Card, 'id'>): Card {
  return { ...template, id: crypto.randomUUID() };
}

export function createStarterDeck(): Card[] {
  const strikeDef = ALL_CARDS.find(c => c.name === '스트라이크')!;
  const defendDef = ALL_CARDS.find(c => c.name === '디펜드')!;
  return [
    ...Array(5).fill(null).map(() => createCard(strikeDef)),
    ...Array(4).fill(null).map(() => createCard(defendDef)),
    createCard(ALL_CARDS.find(c => c.name === '강타')!),
  ];
}
