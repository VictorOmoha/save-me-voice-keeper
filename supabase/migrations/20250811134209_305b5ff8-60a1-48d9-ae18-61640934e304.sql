
-- Allow authenticated users to manage their own files in the private "documents" bucket

-- Insert (upload)
create policy "docs_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and owner = auth.uid()
);

-- Select (download)
create policy "docs_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and owner = auth.uid()
);

-- Update (overwrite existing when upsert=true)
create policy "docs_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and owner = auth.uid()
)
with check (
  bucket_id = 'documents'
  and owner = auth.uid()
);

-- Delete (optional, for completeness)
create policy "docs_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and owner = auth.uid()
);
