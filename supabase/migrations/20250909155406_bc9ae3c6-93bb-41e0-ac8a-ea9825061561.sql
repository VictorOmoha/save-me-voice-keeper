-- Fix the invalid "click" field type in the Books entry
UPDATE entries 
SET field_definitions = jsonb_set(
  field_definitions::jsonb,
  '{1,type}',
  '"text"'::jsonb
)
WHERE title = 'Books' AND field_definitions::text LIKE '%click%';

-- Add a constraint to prevent invalid field types in the future
ALTER TABLE entries 
ADD CONSTRAINT valid_field_types 
CHECK (
  field_definitions IS NULL OR 
  (
    SELECT bool_and(
      (field_def->>'type') IN ('text', 'number', 'date', 'textarea', 'image', 'gallery', 'table')
    )
    FROM jsonb_array_elements(field_definitions) AS field_def
    WHERE field_def ? 'type'
  )
);