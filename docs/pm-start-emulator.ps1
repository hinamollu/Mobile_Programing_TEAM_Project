param([string]$Avd = 'Team_Pixel_8_API_36')
$pmSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
$pmEmulator = Join-Path $pmSdk 'emulator'
$pmOldPath = $env:PATH
try {
    $env:PATH = "$pmEmulator;$(Join-Path $pmEmulator 'lib64');$pmOldPath"
    Push-Location -LiteralPath $pmEmulator
    try { & (Join-Path $pmEmulator 'emulator.exe') -avd $Avd -no-snapshot-save }
    finally { Pop-Location }
} finally { $env:PATH = $pmOldPath }
