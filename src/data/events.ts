import type { GameEvent } from '../types';
import { createCard, ALL_CARDS } from './cards';

export const EVENTS: GameEvent[] = [
  {
    id: 'healing_spring',
    title: '치유의 샘',
    emoji: '💧',
    description: '깊은 숲 속 작은 샘을 발견했다. 맑은 물에서 신비로운 기운이 느껴진다.',
    choices: [
      {
        text: '샘물을 마신다',
        description: '+20 HP 회복',
        effect: (player, deck) => ({
          player: { ...player, hp: Math.min(player.maxHp, player.hp + 20) },
          deck,
        }),
      },
      {
        text: '샘물로 목욕한다',
        description: '최대 HP의 30% 회복',
        effect: (player, deck) => ({
          player: { ...player, hp: Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.3)) },
          deck,
        }),
      },
      {
        text: '그냥 지나친다',
        description: '아무 효과 없음',
        effect: (player, deck) => ({ player, deck }),
      },
    ],
  },
  {
    id: 'mysterious_chest',
    title: '수상한 상자',
    emoji: '📦',
    description: '길 한복판에 낡은 나무 상자가 놓여 있다. 자물쇠가 채워져 있지 않다.',
    choices: [
      {
        text: '상자를 연다',
        description: '랜덤 카드 1장 획득',
        effect: (player, deck) => {
          const randomTemplate = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
          return { player, deck: [...deck, createCard(randomTemplate)] };
        },
      },
      {
        text: '함정일 수도 있다 — 열지 않는다',
        description: '아무 효과 없음',
        effect: (player, deck) => ({ player, deck }),
      },
    ],
  },
  {
    id: 'old_merchant',
    title: '행상인과의 만남',
    emoji: '🪙',
    description: '낡은 수레를 끌고 가는 행상인을 만났다. 그가 지갑을 슬쩍 건넨다.',
    choices: [
      {
        text: '지갑을 받는다',
        description: '+50 골드 획득',
        effect: (player, deck) => ({
          player: { ...player, gold: player.gold + 50 },
          deck,
        }),
      },
      {
        text: '카드 한 장과 교환한다',
        description: '+30 골드, 덱에서 랜덤 카드 1장 제거',
        effect: (player, deck) => {
          if (deck.length === 0) return { player: { ...player, gold: player.gold + 30 }, deck };
          const removeIdx = Math.floor(Math.random() * deck.length);
          const newDeck = deck.filter((_, i) => i !== removeIdx);
          return { player: { ...player, gold: player.gold + 30 }, deck: newDeck };
        },
      },
      {
        text: '거절한다',
        description: '아무 효과 없음',
        effect: (player, deck) => ({ player, deck }),
      },
    ],
  },
];

export function pickRandomEvent(): GameEvent {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

export function findEventById(id: string): GameEvent | undefined {
  return EVENTS.find(e => e.id === id);
}
