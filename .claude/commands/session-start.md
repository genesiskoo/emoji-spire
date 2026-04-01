Start a new session by checking project health.

## Steps

1. **Check for leftover temp files**:
   ```
   find . -name "*.tmp" -o -name "*.bak" -o -name "test_*" -o -name "temp_*" -o -name "debug_*" | grep -v node_modules | grep -v .git
   ```
   If any are found, list them and ask the user whether to delete before continuing.

2. **Show directory structure**:
   ```
   tree src/ -I node_modules --dirsfirst
   ```
   If `tree` is not available, use `find src/ -type f | sort` as a fallback.

3. **Run `npm run build`** and report the result. If it fails, show the errors and ask the user how to proceed — do not auto-fix without permission.

4. **Read `CHANGELOG.md`** and show the last 5 entries so the previous session's work is visible.

5. **Read `SESSION_CONTEXT.md`** if it exists, and summarize the current phase and next steps. If the file does not exist, skip this step and note that no session context was found.

6. **Report status**:
   ```
   Session ready. Current status: [phase/status summary from CHANGELOG and SESSION_CONTEXT]
   ```

7. **If `$ARGUMENTS` is provided**, treat it as the task to begin immediately after the health check completes. Transition directly into that task without waiting for further input.
