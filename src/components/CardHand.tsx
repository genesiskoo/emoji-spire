import type { Card } from '../types';

interface CardHandProps {
  cards: Card[];
  energy: number;
  selectedCardId: string | null;
  onSelectCard: (cardId: string | null) => void;
  onPlayCard: (cardId: string) => void;
}

const CARD_TYPE_EMOJI: Record<Card['type'], string> = {
  attack: '🗡️',
  defense: '🛡️',
  skill: '✨',
};

const CARD_TYPE_COLOR: Record<Card['type'], string> = {
  attack: 'border-red-500 bg-red-950',
  defense: 'border-blue-500 bg-blue-950',
  skill: 'border-yellow-500 bg-yellow-950',
};

export function CardHand({ cards, energy, selectedCardId, onSelectCard, onPlayCard }: CardHandProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {cards.map((card) => {
        const playable = energy >= card.cost;
        const isSelected = card.id === selectedCardId;

        function handleClick() {
          if (!playable) return;
          if (card.requiresTarget) {
            // 이미 선택된 카드를 다시 클릭하면 선택 해제
            onSelectCard(isSelected ? null : card.id);
          } else {
            onPlayCard(card.id);
          }
        }

        return (
          <button
            key={card.id}
            onClick={handleClick}
            disabled={!playable}
            className={[
              'w-28 min-h-36 rounded-lg border-2 p-2 flex flex-col gap-1 text-left transition-all duration-150',
              CARD_TYPE_COLOR[card.type],
              isSelected
                ? 'border-white ring-2 ring-white -translate-y-4 shadow-xl shadow-white/30'
                : playable
                  ? 'cursor-pointer hover:-translate-y-2 hover:shadow-lg hover:shadow-white/20'
                  : 'opacity-40 cursor-not-allowed',
            ].join(' ')}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs">{CARD_TYPE_EMOJI[card.type]}</span>
              <span className="text-xs font-bold text-yellow-300">⚡{card.cost}</span>
            </div>
            <div className="text-xs font-bold text-white leading-tight">{card.name}</div>
            <div className="text-xs text-gray-300 leading-tight flex-1">{card.description}</div>
            {isSelected && (
              <div className="text-xs text-center text-white/70 mt-1">적을 선택하세요</div>
            )}
          </button>
        );
      })}
    </div>
  );
}
