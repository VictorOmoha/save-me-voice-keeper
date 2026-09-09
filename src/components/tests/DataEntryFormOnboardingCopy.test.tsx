import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DataEntryForm } from '@/components/DataEntryForm';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

afterEach(cleanup);
describe('DataEntryForm memory workflow', () => {
  it('saves notes directly into the originating collection', () => {
    const save = vi.fn();
    render(<DataEntryForm onSave={save} onCancel={vi.fn()} preselectedCategory="Health" />);
    expect((screen.getByLabelText('Category') as HTMLInputElement).value).toBe('Health');
    fireEvent.change(screen.getByLabelText('Title'), {target: {value: 'Walk after lunch'}});
    fireEvent.change(screen.getByLabelText('Notes'), {target: {value: 'Leave the phone at home.'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save Entry'}));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({title: 'Walk after lunch', fields: {category: 'Health', notes: 'Leave the phone at home.'}}));
  });
  it('lets a new custom field receive a value before the first save', () => {
    const save = vi.fn();
    render(<DataEntryForm onSave={save} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Title'), {target: {value: 'Budget'}});
    fireEvent.click(screen.getByRole('button', {name: 'Add Field'}));
    fireEvent.change(screen.getByLabelText('Field name'), {target: {value: 'Balance'}});
    fireEvent.change(screen.getByRole('textbox', {name: 'Balance value'}), {target: {value: '0'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save Entry'}));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({fields: expect.objectContaining({category: 'Personal', balance: '0'})}));
  });
  it('preserves a numeric zero when editing an existing field', () => {
    const save = vi.fn();
    render(<DataEntryForm onSave={save} onCancel={vi.fn()} mode="edit" editEntry={{id:'zero', title:'Budget', fields:{category:'Finance', balance:0}, fieldDefinitions:[{id:'balance',name:'balance',type:'number'}], createdAt:new Date(), updatedAt:new Date()}} />);
    fireEvent.click(screen.getByRole('button', {name: 'Update Entry'}));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({fields: {category: 'Finance', balance: 0}}));
  });
});
