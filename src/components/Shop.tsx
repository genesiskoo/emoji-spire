import { useState } from 'react';
import type { Card, Player } from '../types';
import { ALL_CARDS, createCard } from '../data/cards';
import { shuffle } from '../logic/battle';

const HP_COST = 30;
const REMOVE_COST = 75;
const HP_HEAL = 10;
const PRICE_OPTIONS = [50, 60, 75, 80, 100];

interface ShopItem {
  card: Card;
  price: number;
  purchased: boolean;
}

interface ShopProps {
  player: Player;
  deck: Card[];
  onLeave: (newPlayer: Player, newDeck: Card[]) => void;
}

function cardTypeIcon(type: string): string {
  if (type === 'attack') return '🗡️';
  if (type === 'defense') return '🛡️';
  return '✨';
}

export function Shop({ player, deck: initialDeck, onLeave }: ShopProps) {
  const [items, setItems] = useState<ShopItem[]>(() =>
    shuffle([...ALL_CARDS]).slice(0, 3).map(template => ({
      card: createCard(template),
      price: PRICE_OPTIONS[Math.floor(Math.random() * PRICE_OPTIONS.length)],
      purchased: false,
    }))
  );
  const [gold, setGold] = useState(player.gold);
  const [currentHp, setCurrentHp] = useState(player.hp);
  const [currentDeck, setCurrentDeck] = useState<Card[]>(initialDeck);
  const [removingMode, setRemovingMode] = useState(false);
  const [hpHealed, setHpHealed] = useState(false);

  function buyCard(index: number) {
    const item = items[index];
    if (item.purchased || gold < item.price) return;
    setGold(g => g - item.price);
    setCurrentDeck(d => [...d, item.card]);
    setItems(prev => prev.map((it, i) => i === index ? { ...it, purchased: true } : it));
  }

  function healHp() {
    if (hpHealed || gold < HP_COST || currentHp >= player.maxHp) return;
    setGold(g => g - HP_COST);
    setCurrentHp(h => Math.min(h + HP_HEAL, player.maxHp));
    setHpHealed(true);
  }

  function removeCard(cardId: string) {
    // Synchronously verify the card exists before touching gold
    const idx = currentDeck.findIndex(c => c.id === cardId);
    if (idx === -1 || gold < REMOVE_COST) return;
    setGold(g => g - REMOVE_COST);
    setCurrentDeck(d => {
      const i = d.findIndex(c => c.id === cardId);
      if (i === -1) return d;
      return [...d.slice(0, i), ...d.slice(i + 1)];
    });
    setRemovingMode(false);
  }

  function handleLeave() {
    onLeave({ ...player, gold, hp: currentHp }, currentDeck);
  }

  // ── 카드 제거 모드 ──
  if (removingMode) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6 gap-4">
        <h2 className="text-2xl font-bold">어떤 카드를 제거하겠습니까?</h2>
        <p className="text-gray-400 text-sm">카드 1장 제거 — {REMOVE_COST}G</p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
          {currentDeck.map(card => (
            <button
              key={card.id}
              onClick={() => removeCard(card.id)}
              className="bg-gray-800 border border-red-700 hover:border-red-400 rounded-xl p-3 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>{cardTypeIcon(card.type)}</span>
                <span className="font-semibold text-sm">{card.name}</span>
                <span className="text-xs text-gray-400 ml-auto">⚡{card.cost}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{card.description}</p>
            </button>
          ))}
        </div>
        <button
          onClick={() => setRemovingMode(false)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        >
          취소
        </button>
      </div>
    );
  }

  // ── 메인 상점 화면 ──
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6 gap-6">
      {/* 헤더 */}
      <div className="text-center">
        <div className="text-5xl mb-2">🛒</div>
        <h2 className="text-2xl font-bold">상인</h2>
      </div>

      {/* 플레이어 상태 */}
      <div className="flex gap-6 text-sm">
        <span className="text-yellow-400">💰 {gold}G</span>
        <span className="text-red-400">❤️ {currentHp}/{player.maxHp}</span>
        <span className="text-gray-400">📚 {currentDeck.length}장</span>
      </div>

      {/* 카드 구매 */}
      <div className="w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-3 text-gray-300">카드 구매</h3>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item, i) => (
            <div
              key={item.card.id}
              onClick={() => buyCard(i)}
              className={`relative bg-gray-800 rounded-xl p-3 border transition-colors ${
                item.purchased
                  ? 'border-gray-700 opacity-50 cursor-default'
                  : gold >= item.price
                  ? 'border-gray-600 hover:border-yellow-500 cursor-pointer'
                  : 'border-gray-700 opacity-60 cursor-not-allowed'
              }`}
            >
              {item.purchased && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                  <span className="text-green-400 font-bold">구매 완료</span>
                </div>
              )}
              <div className="flex items-center gap-1 mb-1">
                <span>{cardTypeIcon(item.card.type)}</span>
                <span className="font-semibold text-sm">{item.card.name}</span>
                <span className="text-xs text-gray-400 ml-auto">⚡{item.card.cost}</span>
              </div>
              <p className="text-xs text-gray-400">{item.card.description}</p>
              <div className="mt-2 text-yellow-400 font-bold text-sm">💰 {item.price}G</div>
            </div>
          ))}
        </div>
      </div>

      {/* 서비스 */}
      <div className="w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-3 text-gray-300">서비스</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* HP 회복 */}
          <button
            onClick={healHp}
            disabled={hpHealed || gold < HP_COST || currentHp >= player.maxHp}
            className={`bg-gray-800 border rounded-xl p-4 text-left transition-colors ${
              hpHealed || gold < HP_COST || currentHp >= player.maxHp
                ? 'border-gray-700 opacity-50 cursor-not-allowed'
                : 'border-gray-600 hover:border-red-400 cursor-pointer'
            }`}
          >
            <div className="text-2xl mb-1">🧪</div>
            <div className="font-semibold">HP 회복</div>
            <div className="text-xs text-gray-400 mt-1">HP {HP_HEAL} 회복</div>
            <div className="mt-2 text-yellow-400 font-bold">💰 {HP_COST}G</div>
            {hpHealed && <div className="text-xs text-green-400 mt-1">사용 완료</div>}
            {!hpHealed && currentHp >= player.maxHp && (
              <div className="text-xs text-gray-500 mt-1">HP 최대</div>
            )}
          </button>

          {/* 카드 제거 */}
          <button
            onClick={() => setRemovingMode(true)}
            disabled={gold < REMOVE_COST || currentDeck.length === 0}
            className={`bg-gray-800 border rounded-xl p-4 text-left transition-colors ${
              gold < REMOVE_COST || currentDeck.length === 0
                ? 'border-gray-700 opacity-50 cursor-not-allowed'
                : 'border-gray-600 hover:border-purple-400 cursor-pointer'
            }`}
          >
            <div className="text-2xl mb-1">🗑️</div>
            <div className="font-semibold">카드 제거</div>
            <div className="text-xs text-gray-400 mt-1">덱에서 카드 1장 제거</div>
            <div className="mt-2 text-yellow-400 font-bold">💰 {REMOVE_COST}G</div>
          </button>
        </div>
      </div>

      {/* 떠나기 */}
      <button
        onClick={handleLeave}
        className="px-8 py-3 bg-green-700 hover:bg-green-600 rounded-xl font-bold text-lg transition-colors"
      >
        떠나기
      </button>
    </div>
  );
}
