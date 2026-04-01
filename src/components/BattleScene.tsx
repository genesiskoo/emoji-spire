import { useState, useEffect, useRef } from 'react';
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

interface DamagePopup {
  id: number;
  value: number;              // 음수 = 데미지(빨강), 양수 = 힐(초록)
  target: number | 'player'; // number = enemyIndex
}

// 컴포넌트 외부 상수 — 매 렌더 재생성 방지
const BANNER_CONFIG = {
  enemy: { text: '⚔️ 적의 턴', style: 'bg-red-900/85 text-red-100 border-red-500' },
  player: { text: '🛡️ 내 턴', style: 'bg-blue-900/85 text-blue-100 border-blue-500' },
} as const;

export function BattleScene({ initialBattle, onBattleEnd }: BattleSceneProps) {
  const [battle, setBattle] = useState<BattleState>(initialBattle);
  const [log, setLog] = useState<string>('전투 시작!');
  const [isOver, setIsOver] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [hurtEnemies, setHurtEnemies] = useState<Set<number>>(new Set());
  const [dyingEnemies, setDyingEnemies] = useState<Set<number>>(new Set());
  const [banner, setBanner] = useState<'enemy' | 'player' | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupIdRef = useRef(0);

  // 전투 시작 시 "내 턴" 배너
  useEffect(() => {
    setBanner('player');
  }, []);

  useEffect(() => {
    return () => {
      if (playTimerRef.current !== null) clearTimeout(playTimerRef.current);
      setPopups([]);
    };
  }, []);

  const PLAY_ANIM_MS = 350;

  // before/after HP 비교로 팝업·피격 모션 일괄 처리
  function spawnPopups(before: BattleState, after: BattleState) {
    const newPopups: DamagePopup[] = [];
    const newHurt = new Set<number>();
    const newDying = new Set<number>();

    before.enemies.forEach((enemy, i) => {
      const afterEnemy = after.enemies[i];
      if (!afterEnemy) return;
      const delta = afterEnemy.hp - enemy.hp;
      if (delta !== 0) {
        newPopups.push({ id: ++popupIdRef.current, value: delta, target: i });
      }
      if (delta < 0) {
        if (afterEnemy.hp <= 0) {
          newDying.add(i);
        } else {
          newHurt.add(i);
        }
      }
    });

    const playerDelta = after.player.hp - before.player.hp;
    if (playerDelta !== 0) {
      newPopups.push({ id: ++popupIdRef.current, value: playerDelta, target: 'player' });
      if (playerDelta < 0) setIsScreenShaking(true);
    }

    if (newPopups.length > 0) setPopups(prev => [...prev, ...newPopups]);
    if (newHurt.size > 0) setHurtEnemies(prev => new Set([...prev, ...newHurt]));
    if (newDying.size > 0) {
      // dying 추가 시 동일 적의 hurt도 제거 (W-4: 두 클래스 동시 적용 방지)
      setHurtEnemies(prev => { const s = new Set(prev); newDying.forEach(i => s.delete(i)); return s; });
      setDyingEnemies(prev => new Set([...prev, ...newDying]));
    }
  }

  function removePopup(id: number, e: React.AnimationEvent) {
    e.stopPropagation(); // W-3: handleAnimationEnd로 버블링 차단
    setPopups(prev => prev.filter(p => p.id !== id));
  }

  function removeHurt(index: number) {
    setHurtEnemies(prev => { const s = new Set(prev); s.delete(index); return s; });
  }
  // removeDying은 의도적으로 없음: enemy-dying forwards로 opacity:0 영속 유지 (C-1 fix)

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
    if (isOver || playingCardId) return;
    const card = battle.hand.find(c => c.id === cardId);
    if (!card) return;
    const snapshot = battle;
    setPlayingCardId(cardId);
    playTimerRef.current = setTimeout(() => {
      const next = playCard(snapshot, cardId);
      spawnPopups(snapshot, next);
      setPlayingCardId(null);
      applyAndCheck(next, card.name);
    }, PLAY_ANIM_MS);
  }

  // 타겟 필요 카드 선택 (null 이면 선택 해제)
  function handleSelectCard(cardId: string | null) {
    if (isOver) return;
    setSelectedCardId(cardId);
  }

  // 적 클릭: 선택된 카드가 있으면 해당 적에게 사용
  function handleEnemyClick(enemyIndex: number) {
    if (isOver || !selectedCardId || playingCardId) return;
    const card = battle.hand.find(c => c.id === selectedCardId);
    if (!card) return;
    const cardId = selectedCardId;
    const snapshot = battle;
    setSelectedCardId(null);
    setPlayingCardId(cardId);
    playTimerRef.current = setTimeout(() => {
      const next = playCard(snapshot, cardId, enemyIndex);
      spawnPopups(snapshot, next);
      setPlayingCardId(null);
      applyAndCheck(next, card.name);
    }, PLAY_ANIM_MS);
  }

  function handleEndTurn() {
    if (isOver || playingCardId) return;
    setSelectedCardId(null);
    const snapshot = battle;
    const next = endPlayerTurn(snapshot);
    spawnPopups(snapshot, next);
    const result = isBattleOver(next);
    setBattle(next);
    setLog(`턴 ${next.turn} 시작`);
    if (result) {
      setIsOver(true);
      onBattleEnd(result);
    } else {
      setBanner('enemy'); // 전투가 계속될 때만 배너 표시 (C-2 fix)
    }
  }

  const { player, enemies, hand, energy, maxEnergy, deck, discardPile, turn } = battle;
  const isTargeting = selectedCardId !== null;

  return (
    // 외부 래퍼: transform 없음 → fixed 배너가 viewport 기준으로 올바르게 위치 (C-1 fix)
    <div className="relative h-screen">
      {/* 턴 전환 배너 오버레이 — screen-shake 래퍼 바깥에 있어 흔들림 영향 없음 */}
      {banner && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={['turn-banner text-4xl font-black px-10 py-5 rounded-2xl border-2 shadow-2xl', BANNER_CONFIG[banner].style].join(' ')}
            onAnimationEnd={() => {
              if (banner === 'enemy' && !isOver) setBanner('player');
              else setBanner(null);
            }}
          >
            {BANNER_CONFIG[banner].text}
          </div>
        </div>
      )}
      {/* 게임 콘텐츠 — screen-shake가 이 div에만 적용됨 */}
      <div
        className={['flex flex-col h-full bg-gray-900 text-white p-4 gap-4', isScreenShaking ? 'screen-shake' : ''].join(' ')}
        onAnimationEnd={e => { if (e.animationName === 'screen-shake') setIsScreenShaking(false); }}
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
          disabled={isOver || !!playingCardId}
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
          const isHurt = hurtEnemies.has(index);
          const isDying = dyingEnemies.has(index);

          // enemy-dying은 forwards로 opacity:0을 유지하므로 제거하지 않음 (C-1)
          function handleAnimationEnd(e: React.AnimationEvent<HTMLDivElement>) {
            if (e.animationName === 'enemy-hurt') removeHurt(index);
          }

          return (
            <div
              key={enemy.id}
              onClick={() => isClickable && handleEnemyClick(index)}
              onAnimationEnd={handleAnimationEnd}
              className={[
                'relative overflow-visible bg-gray-800 rounded-xl p-4 w-44 flex flex-col gap-2 border',
                isDying
                  ? 'enemy-dying border-gray-600'
                  : isHurt
                    ? 'enemy-hurt border-gray-600'
                    : 'transition-all duration-150',
                // isDying이 영속되므로 사망 후에도 opacity-40 적용 불필요
                !isAlive && !isDying ? 'border-gray-700 opacity-40 pointer-events-none' : '',
                !isDying && !isHurt && isClickable
                  ? 'border-red-400 cursor-crosshair ring-2 ring-red-400/60 hover:ring-red-400 hover:scale-105'
                  : !isDying && !isHurt && isAlive
                    ? 'border-gray-600'
                    : '',
              ].join(' ')}
            >
              {popups.filter(p => p.target === index).map(popup => (
                <span
                  key={popup.id}
                  onAnimationEnd={e => removePopup(popup.id, e)}
                  className={`damage-popup ${popup.value < 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {popup.value < 0 ? popup.value : `+${popup.value}`}
                </span>
              ))}
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
        {/* 이모지 래퍼 — 팝업이 이모지 위에 정확히 뜨도록 relative 기준점 설정 (W-6) */}
        <div className="relative overflow-visible">
          {popups.filter(p => p.target === 'player').map(popup => (
            <span
              key={popup.id}
              onAnimationEnd={e => removePopup(popup.id, e)}
              className={`damage-popup ${popup.value < 0 ? 'text-red-400' : 'text-green-400'}`}
            >
              {popup.value < 0 ? popup.value : `+${popup.value}`}
            </span>
          ))}
          <div className="text-4xl">🧙</div>
        </div> {/* /이모지 래퍼 */}
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
            playingCardId={playingCardId}
            onSelectCard={handleSelectCard}
            onPlayCard={handleImmediatePlay}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
