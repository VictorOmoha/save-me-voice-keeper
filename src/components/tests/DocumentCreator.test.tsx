import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {DocumentCreator} from '@/components/DocumentCreator';
const {upload, error, generate} = vi.hoisted(() => ({upload:vi.fn(), error:vi.fn(), generate:vi.fn()}));
vi.mock('@/utils/documentStorage', () => ({uploadDocumentToStorage:upload}));
vi.mock('@/utils/documentGenerator', () => ({generateDocument:generate}));
vi.mock('sonner', () => ({toast:{error,success:vi.fn()}}));
vi.mock('@/components/documents/RichTextEditor', () => ({RichTextEditor: ({onContentChange}: {onContentChange:(value:string)=>void}) => <textarea aria-label="Document content" onChange={event => onContentChange(event.target.value)} />}));
vi.mock('@/components/documents/DocumentFormatSelector', () => ({DocumentFormatSelector: ({selectedFormat,onFormatChange}: {selectedFormat:string,onFormatChange:(value:string)=>void}) => <select aria-label="Document format" value={selectedFormat} onChange={event => onFormatChange(event.target.value)}><option value="docx">Word</option><option value="pdf">PDF</option></select>}));
afterEach(cleanup);
beforeEach(() => {upload.mockReset(); error.mockReset(); generate.mockReset();});
describe('Document save recovery', () => {
  it('reuses the same uploaded file when the entry write fails and is retried', async () => {
    upload.mockResolvedValue('documents/owner/upload/sample.txt');
    const save=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    render(<DocumentCreator initialMode="upload" onSave={save} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Upload Document'),{target:{files:[new File(['sample'],'sample.txt',{type:'text/plain'})]}});
    fireEvent.click(screen.getByRole('button',{name:'Save document'}));
    await waitFor(()=>expect(error).toHaveBeenCalledWith('Could not save your document. Your draft is still here.'));
    fireEvent.click(screen.getByRole('button',{name:'Save document'}));
    await waitFor(()=>expect(save).toHaveBeenCalledTimes(2));
    expect(upload).toHaveBeenCalledOnce();
  });
  it('does not generate a document from empty editor markup', () => {
    render(<DocumentCreator onSave={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Document content'), {target:{value:'<p><br></p>'}});
    fireEvent.click(screen.getByRole('button',{name:'Create DOCX'}));
    expect(generate).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Please add some content to create the document');
  });
  it('requires regeneration after changing the document format', async () => {
    generate.mockResolvedValue(new Blob(['generated'],{type:'application/octet-stream'}));
    const save=vi.fn();
    render(<DocumentCreator onSave={save} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Document content'), {target:{value:'<p>A useful note</p>'}});
    fireEvent.click(screen.getByRole('button',{name:'Create DOCX'}));
    await screen.findByText('Document created: Untitled Document.docx');
    fireEvent.change(screen.getByLabelText('Document format'), {target:{value:'pdf'}});
    fireEvent.click(screen.getByRole('button',{name:'Save document'}));
    expect(upload).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Create your document file before saving.');
  });
  it('does not save an upload without a file', () => {
    const save=vi.fn();
    render(<DocumentCreator initialMode="upload" onSave={save} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Document Name *'), {target:{value:'My document'}});
    fireEvent.click(screen.getByRole('button',{name:'Save document'}));
    expect(save).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Choose a file to upload.');
  });
  it('keeps the draft open and avoids creating a broken entry when upload fails', async () => {
    upload.mockResolvedValue(null);
    const save=vi.fn();
    render(<DocumentCreator initialMode="upload" onSave={save} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Upload Document'), {target:{files:[new File(['sample'],'sample.txt',{type:'text/plain'})]}});
    fireEvent.click(screen.getByRole('button',{name:'Save document'}));
    await waitFor(() => expect(upload).toHaveBeenCalledOnce());
    await waitFor(() => expect((screen.getByRole('button',{name:'Save document'}) as HTMLButtonElement).disabled).toBe(false));
    expect(save).not.toHaveBeenCalled();
    expect((screen.getByLabelText('Document Name *') as HTMLInputElement).value).toBe('sample.txt');
  });
  it('waits for save completion before accepting another submission', async () => {
    let finish!: () => void;
    const save=vi.fn(() => new Promise<void>(resolve => {finish=resolve;}));
    render(<DocumentCreator initialMode="info" onSave={save} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Document Name *'), {target:{value:'Document note'}});
    fireEvent.click(screen.getByRole('button',{name:'Save document'}));
    expect((screen.getByRole('button',{name:'Saving…'}) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button',{name:'Saving…'}));
    expect(save).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(screen.getByRole('button',{name:'Save document'})).toBeTruthy());
  });
});
