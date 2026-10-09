param([switch]$CheckOnly)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$AppUrl = 'http://127.0.0.1:4174'
$RuntimeRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$LaunchMutex = $null
$MutexAcquired = $false

function Find-Node {
    $candidates = @()
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($command) { $candidates += $command.Source }
    $candidates += (Join-Path $RuntimeRoot 'node\bin\node.exe')
    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $version = & $candidate -p 'process.versions.node' 2>$null
            if ($LASTEXITCODE -eq 0 -and [int]($version -split '\.')[0] -ge 24) { return $candidate }
        }
    }
    throw '没有找到 Node.js 24 或更新版本。请先安装 Node.js 24，或在 Codex 中打开本项目后重试。'
}

function Find-Pnpm {
    foreach ($name in @('pnpm.cmd', 'pnpm.exe')) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) { return $command.Source }
    }
    $fallback = Join-Path $RuntimeRoot 'bin\fallback\pnpm.cmd'
    if (Test-Path -LiteralPath $fallback -PathType Leaf) { return $fallback }
    return $null
}

function Get-WorkspaceHealth {
    try {
        $health = Invoke-RestMethod -Uri "$AppUrl/api/health" -TimeoutSec 2 -Method Get
        return ($health.ok -eq $true -and $health.app -eq 'rpg-ai-helper')
    } catch { return $false }
}

function Test-ServicePort {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $connection = $client.ConnectAsync('127.0.0.1', 4174)
        if (-not $connection.Wait(700)) { return $false }
        return $client.Connected
    } catch { return $false }
    finally { $client.Dispose() }
}

try {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'package.json'))) {
        throw '找不到项目文件。请把启动文件保留在项目目录中，不要单独移动它。'
    }
    $NodePath = Find-Node
    $NodeDirectory = Split-Path -Parent $NodePath
    $env:PATH = "$NodeDirectory;$env:PATH"
    $PnpmPath = Find-Pnpm
    if ($CheckOnly) {
        Write-Host "项目目录：$ProjectRoot"
        Write-Host "Node：$NodePath"
        Write-Host "pnpm：$PnpmPath"
        Write-Host '检查完成；没有安装、构建、启动服务或打开浏览器。' -ForegroundColor Green
        exit 0
    }

    $hash = [System.Security.Cryptography.SHA256]::Create()
    try { $projectHash = ([BitConverter]::ToString($hash.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($ProjectRoot.ToLowerInvariant())))).Replace('-', '').Substring(0, 16) }
    finally { $hash.Dispose() }
    $LaunchMutex = New-Object System.Threading.Mutex($false, "Local\RpgAiHelper-$projectHash")
    try { $MutexAcquired = $LaunchMutex.WaitOne(0) }
    catch [System.Threading.AbandonedMutexException] { $MutexAcquired = $true }
    if (-not $MutexAcquired) {
        Write-Host '另一个启动窗口正在准备项目，请稍等它完成。' -ForegroundColor Yellow
        exit 0
    }

    if (Get-WorkspaceHealth) {
        Write-Host '工作区已经在运行，正在打开页面……' -ForegroundColor Green
        Start-Process -FilePath $AppUrl
        exit 0
    }
    if (Test-ServicePort) { throw '4174 端口已经被其他程序占用。请先确认占用程序；启动器不会关闭任何已有程序。' }

    Push-Location -LiteralPath $ProjectRoot
    try {
        $TscPath = Join-Path $ProjectRoot 'node_modules\typescript\bin\tsc'
        $VitePath = Join-Path $ProjectRoot 'node_modules\vite\bin\vite.js'
        if (-not (Test-Path -LiteralPath $TscPath) -or -not (Test-Path -LiteralPath $VitePath)) {
            if (-not $PnpmPath) { throw '项目依赖尚未安装，且没有找到 pnpm。请在 Codex 中运行 pnpm install --frozen-lockfile，或先安装 pnpm 后重试。' }
            if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot 'pnpm-lock.yaml'))) { throw '缺少 pnpm-lock.yaml，请重新获取完整项目后再启动。' }
            Write-Host '首次启动：正在安装已锁定版本的依赖，需要联网……' -ForegroundColor Cyan
            & $PnpmPath install --frozen-lockfile
            if ($LASTEXITCODE -ne 0) { throw '依赖安装失败。请检查网络和上方报错后重试；现有学习数据未被修改。' }
        }
        Write-Host '正在检查并构建最新页面，请稍等……' -ForegroundColor Cyan
        & $NodePath $TscPath -b
        if ($LASTEXITCODE -ne 0) { throw '项目检查未通过。请保留上方报错并在 Codex 中修复后重试。' }
        & $NodePath $VitePath build
        if ($LASTEXITCODE -ne 0) { throw '页面构建失败。请保留上方报错并在 Codex 中修复后重试。' }

        # Recheck after the build in case another process started during preparation.
        if (Get-WorkspaceHealth) {
            Write-Host '工作区已经就绪。' -ForegroundColor Green
            Start-Process -FilePath $AppUrl
            exit 0
        }
        if (Test-ServicePort) { throw '准备期间 4174 端口被其他程序占用。请确认占用程序后重试。' }
        $LogDirectory = Join-Path $ProjectRoot '.local\logs'
        New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
        $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $OutLog = Join-Path $LogDirectory "server-$stamp.out.log"
        $ErrorLog = Join-Path $LogDirectory "server-$stamp.err.log"
        $ServerProcess = Start-Process -FilePath $NodePath -ArgumentList @('server/index.mjs') -WorkingDirectory $ProjectRoot -WindowStyle Hidden -RedirectStandardOutput $OutLog -RedirectStandardError $ErrorLog -PassThru
        $ready = $false
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            if (Get-WorkspaceHealth) { $ready = $true; break }
            $ServerProcess.Refresh()
            if ($ServerProcess.HasExited) { break }
            Start-Sleep -Milliseconds 250
        }
        if (-not $ready) {
            if (Test-Path -LiteralPath $ErrorLog) { Get-Content -LiteralPath $ErrorLog -Tail 8 | ForEach-Object { Write-Host $_ -ForegroundColor Red } }
            throw "服务未能正常启动。诊断日志位于：$LogDirectory"
        }
        Write-Host '工作区已就绪，正在打开浏览器。关闭此窗口不会关闭工作区。' -ForegroundColor Green
        Write-Host "本机地址：$AppUrl"
        Start-Process -FilePath $AppUrl
    } finally { Pop-Location }
} catch {
    Write-Host ''
    Write-Host "启动失败：$($_.Exception.Message)" -ForegroundColor Red
    Write-Host '可以把这段提示发给 Codex 继续处理。' -ForegroundColor Yellow
    exit 1
} finally {
    if ($MutexAcquired -and $LaunchMutex) { $LaunchMutex.ReleaseMutex() }
    if ($LaunchMutex) { $LaunchMutex.Dispose() }
}
