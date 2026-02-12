import re

with open('src/pages/BrainDump.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the return statement closing
content = content.replace(
    '</>\n  );\n};\n\nexport default BrainDumpPage',
    '<KeyboardShortcuts open={showShortcuts} onOpenChange={setShowShortcuts} />\n    </>\n  );\n};\n\nexport default BrainDumpPage'
)

# Add shortcuts button to header - find Dashboard button and add after it
dashboard_button = '<Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard">'
shortcuts_button = '''<Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} aria-label="Keyboard shortcuts" className="ml-2">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>'''
content = content.replace(dashboard_button + '\n            <LayoutDashboard', shortcuts_button.replace('\n            <LayoutDashboard', '\n            <LayoutDashboard'))

# Actually, let me just find and replace the specific pattern
old_header = '''<Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>'''

new_header = '''<Button variant="outline" size="sm" onClick={handleDashboardClick} aria-label="Go to dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} aria-label="Keyboard shortcuts" className="ml-2">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>'''

content = content.replace(old_header, new_header)

with open('src/pages/BrainDump.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('UI components added successfully')
