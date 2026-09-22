# ============================================================
#  pgl-tools - one-command deploy
#  Usage:  .\deploy.ps1 "your commit message"
#  Stages every change, commits it, and pushes to GitHub.
#  GitHub Actions then rebuilds and redeploys automatically.
# ============================================================
param(
    [string]$Message = "chore: update"
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

Write-Host ''
Write-Host '=== 1/3 stage changes ===' -ForegroundColor Cyan
git add -A

$pending = (git status --porcelain)
if (-not $pending) {
    Write-Host 'No changes to commit. Checking for unpushed commits...'
} else {
    Write-Host $pending
    Write-Host ''
    Write-Host '=== 2/3 commit ===' -ForegroundColor Cyan
    git commit -m $Message
}

Write-Host ''
Write-Host '=== 3/3 push ===' -ForegroundColor Cyan
git push

Write-Host ''
Write-Host 'Done. GitHub Actions is rebuilding the site.' -ForegroundColor Green
Write-Host 'Watch it at: https://github.com/GelunPan/pgl-tools/actions'
Write-Host 'Live site  : https://gelunpan.github.io/pgl-tools/'
