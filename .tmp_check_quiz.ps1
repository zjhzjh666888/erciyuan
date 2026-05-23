$urls = @(
  'http://localhost:3000/quiz',
  'http://localhost:3000/quiz?from_video=vid_001',
  'http://localhost:3000/quiz?from_video=vid_999_unknown'
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 60
    Write-Host "OK $($r.StatusCode) $u"
  } catch {
    Write-Host "ERR $u :: $($_.Exception.Message)"
  }
}
