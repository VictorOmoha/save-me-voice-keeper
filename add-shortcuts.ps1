$content = Get-Content 'src\pages\BrainDump.tsx' -Raw

# Find and replace the Dashboard button to add Shortcuts button after it
$oldNavButtons = @'
<Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard"> <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard </Button> </nav>
'@

$newNavButtons = @'
<Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard"> <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard </Button> <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} aria-label="Keyboard shortcuts" className="ml-2"> <Keyboard className="h-4 w-4 mr-2" /> Shortcuts </Button> </nav>
'@

$content = $content.Replace($oldNavButtons, $newNavButtons)

# Find and replace the closing fragment to add KeyboardShortcuts dialog
$oldClosing = '</> ); }; export default BrainDumpPage;'
$newClosing = '<KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} /> </> ); }; export default BrainDumpPage;'

$content = $content.Replace($oldClosing, $newClosing)

Set-Content 'src\pages\BrainDump.tsx' $content -NoNewline
Write-Host 'Shortcuts button and dialog added successfully'
