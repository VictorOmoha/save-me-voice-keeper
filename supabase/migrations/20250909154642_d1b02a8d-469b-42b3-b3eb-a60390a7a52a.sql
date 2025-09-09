-- Clean up existing entries with conflicting field names
-- Update the "Books" entry that has a conflicting "title" custom field
UPDATE entries 
SET fields = jsonb_set(
  fields - 'title',
  '{custom_title}', 
  fields->'title'
)
WHERE id = 'bdbb0a12-c9ba-4a8e-aba0-abefdc9925a2' 
AND fields ? 'title';

-- Clean up any other entries that might have reserved field name conflicts
UPDATE entries 
SET fields = (
  SELECT jsonb_object_agg(
    CASE 
      WHEN key IN ('id', 'title', 'created_at', 'updated_at', 'user_id', 'fields', 'field_definitions', 'createdAt', 'updatedAt', 'userId') 
      THEN 'custom_' || key
      ELSE key 
    END,
    value
  )
  FROM jsonb_each(fields) 
  WHERE key != 'category'
) || jsonb_build_object('category', fields->'category')
WHERE EXISTS (
  SELECT 1 FROM jsonb_each(fields) 
  WHERE key IN ('id', 'title', 'created_at', 'updated_at', 'user_id', 'fields', 'field_definitions', 'createdAt', 'updatedAt', 'userId')
  AND key != 'category'
);