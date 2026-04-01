Add a new card to `src/data/cards.ts` based on the description below.

**Card spec**: $ARGUMENTS

## Instructions

1. Parse the card spec (name, cost, type, effect description)
2. Review existing cards in `src/data/cards.ts` for patterns and conventions
3. Create the card definition following the same structure (effect function, requiresTarget, etc.)
4. Add it to the `ALL_CARDS` array
5. Run `npm run build` to verify

## Review

Run code-reviewer as a subagent to review ONLY `src/data/cards.ts`.
Focus on: state mutation, intent-action mismatch, missing requiresTarget, unreachable actions.
Fix any Critical issues before finishing.

## Finish

Add a one-line entry to `CHANGELOG.md` with today's date.
