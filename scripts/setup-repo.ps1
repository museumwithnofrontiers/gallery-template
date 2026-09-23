# Finishes the repository setup that "Use this template" and the built-in
# GITHUB_TOKEN cannot do themselves (see .github/workflows/bootstrap.yml for
# why: repository administration is not a permission GITHUB_TOKEN can ever
# hold). Run this once, as yourself, after using the template:
#
#   .\scripts\setup-repo.ps1
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

$ErrorActionPreference = 'Stop'

$RequiredChecks = @(
  'ci / Build (blocking)',
  'ci / Test (blocking)',
  'ci / Texts (blocking)',
  'locales / Validate locale files'
)
$CheckAppId = 15368 # GitHub Actions

$Repo = gh repo view --json nameWithOwner --jq .nameWithOwner
Write-Host "Setting up $Repo ..."
Write-Host ""

function Invoke-GhApiJson($Path, $Method, $Payload) {
  $tmp = New-TemporaryFile
  try {
    $Payload | Set-Content -Path $tmp -Encoding utf8NoBOM
    gh api -X $Method "repos/$Repo/$Path" --input $tmp.FullName | Out-Null
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

# ── Pages ────────────────────────────────────────────────────────────────
$pagesOk = $true
try { gh api "repos/$Repo/pages" | Out-Null } catch { $pagesOk = $false }
if (-not $pagesOk) {
  gh api -X POST "repos/$Repo/pages" -f build_type=workflow | Out-Null
  Write-Host "[Pages]          enabled (build_type=workflow)."
} else {
  Write-Host "[Pages]          already enabled -- nothing to do."
}

# ── Ruleset: main-requires-pr ───────────────────────────────────────────
$rulesetPayload = @{
  name = 'main-requires-pr'
  target = 'branch'
  enforcement = 'active'
  conditions = @{ ref_name = @{ include = @('~DEFAULT_BRANCH'); exclude = @() } }
  rules = @(
    @{ type = 'deletion' },
    @{ type = 'non_fast_forward' },
    @{
      type = 'pull_request'
      parameters = @{
        required_approving_review_count = 0
        dismiss_stale_reviews_on_push = $false
        required_reviewers = @()
        require_code_owner_review = $false
        dismissal_restriction = @{ enabled = $false; allowed_actors = @() }
        require_last_push_approval = $false
        required_review_thread_resolution = $false
        require_extra_approval_for_unattributed_changes = $true
        allowed_merge_methods = @('merge', 'squash', 'rebase')
      }
    }
  )
} | ConvertTo-Json -Depth 10

$existingRulesetId = gh api "repos/$Repo/rulesets" --jq '.[] | select(.name=="main-requires-pr") | .id' 2>$null
if ([string]::IsNullOrWhiteSpace($existingRulesetId)) {
  Invoke-GhApiJson 'rulesets' 'POST' $rulesetPayload
  Write-Host "[Ruleset]        created 'main-requires-pr'."
} else {
  Invoke-GhApiJson "rulesets/$existingRulesetId" 'PUT' $rulesetPayload
  Write-Host "[Ruleset]        'main-requires-pr' already exists -- refreshed to the canonical shape."
}

# ── Classic branch protection: the four required CI checks ─────────────
$protectionPayload = @{
  required_status_checks = @{
    strict = $false
    checks = $RequiredChecks | ForEach-Object { @{ context = $_; app_id = $CheckAppId } }
  }
  enforce_admins = $true
  required_pull_request_reviews = $null
  restrictions = $null
  required_linear_history = $false
  allow_force_pushes = $false
  allow_deletions = $false
  block_creations = $false
  required_conversation_resolution = $false
  lock_branch = $false
  allow_fork_syncing = $false
} | ConvertTo-Json -Depth 10
Invoke-GhApiJson 'branches/main/protection' 'PUT' $protectionPayload
Write-Host "[Branch protection] main requires: $($RequiredChecks -join ', ')."

# ── Repo flags: auto-merge, delete-branch-on-merge ──────────────────────
$current = gh api "repos/$Repo" --jq '"\(.allow_auto_merge) \(.delete_branch_on_merge)"'
if ($current -ne 'true true') {
  gh api -X PATCH "repos/$Repo" -f allow_auto_merge=true -F delete_branch_on_merge=true | Out-Null
  Write-Host "[Repo settings]  allow_auto_merge and delete_branch_on_merge enabled."
} else {
  Write-Host "[Repo settings]  already enabled -- nothing to do."
}

# ── Dependabot security updates ──────────────────────────────────────────
$secFixesOn = $false
try { $secFixesOn = (gh api "repos/$Repo/automated-security-fixes" --jq '.enabled') -eq 'true' } catch {}
if ($secFixesOn) {
  Write-Host "[Dependabot]     security updates already enabled -- nothing to do."
} else {
  gh api -X PUT "repos/$Repo/automated-security-fixes" | Out-Null
  Write-Host "[Dependabot]     security updates enabled."
}

# ── CodeQL: extend the org default setup to javascript-typescript ───────
# Deliberately tolerant, unlike every other call in this script: on a freshly
# created repo the organization's own CodeQL default setup is busy
# auto-detecting languages at the same time, and GitHub answers this PATCH
# with a conflict while that's in flight. The final assertion loop below
# re-reads the language list for real and waits for it, so it alone decides
# whether the run succeeded.
$hasJs = $false
try { $hasJs = (gh api "repos/$Repo/code-scanning/default-setup" --jq '.languages | index("javascript-typescript") != null') -eq 'true' } catch {}
if ($hasJs) {
  Write-Host "[CodeQL]         already scans javascript-typescript -- nothing to do."
} else {
  try {
    gh api -X PATCH "repos/$Repo/code-scanning/default-setup" `
      -f state=configured -f query_suite=extended `
      -F 'languages[]=actions' -F 'languages[]=javascript-typescript' | Out-Null
    Write-Host "[CodeQL]         extended to scan javascript-typescript too (takes about a minute to take effect)."
  } catch {
    Write-Host "[CodeQL]         could not update the scan configuration right now -- the organization's own scan setup may be updating this repository at the same time; the final check below will wait for it."
  }
}

# ── Verify, then mark complete ───────────────────────────────────────────
function Test-FinalSettings {
  $failures = @()

  $pagesOk = $true
  try { gh api "repos/$Repo/pages" | Out-Null } catch { $pagesOk = $false }
  if (-not $pagesOk) { $failures += 'Pages is not enabled.' }

  $rulesetId = gh api "repos/$Repo/rulesets" --jq '.[] | select(.name=="main-requires-pr") | .id' 2>$null
  if ([string]::IsNullOrWhiteSpace($rulesetId)) { $failures += "Ruleset 'main-requires-pr' is missing." }

  $checkCount = $null
  try { $checkCount = gh api "repos/$Repo/branches/main/protection" --jq '.required_status_checks.checks | length' } catch {}
  if ($checkCount -ne '4') { $failures += 'Branch protection on main does not require all four checks.' }

  $current = gh api "repos/$Repo" --jq '"\(.allow_auto_merge) \(.delete_branch_on_merge)"'
  if ($current -ne 'true true') { $failures += 'allow_auto_merge and/or delete_branch_on_merge is not enabled.' }

  $secFixesOk = $false
  try { $secFixesOk = (gh api "repos/$Repo/automated-security-fixes" --jq '.enabled') -eq 'true' } catch {}
  if (-not $secFixesOk) { $failures += 'Dependabot security updates are not enabled.' }

  $hasJsFinal = $false
  try { $hasJsFinal = (gh api "repos/$Repo/code-scanning/default-setup" --jq '.languages | index("javascript-typescript") != null') -eq 'true' } catch {}
  if (-not $hasJsFinal) { $failures += 'CodeQL default setup does not include javascript-typescript.' }

  return $failures
}

Write-Host ""
Write-Host "Verifying final state before marking setup complete ..."

$deadline = (Get-Date).ToUniversalTime().AddSeconds(90)
$failures = Test-FinalSettings
$waitMessageShown = $false
while ($failures.Count -gt 0 -and (Get-Date).ToUniversalTime() -lt $deadline) {
  if (-not $waitMessageShown) {
    Write-Host "Some settings (most often CodeQL's language list) can take a little while to catch up on GitHub's side after being set -- waiting and checking again, this is normal ..."
    $waitMessageShown = $true
  }
  Start-Sleep -Seconds 5
  $failures = Test-FinalSettings
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "ERROR: setup is not actually complete -- refusing to set the completion marker:"
  foreach ($f in $failures) { Write-Host "  - $f" }
  Write-Host ""
  Write-Host "Re-run this script after checking the messages above."
  exit 1
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
gh variable set GALLERY_TEMPLATE_SETUP_COMPLETE --body $timestamp | Out-Null
Write-Host "[Marker]         GALLERY_TEMPLATE_SETUP_COMPLETE repository variable set."

Write-Host ""
Write-Host "Done. Next: replace the __DATASET__/__SITE_NAME__/__SITE_NAMESPACE__"
Write-Host "placeholders (README.md, 'Admin - creating a new gallery', step 2),"
Write-Host "then install the dataset package (step 3)."
