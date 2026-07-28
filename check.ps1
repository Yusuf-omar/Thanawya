$txt = [IO.File]::ReadAllText('d:\Programming\Projects\Thanwya\data\old.json')
Write-Host "Length: $($txt.Length)"
Write-Host "First 150:"
Write-Host $txt.Substring(0, 150)
Write-Host "---LAST 150---"
Write-Host $txt.Substring($txt.Length - 150)
