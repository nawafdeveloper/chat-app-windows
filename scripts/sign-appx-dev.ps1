param(
  [string]$AppxPath
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$releaseDir = Join-Path $repoRoot "release"
$publisher = "CN=E74A2C33-7C93-4629-AB33-D7CE624E0278"
$certPath = Join-Path $releaseDir "Yahla-dev-appx-signing.cer"
$signtoolPath = Join-Path $repoRoot "node_modules\@electron\windows-sign\vendor\signtool.exe"

if (-not (Test-Path $signtoolPath)) {
  throw "signtool.exe was not found at $signtoolPath. Run npm install first."
}

if (-not $AppxPath) {
  $appx = Get-ChildItem -Path $releaseDir -Filter "*.appx" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $appx) {
    throw "No .appx file was found in $releaseDir. Run npm run dist:win first."
  }

  $AppxPath = $appx.FullName
}

$cert = Get-ChildItem Cert:\CurrentUser\My |
  Where-Object {
    $_.Subject -eq $publisher -and
    $_.HasPrivateKey -and
    $_.NotAfter -gt (Get-Date)
  } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $cert) {
  $cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject $publisher `
    -FriendlyName "Yahla Dev AppX Signing" `
    -CertStoreLocation Cert:\CurrentUser\My `
    -NotAfter (Get-Date).AddYears(3)
}

Export-Certificate -Cert $cert -FilePath $certPath | Out-Null
Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\Root | Out-Null
Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\CurrentUser\TrustedPeople | Out-Null

$isAdmin = (
  New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent()
  )
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
  Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\LocalMachine\Root | Out-Null
  Import-Certificate -FilePath $certPath -CertStoreLocation Cert:\LocalMachine\TrustedPeople | Out-Null
} else {
  Write-Warning "Not running as Administrator. If AppX install fails with 0x800B0109/0x800B010A, import $certPath into LocalMachine\Root and LocalMachine\TrustedPeople from an elevated PowerShell."
}

& $signtoolPath sign /fd SHA256 /sha1 $cert.Thumbprint /v $AppxPath

if ($LASTEXITCODE -ne 0) {
  throw "signtool failed with exit code $LASTEXITCODE"
}

Get-AuthenticodeSignature -FilePath $AppxPath | Format-List Status, StatusMessage, SignerCertificate
