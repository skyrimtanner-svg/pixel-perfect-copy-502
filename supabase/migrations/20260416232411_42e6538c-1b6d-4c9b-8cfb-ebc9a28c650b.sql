-- Idempotent backfill of waitlist.spot_number based on created_at order
DO $$
BEGIN
  -- Reassign sequential spots ordered by created_at
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS new_spot
    FROM public.waitlist
  )
  UPDATE public.waitlist w
  SET spot_number = o.new_spot
  FROM ordered o
  WHERE w.id = o.id
    AND (w.spot_number IS DISTINCT FROM o.new_spot);
END $$;

-- Ensure NOT NULL (idempotent: ALTER ... SET NOT NULL is a no-op if already set)
ALTER TABLE public.waitlist ALTER COLUMN spot_number SET NOT NULL;

-- Add UNIQUE constraint only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.waitlist'::regclass
      AND contype = 'u'
      AND conname = 'waitlist_spot_number_key'
  ) THEN
    ALTER TABLE public.waitlist
      ADD CONSTRAINT waitlist_spot_number_key UNIQUE (spot_number);
  END IF;
END $$;