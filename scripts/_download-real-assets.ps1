# scripts/_download-real-assets.ps1 — PowerShell sequel to the .mjs script.
# Node fetch on Windows fails the first request per worker (TLS warm-up race);
# Invoke-WebRequest is reliable. We re-issue every URL the .mjs failed on.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$root = (Get-Location).Path
$base = 'https://raw.githubusercontent.com/ETdoFresh/kenney.nl/master'

# All required mirror paths. Idempotent: skip if already on disk.
$queue = @()
$queue += 'kenney_rpgurbanpack/Tilemap/tilemap.png'
$queue += 'kenney_rpgurbanpack/Tilemap/tilemap_packed.png'
$queue += 'kenney_rpgurbanpack/Tilemap/tilemap.txt'
$queue += 'kenney_rpgurbanpack/Preview.png'
$queue += 'kenney_rpgurbanpack/License.txt'
for ($i = 0; $i -lt 256; $i++) {
  $padded = '{0:D4}' -f $i
  $queue += "kenney_rpgurbanpack/Tiles/tile_$padded.png"
}
$queue += 'kenney_uiaudio/Audio/click1.ogg'
$queue += 'kenney_uiaudio/Audio/click2.ogg'
$queue += 'kenney_uiaudio/Audio/click3.ogg'
$queue += 'kenney_uiaudio/Audio/switch1.ogg'
$queue += 'kenney_uiaudio/Audio/rollover1.ogg'
$queue += 'kenney_uiaudio/License.txt'
$queue += 'kenneyrpgpack/Spritesheet/RPGpack_sheet.png'
$queue += 'kenneyrpgpack/Spritesheet/RPGpack_sheet_2X.png'

# Map mirror path → local path
function To-LocalPath([string]$mirror) {
  if ($mirror -like 'kenney_rpgurbanpack/*') {
    return $mirror -replace '^kenney_rpgurbanpack/', 'assets/_raw/kenney-rpgurbanpack/'
  } elseif ($mirror -like 'kenney_uiaudio/Audio/*') {
    return $mirror -replace '^kenney_uiaudio/Audio/', 'assets/_raw/kenney-uiaudio/'
  } elseif ($mirror -like 'kenney_uiaudio/*') {
    return $mirror -replace '^kenney_uiaudio/', 'assets/_raw/kenney-uiaudio/'
  } elseif ($mirror -like 'kenneyrpgpack/Spritesheet/*') {
    return $mirror -replace '^kenneyrpgpack/Spritesheet/', 'assets/_raw/kenney-rpgpack/'
  }
  throw "no mapping for $mirror"
}

$total = $queue.Count
$skipped = 0
$downloaded = 0
$failed = @()

Write-Output "[ps download] queue=$total"

$idx = 0
foreach ($mirror in $queue) {
  $idx++
  $local = Join-Path $root (To-LocalPath $mirror)
  $dir = Split-Path -Parent $local
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if (Test-Path $local) {
    $size = (Get-Item $local).Length
    if ($size -gt 0) {
      $skipped++
      continue
    }
  }
  $url = "$base/$mirror"
  try {
    Invoke-WebRequest -Uri $url -OutFile $local -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
    $downloaded++
    if (($downloaded % 20) -eq 0) {
      Write-Output "  [$idx/$total] +$downloaded skip=$skipped fail=$($failed.Count) latest=$mirror"
    }
  } catch {
    $failed += [PSCustomObject]@{ mirror = $mirror; err = $_.Exception.Message }
  }
}

Write-Output "[ps download] done downloaded=$downloaded skipped=$skipped failed=$($failed.Count)"
if ($failed.Count -gt 0) {
  Write-Output "[ps download] failures:"
  $failed | ForEach-Object { Write-Output "  - $($_.mirror): $($_.err.Substring(0, [Math]::Min(60, $_.err.Length)))" }
}
