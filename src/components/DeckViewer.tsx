import { useState } from 'react';
import type { Card } from '../types';

const CARD_TYPE_EMOJI: Record<Card['type'], string> = {
  attack: '🗡️',
  defense: '🛡️',
  skill: '✨',
};

const CARD_TYPE_COLOR: Record<Card['type'], string> = {
  attack: 'border-red-700 bg-red-950/60',
  defense: 'border-blue-700 bg-blue-950/60',
  skill: 'border-yellow-700 bg-yellow-950/60',
};

interface DeckViewerProps {
  cards: Card[];
  discardPile?: Card[]; // 전투 중에만 전달 — undefined면 탭 숨김
  onClose: () => void;
}

export function DeckViewer({ cards, discardPile, onClose }: DeckViewerProps) {
  const isBattle = discardPile !== undefined;
  const [tab, setTab] = useState<'deck' | 'discard'>('deck');

  const displayed = isBattle && tab === 'discard' ? discardPile : cards;
  const title = isBattle
    ? tab === 'deck'
      ? `덱 (${cards.length}장)`
      : `버리기 더미 (${discardPile.length}장)`
    : `보유 카드 (${cards.length}장)`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
      onClick={onClose}
      onKeyDown={e => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-viewer-title"
        className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-2xl max-h-[80vh] flex flex-col gap-4 mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <h2 id="deck-viewer-title" className="text-lg font-bold text-white">📚 {title}</h2>
          <button
            onClick={onClose}
            autoFocus
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 탭 — 전투 중에만 표시 */}
        {isBattle && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab('deck')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'deck'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              덱 {cards.length}
            </button>
            <button
              onClick={() => setTab('discard')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'discard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              버리기 {discardPile.length}
            </button>
          </div>
        )}

        {/* 카드 목록 */}
        <div className="overflow-y-auto flex-1">
          {displayed.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">카드 없음</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {displayed.map((card) => (
                <div
                  key={card.id}
                  className={`rounded-lg border p-3 flex flex-col gap-1 ${CARD_TYPE_COLOR[card.type]}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs">{CARD_TYPE_EMOJI[card.type]}</span>
                    <span className="text-xs font-bold text-yellow-300">⚡{card.cost}</span>
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">{card.name}</div>
                  <div className="text-xs text-gray-400 leading-snug">{card.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
