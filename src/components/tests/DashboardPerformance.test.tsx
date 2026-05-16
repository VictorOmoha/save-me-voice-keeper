import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../../..');

const readSource = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), 'utf8');

describe('Dashboard performance boundaries', () => {
  it('does not statically import document creation tools into the default dashboard content', () => {
    const source = readSource('src/components/DashboardMainContent.tsx');

    expect(source).not.toMatch(/import\s+\{\s*DocumentCreator\s*\}\s+from\s+["']@\/components\/DocumentCreator["']/);
    expect(source).not.toMatch(/import\s+\{\s*DataEntryForm\s*\}\s+from\s+["']@\/components\/DataEntryForm["']/);
    expect(source).not.toContain('<DocumentCreator');
    expect(source).not.toContain('<DataEntryForm');
  });

  it('only mounts heavy document modals after they are opened', () => {
    const source = readSource('src/pages/Dashboard.tsx');

    expect(source).toMatch(/const\s+DataEntryForm\s*=\s*lazy\(\(\)\s*=>/);
    expect(source).toContain('documentViewerState.isOpen &&');
    expect(source).toContain('documentEditorState.isOpen &&');
  });

  it('keeps recent-entry dialog and print tooling lazy on initial dashboard render', () => {
    const source = readSource('src/components/entries/EnhancedRecentEntries.tsx');

    expect(source).not.toMatch(/import\s+\{\s*EnhancedEntryViewDialog\s*\}\s+from\s+["']\.\/EnhancedEntryViewDialog["']/);
    expect(source).not.toMatch(/import\s+\{\s*printProfessionally\s*\}\s+from\s+["']\.\/ProfessionalPrintView["']/);
    expect(source).toMatch(/const\s+EnhancedEntryViewDialog\s*=\s*React\.lazy/);
    expect(source).toContain("import('./ProfessionalPrintView')");
  });

});
