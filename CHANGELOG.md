# Changelog

## 2026-04-01
- NodeMap 컴포넌트 구현: SVG 연결선 + 절대 위치 노드, 아래→위 레이아웃, 이용 가능/현재/방문/잠금 상태 시각화
- CardReward 컴포넌트 구현: 전투 승리 후 카드 3장 중 1장 선택, 건너뛰기 지원
- App.tsx 전체 게임 흐름 구현: map→battle→reward→map, gameover, victory
- TOTAL_ACTS 상수 추출, isLastAct 하드코딩 제거
- code-reviewer 리뷰 반영:
  - [Critical] handleBattleEnd의 prev.battle! non-null assertion → optional chaining으로 교체
  - [Critical] handleRewardSelect/handleNonBattleNodeDone stale closure 수정 → setGs(prev=>) 안으로 로직 이동
  - [Warning] isLastAct 하드코딩 2 → TOTAL_ACTS - 1 상수 사용
  - [Info] SVG line에 vectorEffect="non-scaling-stroke" 추가로 strokeWidth 왜곡 해결

## 2026-03-31
- Vite + React + TypeScript + Tailwind CSS v4 프로젝트 초기화
- 디렉토리 구조 생성: src/types, src/logic, src/components, src/data
- 타입 정의 완료: Card, Enemy, BattleState, GameState 등 전체 게임 타입 (src/types/index.ts)
- 전투 로직 구현: dealDamage, addBlock, applyStatusEffect, drawCards, playCard, endPlayerTurn 등 순수 함수 (src/logic/battle.ts)
- 노드맵 생성 로직 구현: generateMap (Act 간 연결 포함), getAvailableNodes (src/logic/map.ts)
- 카드 10종 데이터 정의: 스트라이크, 디펜드, 강타, 이중 공격 등 (src/data/cards.ts)
- 적 5종 데이터 정의: 슬라임, 고블린, 해골, 엘리트, 보스 (src/data/enemies.ts)
- code-reviewer 리뷰 반영:
  - [Critical] map.ts Act 간 연결 누락 수정 — 보스 → 다음 Act floor 0 연결 추가
  - [Critical] dealDamageToPlayer가 enemies[0] 고정이던 버그 수정 — attackerIndex 파라미터 추가, EnemyAction.execute에 selfIndex 전파
  - [Critical] 인텐트-액션 불일치 수정 — currentIntent 매칭 후 실행, 이후 다음 인텐트 결정으로 순서 교정
  - [Warning] initBattle에서 gold: 0 초기화로 기존 gold 소멸하던 버그 수정 — playerGold 파라미터 추가
  - [Warning] 해골 이중 공격 인텐트 value 불일치 수정 — 6 → 12
- BattleScene 컴포넌트 구현: 카드 핸드(CardHand.tsx), 에너지 표시, 적 HP/인텐트/블록, 플레이어 HP/블록/상태이상 (src/components/BattleScene.tsx, CardHand.tsx)
- App.tsx를 BattleScene 렌더링으로 교체 — 슬라임 + 고블린 테스트 전투
- 적 타겟팅 기능 추가: 공격/타겟 스킬 카드 클릭 시 선택 상태 전환, 적 클릭으로 타겟 지정, 빈 영역 클릭 시 선택 해제
- Card 타입에 requiresTarget 필드 추가 — 타입 기반 타겟팅 판별 대신 명시적 선언으로 변경
- code-reviewer 리뷰 반영 (2차):
  - [Critical] dealDamage에서 이미 사망한 적(hp <= 0)에 데미지 계산하던 버그 수정
  - [Critical] 스킬 카드(약점 노출, 약화)도 requiresTarget: true로 타겟 선택 지원
  - [Warning] onSelectCard 시그니처를 string | null로 수정 — 빈 문자열 특수값 패턴 제거
  - [Info] 사망한 적에 pointer-events-none 추가
- code-reviewer 리뷰 반영 (1차):
  - [Critical] 해골 두 액션 인텐트 동일 버그 수정 — 이중타격 인텐트를 value:6으로 구분
  - [Critical] 플레이어 사망 후 적 루프 계속 실행되던 버그 수정 — break 추가 (battle.ts)
  - [Critical] 전투 종료 후 핸들러 중복 호출 방지 — isOver 플래그 + disabled 처리 (BattleScene.tsx)
  - [Warning] 카드/적 ID를 전역 카운터에서 crypto.randomUUID()로 교체 — HMR 중복 방지
