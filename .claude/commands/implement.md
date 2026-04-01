Implement the following feature, following the workflow below step by step.

**Feature**: $ARGUMENTS

## Workflow

### Step 1 - Implement
Build the feature described above.
- Review existing code structure before starting
- Run intermediate build checks if modifying 3+ files
- No temp files, no any types

### Step 2 - Build
Run npm run build. Fix errors and rebuild until it passes.

### Step 3 - Code Review
Run code-reviewer agent as a subagent to review all changed files.

### Step 4 - Fix Issues
Fix any Critical or Warning issues from the review, then rebuild.

### Step 5 - Cleanup
Remove debug logs, unused imports, orphan files. Final build check.

### Step 6 - Changelog
Add a one-line entry to CHANGELOG.md with today's date.
