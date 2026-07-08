$desktop = [Environment]::GetFolderPath('Desktop')
$docFile = Get-ChildItem -Path $desktop -Recurse -Filter '*.doc' -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*新建*' -and $_.DirectoryName -like '*新建*' } | Select-Object -First 1

if (-not $docFile) {
    Write-Host 'File not found'
    exit 1
}

Write-Host "Found: $($docFile.FullName)"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docFile.FullName)
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

$outPath = Join-Path $desktop 'personal website\_doc_output.txt'
[System.IO.File]::WriteAllText($outPath, $text, [System.Text.UTF8Encoding]::new($false))
Write-Host "Done. Output: $outPath"
