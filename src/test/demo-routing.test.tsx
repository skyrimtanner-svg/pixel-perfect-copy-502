import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ModeProvider } from '@/contexts/ModeContext';
import DemoObservatoryPage from '@/pages/DemoObservatoryPage';
import AgentReadmePage from '@/pages/AgentReadmePage';

// Mock Supabase to be unauthenticated and return empty data
vi.mock('@/integrations/supabase/client', () => {
  const builder = (_table: string) => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
      then: (resolve: any) => Promise.resolve({ data: [], count: 0, error: null }).then(resolve),
    };
    return chain;
  };
  return {
    supabase: {
      from: builder,
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => {},
      },
      channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      removeChannel: () => {},
    },
  };
});

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>loading-auth</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}

function AuthSentinel() {
  return <div data-testid="auth-page-sentinel">AUTH PAGE</div>;
}
function ProtectedSentinel() {
  return <div data-testid="protected-sentinel">PROTECTED</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ModeProvider>
          <Routes>
            <Route path="/demo" element={<DemoObservatoryPage />} />
            <Route path="/agent-readme" element={<AgentReadmePage />} />
            <Route path="/auth" element={<AuthSentinel />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/triage" element={<ProtectedSentinel />} />
            </Route>
          </Routes>
        </ModeProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Public route accessibility (logged out)', () => {
  it('/demo renders without auth and does not redirect to /auth', async () => {
    renderAt('/demo');
    await waitFor(() => {
      expect(document.querySelector('[data-agent-id="demo-root"]')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('auth-page-sentinel')).not.toBeInTheDocument();
    expect(document.querySelector('[data-agent-id="demo-proof-strip"]')).toBeInTheDocument();
  });

  it('/agent-readme renders without auth and does not redirect to /auth', async () => {
    renderAt('/agent-readme');
    expect(await screen.findByText(/Agent README/i)).toBeInTheDocument();
    expect(screen.queryByTestId('auth-page-sentinel')).not.toBeInTheDocument();
  });

  it('protected route still redirects to /auth when logged out', async () => {
    renderAt('/triage');
    expect(await screen.findByTestId('auth-page-sentinel')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-sentinel')).not.toBeInTheDocument();
  });
});
