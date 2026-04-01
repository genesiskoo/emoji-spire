import type { GameEvent, Player, Card } from '../types';

interface EventSceneProps {
  event: GameEvent;
  player: Player;
  deck: Card[];
  onChoose: (player: Player, deck: Card[]) => void;
}

export function EventScene({ event, player, deck, onChoose }: EventSceneProps) {
  function handleChoice(choiceIndex: number) {
    const choice = event.choices[choiceIndex];
    const result = choice.effect(player, deck);
    onChoose(result.player, result.deck);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4 gap-6">
      <div className="text-7xl">{event.emoji}</div>
      <h2 className="text-3xl font-bold text-center">{event.title}</h2>
      <p className="text-gray-300 text-center max-w-sm leading-relaxed">{event.description}</p>

      <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
        {event.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleChoice(i)}
            className="w-full px-5 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-purple-500 rounded-xl text-left transition-all group"
          >
            <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
              {choice.text}
            </div>
            <div className="text-sm text-gray-400 mt-1">{choice.description}</div>
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-500 mt-2">
        ❤️ {player.hp}/{player.maxHp} &nbsp;|&nbsp; 💰 {player.gold}G
      </div>
    </div>
  );
}
