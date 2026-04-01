---
name: generate-readme
description: "Generate or update README.md. Triggers on: README, readme, 문서화, documentation, 프로젝트 설명, project description, 설치 가이드, install guide, 사용법, usage, README 업데이트, README 만들어, 리드미 만들어, 문서 생성, document this project."
---

# generate-readme

Generate a comprehensive README.md for the emoji-spire project by analyzing the source code, CLAUDE.md, and project history. Follow every step below in order.

## Step 1 — Gather project information

Run the following in parallel:

1. **Directory structure**: `find src/ -type f | sort`
2. **Package info**: Read `package.json` — extract `name`, `version`, `scripts`, `dependencies`, `devDependencies`
3. **CLAUDE.md**: Read the full file — focus on sections: 프로젝트 개요, 기술 스택, 게임 설계 (맵 구조, 전투 시스템, MVP 스코프, 이모지 비주얼 컨벤션)
4. **CHANGELOG.md**: Read the last 10 entries

## Step 2 — Analyze card and enemy data

Read the following files to extract content for the README:

- `src/data/cards.ts` — list all cards: name (id), cost, type, description
- `src/data/enemies.ts` — list all enemies: name, emoji, HP range, behavior

## Step 3 — Check existing README

Read `README.md` if it exists and note its current content. If it does not exist, note that it will be created from scratch.

## Step 4 — Generate README.md

Write `README.md` to the project root with the following sections **in this order**:

### 4-1. Header
```markdown
# 🗼 Emoji Spire

> Slay the Spire 스타일의 브라우저 로그라이크 덱빌딩 게임. 이모지로 즐기는 턴제 카드 배틀.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8)](https://tailwindcss.com/)
```

### 4-2. Screenshot placeholder
```markdown
## 스크린샷

> 📸 추후 스크린샷 추가 예정

<!-- ![Battle Scene](docs/screenshots/battle.png) -->
<!-- ![Node Map](docs/screenshots/map.png) -->
```

### 4-3. 기술 스택
List framework, language, styling, bundler, and state management from the package.json and CLAUDE.md. Use a markdown table or bullet list.

### 4-4. 설치 및 실행
```markdown
## 설치 및 실행

### 요구사항
- Node.js 18+
- npm 9+

### 설치
\`\`\`bash
git clone <repo-url>
cd emoji-spire
npm install
\`\`\`

### 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`
브라우저에서 http://localhost:5173 접속

### 프로덕션 빌드
\`\`\`bash
npm run build
npm run preview
\`\`\`
```

### 4-5. 게임 소개
Include three subsections:

**맵 구조**: Describe the Act/node structure from CLAUDE.md. Include the node type emojis (⚔️ ❓ 🛒 💀 👹).

**전투 시스템**: Describe energy, card types, hand size, block, status effects, and enemy intents from CLAUDE.md.

**카드 목록**: Generate a markdown table from the card data gathered in Step 2:

| 카드 이름 | 비용 | 타입 | 효과 |
|-----------|------|------|------|
| ... | ... | ... | ... |

**적 목록**: Generate a markdown table from the enemy data gathered in Step 2:

| 적 | 이모지 | HP | 행동 패턴 |
|----|--------|-----|-----------|
| ... | ... | ... | ... |

### 4-6. 프로젝트 구조
Show the directory tree from Step 1 in a code block. Add a one-line comment for each top-level folder:

```
src/
├── types/        # 게임 타입 정의 (Card, Enemy, GameState 등)
├── logic/        # 순수 함수 게임 로직 (전투, 맵 생성)
├── components/   # React 컴포넌트
├── data/         # 카드, 적, 이벤트 데이터
├── App.tsx       # 루트 컴포넌트 + 게임 흐름 관리
└── main.tsx      # 진입점
```

### 4-7. Claude Code 템플릿 실습 기록
Document the five phases from CLAUDE.md. Mark completed phases with ✅ and pending ones with 🔲. Infer completion status from CHANGELOG.md entries:

```markdown
## Claude Code 템플릿 실습 로드맵

이 프로젝트는 [aitmpl.com](https://aitmpl.com) 템플릿을 활용한 Claude Code 실습 프로젝트입니다.

| Phase | 템플릿 | 내용 | 상태 |
|-------|--------|------|------|
| 1 | Agent | frontend-developer + code-reviewer 에이전트 / 게임 코어 구현 | ✅ |
| 2 | Command | /add-card, /add-enemy, /implement 커맨드 / 콘텐츠 자동화 | ✅ |
| 3 | Skill | /generate-readme 스킬 / 문서 자동 생성 | ✅ |
| 4 | Hook | pre-commit 빌드·타입 체크 자동화 | 🔲 |
| 5 | MCP | GitHub 연동 / commit·push·PR 자동화 | 🔲 |
```

Update each phase's status based on what CHANGELOG.md shows as completed.

### 4-8. 라이선스
```markdown
## 라이선스

MIT License — 자유롭게 사용, 수정, 배포 가능합니다.

---

> 🤖 이 프로젝트는 [Claude Code](https://claude.ai/claude-code)와 함께 개발되었습니다.
```

## Step 5 — Report differences

After writing README.md, compare the new content to what existed before (Step 3):
- If it was created from scratch: report "README.md를 새로 생성했습니다."
- If it overwrote an existing file: briefly list the major sections that changed or were added.

## Step 6 — Update CHANGELOG.md

Append to `CHANGELOG.md`:

```markdown

## <today's date>
- generate-readme 스킬로 README.md 자동 생성: 카드/적 목록 표, Claude Code 실습 로드맵, 설치 가이드 포함
```

## Step 7 — Verify build

Run `npm run build` and confirm it still passes. README.md changes do not affect the build, but confirm anyway to maintain discipline.

Report: "README.md 생성 완료. 빌드 이상 없음."
