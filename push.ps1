# push.ps1 — Stage, commit, and push all changes to GitHub
# Usage: .\push.ps1 ["optional commit message"]

param(
  [string]$Message = ""
)

Set-Location $PSScriptRoot

# Check if there is anything to commit
$status = git status --porcelain
if (-not $status) {
  Write-Host "✅ Nothing to commit — working tree is clean." -ForegroundColor Green
  exit 0
}

# Build commit message
if (-not $Message) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
  $Message = "Update: $timestamp"
}

Write-Host ""
Write-Host "📦 Staging all changes..." -ForegroundColor Cyan
git add .

Write-Host "💬 Committing: $Message" -ForegroundColor Cyan
git commit -m $Message

Write-Host "🚀 Pushing to origin/main..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
  Write-Host ""
  Write-Host "❌ Push failed. Check the error above." -ForegroundColor Red
}
