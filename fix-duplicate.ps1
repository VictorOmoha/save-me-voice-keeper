$filePath = 'C:\Users\omoha\.openclaw\workspace\save-me-voice-keeper\src\pages\BrainDump.tsx'
$content = Get-Content $filePath -Raw

# Remove the duplicate line
$content = $content -replace 'const \[editingField, setEditingField\] = useState<string \| null>\(null\); const \[showShortcuts, setShowShortcuts\] = useState\(false\); const \[showShortcuts, setShowShortcuts\] = useState\(false\);', 'const [editingField, setEditingField] = useState<string | null>(null); const [showShortcuts, setShowShortcuts] = useState(false);'

Set-Content $filePath $content -NoNewline
Write-Host "Fixed!"
