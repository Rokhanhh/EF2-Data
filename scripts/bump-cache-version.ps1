param(
    [string]$Version = (Get-Date -Format "yyyyMMddHHmmss")
)

$root = Split-Path -Parent $PSScriptRoot
$files = @(
    "index.html",
    "js/app.js",
    "js/asset-atlas.js",
    "js/cache-bust.js",
    "js/data.js",
    "js/pets-view.js",
    "js/relic-calculations.js",
    "js/relics-view.js",
    "js/units-view.js"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

foreach ($file in $files) {
    $path = Join-Path $root $file
    $content = [System.IO.File]::ReadAllText($path)
    $content = $content -replace '\?v=[0-9A-Za-z_.-]+', "?v=$Version"
    $content = $content -replace 'BUILD_VERSION = "[^"]+"', "BUILD_VERSION = `"$Version`""
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}

Write-Host "Cache version updated to $Version"
