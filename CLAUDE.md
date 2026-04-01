# CLAUDE.md — emoji-spire

## 프로젝트 개요

Slay the Spire 스타일의 브라우저 로그라이크 덱빌딩 게임.
이모지 기반 비주얼, 턴제 카드 배틀, 노드맵 경로 선택.
Claude Code 템플릿(Agent/Command/Skill/Hook/MCP) 실습이 핵심 목적.

## 기술 스택

- **언어**: TypeScript
- **프레임워크**: React (Vite)
- **스타일**: Tailwind CSS
- **상태 관리**: React useState/useReducer (외부 라이브러리 없이)
- **빌드**: Vite
- **패키지 매니저**: npm

## 게임 설계

### 맵 구조 (Slay the Spire 형식)

- 3개 Act, 각 Act는 3~4개 층(노드)로 구성
- 노드 타입: ⚔️ 전투 / ❓ 이벤트 / 🛒 상점 / 💀 엘리트 / 👹 보스
- 각 층에서 2~3개 경로 중 선택
- Act 3 마지막에 보스 전투

### 전투 시스템 (덱빌딩 카드 배틀)

- **에너지**: 턴당 3 에너지 지급, 카드마다 비용 소모
- **카드 타입**: 공격(🗡️), 방어(🛡️), 스킬(✨)
- **핸드**: 턴 시작 시 5장 드로우
- **카드 사이클**: 덱 → 핸드 → 버리기 더미 → (덱 소진 시 셔플)
- **블록**: 방어 카드로 획득, 턴 종료 시 리셋
- **인텐트**: 적의 다음 행동을 아이콘으로 예고 (공격/방어/버프)
- **버프/디버프**: 스택 기반 (힘↑, 약화↓, 취약↓ 등)

### MVP 스코프 (하루 분량)

**포함:**
- 기본 카드 8~10종 (스트라이크, 디펜드, 강타, 이중공격 등)
- 적 3~4종 (슬라임, 고블린, 해골, 엘리트 1종)
- 보스 1종
- 노드맵 UI (경로 선택)
- 전투 UI (핸드, 에너지, HP, 인텐트 표시)
- 카드 보상 (전투 후 3장 중 1장 선택)
- 상점 (카드 구매/제거)

**미포함 (추후 확장):**
- 유물(렐릭) 시스템
- 카드 업그레이드
- 포션
- 세이브/로드
- 사운드

### 이모지 비주얼 컨벤션

- 플레이어: 🧙
- 적: 🟢(슬라임) 👺(고블린) 💀(해골) 👹(보스)
- 카드: 🗡️(공격) 🛡️(방어) ✨(스킬)
- 맵노드: ⚔️ ❓ 🛒 💀 👹
- 상태: ❤️(HP) ⚡(에너지) 🔥(힘) 💧(약화) 🩸(취약)

## 코드 컨벤션

- 컴포넌트: PascalCase (BattleScene.tsx, NodeMap.tsx)
- 함수/변수: camelCase
- 타입/인터페이스: PascalCase, 접두사 없음 (ICard ❌ → Card ✅)
- 게임 상태 타입은 `types/` 폴더에 분리
- 게임 로직은 `logic/` 폴더에 순수 함수로 분리 (React 의존 없이)
- 컴포넌트는 `components/` 폴더

## 디렉토리 구조 (목표)

```
emoji-spire/
├── CLAUDE.md
├── src/
│   ├── types/        # Card, Enemy, GameState 등 타입 정의
│   ├── logic/        # 전투, 맵 생성, 카드 처리 등 순수 함수
│   ├── components/   # React 컴포넌트
│   │   ├── NodeMap.tsx
│   │   ├── BattleScene.tsx
│   │   ├── CardHand.tsx
│   │   ├── Shop.tsx
│   │   └── GameOver.tsx
│   ├── data/         # 카드, 적, 이벤트 데이터 정의
│   ├── App.tsx
│   └── main.tsx
├── .claude/          # Claude Code 템플릿 (Agent/Command/Hook 등)
├── package.json
└── vite.config.ts
```

## 에이전트 구성

### 설치할 에이전트 (aitmpl.com)

```bash
# 1. 코드 생성 — 프론트엔드 개발 담당
npx claude-code-templates@latest --agent development-team/frontend-developer --yes

# 2. 코드 리뷰 — 생성된 코드의 품질/보안/패턴 검증
npx claude-code-templates@latest --agent development-tools/code-reviewer --yes
```

### 역할 분리 원칙

이 프로젝트에서는 "만든 놈이 자기 코드를 검증하는" 상황을 구조적으로 차단한다.

- **frontend-developer**: 코드 생성만 담당. 기능 구현 후 "완성"이라고 선언하지 말 것.
- **code-reviewer**: 생성된 코드를 별도 서브에이전트로 리뷰. 빌드 에러, 타입 에러, 누락된 import, 미사용 변수, 런타임 크래시 가능성을 검출.

### 검증 워크플로우 (필수)

모든 기능 구현은 아래 순서를 따른다:

1. **구현**: frontend-developer 에이전트가 코드 생성
2. **빌드 확인**: `npm run build` 실행하여 컴파일 에러 없는지 확인
3. **실행 확인**: `npm run dev`로 브라우저에서 실제 동작 확인
4. **리뷰**: code-reviewer 에이전트가 서브에이전트로 코드 검토
5. **수정**: 리뷰에서 나온 이슈 반영 후 2~3번 재확인

**절대 하지 말 것:**
- 빌드/실행 확인 없이 "완성했습니다" 선언
- 여러 파일을 한번에 만들고 한번도 빌드하지 않은 채 다음으로 넘어가기
- 타입 에러를 `any`로 때우기
- import 경로를 확인 없이 추정으로 작성

**반드시 할 것:**
- 파일 3개 이상 생성/수정할 때마다 중간 빌드 체크
- 새 컴포넌트 만들면 즉시 App.tsx에서 렌더링 확인
- 게임 로직 함수는 작성 즉시 간단한 테스트 실행

## Claude Code 템플릿 실습 계획

이 프로젝트는 aitmpl.com 템플릿 실습이 목적이므로, 아래 순서로 컴포넌트를 설치하며 개발한다:

### Phase 1 — Agent (게임 코어)
- frontend-developer 에이전트로 타입 정의 + 게임 로직 + 컴포넌트 생성
- code-reviewer 에이전트를 서브에이전트로 태워서 생성된 코드 검증
- 매 단계마다 빌드/실행 확인 필수

### Phase 2 — Command (콘텐츠 자동화)
- `/add-card` — 카드 이름, 비용, 효과를 입력하면 data/cards.ts에 자동 추가
- `/add-enemy` — 적 이름, HP, 행동 패턴을 입력하면 data/enemies.ts에 자동 추가

### Phase 3 — Skill (문서 자동 생성)
- README.md 자동 생성
- 게임 설계 문서 (카드 목록, 적 스탯 표 등) 자동 생성

### Phase 4 — Hook (자동 검증)
- pre-commit: `npm run build` 통과 필수
- pre-commit: TypeScript 타입 체크 (`tsc --noEmit`) 통과 필수

### Phase 5 — MCP (GitHub 연동)
- GitHub 리포 생성
- Claude Code 안에서 commit → push → PR 자동화

## 세션 시작 프로토콜

**새 세션을 시작할 때마다 반드시 아래를 먼저 수행한다:**

1. `find . -name "*.tmp" -o -name "*.bak" -o -name "test_*" -o -name "temp_*" -o -name "debug_*" | head -20` 실행하여 이전 세션의 잔여 파일 확인
2. `src/` 디렉토리 구조를 `tree src/ -I node_modules` 로 확인하여 현재 프로젝트 상태 파악
3. `npm run build` 실행하여 현재 빌드 상태 확인
4. 잔여 임시 파일이 있으면 사용자에게 보고하고 삭제 여부 확인
5. `CHANGELOG.md`가 있으면 마지막 작업 내역 확인

**이 프로토콜을 건너뛰지 마라. 세션 시작 시 "뭘 해드릴까요?" 전에 위 5단계를 먼저 실행한다.**

## 파일 위생 규칙

### 임시 파일 금지

- 프로젝트 루트에 `test.ts`, `temp.tsx`, `debug.ts`, `scratch.ts` 같은 임시 파일을 절대 생성하지 않는다
- 디버깅/테스트 목적의 코드는 반드시 정해진 위치에만 작성:
  - 테스트 코드: `src/__tests__/` 폴더 안에만
  - 임시 디버깅: 기존 파일에 `console.log` 추가 후, 작업 완료 시 반드시 제거
- 파일을 생성했으면 반드시 어딘가에서 import/사용해야 한다. 고아 파일 금지.

### 레거시 코드 금지

- 기능을 다시 만들 때, 이전 버전을 `OldComponent.tsx`, `CardV1.ts` 같은 이름으로 남기지 않는다
- 교체된 코드는 삭제한다. git이 히스토리를 관리한다.
- 주석 처리로 "혹시 모르니까 남겨두는" 코드 블록 금지

### 작업 완료 시 정리 체크리스트

모든 작업(기능 구현, 버그 수정, 리팩토링) 완료 시 아래를 반드시 수행:

1. `console.log`, `console.debug` 등 디버깅 로그 전부 제거
2. 사용하지 않는 import 제거
3. 빈 파일, 고아 파일 확인 및 삭제
4. `npm run build` 통과 확인
5. 작업 내용을 `CHANGELOG.md`에 한 줄로 기록 (날짜 + 요약)

### CHANGELOG.md 형식

```markdown
# Changelog

## 2026-03-31
- 전투 시스템 코어 로직 구현 (카드 드로우, 에너지, 블록)
- 슬라임/고블린 적 데이터 추가
```

이 파일은 세션 간 인수인계 역할을 한다. 다음 세션의 에이전트가 이걸 읽고 현재 상태를 파악한다.

## 주의사항

- 게임 로직(`logic/`)은 React 의존 없이 순수 함수로 작성할 것
- 상태 변경은 불변성(immutable) 유지 — spread operator 또는 structuredClone 사용
- 카드 효과는 전략 패턴으로 구현 (카드별 effect 함수)
- 적 AI(인텐트)는 확률 기반 행동 테이블로 구현
- **3개 파일 이상 수정 시 반드시 중간 빌드 체크**
- **"완성" 선언 전 반드시 브라우저에서 실행 확인**
- **임시 파일 생성 금지 — 정해진 위치에만 코드 작성**
- **작업 완료 시 정리 체크리스트 필수 수행**
