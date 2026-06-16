$wc = New-Object System.Net.WebClient
$html = $wc.DownloadString('https://nearsited.io')

# Find CSS links in the HTML (Next.js pattern)
$pattern = '/_next/static/css/[a-zA-Z0-9]+\.css'
$cssLinks = [regex]::Matches($html, $pattern)
Write-Host ("CSS links found: " + $cssLinks.Count)

foreach ($link in $cssLinks) {
  $cssUrl = "https://nearsited.io" + $link.Value
  Write-Host ("Fetching: " + $cssUrl)
  try {
    $css = $wc.DownloadString($cssUrl)
    if ($css -match 'text-hero') {
      $lines = $css -split "`n"
      foreach ($line in $lines) {
        if ($line -match 'text-hero') {
          Write-Host ("FOUND: " + $line.Trim())
        }
      }
    } else {
      Write-Host "No --text-hero in this CSS file"
    }
  } catch {
    Write-Host ("Failed to fetch: " + $_.Exception.Message)
  }
}
