-- ─── 1. Tighten analytics_events INSERT policy ─────────────────────────────
-- Prevent users from inserting events with NULL user_id (anonymous-looking)
DROP POLICY IF EXISTS "Users can insert own events" ON public.analytics_events;

CREATE POLICY "Users can insert own events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NOT NULL
  AND auth.uid() = user_id
);

-- ─── 2. Realtime channel authorization on realtime.messages ────────────────
-- Restrict broadcast/presence channel subscriptions so only admins can
-- subscribe to internal operational topics (pending_evidence, scout_logs).
-- Other authenticated users can still use any non-restricted topic.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only on internal realtime topics" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can use non-internal realtime topics" ON realtime.messages;

-- Admins can subscribe to (and broadcast on) any topic, including internal ones.
CREATE POLICY "Admins only on internal realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  CASE
    WHEN realtime.topic() IN ('pending_evidence', 'scout_logs')
      OR realtime.topic() LIKE 'pending_evidence:%'
      OR realtime.topic() LIKE 'scout_logs:%'
    THEN public.has_role(auth.uid(), 'admin'::public.app_role)
    ELSE true
  END
);

-- Same gate for writing (broadcast) so non-admins can't inject into admin topics.
CREATE POLICY "Authenticated can use non-internal realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() IN ('pending_evidence', 'scout_logs')
      OR realtime.topic() LIKE 'pending_evidence:%'
      OR realtime.topic() LIKE 'scout_logs:%'
    THEN public.has_role(auth.uid(), 'admin'::public.app_role)
    ELSE true
  END
);