import { describe, it, expect } from 'vitest';

/**
 * Regression guard for the append-only triggers on trust_ledger, latent_log,
 * and analytics_events, plus the sequential waitlist spot RPC.
 *
 * Invokes the deployed `verify-integrity` edge function and asserts every
 * check in the report returned `passed: true`. If any append-only protection
 * regresses, this test fails the suite.
 *
 * Required env vars (read from .env / process.env):
 *   - VITE_SUPABASE_URL          (function endpoint host)
 *   - VITE_SUPABASE_PUBLISHABLE_KEY  (anon key for apikey + Bearer header)
 *
 * If either is missing (e.g. fresh local clone with no .env), the test is
 * skipped with a clear message rather than failing.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const hasEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

describe('verify-integrity edge function', () => {
  if (!hasEnv) {
    it.skip('SKIPPED — set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to run live integrity checks', () => {
      // Intentionally skipped: required env vars are not configured locally.
    });
    return;
  }

  it('reports all append-only and waitlist checks as passed', async () => {
    const url = `${SUPABASE_URL}/functions/v1/verify-integrity`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    expect(res.status, 'verify-integrity should return 200').toBe(200);

    const report = (await res.json()) as {
      summary: { total: number; passed: number; failed: number; status: string };
      checks: Array<{ name: string; passed: boolean; actual?: string; expected?: string }>;
    };

    // Build a readable failure message listing any regressed checks.
    const failed = report.checks.filter((c) => !c.passed);
    if (failed.length > 0) {
      const detail = failed
        .map((c) => `  ✗ ${c.name}\n      expected: ${c.expected}\n      actual:   ${c.actual}`)
        .join('\n');
      throw new Error(
        `verify-integrity reported ${failed.length}/${report.checks.length} failed checks:\n${detail}`
      );
    }

    expect(report.summary.status).toBe('ALL_PASSED');
    expect(report.summary.failed).toBe(0);
    expect(report.summary.passed).toBe(report.summary.total);
    expect(report.summary.total).toBeGreaterThanOrEqual(4);

    for (const check of report.checks) {
      expect(check.passed, `check "${check.name}" must pass`).toBe(true);
    }
  }, 30_000);
});
