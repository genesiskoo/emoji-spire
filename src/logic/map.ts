import type { MapNode, NodeType } from '../types';

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

      for (const node of currentFloor) {
        const connectCount = Math.min(2, nextFloor.length);
        const indices = new Set<number>();
        while (indices.size < connectCount) {
          indices.add(Math.floor(Math.random() * nextFloor.length));
        }
        node.connections = [...indices].map(i => nextFloor[i].id);
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
