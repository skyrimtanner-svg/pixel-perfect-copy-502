import { Navigate } from 'react-router-dom';

/**
 * Index page — redirects to the main Triage view.
 * This page exists only as a fallback; the primary route is handled by App.tsx.
 */
const Index = () => <Navigate to="/" replace />;

export default Index;
