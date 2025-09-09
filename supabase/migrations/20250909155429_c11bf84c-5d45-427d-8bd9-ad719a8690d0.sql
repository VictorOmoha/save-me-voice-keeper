-- Fix the invalid "click" field type in the Books entry
UPDATE entries 
SET field_definitions = jsonb_set(
  field_definitions::jsonb,
  '{1,type}',
  '"text"'::jsonb
)
WHERE title = 'Books' AND field_definitions::text LIKE '%click%';