$content = Get-Content 'src\pages\BrainDump.tsx' -Raw

# Add ShareButtons component after the Save button in the right card
$oldSaveButton = '{(!livePreview || hasStructured) && ( <div className="pt-2"> <Button onClick={handleSave}'
$newSaveSection = '{(!livePreview || hasStructured) && ( <div className="pt-2 flex gap-2"> <Button onClick={handleSave}'
$content = $content.Replace($oldSaveButton, $newSaveSection)

# Add ShareButtons after Save button
$saveButtonEnd = 'className="w-full" > Save to Entries </Button> </div> )}'
$saveWithShare = 'className="w-full" > Save to Entries </Button> <ShareButtons data={{ title: title || "Brain Dump", category, actionItems, keyPoints, notes, people, tags, confidence, originalText: rawText || transcript }} disabled={!hasStructured} /> </div> )}'
$content = $content.Replace($saveButtonEnd, $saveWithShare)

Set-Content 'src\pages\BrainDump.tsx' $content -NoNewline
Write-Host 'Share buttons added successfully'
