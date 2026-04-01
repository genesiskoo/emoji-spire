import type { Card } from '../types';

interface CardHandProps {
  cards: Card[];
  energy: number;
  selectedCardId: string | null;
  playingCardId: string | null;
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

const CARD_SELECTED_GLOW: Record<Card['type'], string> = {
  attack: 'shadow-[0_0_18px_5px_rgba(239,68,68,0.75)]',
  defense: 'shadow-[0_0_18px_5px_rgba(59,130,246,0.75)]',
  skill: 'shadow-[0_0_18px_5px_rgba(234,179,8,0.75)]',
};

export function CardHand({ cards, energy, selectedCardId, playingCardId, onSelectCard, onPlayCard }: CardHandProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {cards.map((card) => {
        const playable = energy >= card.cost;
        const isSelected = card.id === selectedCardId;
        const isFlying = card.id === playingCardId;

        function handleClick() {
          if (!playable || isFlying) return;
          if (card.targetType === 'single') {
            onSelectCard(isSelected ? null : card.id);
          } else {
            onPlayCard(card.id);
          }
        }

        return (
          <button
            key={card.id}
            onClick={handleClick}
            disabled={!playable || isFlying}
            className={[
              'w-28 min-h-36 rounded-lg border-2 p-2 flex flex-col gap-1 text-left transition-all duration-200',
              CARD_TYPE_COLOR[card.type],
              isFlying
                ? 'card-flying'
                : isSelected
                  ? [
                      'border-white -translate-y-6 scale-110',
                      CARD_SELECTED_GLOW[card.type],
                    ].join(' ')
                  : playable
                    ? 'cursor-pointer hover:-translate-y-5 hover:scale-110 hover:shadow-xl hover:shadow-white/25'
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
