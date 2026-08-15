#!/usr/bin/env bash
# .chief/verify.sh — Chief verification hook.
#
# Chief runs this after a tasklist's stories are done and its branch has been
# rebased onto the base. Return 0 to ALLOW the merge, non-zero to BLOCK it (the
# branch is left for review). Runs with cwd = repo root, the finished branch
# checked out; $CHIEF_BASE_BRANCH names the base (use it to baseline if you want).
#
# Replace the body with your project's real checks (build + tests + lint).
set -uo pipefail

changed="$(git diff --name-only "$CHIEF_BASE_BRANCH"...HEAD)"
[ -z "$changed" ] && { echo "verify: no diff vs $CHIEF_BASE_BRANCH"; exit 0; }

# --- documentation link gate -------------------------------------------------
# Every local doc reference must resolve. RATCHET, not a wall: compares this branch
# against the base and blocks only a REGRESSION, so pre-existing rot is retired
# deliberately instead of blocking every merge. Local refs only — an external URL
# checker fails for network reasons, and a gate that fails for reasons unrelated to
# the change is a gate that gets switched off. CHIEF_VERIFY_DOCLINKS=0 skips it.
if [ "${CHIEF_VERIFY_DOCLINKS:-1}" = 1 ] \
   && echo "$changed" | grep -qE '\.md$|^docs/' \
   && [ -f scripts/check-doc-links.mjs ] && command -v node >/dev/null 2>&1; then
  node scripts/check-doc-links.mjs --ratchet --base "${CHIEF_BASE_BRANCH:-main}" \
    || { echo "verify: doc-link regression (see above)"; exit 1; }
fi


# --- EDIT ME: run the checks relevant to what the branch changed ---
# make test        || exit 1
# npm test         || exit 1
# uv run pytest -q || exit 1
echo "verify: no checks configured yet — edit .chief/verify.sh (allowing merge)"
exit 0
