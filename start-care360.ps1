$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

Write-Host 'Care360 will start any service that is not already running.' -ForegroundColor Cyan
$backendReady = $false
try {
    $apiStatus = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2
    $backendReady = $apiStatus.status -eq 'ok'
}
catch { }

if (-not $backendReady) {
    $securePassword = Read-Host 'Enter your local MySQL root password' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToGlobalAllocUnicode($securePassword)
    try {
        $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringUni($passwordPointer)
        $backendCommand = "Set-Location -LiteralPath '$backendPath'; mvn spring-boot:run"
        Start-Process -FilePath 'powershell.exe' -WorkingDirectory $backendPath -ArgumentList @('-NoExit', '-Command', $backendCommand)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeGlobalAllocUnicode($passwordPointer)
        Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
    }

    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        try {
            $apiStatus = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -TimeoutSec 2
            if ($apiStatus.status -eq 'ok') { $backendReady = $true; break }
        }
        catch { }
        Start-Sleep -Seconds 1
    }
}

$frontendUrl = 'http://localhost:3000'
$frontendReady = $false
try {
    $existingPage = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 2
    $frontendReady = $existingPage.Content -match '<title>Care360'
}
catch { }

if (-not $frontendReady) {
    $portInUse = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($portInUse) {
        throw 'Port 3000 is already being used by another app. Close it, then run start-care360.ps1 again.'
    }

    $frontendCommand = "Set-Location -LiteralPath '$frontendPath'; npm start"
    Start-Process -FilePath 'powershell.exe' -WorkingDirectory $frontendPath -ArgumentList @('-NoExit', '-Command', $frontendCommand)

    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        try {
            $page = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 2
            if ($page.Content -match '<title>Care360') {
                $frontendReady = $true
                break
            }
        }
        catch { }
        Start-Sleep -Seconds 1
    }
}

if ($frontendReady) {
    Start-Process 'http://localhost:3000'
}
else {
    Write-Host 'The frontend window is open. Check its output if the browser did not start.' -ForegroundColor Yellow
}

if (-not $backendReady) {
    Write-Host 'The API is still starting. Check the backend window before signing in.' -ForegroundColor Yellow
}
