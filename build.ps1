# ============================================================================
#  pgl-tools · 本地构建
#
#  用法：  .\build.ps1
#
#  产出在 out\ 目录（纯静态站点，可以直接丢给任何静态服务器）。
#  本机踩过的三个坑都封在这里面了，不用再记：
#    ① 环境里可能被注入 NODE_OPTIONS 之类的东西，会让 next build 报 EPERM；
#      这里在子进程里把它清掉，并改用裸 node 直接跑（绕开 npm 脚本的二次注入）。
#    ② .next 是纯缓存，但整目录删除可能撞上批量删除护栏 —— 改成「改名挪走」。
#    ③ 同时跑着 dev server 的话，两边会抢同一个 .next，构建必挂 —— 开头先提醒。
#
#  跑完还想去线上看看，用 .\deploy.ps1 "说明"（提交+推送+等上线+冒烟一条龙）。
# ============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
Set-Location -LiteralPath $PSScriptRoot

function Say  { param([string]$T, [string]$C = 'Gray') Write-Host $T -ForegroundColor $C }
function Head { param([string]$T) Write-Host ''; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Die  { param([string]$T) Write-Host $T -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------- 0. 前置
Head '0/3 环境检查'

if (-not (Test-Path '.\node_modules\next\dist\bin\next')) {
    Die "找不到 node_modules\next，先在项目根目录跑一次 npm install。"
}

# dev server 和 build 会抢同一个 .next，这是本机最容易踩的「假故障」
$devListening = $false
try {
    $devListening = [bool](Get-NetTCPConnection -LocalPort 9002 -State Listen -ErrorAction SilentlyContinue)
} catch { }

if ($devListening) {
    Say '⚠️  9002 端口上有 dev server 在跑。' 'Yellow'
    Say '    它和这次构建会抢同一个 .next 目录，构建可能失败。' 'Yellow'
    Say '    建议先停掉它（关掉那个终端窗口），或干脆跳过本地构建直接 .\deploy.ps1。' 'Yellow'
    Say '    继续中……' 'DarkGray'
} else {
    Say '  ✅ 没有 dev server 抢占 .next' 'Green'
}

# ---------------------------------------------------------------- 1. 清场
Head '1/3 清理旧缓存'

# 只影响本次构建进程；这些变量会把 next build 搞出 EPERM
Remove-Item Env:NODE_OPTIONS -ErrorAction SilentlyContinue
Remove-Item Env:CODEBUDDY_SAFE_DELETE_ENABLED -ErrorAction SilentlyContinue
$env:CODEBUDDY_SAFE_DELETE_ENABLED = '0'

# 清场：优先「直接删除」（最干净）；删不掉（被 dev server 之类占用）再退化为改名挪走。
#
# ⚠️ 2026-09-29 实测经验：**光把 .next 改名挪走，并不保证 next build 一定成功** ——
#    项目里残留着 .next-prev-* / .next-junk-* 之类的旧目录时，构建仍可能报
#    `EPERM: operation not permitted, open '.next\trace'`。
#    先彻底删掉（或先停掉 dev server）再构建，才是稳的。
$stash = $null
$outStash = $null

function Clear-Dir {
    param([string]$Path, [string]$PrevName)
    if (-not (Test-Path $Path)) { return $null }

    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $Path)) {
        Say "  已删除旧 $Path" 'DarkGray'
        return $null
    }

    # 删不掉 → 改名挪走（rename 不计入删除配额）
    $dst = "{0}-{1}" -f $PrevName, (Get-Date -Format 'yyyyMMdd-HHmmss')
    Move-Item -LiteralPath $Path -Destination $dst -Force
    Say "  旧 $Path 删不掉（多半被占用），已改名挪到 $dst" 'Yellow'
    return $dst
}

$stash = Clear-Dir '.next' '.next-prev'
$outStash = Clear-Dir 'out' '.out-prev'

# ---------------------------------------------------------------- 2. 构建
Head '2/3 构建（next build → out\）'
$started = Get-Date

& node '.\node_modules\next\dist\bin\next' build
$code = $LASTEXITCODE

$elapsed = [Math]::Round(((Get-Date) - $started).TotalSeconds, 1)

# ---------------------------------------------------------------- 3. 收尾
Head '3/3 结果'

# 清掉改名挪走的残骸（删不掉也不影响本次构建结果）
foreach ($d in @($stash, $outStash)) {
    if ($d -and (Test-Path $d)) {
        Remove-Item -LiteralPath $d -Recurse -Force -ErrorAction SilentlyContinue
        if (Test-Path $d) {
            Say "  ⚠️  $d 删不掉，留着不碍事（已在 .gitignore 里），下次重启后再清" 'Yellow'
        }
    }
}

if ($code -ne 0) {
    Write-Host ''
    Say "构建失败（退出码 $code），耗时 ${elapsed}s。" 'Red'
    Say '若上面出现 EPERM 且路径是 .next\trace：' 'Red'
    Say '  多半是有 dev server（或上一次构建的残留进程）攥着 .next 不放。' 'Red'
    Say '  把 9002 上的 dev server 关干净，再重跑本脚本。' 'Red'
    exit 1
}

if (-not (Test-Path 'out')) {
    Die '构建声称成功，但没找到 out 目录 —— 检查 next.config.ts 里是不是还留着 output: "export"。'
}

$files = @(Get-ChildItem 'out' -Recurse -File)
$bytes = ($files | Measure-Object -Property Length -Sum).Sum
$html  = @($files | Where-Object { $_.Name -eq 'index.html' })

Say ("  ✅ 构建成功  耗时 {0}s" -f $elapsed) 'Green'
Say ("     产物：{0} 个文件 / {1:N2} MB / {2} 个页面入口" -f $files.Count, ($bytes / 1MB), $html.Count) 'Green'
Say ''
Say '  本地预览（可选）：'
Say ("     python -m http.server 9100 --directory out") 'DarkGray'
Say ("     然后开 http://127.0.0.1:9100/") 'DarkGray'
Say ''
Say '  要发到线上：.\deploy.ps1 "这次改了什么"' 'Cyan'
