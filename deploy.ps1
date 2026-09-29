# ============================================================================
#  pgl-tools · 一键发布
#
#  用法：
#     .\deploy.ps1 "这次改了什么"          # 提交 + 推送 + 等上线 + 冒烟
#     .\deploy.ps1 "说明" -Build           # 推送前先在本机跑一遍构建
#     .\deploy.ps1 "说明" -NoWatch         # 只推送，不站在这等线上
#     .\deploy.ps1 "说明" -SkipCheck       # 跳过类型检查
#     .\deploy.ps1 "说明" -Site https://别的域名
#
#  推送之后不用再管：GitHub Actions 会自动构建并发布（.github/workflows/deploy.yml），
#  这个脚本的价值在于——把「到底发出去没有」替你盯到最后一秒：
#  它会轮询线上产物里的 build.json，确认线上真的换成这次 commit 了，再逐个路由冒烟。
#
#  首次上线时 build.json 还不存在，探测会报「没探到」，属正常，等 CI 跑完就好。
# ============================================================================
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Message = '',

    [switch]$Build,
    [switch]$SkipCheck,
    [switch]$NoWatch,

    [string]$Site = 'https://gelun.eu.cc'
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch { }
Set-Location -LiteralPath $PSScriptRoot

$RepoUrl   = 'https://github.com/GelunPan/pgl-tools'
$Branch    = 'main'
$StartTime = Get-Date

function Say  { param([string]$T, [string]$C = 'Gray') Write-Host $T -ForegroundColor $C }
function Head { param([string]$T) Write-Host ''; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Die  { param([string]$T) Write-Host ''; Write-Host $T -ForegroundColor Red; exit 1 }
function Step { param([string]$T) Write-Host "  -> $T" -ForegroundColor DarkGray }

# 与 .github/workflows/deploy.yml 的 paths-ignore 保持一致：
# 改了这些文件，流水线不会触发，脚本也就不该傻等。
$IgnoredPatterns = @('*.md', 'LICENSE', '.gitignore', '.workbuddy/*', 'deploy.ps1', 'build.ps1')

$script:HasCurl = $null -ne (Get-Command curl.exe -ErrorAction SilentlyContinue)

# ------------------------------------------------------------------ HTTP 小工具
function Get-RawUrl {
    param([string]$Url)
    if ($script:HasCurl) {
        $out = & curl.exe -s -m 20 -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' $Url 2>$null
        if ($LASTEXITCODE -eq 0) { return ($out -join "`n") }
        return $null
    }
    try {
        return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20 `
                -Headers @{ 'Cache-Control' = 'no-cache' }).Content
    } catch { return $null }
}

function Get-HttpCode {
    param([string]$Url)
    if ($script:HasCurl) {
        $c = & curl.exe -s -o NUL -w '%{http_code}' -m 20 -H 'Cache-Control: no-cache' $Url 2>$null
        return ("$c").Trim()
    }
    try {
        return "$((Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20).StatusCode)"
    } catch {
        if ($_.Exception.Response) { return "$([int]$_.Exception.Response.StatusCode)" }
        return 'ERR'
    }
}

# 每次请求都换一个 query，直接绕过 CDN 缓存
function New-Buster { return [DateTime]::UtcNow.Ticks }

# ------------------------------------------------------------------ git 小工具
#
# ⚠️ 原生命令（git / node）往 stderr 写字时，在 $ErrorActionPreference = 'Stop' 下
#    会被当成【终止错误】——后果是「脚本默默 exit 1，什么原因都看不到」。
#    所以所有外部命令统一走这层包装：捕获输出、显式取退出码，失败时能把话说清楚。
function Invoke-Native {
    param([string]$Exe, [string[]]$Arguments)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $raw  = & $Exe @Arguments 2>&1
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $prev
    }
    return [pscustomobject]@{
        Text = (($raw | Out-String).Trim())
        Code = $code
    }
}

function Invoke-Git {
    param([string[]]$Arguments)
    return (Invoke-Native 'git' $Arguments)
}

# 把命令输出拆成非空行数组（统一处理 CRLF）
function Split-Lines {
    param([string]$Text)
    if (-not $Text) { return @() }
    return @($Text -split "`n" | ForEach-Object { $_.TrimEnd("`r") } | Where-Object { $_ -ne '' })
}

# ls-remote 同样受 schannel 影响，统一带 openssl 后端
function Get-RemoteHead {
    $r = Invoke-Git @('-c', 'http.sslBackend=openssl', '-c', 'http.sslVerify=false',
                      'ls-remote', 'origin', "refs/heads/$Branch")
    if (-not $r.Text) { return $null }
    return (($r.Text -split "\s+")[0]).Trim()
}

function Test-RemoteInSync {
    $local = (Invoke-Git @('rev-parse', 'HEAD')).Text
    for ($i = 1; $i -le 3; $i++) {
        if ((Get-RemoteHead) -eq $local) { return $true }
        Start-Sleep -Seconds 2
    }
    return $false
}

function Invoke-Push {
    param([switch]$Legacy)
    # 关掉交互提示：宁可失败得干脆，也不要卡在 "Password:" 上无人知晓
    $env:GIT_TERMINAL_PROMPT = '0'
    if ($Legacy) {
        $env:GIT_SSL_NO_VERIFY = '1'
        $r = Invoke-Git @('-c', 'http.sslBackend=openssl', 'push', 'origin', $Branch)
    } else {
        Remove-Item Env:GIT_SSL_NO_VERIFY -ErrorAction SilentlyContinue
        $r = Invoke-Git @('push', 'origin', $Branch)
    }
    $script:LastPushText = $r.Text
    # git 的退出码不能当结论：被中断时它可能非 0，但数据其实已经传完 —— 一律以远端为准
    return (Test-RemoteInSync)
}

$script:LastPushText = $null

# ================================================================== 0. 前置
Head '0/6 前置检查'

if (-not (Test-Path (Join-Path $PSScriptRoot '.git'))) {
    Die '当前目录不是 git 仓库根目录，脚本不知道要推什么。'
}

$current = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Text
if ($current -ne $Branch) {
    Die "当前分支是「$current」，而这个脚本只会推「$Branch」。先切回去再跑：git switch $Branch"
}

$dirty = @(Split-Lines (Invoke-Git @('status', '--porcelain')).Text)
$gitExe = (Get-Command git -ErrorAction SilentlyContinue).Source
Say ("  git: {0}" -f $(if ($gitExe) { $gitExe } else { '❌ 没找到 git，后面必然失败' })) 'DarkGray'
Say ("  分支 {0} · 未提交改动 {1} 项" -f $current, $dirty.Count) 'Green'

# ================================================================== 1. 类型检查
if (-not $SkipCheck) {
    Head '1/6 类型检查'
    $r = Invoke-Native 'node' @('.\node_modules\typescript\bin\tsc', '--noEmit')
    if ($r.Code -ne 0) {
        Write-Host ''
        Say $r.Text 'Red'
        Die '类型检查没过。修掉再发，或者加 -SkipCheck 硬发（流水线里那一步只是提示，不会拦）。'
    }
    Say '  ✅ 类型干净' 'Green'
} else {
    Head '1/6 类型检查（已跳过）'
}

# ================================================================== 2. 本地构建
if ($Build) {
    Head '2/6 本地构建'
    & (Join-Path $PSScriptRoot 'build.ps1')
    if ($LASTEXITCODE -ne 0) { Die '本地构建失败，没有推送。' }
} else {
    Head '2/6 本地构建（未启用；加 -Build 可在推送前先验一遍）'
}

# ================================================================== 3. 提交
Head '3/6 暂存并提交'

$r = Invoke-Git @('add', '-A')
if ($r.Code -ne 0) { Die ("git add 失败：`n" + $r.Text) }

$pending = @(Split-Lines (Invoke-Git @('status', '--porcelain')).Text)
if ($pending.Count -eq 0) {
    Say '  没有新改动，本次只做推送。' 'Yellow'
} else {
    if (-not $Message) {
        $Message = 'chore: 更新 ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
    }
    $pending | ForEach-Object { Step $_ }
    $r = Invoke-Git @('commit', '-m', $Message)
    if ($r.Code -ne 0) { Die ("git commit 失败：`n" + $r.Text) }
    Say "  ✅ 已提交：$Message" 'Green'
}

# ================================================================== 4. 推送
Head '4/6 推送到 GitHub'

$localHead  = (Invoke-Git @('rev-parse', 'HEAD')).Text
$remoteHead = Get-RemoteHead

if ($remoteHead -eq $localHead) {
    Say '  远端已经是这个提交，无需推送。' 'Yellow'
    $pushed = $true
} else {
    Step '按标准姿势推送……'
    $pushed = Invoke-Push
    if (-not $pushed) {
        Say '  标准姿势没成，换 openssl 后端重试（本机对 schannel 的证书吊销检查不友好）……' 'Yellow'
        $pushed = Invoke-Push -Legacy
    }
    if (-not $pushed) {
        Say '  再来一次 openssl……' 'Yellow'
        Start-Sleep -Seconds 3
        $pushed = Invoke-Push -Legacy
    }
    if ($pushed) {
        Say ("  ✅ 已推送 {0}" -f $localHead.Substring(0, 7)) 'Green'
    } else {
        Write-Host ''
        Say '推送失败。提交已经安全地存在本地，什么都没丢。' 'Red'
        if ($script:LastPushText) {
            Say '  --- git 原话 ---' 'DarkGray'
            Say ("  " + $script:LastPushText) 'DarkGray'
        } else {
            Say '  （git 这次一个字都没说 —— 静默失败，多半是进程被外部因素打断/拦截，' 'DarkGray'
            Say '    而不是账号或网络本身的问题。换个终端窗口再跑一次通常就好。）' 'DarkGray'
        }
        Say '依次试这几件事：' 'Red'
        Say '  1) 手动跑  git push origin main  看它到底报什么' 'Red'
        Say '  2) 凭据可能过期 —— 控制面板 → 凭据管理器 → Windows 凭据，删掉 git:https://github.com 重登' 'Red'
        Say '  3) 仍不行就查 .workbuddy/memory/2026-09-24.md 里记的离线兜底姿势' 'Red'
        Say '  4) 本机装了两个 Git（PortableGit / D:\TOOLS\Git）。上面已打印实际用的是哪一个，' 'Red'
        Say '     两个的 system 配置各自独立，凭据类怪毛病要两边都查' 'Red'
        exit 1
    }
}

# ================================================================== 5. 等上线
if ($NoWatch) {
    Head '5/6 等上线（已跳过）'
    Say '  用了 -NoWatch，不在这儿等。' 'Yellow'
} else {
    Head '5/6 等 GitHub Actions 构建并发布'

    # 先看这次提交有没有资格触发流水线
    $changed    = @(Split-Lines (Invoke-Git @('show', '--name-only', '--pretty=format:', 'HEAD')).Text)
    $deployable = @($changed | Where-Object {
            $p = $_
            -not ($IgnoredPatterns | Where-Object { $p -like $_ })
        })

    if ($deployable.Count -eq 0) {
        Say '  这次只改了文档 / 本地脚本，按流水线配置不会触发构建。' 'Yellow'
        Say '  需要立刻发一次的话：去 Actions 页面点 Run workflow，或者夹带进一次代码提交。' 'Yellow'
        Say ("  {0}/actions" -f $RepoUrl) 'DarkGray'
        Write-Host ''
        exit 0
    }

    Say ("  本次有 {0} 个文件参与构建，开始探测线上版本……" -f $deployable.Count) 'DarkGray'

    $deadline = (Get-Date).AddMinutes(7)
    $live     = $false
    $seen     = $null
    $ticks    = 0

    while ((Get-Date) -lt $deadline) {
        $ticks++
        $body = Get-RawUrl "$Site/build.json?t=$(New-Buster)"
        if ($body) {
            try {
                $info = $body | ConvertFrom-Json
                if ($info.sha -eq $localHead) { $live = $true; break }
                if ($info.short -ne $seen) {
                    $seen = $info.short
                    Say ("  线上还是 {0}，等新构建……" -f $info.short) 'DarkGray'
                }
            } catch { }
        } else {
            if ($ticks % 5 -eq 1) { Say '  还没探到 build.json（首次上线时属正常）……' 'DarkGray' }
        }
        Start-Sleep -Seconds 6
    }

    if ($live) {
        Say ("  ✅ 线上已切到 {0}" -f $localHead.Substring(0, 7)) 'Green'
    } else {
        Write-Host ''
        Say '等了 7 分钟，线上还是旧版本。常见原因：' 'Red'
        Say '  1) CI 失败了 —— 先去 Actions 页面看那一步红在哪' 'Red'
        Say ("     {0}/actions" -f $RepoUrl) 'DarkGray'
        Say '  2) CDN 缓存没刷（带时间戳也刷不掉的话，去 Cloudflare 清一下缓存）' 'Red'
        Say '  3) 首次上线还没有 build.json —— 那就不用等它，直接测路由有没有变' 'Red'
        exit 1
    }
}

# ================================================================== 6. 冒烟
Head '6/6 线上冒烟'

if ($NoWatch) {
    Say '  跳过（用了 -NoWatch）。' 'Yellow'
} else {
    $routes = @('', 'welcome/', 'login/', 'signup/', 'bento/', 'resume/')
    $bad = @()
    foreach ($p in $routes) {
        $code = Get-HttpCode "$Site/${p}?t=$(New-Buster)"
        if ($code -eq '200') {
            Write-Host ("  ✅ /{0}" -f $p) -ForegroundColor Green
        } else {
            Write-Host ("  ❌ /{0} → {1}" -f $p, $code) -ForegroundColor Red
            $bad += "/$p"
        }
    }
    # 字体是自托管的（红线：不许引外部样式表），顺手确认 woff2 真能取到
    $fcode = Get-HttpCode "$Site/fonts/nunito-latin-400-normal.woff2"
    if ($fcode -eq '200') {
        Write-Host '  ✅ 自托管字体' -ForegroundColor Green
    } else {
        Write-Host ("  ⚠️  自托管字体 → {0}（不致命，但首屏字体会退化）" -f $fcode) -ForegroundColor Yellow
    }

    if ($bad.Count -gt 0) {
        Write-Host ''
        Say ('这些路由没返回 200：' + ($bad -join '、')) 'Red'
        exit 1
    }
}

# ================================================================== 完成
$secs = [Math]::Round(((Get-Date) - $StartTime).TotalSeconds, 1)
Write-Host ''
Write-Host '--------------------------------------------' -ForegroundColor DarkGray
Say ("  🚀 发布完成  {0}  全程 {1}s" -f $localHead.Substring(0, 7), $secs) 'Green'
Say ("     站点    {0}" -f $Site) 'Green'
Say ("     Actions {0}/actions" -f $RepoUrl) 'DarkGray'
Write-Host '--------------------------------------------' -ForegroundColor DarkGray
