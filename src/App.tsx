import { useState } from 'react';
import './index.css';
import { BattleScene } from './components/BattleScene';
import { NodeMap } from './components/NodeMap';
import { CardReward } from './components/CardReward';
import { initBattle, shuffle } from './logic/battle';
import { generateMap } from './logic/map';
import { createStarterDeck, createCard, ALL_CARDS } from './data/cards';
import { createBoss, createElite, pickRandomEnemies } from './data/enemies';
import type { GameState, MapNode, Card, Player } from './types';

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

  // 맵에서 노드 클릭
  function handleNodeClick(node: MapNode) {
    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      const enemies = createEnemiesForNode(node);
      const battle = initBattle(gs.deck, enemies, gs.player.hp, gs.player.maxHp, gs.player.gold);
      setGs(prev => ({ ...prev, currentNodeId: node.id, phase: 'battle', battle }));
    } else if (node.type === 'event') {
      setGs(prev => ({ ...prev, currentNodeId: node.id, phase: 'event' }));
    } else if (node.type === 'shop') {
      setGs(prev => ({ ...prev, currentNodeId: node.id, phase: 'shop' }));
    }
  }

  // 전투 종료
  function handleBattleEnd(result: 'win' | 'lose') {
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
        hp: prev.battle?.player.hp ?? prev.player.hp,
        gold: prev.battle?.player.gold ?? prev.player.gold,
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

  // 이벤트/상점 완료 (미구현 — 방문 처리 후 맵 복귀)
  function handleNonBattleNodeDone() {
    setGs(prev => ({
      ...prev,
      map: prev.map.map(n =>
        n.id === prev.currentNodeId ? { ...n, visited: true } : n
      ),
      phase: 'map',
    }));
  }

  // ───── 페이즈별 렌더링 ─────

  if (gs.phase === 'gameover') {
    return (
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
    );
  }

  if (gs.phase === 'victory') {
    return (
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
    );
  }

  if (gs.phase === 'battle' && gs.battle) {
    return (
      <BattleScene
        initialBattle={gs.battle}
        onBattleEnd={handleBattleEnd}
      />
    );
  }

  if (gs.phase === 'reward') {
    return (
      <CardReward
        cards={gs.rewardCards}
        onSelect={handleRewardSelect}
        onSkip={() => handleRewardSelect(null)}
      />
    );
  }

  if (gs.phase === 'event') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
        <div className="text-6xl">❓</div>
        <h2 className="text-2xl font-bold">신비한 사건</h2>
        <p className="text-gray-400 text-center max-w-xs">
          낡은 석판에 알 수 없는 문자가 새겨져 있다.<br />
          <span className="text-sm text-gray-500">(이벤트 시스템 준비 중)</span>
        </p>
        <button
          onClick={handleNonBattleNodeDone}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-colors"
        >
          계속 진행
        </button>
      </div>
    );
  }

  if (gs.phase === 'shop') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
        <div className="text-6xl">🛒</div>
        <h2 className="text-2xl font-bold">상인</h2>
        <p className="text-gray-400 text-center max-w-xs">
          상인이 다양한 물건을 펼쳐 놓고 있다.<br />
          <span className="text-sm text-gray-500">(상점 시스템 준비 중)</span>
        </p>
        <p className="text-yellow-400">💰 보유 골드: {gs.player.gold}G</p>
        <button
          onClick={handleNonBattleNodeDone}
          className="px-6 py-3 bg-green-700 hover:bg-green-600 rounded-xl font-bold transition-colors"
        >
          떠나기
        </button>
      </div>
    );
  }

  // ───── 맵 화면 ─────
  const { player, map, currentNodeId, act, deck } = gs;

  return (
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
  );
}
