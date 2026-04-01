import { useState, useRef, type ReactNode } from 'react';
import './index.css';
import { BattleScene } from './components/BattleScene';
import { NodeMap } from './components/NodeMap';
import { CardReward } from './components/CardReward';
import { EventScene } from './components/EventScene';
import { Shop } from './components/Shop';
import { DeckViewer } from './components/DeckViewer';
import { initBattle, shuffle } from './logic/battle';
import { generateMap } from './logic/map';
import { createStarterDeck, createCard, ALL_CARDS } from './data/cards';
import { createBoss, createElite, pickRandomEnemies } from './data/enemies';
import { pickRandomEvent, findEventById } from './data/events';
import type { GameState, MapNode, Card, Player, BattleState } from './types';

const TOTAL_ACTS = 3;

const INITIAL_PLAYER: Player = {
  hp: 70,
  maxHp: 70,
  block: 0,
  statusEffects: [],
  gold: 100,
};

function createInitialState(): GameState {
  return {
    phase: 'map',
    player: { ...INITIAL_PLAYER },
    map: generateMap(TOTAL_ACTS),
    currentNodeId: null,
    deck: createStarterDeck(),
    act: 0,
    battle: null,
    rewardCards: [],
    activeEventId: null,
  };
}

function createEnemiesForNode(node: MapNode) {
  if (node.type === 'boss') return [createBoss()];
  if (node.type === 'elite') return [createElite()];
  return pickRandomEnemies(Math.random() < 0.35 ? 2 : 1, false);
}

function generateRewardCards(): Card[] {
  const shuffled = shuffle([...ALL_CARDS]);
  return shuffled.slice(0, 3).map(createCard);
}

export default function App() {
  const [gs, setGs] = useState<GameState>(createInitialState);
  const [showDeck, setShowDeck] = useState(false);
  const liveBattleRef = useRef<BattleState | null>(null);

  // 맵에서 노드 클릭
  function handleNodeClick(node: MapNode) {
    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      const enemies = createEnemiesForNode(node);
      const battle = initBattle(gs.deck, enemies, gs.player.hp, gs.player.maxHp, gs.player.gold);
      liveBattleRef.current = battle;
      setGs(prev => ({ ...prev, currentNodeId: node.id, phase: 'battle', battle }));
    } else if (node.type === 'event') {
      const gameEvent = pickRandomEvent();
      setGs(prev => ({ ...prev, currentNodeId: node.id, phase: 'event', activeEventId: gameEvent.id }));
    } else if (node.type === 'shop') {
      setGs(prev => ({ ...prev, currentNodeId: node.id, phase: 'shop' }));
    }
  }

  // 전투 종료
  function handleBattleEnd(result: 'win' | 'lose') {
    // liveBattleRef에서 최신 HP/gold 읽기 (gs.battle은 초기값이라 stale함)
    const finalBattle = liveBattleRef.current;
    liveBattleRef.current = null;
    if (result === 'lose') {
      setGs(prev => ({ ...prev, phase: 'gameover' }));
      return;
    }
    setGs(prev => ({
      ...prev,
      phase: 'reward',
      rewardCards: generateRewardCards(),
      // 전투 중 변한 HP/gold 반영, block과 statusEffects는 전투 간 리셋
      player: {
        ...prev.player,
        hp: finalBattle?.player.hp ?? prev.player.hp,
        gold: finalBattle?.player.gold ?? prev.player.gold,
        block: 0,
        statusEffects: [],
      },
    }));
  }

  // 카드 보상 선택 (null = 건너뛰기)
  function handleRewardSelect(card: Card | null) {
    setGs(prev => {
      const newDeck = card ? [...prev.deck, card] : prev.deck;
      const newMap = prev.map.map(n =>
        n.id === prev.currentNodeId ? { ...n, visited: true } : n
      );
      const currentNode = prev.map.find(n => n.id === prev.currentNodeId);
      const beatBoss = currentNode?.type === 'boss';
      const isLastAct = prev.act >= TOTAL_ACTS - 1;
      return {
        ...prev,
        deck: newDeck,
        map: newMap,
        rewardCards: [],
        phase: beatBoss && isLastAct ? 'victory' : 'map',
        act: beatBoss && !isLastAct ? prev.act + 1 : prev.act,
      };
    });
  }

  // 이벤트 선택 완료
  function handleEventDone(newPlayer: Player, newDeck: Card[]) {
    setGs(prev => ({
      ...prev,
      player: { ...prev.player, hp: newPlayer.hp, gold: newPlayer.gold },
      deck: newDeck,
      map: prev.map.map(n =>
        n.id === prev.currentNodeId ? { ...n, visited: true } : n
      ),
      activeEventId: null,
      phase: 'map',
    }));
  }

  // 상점 완료 — 변경된 플레이어/덱 반영 후 맵 복귀
  function handleShopDone(newPlayer: Player, newDeck: Card[]) {
    setGs(prev => ({
      ...prev,
      // block/statusEffects는 전투 간에 유지되지 않으므로 의도적으로 제외
      player: { ...prev.player, hp: newPlayer.hp, gold: newPlayer.gold },
      deck: newDeck,
      map: prev.map.map(n =>
        n.id === prev.currentNodeId ? { ...n, visited: true } : n
      ),
      phase: 'map',
    }));
  }

  // 비전투 노드 완료 (방문 처리 후 맵 복귀)
  function handleNonBattleNodeDone() {
    setGs(prev => ({
      ...prev,
      map: prev.map.map(n =>
        n.id === prev.currentNodeId ? { ...n, visited: true } : n
      ),
      phase: 'map',
    }));
  }

  // ───── 덱 뷰어 데이터 ─────
  const isEndScreen = gs.phase === 'gameover' || gs.phase === 'victory';
  const deckForViewer = gs.phase === 'battle'
    ? (liveBattleRef.current?.deck ?? gs.battle?.deck ?? [])
    : gs.deck;
  const discardForViewer: Card[] | undefined = gs.phase === 'battle'
    ? (liveBattleRef.current?.discardPile ?? gs.battle?.discardPile ?? [])
    : undefined;

  // ───── 이벤트 페이즈 콘텐츠 (fallback 처리 포함) ─────
  let eventContent: ReactNode = null;
  if (gs.phase === 'event') {
    const event = gs.activeEventId ? findEventById(gs.activeEventId) : undefined;
    if (event) {
      eventContent = (
        <EventScene
          event={event}
          player={gs.player}
          deck={gs.deck}
          onChoose={handleEventDone}
        />
      );
    } else {
      // activeEventId 누락 또는 알 수 없는 id — 맵으로 복귀
      handleNonBattleNodeDone();
    }
  }

  // ───── 맵 화면 데이터 ─────
  const { player, map, currentNodeId, act, deck } = gs;

  return (
    <>
      {/* ── 게임오버 ── */}
      {gs.phase === 'gameover' && (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
          <div className="text-7xl">💀</div>
          <h1 className="text-4xl font-bold">패배...</h1>
          <p className="text-gray-400">모험은 여기서 끝났습니다.</p>
          <button
            onClick={() => setGs(createInitialState)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-colors"
          >
            다시 시작
          </button>
        </div>
      )}

      {/* ── 빅토리 ── */}
      {gs.phase === 'victory' && (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
          <div className="text-7xl">🎉</div>
          <h1 className="text-4xl font-bold">대마왕 격파!</h1>
          <p className="text-gray-400">모든 Act를 클리어했습니다!</p>
          <button
            onClick={() => setGs(createInitialState)}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold text-lg transition-colors"
          >
            다시 시작
          </button>
        </div>
      )}

      {/* ── 전투 ── */}
      {gs.phase === 'battle' && gs.battle && (
        <BattleScene
          initialBattle={gs.battle}
          onBattleEnd={handleBattleEnd}
          onBattleStateChange={(s) => { liveBattleRef.current = s; }}
        />
      )}

      {/* ── 카드 보상 ── */}
      {gs.phase === 'reward' && (
        <CardReward
          cards={gs.rewardCards}
          onSelect={handleRewardSelect}
          onSkip={() => handleRewardSelect(null)}
        />
      )}

      {/* ── 이벤트 ── */}
      {eventContent}

      {/* ── 상점 ── */}
      {gs.phase === 'shop' && (
        <Shop
          player={gs.player}
          deck={gs.deck}
          onLeave={handleShopDone}
        />
      )}

      {/* ── 맵 화면 ── */}
      {gs.phase === 'map' && (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
          {/* 헤더 */}
          <div className="flex-shrink-0 px-4 pt-4 pb-2 flex justify-between items-center border-b border-gray-700">
            <h1 className="text-xl font-bold">🧙 Emoji Spire</h1>
            <div className="text-sm text-gray-400 font-medium">Act {act + 1} / 3</div>
          </div>

          {/* 플레이어 상태 바 */}
          <div className="flex-shrink-0 px-4 py-2 flex gap-6 items-center text-sm border-b border-gray-800">
            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <span>❤️</span>
              <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${Math.max(0, (player.hp / player.maxHp) * 100)}%` }}
                />
              </div>
              <span className="text-gray-400 w-14 text-right">{player.hp}/{player.maxHp}</span>
            </div>
            <span className="text-yellow-400">💰 {player.gold}G</span>
            <span className="text-gray-400">📚 {deck.length}장</span>
          </div>

          {/* 노드맵 — 남은 공간 전체 사용 */}
          <div className="flex-1 min-h-0 px-4 py-3">
            <NodeMap
              map={map}
              currentAct={act}
              currentNodeId={currentNodeId}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>
      )}

      {/* ── 덱 보기 버튼 (엔드 화면 제외 모든 씬) ── */}
      {!isEndScreen && (
        <button
          onClick={() => setShowDeck(true)}
          className="fixed bottom-4 right-4 z-40 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg transition-colors"
        >
          📚 덱 보기
        </button>
      )}

      {/* ── 덱 뷰어 모달 ── */}
      {showDeck && (
        <DeckViewer
          cards={deckForViewer}
          discardPile={discardForViewer}
          onClose={() => setShowDeck(false)}
        />
      )}
    </>
  );
}
