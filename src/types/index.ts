// ===== 카드 타입 =====
export type CardType = 'attack' | 'defense' | 'skill';
export type TargetType = 'single' | 'all' | 'none';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  description: string;
  targetType: TargetType;
  effect: (state: BattleState, targetIndex?: number) => BattleState;
}

// ===== 버프/디버프 =====
export interface StatusEffect {
  type: 'strength' | 'weakness' | 'vulnerable';
  stacks: number;
}

// ===== 적 =====
export type IntentType = 'attack' | 'defend' | 'buff';

export interface Intent {
  type: IntentType;
  value?: number;
}

export interface EnemyAction {
  intent: Intent;
  // selfIndex: 멀티 에너미 전투에서 이 액션을 실행하는 적의 인덱스
  execute: (state: BattleState, selfIndex: number) => BattleState;
  weight: number;
}

export interface Enemy {
  id: string;
  name: string;
  emoji: string;
  maxHp: number;
  hp: number;
  block: number;
  statusEffects: StatusEffect[];
  actions: EnemyAction[];
  currentIntent: Intent;
}

// ===== 플레이어 =====
export interface Player {
  hp: number;
  maxHp: number;
  block: number;
  statusEffects: StatusEffect[];
  gold: number;
}

// ===== 전투 상태 =====
export interface BattleState {
  player: Player;
  enemies: Enemy[];
  deck: Card[];
  hand: Card[];
  discardPile: Card[];
  energy: number;
  maxEnergy: number;
  turn: number;
}

// ===== 노드맵 =====
export type NodeType = 'battle' | 'event' | 'shop' | 'elite' | 'boss';

export interface MapNode {
  id: string;
  type: NodeType;
  emoji: string;
  act: number;
  floor: number;
  pathIndex: number;
  connections: string[];
  visited: boolean;
}

// ===== 이벤트 =====
export interface EventChoice {
  text: string;
  description: string;
  effect: (player: Player, deck: Card[]) => { player: Player; deck: Card[] };
}

export interface GameEvent {
  id: string;
  title: string;
  emoji: string;
  description: string;
  choices: EventChoice[];
}

// ===== 게임 상태 =====
export type GamePhase = 'map' | 'battle' | 'reward' | 'shop' | 'event' | 'gameover' | 'victory';

export interface GameState {
  phase: GamePhase;
  player: Player;
  map: MapNode[];
  currentNodeId: string | null;
  deck: Card[];
  act: number;
  battle: BattleState | null;
  rewardCards: Card[];
  activeEventId: string | null;
}
