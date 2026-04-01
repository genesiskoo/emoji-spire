import type { MapNode, NodeType } from '../types';
import { shuffle } from './battle';

const NODE_EMOJIS: Record<NodeType, string> = {
  battle: '⚔️',
  event: '❓',
  shop: '🛒',
  elite: '💀',
  boss: '👹',
};

function pickNodeType(floor: number, actFloors: number): NodeType {
  if (floor === actFloors - 1) return 'boss';

  const isEliteFloor = floor === Math.floor(actFloors * 0.6);
  if (isEliteFloor) return 'elite';

  const rand = Math.random();
  if (rand < 0.55) return 'battle';
  if (rand < 0.75) return 'event';
  if (rand < 0.90) return 'shop';
  return 'elite';
}

export function generateMap(acts = 3): MapNode[] {
  // 함수 스코프 카운터 — 다중 generateMap 호출 시 ID 독립성 보장
  let nodeIdCounter = 0;

  function createNode(type: NodeType, act: number, floor: number, pathIndex: number): MapNode {
    return {
      id: `node_${nodeIdCounter++}`,
      type,
      emoji: NODE_EMOJIS[type],
      act,
      floor,
      pathIndex,
      connections: [],
      visited: false,
    };
  }

  const FLOORS_PER_ACT = 4;
  const PATHS_PER_FLOOR = 3;

  // 1단계: 모든 Act의 노드를 먼저 생성
  const allActNodes: MapNode[][][] = [];

  for (let act = 0; act < acts; act++) {
    const actNodes: MapNode[][] = [];

    for (let floor = 0; floor < FLOORS_PER_ACT; floor++) {
      const floorNodes: MapNode[] = [];
      const pathCount = floor === FLOORS_PER_ACT - 1 ? 1 : PATHS_PER_FLOOR;

      for (let path = 0; path < pathCount; path++) {
        const type = floor === FLOORS_PER_ACT - 1 ? 'boss' : pickNodeType(floor, FLOORS_PER_ACT);
        floorNodes.push(createNode(type, act, floor, path));
      }
      actNodes.push(floorNodes);
    }

    allActNodes.push(actNodes);
  }

  // 2단계: Act 내부 연결 설정
  for (let act = 0; act < acts; act++) {
    const actNodes = allActNodes[act];

    for (let floor = 0; floor < FLOORS_PER_ACT - 1; floor++) {
      const currentFloor = actNodes[floor];
      const nextFloor = actNodes[floor + 1];

      // 연결 초기화
      for (const node of currentFloor) {
        node.connections = [];
      }

      // Step 1: 다음 층의 모든 노드에 최소 1개의 인입 연결 보장
      // 셔플 후 round-robin으로 배분 → 어떤 노드도 고립되지 않음
      const shuffledNextIndices = shuffle(nextFloor.map((_, i) => i));
      shuffledNextIndices.forEach((nextIdx, i) => {
        const currNode = currentFloor[i % currentFloor.length];
        const nextId = nextFloor[nextIdx].id;
        if (!currNode.connections.includes(nextId)) {
          currNode.connections.push(nextId);
        }
      });

      // Step 2: 현재 층 노드가 연결 없는 경우 보정 (안전망)
      for (const node of currentFloor) {
        if (node.connections.length === 0) {
          const nextIdx = Math.floor(Math.random() * nextFloor.length);
          node.connections.push(nextFloor[nextIdx].id);
        }
      }

      // Step 3: 최대 2개까지 랜덤 추가 연결
      const maxConns = Math.min(2, nextFloor.length);
      for (const node of currentFloor) {
        for (let attempt = 0; node.connections.length < maxConns && attempt < 20; attempt++) {
          const nextIdx = Math.floor(Math.random() * nextFloor.length);
          const nextId = nextFloor[nextIdx].id;
          if (!node.connections.includes(nextId)) {
            node.connections.push(nextId);
          }
        }
      }
    }

    // 3단계: Act 경계 연결 — 이 Act의 보스 노드에서 다음 Act의 첫 번째 층으로 연결
    if (act < acts - 1) {
      const bossFloor = actNodes[FLOORS_PER_ACT - 1];
      const nextActFirstFloor = allActNodes[act + 1][0];
      for (const bossNode of bossFloor) {
        bossNode.connections = nextActFirstFloor.map(n => n.id);
      }
    }
  }

  return allActNodes.flat(2);
}

export function getAvailableNodes(map: MapNode[], currentNodeId: string | null): MapNode[] {
  if (!currentNodeId) {
    return map.filter(n => n.act === 0 && n.floor === 0);
  }
  const current = map.find(n => n.id === currentNodeId);
  if (!current) return [];
  return map.filter(n => current.connections.includes(n.id));
}
