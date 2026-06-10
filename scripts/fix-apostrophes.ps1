param(
    [string]$FilePath
)

$content = [System.IO.File]::ReadAllText($FilePath, [System.Text.Encoding]::UTF8)

# Replace straight apostrophes in JSX text with '
# These are specific patterns that ESLint flags as unescaped entities
$replacements = @{
    "I'd" = "I'd"
    "doesn't" = "doesn't"
    "don't" = "don't"
    "you're" = "you're"
    "That's" = "That's"
    "today's" = "today's"
}

foreach ($old in $replacements.Keys) {
    $new = $replacements[$old]
    $content = $content.Replace($old, $new)
}

[System.IO.File]::WriteAllText($FilePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Fixed: $FilePath"
