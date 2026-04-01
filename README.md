# 🗼 Emoji Spire

> Slay the Spire 스타일의 브라우저 로그라이크 덱빌딩 게임. 이모지로 즐기는 턴제 카드 배틀.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8)](https://tailwindcss.com/)

## 스크린샷

> 📸 추후 스크린샷 추가 예정

<!-- ![Battle Scene](docs/screenshots/battle.png) -->
<!-- ![Node Map](docs/screenshots/map.png) -->

## 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 | TypeScript 5.x |
| 프레임워크 | React 19 |
| 스타일링 | Tailwind CSS 4.x |
| 빌드 도구 | Vite 8.x |
| 상태 관리 | React useState / useReducer (외부 라이브러리 없음) |

## 설치 및 실행

### 요구사항
- Node.js 18+
- npm 9+

### 설치
```bash
git clone <repo-url>
cd emoji-spire
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 http://localhost:5173 접속

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 게임 소개

### 맵 구조

3개 Act, 각 Act는 3~4개 층(노드)로 구성된 로그라이크 경로 탐험 구조.

| 노드 타입 | 이모지 | 설명 |
|-----------|--------|------|
| 전투 | ⚔️ | 일반 적과의 카드 배틀 |
| 이벤트 | ❓ | 랜덤 이벤트 (치유의 샘, 수상한 상자, 행상인) |
| 상점 | 🛒 | 카드 구매·제거, HP 회복 |
| 엘리트 | 💀 | 강력한 엘리트 적 |
| 보스 | 👹 | Act 마지막의 보스 전투 |

각 층에서 2~3개 경로 중 하나를 선택하며, Act 3 마지막에 최종 보스 전투.

### 전투 시스템

- **에너지**: 턴당 3 에너지 지급. 카드마다 에너지 비용 소모
- **핸드**: 턴 시작 시 5장 드로우
- **카드 사이클**: 덱 → 핸드 → 버리기 더미 → 덱 소진 시 셔플
- **블록**: 방어 카드로 획득, 턴 종료 시 리셋
- **인텐트**: 적의 다음 행동을 아이콘으로 예고 (⚔️ 공격 / 🛡️ 방어 / ✨ 버프)
- **상태이상**: 스택 기반 — 🔥 힘(공격력↑), 💧 약화(공격력↓), 🩸 취약(받는 피해↑)

### 카드 목록

| 카드 이름 | 비용 | 타입 | 효과 |
|-----------|:----:|------|------|
| 스트라이크 | 1 | 🗡️ 공격 | 적에게 6 피해를 입힌다. |
| 디펜드 | 1 | 🛡️ 방어 | 블록 5를 얻는다. |
| 강타 | 2 | 🗡️ 공격 | 적에게 14 피해를 입힌다. |
| 이중 공격 | 1 | 🗡️ 공격 | 적에게 3 피해를 2번 입힌다. |
| 방어막 | 1 | 🛡️ 방어 | 블록 8을 얻는다. |
| 전투 의지 | 1 | ✨ 스킬 | 힘 2를 얻는다. |
| 약점 노출 | 1 | ✨ 스킬 | 적에게 취약 2를 부여한다. |
| 분쇄 | 2 | 🗡️ 공격 | 적에게 18 피해를 입힌다. |
| 철벽 | 2 | 🛡️ 방어 | 블록 14를 얻는다. |
| 약화 | 1 | ✨ 스킬 | 적에게 약화 2를 부여한다. |
| 화염구 | 2 | 🗡️ 공격 | 적에게 12 피해를 입힌다. |

**시작 덱**: 스트라이크 ×5, 디펜드 ×4, 강타 ×1 (총 10장)

### 적 목록

| 적 이름 | 이모지 | HP | 행동 패턴 |
|---------|:------:|:---:|-----------|
| 슬라임 | 🟢 | 20 | 공격 8 (66%) / 블록 6 (33%) |
| 고블린 | 👺 | 28 | 공격 10 (75%) / 힘 버프 1 (25%) |
| 해골 | 💀 | 24 | 강타 12 (50%) / 이중타격 6×2 (50%) |
| 버섯맨 | 🍄 | 35 | 독포자 공격 6+약화 1 (75%) / 자가치유 HP+5 (25%) |
| 엘리트 오크 | 👹 | 50 | 공격 15 / 블록 12 / 힘 버프 2 |
| 대마왕 | 👿 | 120 | 공격 20 / 블록 15 / 힘 버프 3 |

## 프로젝트 구조

```
src/
├── types/        # 게임 타입 정의 (Card, Enemy, GameState 등)
├── logic/        # 순수 함수 게임 로직 (전투, 맵 생성)
├── components/   # React 컴포넌트
├── data/         # 카드, 적, 이벤트 데이터
├── App.tsx       # 루트 컴포넌트 + 게임 흐름 관리
└── main.tsx      # 진입점
```

**컴포넌트 목록:**

| 파일 | 역할 |
|------|------|
| `App.tsx` | 게임 전체 흐름 관리 (map → battle → reward → map) |
| `NodeMap.tsx` | Act별 노드맵 렌더링, 경로 선택 UI |
| `BattleScene.tsx` | 전투 화면 — 적 인텐트, 플레이어 상태, 카드 플레이 |
| `CardHand.tsx` | 핸드 카드 렌더링 및 선택 |
| `CardReward.tsx` | 전투 승리 후 카드 3장 중 1장 선택 |
| `EventScene.tsx` | 랜덤 이벤트 화면 (선택지 클릭 → 효과 적용) |
| `Shop.tsx` | 상점 UI — 카드 구매·제거, HP 회복 |

## Claude Code 템플릿 실습 로드맵

이 프로젝트는 [aitmpl.com](https://aitmpl.com) 템플릿을 활용한 Claude Code 실습 프로젝트입니다.

| Phase | 템플릿 | 내용 | 상태 |
|-------|--------|------|:----:|
| 1 | Agent | frontend-developer + code-reviewer 에이전트 / 게임 코어 구현 | ✅ |
| 2 | Command | `/add-card`, `/add-enemy`, `/implement` 커맨드 / 콘텐츠 자동화 | ✅ |
| 3 | Skill | `/generate-readme`, `/generate-gdd` 스킬 / 문서 자동 생성 | ✅ |
| 4 | Hook | pre-commit 빌드·타입 체크 자동화 | 🔲 |
| 5 | MCP | GitHub 연동 / commit·push·PR 자동화 | 🔲 |

## 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.

---

> 🤖 이 프로젝트는 [Claude Code](https://claude.ai/claude-code)와 함께 개발되었습니다.
