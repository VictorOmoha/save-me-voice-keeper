import {fireEvent, render, screen} from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {describe, expect, it, vi} from 'vitest';
import {ConnectionTools} from './ConnectionsSettings';
vi.mock('@/lib/firebase', () => ({auth: {}, db: {}}));
vi.mock('@/contexts/AuthContext', () => ({useAuth: () => ({user: null})}));
describe('external tool access', () => {
  it('starts with no tools selected and saves only the selected names without rendering provider HTML', () => {
    const save = vi.fn();
    const {container} = render(<ConnectionTools busy={false} onSave={save} connection={{id: 'id', provider: 'mcp', revision: 'one', name: 'Test', account: 'example.com', enabled_tools: [], tools: [
      {name: 'search', description: '<script>bad()</script>', inputSchema: {}}, {name: 'send', description: 'Send a message', inputSchema: {}},
    ]}} />);
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes[0]).not.toBeChecked(); expect(container.querySelector('script')).toBeNull();
    fireEvent.click(boxes[0]); fireEvent.click(screen.getByRole('button', {name: 'Save tool access'}));
    expect(save).toHaveBeenCalledWith(['search']);
  });
});
