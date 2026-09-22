# ============================================================
#  pgl-tools - one-command deploy
#  Usage:  .\deploy.ps1 "your commit message"
#  Stages every change, commits it, pushes to GitHub, then
#  verifies the remote really received the commit.
#  GitHub Actions rebuilds and redeploys automatically.
# ============================================================
param(
    [string]$Message = "chore: update"
)

Set-Location -LiteralPath $PSScriptRoot

Write-Host ''
Write-Host '=== 1/4 stage changes ===' -ForegroundColor Cyan
git add -A
if ($LASTEXITCODE -ne 0) {
    Write-Host 'FAILED: git add' -ForegroundColor Red
    exit 1
}

$pending = git status --porcelain
if (-not $pending) {
    Write-Host 'No local changes to commit.'
} else {
    Write-Host $pending
    Write-Host ''
    Write-Host '=== 2/4 commit ===' -ForegroundColor Cyan
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'FAILED: git commit' -ForegroundColor Red
        exit 1
    }
}

Write-Host ''
Write-Host '=== 3/4 push (up to 3 attempts) ===' -ForegroundColor Cyan
$pushed = $false
for ($i = 1; $i -le 3; $i++) {
    Write-Host "attempt $i ..."
    git push origin main
    if ($LASTEXITCODE -eq 0) { $pushed = $true; break }
    Write-Host "attempt $i failed, retrying in 4s" -ForegroundColor Yellow
    Start-Sleep -Seconds 4
}

if (-not $pushed) {
    Write-Host ''
    Write-Host 'FAILED: could not push after 3 attempts.' -ForegroundColor Red
    Write-Host 'Your commit is saved locally - nothing was lost.' -ForegroundColor Red
    Write-Host 'Run the script again, or run "git push origin main" by hand' -ForegroundColor Red
    Write-Host 'and read the error message it prints.' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '=== 4/4 verify remote ===' -ForegroundColor Cyan
git fetch origin main 2>&1 | Out-Null
$local  = (git rev-parse HEAD).Trim()
$remote = (git rev-parse FETCH_HEAD).Trim()

if ($local -eq $remote) {
    Write-Host "Remote confirmed in sync ($($local.Substring(0,7)))" -ForegroundColor Green
    Write-Host ''
    Write-Host 'Done. GitHub Actions is rebuilding the site (~1 min).' -ForegroundColor Green
} else {
    Write-Host 'MISMATCH - the push may not have landed.' -ForegroundColor Red
    Write-Host "  local  = $local"
    Write-Host "  remote = $remote"
    Write-Host 'Run the script again; if it keeps failing, check your GitHub login.' -ForegroundColor Red
    exit 1
}

Write-Host 'Actions : https://github.com/GelunPan/pgl-tools/actions'
Write-Host 'Live    : https://gelunpan.github.io/pgl-tools/'
