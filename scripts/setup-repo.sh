#!/usr/bin/env bash
# Finishes the repository setup that "Use this template" and the built-in
# GITHUB_TOKEN cannot do themselves (see .github/workflows/bootstrap.yml for
# why: repository administration is not a permission GITHUB_TOKEN can ever
# hold). Run this once, as yourself, after using the template:
#
#   ./scripts/setup-repo.sh
#
# Requires the GitHub CLI (gh), already logged in as a user with admin
# rights on this repository: gh auth login
#
# This script never sees or stores a token of its own -- every command below
# runs as YOU, through your own `gh auth` session. Safe to re-run: it checks
# the current state before changing anything and only ever tells you what it
# did or already found in place.
#
# The settings this applies mirror every live MWNF gallery/exhibition site
# (museumwithnofrontiers/carpets, museumwithnofrontiers/water-in-islam,
# confirmed 2026-09-23) -- the same ones viewer-workflows' tools/new-website.mjs
# applies for an operator-created site, applied here by the new owner instead.
set -euo pipefail

REQUIRED_CHECKS=(
  "ci / Build (blocking)"
  "ci / Test (blocking)"
  "ci / Texts (blocking)"
  "locales / Validate locale files"
)
CHECK_APP_ID=15368 # GitHub Actions

REPO=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
echo "Setting up $REPO ..."
echo

# ── Pages ────────────────────────────────────────────────────────────────
if ! gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null
  echo "[Pages]          enabled (build_type=workflow)."
else
  echo "[Pages]          already enabled -- nothing to do."
fi

# ── Ruleset: main-requires-pr ───────────────────────────────────────────
ruleset_payload() {
  cat <<'JSON'
{
  "name": "main-requires-pr",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "dismissal_restriction": { "enabled": false, "allowed_actors": [] },
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "require_extra_approval_for_unattributed_changes": true,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    }
  ]
}
JSON
}

existing_ruleset_id=$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name=="main-requires-pr") | .id' 2>/dev/null || true)
if [ -z "$existing_ruleset_id" ]; then
  ruleset_payload | gh api -X POST "repos/$REPO/rulesets" --input - >/dev/null
  echo "[Ruleset]        created 'main-requires-pr'."
else
  ruleset_payload | gh api -X PUT "repos/$REPO/rulesets/$existing_ruleset_id" --input - >/dev/null
  echo "[Ruleset]        'main-requires-pr' already exists -- refreshed to the canonical shape."
fi

# ── Classic branch protection: the four required CI checks ─────────────
protection_payload() {
  local checks_json
  checks_json=$(printf '%s\n' "${REQUIRED_CHECKS[@]}" | jq -R --argjson appId "$CHECK_APP_ID" '{context: ., app_id: $appId}' | jq -s .)
  jq -n --argjson checks "$checks_json" '{
    required_status_checks: { strict: false, checks: $checks },
    enforce_admins: true,
    required_pull_request_reviews: null,
    restrictions: null,
    required_linear_history: false,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: false,
    lock_branch: false,
    allow_fork_syncing: false
  }'
}
protection_payload | gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null
echo "[Branch protection] main requires: ${REQUIRED_CHECKS[*]}."

# ── Repo flags: auto-merge, delete-branch-on-merge ──────────────────────
current=$(gh api "repos/$REPO" --jq '"\(.allow_auto_merge) \(.delete_branch_on_merge)"')
if [ "$current" != "true true" ]; then
  gh api -X PATCH "repos/$REPO" -f allow_auto_merge=true -F delete_branch_on_merge=true >/dev/null
  echo "[Repo settings]  allow_auto_merge and delete_branch_on_merge enabled."
else
  echo "[Repo settings]  already enabled -- nothing to do."
fi

# ── Dependabot security updates ──────────────────────────────────────────
if gh api "repos/$REPO/automated-security-fixes" --jq '.enabled' 2>/dev/null | grep -q true; then
  echo "[Dependabot]     security updates already enabled -- nothing to do."
else
  gh api -X PUT "repos/$REPO/automated-security-fixes" >/dev/null
  echo "[Dependabot]     security updates enabled."
fi

# ── CodeQL: extend the org default setup to javascript-typescript ───────
# Deliberately tolerant, unlike every other call in this script: on a freshly
# created repo the organization's own CodeQL default setup is busy
# auto-detecting languages at the same time, and GitHub answers this PATCH
# with a conflict while that's in flight. That isn't this script doing
# anything wrong, so it must not abort the run -- the final assertion loop
# below re-reads the language list for real and waits for it, so it alone
# decides whether the run succeeded.
has_js=$(gh api "repos/$REPO/code-scanning/default-setup" --jq '.languages | index("javascript-typescript") != null' 2>/dev/null || echo false)
if [ "$has_js" = "true" ]; then
  echo "[CodeQL]         already scans javascript-typescript -- nothing to do."
else
  if gh api -X PATCH "repos/$REPO/code-scanning/default-setup" \
    -f state=configured -f query_suite=extended \
    -F 'languages[]=actions' -F 'languages[]=javascript-typescript' >/dev/null 2>&1; then
    echo "[CodeQL]         extended to scan javascript-typescript too (takes about a minute to take effect)."
  else
    echo "[CodeQL]         could not update the scan configuration right now -- the organization's own scan setup may be updating this repository at the same time; the final check below will wait for it."
  fi
fi

# ── Verify, then mark complete ───────────────────────────────────────────
# Last step, on purpose -- and not a rubber stamp. set -e aborts on the
# first real failure above -- except the CodeQL PATCH, which is deliberately
# tolerant of failure -- but a step could still have silently no-opped
# against a state that was misread, so before promising anything we re-read
# every setting fresh and check it for real. GitHub's API can also
# legitimately still be catching up with a change this very script just made
# a moment ago (CodeQL's language list, extended above, is the one this
# repeatedly shows up on) -- that isn't a failure, so the check below keeps
# re-reading for a while before it gives up, rather than condemning a run
# that actually did everything right.
#
# The bootstrap workflow (.github/workflows/bootstrap.yml) cannot read
# allow_auto_merge, delete_branch_on_merge, branch protection, Dependabot's
# security-fixes setting, or CodeQL's language list under GITHUB_TOKEN --
# several of those reads 403 outright, and the rest are silently omitted
# from the API response for a non-admin reader even when true. This marker
# stands in for all of them so that workflow can tell "verified done" from
# "never run" -- so it must only be written when every assertion below
# actually passes.

check_final_settings() {
  failures=()

  if ! gh api "repos/$REPO/pages" >/dev/null 2>&1; then
    failures+=("Pages is not enabled.")
  fi

  if [ -z "$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name=="main-requires-pr") | .id')" ]; then
    failures+=("Ruleset 'main-requires-pr' is missing.")
  fi

  if ! gh api "repos/$REPO/branches/main/protection" --jq '.required_status_checks.checks | length' 2>/dev/null | grep -q '^4$'; then
    failures+=("Branch protection on main does not require all four checks.")
  fi

  current=$(gh api "repos/$REPO" --jq '"\(.allow_auto_merge) \(.delete_branch_on_merge)"')
  if [ "$current" != "true true" ]; then
    failures+=("allow_auto_merge and/or delete_branch_on_merge is not enabled.")
  fi

  if ! gh api "repos/$REPO/automated-security-fixes" --jq '.enabled' 2>/dev/null | grep -q true; then
    failures+=("Dependabot security updates are not enabled.")
  fi

  has_js_final=$(gh api "repos/$REPO/code-scanning/default-setup" --jq '.languages | index("javascript-typescript") != null' 2>/dev/null || echo false)
  if [ "$has_js_final" != "true" ]; then
    failures+=("CodeQL default setup does not include javascript-typescript.")
  fi
}

echo
echo "Verifying final state before marking setup complete ..."

deadline=$(( $(date -u +%s) + 90 ))
poll_interval_seconds=5
check_final_settings
wait_message_shown=false
while [ "${#failures[@]}" -gt 0 ] && [ "$(date -u +%s)" -lt "$deadline" ]; do
  if [ "$wait_message_shown" = false ]; then
    echo "Some settings (most often CodeQL's language list) can take a little while to catch up on GitHub's side after being set -- waiting and checking again, this is normal ..."
    wait_message_shown=true
  fi
  sleep "$poll_interval_seconds"
  check_final_settings
done

if [ "${#failures[@]}" -gt 0 ]; then
  echo
  echo "ERROR: setup is not actually complete -- refusing to set the completion marker:"
  for f in "${failures[@]}"; do
    echo "  - $f"
  done
  echo
  echo "Re-run this script after checking the messages above."
  exit 1
fi

gh variable set GALLERY_TEMPLATE_SETUP_COMPLETE --body "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >/dev/null
echo "[Marker]         GALLERY_TEMPLATE_SETUP_COMPLETE repository variable set."

echo
echo "Done. Next: replace the __DATASET__/__SITE_NAME__/__SITE_NAMESPACE__"
echo "placeholders (README.md, 'Admin — creating a new gallery', step 2),"
echo "then install the dataset package (step 3)."
