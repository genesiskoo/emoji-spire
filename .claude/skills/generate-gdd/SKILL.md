---
name: generate-gdd
description: "Generate or update GDD.md (Game Design Document). Triggers on: GDD, game design document, 게임 디자인 문서, 카드 목록, card list, 적 목록, enemy list, 이벤트 목록, event list, 스탯, stats, 밸런스, balance, 게임 데이터, game data, GDD 만들어, GDD 업데이트, 카드 정리, 적 정리, 밸런스 표."
---

# generate-gdd

Generate a Game Design Document (`GDD.md`) by parsing the project's data files and formatting the output according to the reference template. Follow every step below in order.

## Step 1 — Read the output format reference

Read `references/output-format.md` (located in the same directory as this SKILL.md file, i.e. `.claude/skills/generate-gdd/references/output-format.md`). This file defines the exact table formats to use for cards, enemies, and events. Use it as the authoritative template for all tables generated in Step 3.

## Step 2 — Parse game data files

Read the following three files in parallel and extract the data described below:

### `src/data/cards.ts`
For each card object, extract:
- `id` — use as the display name (convert camelCase to readable if needed)
- `name` — display name in Korean/English as written
- `cost` — energy cost (number)
- `type` — card type (`'attack'` → 공격, `'defense'` → 방어, `'skill'` → 스킬)
- `description` — effect description string

Also calculate summary statistics:
- Total card count
- Average cost (rounded to 1 decimal)
- Count per type (공격 / 방어 / 스킬)

### `src/data/enemies.ts`
For each enemy object, extract:
- `name` — display name
- `emoji` — visual identifier
- `hp` (or `minHp`/`maxHp` if range) — HP value(s)
- `intents` — list of action names and their values (공격 damage / 방어 block / 버프 etc.)

Also calculate summary statistics:
- Total enemy count
- Average HP (rounded to nearest integer)
- Count per role: 일반 / 엘리트 / 보스 (infer from HP range and name)

### `src/data/events.ts`
For each event object, extract:
- `name` — event title
- `description` — flavor text (first 60 characters if long)
- `choices` — array of choice labels
- `effects` — what each choice does (hp change, gold change, card add/remove)

Also calculate summary statistics:
- Total event count
- Total choice count across all events

## Step 3 — Generate GDD.md

Write `GDD.md` to the project root. Use the table formats from `references/output-format.md`. Include the following sections in order:

### 3-1. Header

```markdown
# 📋 Emoji Spire — Game Design Document

> 이 문서는 `generate-gdd` 스킬로 자동 생성됩니다. 소스 코드(`src/data/`)가 변경되면 `/generate-gdd`로 재생성하세요.

**최종 생성일**: <today's date>
```

### 3-2. 요약 통계 (Summary Statistics)

A quick-reference table at the top:

```markdown
## 요약 통계

| 항목 | 수치 |
|------|------|
| 총 카드 수 | N장 |
| 평균 카드 비용 | N.N 에너지 |
| 공격 / 방어 / 스킬 카드 | N / N / N |
| 총 적 수 | N종 |
| 평균 적 HP | N |
| 일반 / 엘리트 / 보스 | N / N / N |
| 총 이벤트 수 | N종 |
| 총 선택지 수 | N개 |
```

Fill in actual values from Step 2.

### 3-3. 카드 목록 (Card List)

Use the card table format from `references/output-format.md`. Include all cards sorted by cost (ascending), then by type within same cost.

Add a subsection header for each cost tier if there are multiple cards at the same cost:

```markdown
## 카드 목록

<table from output-format.md — all cards>
```

### 3-4. 적 목록 (Enemy List)

Use the enemy table format from `references/output-format.md`. Group enemies into subsections: **일반**, **엘리트**, **보스**.

```markdown
## 적 목록

### 일반 적
<table>

### 엘리트
<table>

### 보스
<table>
```

For the 행동 패턴 column, list each intent on a separate line within the cell using `<br>` if needed, e.g.: `공격(6) / 방어(블록5) / 버프(힘+1)`.

### 3-5. 이벤트 목록 (Event List)

Use the event table format from `references/output-format.md`. Include all events.

```markdown
## 이벤트 목록

<table from output-format.md — all events>
```

### 3-6. 밸런스 노트 (Balance Notes)

Add an automatically generated observations section based on the extracted data:

```markdown
## 밸런스 노트

> 아래 항목은 데이터에서 자동으로 도출된 관찰입니다. 수동으로 검토 후 수정하세요.

- **가장 비싼 카드**: <name> (비용 N)
- **가장 저렴한 카드**: <name> (비용 N)
- **가장 높은 HP 적**: <name> (HP N)
- **가장 낮은 HP 적**: <name> (HP N)
- **이벤트당 평균 선택지 수**: N.N개
```

### 3-7. 확장 계획 (Roadmap)

```markdown
## 확장 계획

> CLAUDE.md MVP 스코프 기준 — 미구현 항목

- [ ] 유물(렐릭) 시스템
- [ ] 카드 업그레이드
- [ ] 포션
- [ ] 세이브/로드
- [ ] 사운드
```

## Step 4 — Report

After writing GDD.md, report:
- Whether GDD.md was newly created or overwrote an existing file
- The summary statistics (card count, enemy count, event count)
- Any data anomalies noticed (e.g. cards with missing descriptions, enemies with no intents)

## Step 5 — Update CHANGELOG.md

Append to `CHANGELOG.md`:

```markdown

## <today's date>
- generate-gdd 스킬로 GDD.md 자동 생성: 카드 N장·적 N종·이벤트 N종 정리, 밸런스 노트 포함
```

Fill in the actual counts.

## Step 6 — Verify build

Run `npm run build`. GDD.md does not affect the build, but run it anyway to confirm no regressions.

Report: "GDD.md 생성 완료. 빌드 이상 없음."
