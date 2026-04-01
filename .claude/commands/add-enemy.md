아래 설명을 기반으로 `src/data/enemies.ts`에 새 적을 추가한다.

**적 스펙**: $ARGUMENTS

## 작업 순서

1. 적 스펙을 파싱한다 (이름, 이모지, HP, 행동/인텐트)
2. `src/data/enemies.ts`의 기존 적 패턴과 컨벤션을 확인한다
3. 같은 구조로 적 팩토리 함수를 작성한다 (EnemyAction 배열, weight, intent 매칭)
4. 팩토리 함수를 export하고 적절한 경우 적 풀에 추가한다
5. `npm run build`로 빌드 확인한다

## 리뷰

code-reviewer를 서브에이전트로 실행하여 `src/data/enemies.ts` 파일만 리뷰한다.
확인 항목: 상태 직접 변이(mutation), 인텐트-액션 불일치, 도달 불가능한 액션(weight 합산 오류).
Critical 이슈가 있으면 반드시 수정 후 완료한다.

## 마무리

오늘 날짜로 `CHANGELOG.md`에 한 줄 기록한다.
