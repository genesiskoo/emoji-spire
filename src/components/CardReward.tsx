import type { Card } from '../types';

const CARD_TYPE_EMOJI: Record<Card['type'], string> = {
  attack: '🗡️',
  defense: '🛡️',
  skill: '✨',
};

const CARD_TYPE_COLOR: Record<Card['type'], string> = {
  attack: 'border-red-500 bg-red-950 hover:bg-red-900',
  defense: 'border-blue-500 bg-blue-950 hover:bg-blue-900',
  skill: 'border-yellow-500 bg-yellow-950 hover:bg-yellow-900',
};

interface CardRewardProps {
  cards: Card[];
  onSelect: (card: Card) => void;
  onSkip: () => void;
}

export function CardReward({ cards, onSelect, onSkip }: CardRewardProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-3xl font-bold">전투 승리!</h2>
        <p className="text-gray-400 mt-2">카드 1장을 덱에 추가하세요</p>
      </div>

      <div className="flex gap-6 flex-wrap justify-center">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => onSelect(card)}
            className={[
              'w-36 min-h-44 rounded-xl border-2 p-3 flex flex-col gap-2 text-left',
              'cursor-pointer hover:-translate-y-3 hover:shadow-xl hover:shadow-white/20 transition-all duration-150',
              CARD_TYPE_COLOR[card.type],
            ].join(' ')}
          >
            <div className="flex justify-between items-center">
              <span className="text-base">{CARD_TYPE_EMOJI[card.type]}</span>
              <span className="text-sm font-bold text-yellow-300">⚡{card.cost}</span>
            </div>
            <div className="text-sm font-bold text-white leading-tight">{card.name}</div>
            <div className="text-xs text-gray-300 leading-tight flex-1">{card.description}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onSkip}
        className="text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
      >
        건너뛰기
      </button>
    </div>
  );
}
