import { useState } from 'react';
import type { BattleState, StatusEffect, Intent } from '../types';
import { playCard, endPlayerTurn, isBattleOver } from '../logic/battle';
import { CardHand } from './CardHand';

interface BattleSceneProps {
  initialBattle: BattleState;
  onBattleEnd: (result: 'win' | 'lose') => void;
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const color = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusBadges({ effects }: { effects: StatusEffect[] }) {
  if (effects.length === 0) return null;
  const icons: Record<StatusEffect['type'], string> = {
    strength: '🔥',
    weakness: '💧',
    vulnerable: '🩸',
  };
  return (
    <div className="flex gap-1 flex-wrap">
      {effects.map((e) => (
        <span key={e.type} className="text-xs bg-gray-700 rounded px-1 py-0.5">
          {icons[e.type]}{e.stacks}
        </span>
      ))}
    </div>
  );
}

function IntentDisplay({ intent }: { intent: Intent }) {
  if (intent.type === 'attack') {
    return <span className="text-xs text-red-400">⚔️ {intent.value}</span>;
  }
  if (intent.type === 'defend') {
    return <span className="text-xs text-blue-400">🛡️ 방어</span>;
  }
  return <span className="text-xs text-yellow-400">🔥 버프</span>;
}

export function BattleScene({ initialBattle, onBattleEnd }: BattleSceneProps) {
  const [battle, setBattle] = useState<BattleState>(initialBattle);
  const [log, setLog] = useState<string>('전투 시작!');
  const [isOver, setIsOver] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  function applyAndCheck(next: BattleState, cardName: string) {
    const result = isBattleOver(next);
    setBattle(next);
    setLog(`${cardName} 사용`);
    if (result) {
      setIsOver(true);
      onBattleEnd(result);
    }
  }

  // 방어/스킬 카드 즉시 사용
  function handleImmediatePlay(cardId: string) {
    if (isOver) return;
    const card = battle.hand.find(c => c.id === cardId);
    if (!card) return;
    applyAndCheck(playCard(battle, cardId), card.name);
  }

  // 타겟 필요 카드 선택 (null 이면 선택 해제)
  function handleSelectCard(cardId: string | null) {
    if (isOver) return;
    setSelectedCardId(cardId);
  }

  // 적 클릭: 선택된 카드가 있으면 해당 적에게 사용
  function handleEnemyClick(enemyIndex: number) {
    if (isOver || !selectedCardId) return;
    const card = battle.hand.find(c => c.id === selectedCardId);
    if (!card) return;
    setSelectedCardId(null);
    applyAndCheck(playCard(battle, selectedCardId, enemyIndex), card.name);
  }

  function handleEndTurn() {
    if (isOver) return;
    setSelectedCardId(null);
    const next = endPlayerTurn(battle);
    const result = isBattleOver(next);
    setBattle(next);
    setLog(`턴 ${next.turn} 시작`);
    if (result) {
      setIsOver(true);
      onBattleEnd(result);
    }
  }

  const { player, enemies, hand, energy, maxEnergy, deck, discardPile, turn } = battle;
  const isTargeting = selectedCardId !== null;

  return (
    // 빈 영역 클릭 시 카드 선택 해제
    <div
      className="flex flex-col h-screen bg-gray-900 text-white p-4 gap-4"
      onClick={() => setSelectedCardId(null)}
    >
      {/* 헤더: 턴 + 로그 + 종료 버튼 */}
      <div className="flex justify-between items-center" onClick={e => e.stopPropagation()}>
        <span className="text-sm text-gray-400">⚔️ 전투 — 턴 {turn}</span>
        <span className={`text-sm italic ${isTargeting ? 'text-yellow-300 font-semibold' : 'text-gray-300'}`}>
          {isTargeting ? '🎯 타겟을 선택하세요' : log}
        </span>
        <button
          onClick={handleEndTurn}
          disabled={isOver}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          턴 종료
        </button>
      </div>

      {/* 적 영역 */}
      <div className="flex gap-4 justify-center" onClick={e => e.stopPropagation()}>
        {enemies.map((enemy, index) => {
          const isAlive = enemy.hp > 0;
          const isClickable = isTargeting && isAlive;
          return (
            <div
              key={enemy.id}
              onClick={() => isClickable && handleEnemyClick(index)}
              className={[
                'bg-gray-800 rounded-xl p-4 w-44 flex flex-col gap-2 border transition-all duration-150',
                !isAlive ? 'border-gray-700 opacity-40 pointer-events-none' : '',
                isClickable
                  ? 'border-red-400 cursor-crosshair ring-2 ring-red-400/60 hover:ring-red-400 hover:scale-105'
                  : 'border-gray-600',
              ].join(' ')}
            >
              <div className="text-4xl text-center">{enemy.emoji}</div>
              <div className="text-sm font-bold text-center">{enemy.name}</div>
              <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
              <div className="text-xs text-center text-gray-400">
                ❤️ {Math.max(0, enemy.hp)}/{enemy.maxHp}
              </div>
              {enemy.block > 0 && (
                <div className="text-xs text-center text-blue-400">🛡️ {enemy.block}</div>
              )}
              <StatusBadges effects={enemy.statusEffects} />
              {isAlive && (
                <div className="text-center">
                  <IntentDisplay intent={enemy.currentIntent} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 플레이어 영역 */}
      <div
        className="bg-gray-800 rounded-xl p-4 flex gap-4 items-center border border-gray-600"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl">🧙</div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span className="font-bold">플레이어</span>
            <span className="text-gray-400">❤️ {player.hp}/{player.maxHp}</span>
          </div>
          <HpBar hp={player.hp} maxHp={player.maxHp} />
          <div className="flex gap-3 text-sm">
            {player.block > 0 && (
              <span className="text-blue-400">🛡️ {player.block}</span>
            )}
            <StatusBadges effects={player.statusEffects} />
            <span className="text-yellow-400 ml-auto">💰 {player.gold}G</span>
          </div>
        </div>
      </div>

      {/* 에너지 + 덱/버리기 정보 */}
      <div className="flex justify-center gap-6 text-sm" onClick={e => e.stopPropagation()}>
        <div className="flex gap-1">
          {Array.from({ length: maxEnergy }, (_, i) => (
            <span key={i} className={i < energy ? 'text-yellow-400' : 'text-gray-600'}>⚡</span>
          ))}
          <span className="text-gray-400 ml-1">{energy}/{maxEnergy}</span>
        </div>
        <span className="text-gray-400">📚 덱 {deck.length}</span>
        <span className="text-gray-400">🗑️ 버리기 {discardPile.length}</span>
        <span className="text-gray-400">🃏 핸드 {hand.length}</span>
      </div>

      {/* 카드 핸드 */}
      <div className="flex-1 flex items-end pb-2" onClick={e => e.stopPropagation()}>
        <div className="w-full">
          <CardHand
            cards={hand}
            energy={energy}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            onPlayCard={handleImmediatePlay}
          />
        </div>
      </div>
    </div>
  );
}
