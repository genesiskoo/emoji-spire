# SESSION_CONTEXT.md

이 파일은 세션 간 인수인계용 컨텍스트입니다. `/session-start` 시 자동으로 확인합니다.

---

### Phase 3 완료 사항
- generate-readme 스킬: SKILL.md 단일 파일, README.md 자동 생성
- generate-gdd 스킬: SKILL.md + references/output-format.md 번들, GDD.md 자동 생성

### Phase 3 핵심 발견사항
1. Command와 Skill은 /skills 목록에 통합 표시된다 (Claude Code가 내부적으로 통합 관리)
2. Skill의 자동 트리거는 100% 보장되지 않는다 — "카드목록 정리해줘"로는 generate-gdd가 트리거되지 않았고, Claude가 자체 판단으로 인라인 응답함
3. 명시적 /generate-gdd 호출 시에는 SKILL.md 워크플로우(references 로딩 → 전체 파싱 → 파일 생성 → CHANGELOG → 빌드 검증)가 정확히 실행됨
4. references/ 번들은 스킬 트리거 시에만 로딩되어 평소 컨텍스트를 차지하지 않음 (프로그레시브 디스클로저 확인)
5. YAML frontmatter의 description은 > 블록 스칼라 대신 한 줄 큰따옴표 문자열로 써야 파싱 문제가 없다
6. .claude/skills/ 또는 .claude/commands/ 추가 후 Claude Code 재시작 필요

### 실습 로드맵 업데이트
Phase 3 상태를 ✅로 변경
