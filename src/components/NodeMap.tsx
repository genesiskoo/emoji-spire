import type { MapNode, NodeType } from '../types';
import { getAvailableNodes } from '../logic/map';

const NODE_LABELS: Record<NodeType, string> = {
  battle: '전투',
  event: '이벤트',
  shop: '상점',
  elite: '엘리트',
  boss: '보스',
};

interface NodeMapProps {
  map: MapNode[];
  currentAct: number;
  currentNodeId: string | null;
  onNodeClick: (node: MapNode) => void;
}

export function NodeMap({ map, currentAct, currentNodeId, onNodeClick }: NodeMapProps) {
  const actNodes = map.filter(n => n.act === currentAct);

  const availableIds = new Set(
    getAvailableNodes(map, currentNodeId).map(n => n.id)
  );

  // 층별 노드 묶음 (x 위치 계산용)
  const nodesByFloor = new Map<number, MapNode[]>();
  for (const node of actNodes) {
    const arr = nodesByFloor.get(node.floor) ?? [];
    nodesByFloor.set(node.floor, [...arr, node]);
  }

  const maxFloor = actNodes.length > 0
    ? Math.max(...actNodes.map(n => n.floor))
    : 3;

  // 노드 위치 계산: x는 층 내 path 분포, y는 floor에 따라 아래→위
  function getPos(node: MapNode): [number, number] {
    const floorNodes = nodesByFloor.get(node.floor) ?? [node];
    const pathCount = floorNodes.length;
    const x = (node.pathIndex + 1) / (pathCount + 1) * 100;
    const y = 88 - (node.floor / maxFloor) * 78;
    return [x, y];
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* SVG 연결선 — 노드 뒤에 렌더링 */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      >
        {actNodes.flatMap(node =>
          node.connections
            .map(id => map.find(n => n.id === id))
            .filter((conn): conn is MapNode => conn != null && conn.act === currentAct)
            .map(conn => {
              const [x1, y1] = getPos(node);
              const [x2, y2] = getPos(conn);
              const isActivePath =
                node.id === currentNodeId && availableIds.has(conn.id);
              return (
                <line
                  key={`${node.id}-${conn.id}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isActivePath ? '#9CA3AF' : '#374151'}
                  strokeWidth={isActivePath ? 1.5 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })
        )}
      </svg>

      {/* 노드 */}
      {actNodes.map(node => {
        const [x, y] = getPos(node);
        const isAvailable = availableIds.has(node.id);
        const isCurrent = node.id === currentNodeId;

        return (
          <div
            key={node.id}
            onClick={() => isAvailable && onNodeClick(node)}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
            className={`absolute flex flex-col items-center gap-0.5 ${isAvailable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={[
              'w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 transition-all duration-150',
              isCurrent
                ? 'border-green-400 bg-green-900/40 ring-2 ring-green-400/50'
                : isAvailable
                  ? 'border-yellow-400 bg-gray-700 hover:scale-110 hover:bg-gray-600 hover:ring-2 hover:ring-yellow-300/50'
                  : node.visited
                    ? 'border-gray-600 bg-gray-800 opacity-40'
                    : 'border-gray-700 bg-gray-800 opacity-20',
            ].join(' ')}>
              {node.emoji}
            </div>
            <span className={[
              'text-xs font-medium whitespace-nowrap',
              isCurrent ? 'text-green-400' :
              isAvailable ? 'text-yellow-300' :
              'text-gray-600',
            ].join(' ')}>
              {NODE_LABELS[node.type]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
