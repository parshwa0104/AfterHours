/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: LoginPage.jsx — Public authentication entry
=============================================================================
*
* WHY THIS PAGE EXISTS:
* Keeping auth on a dedicated public route (`/login`) simplifies security
* and UX. Private app routes can focus on core product behavior.
*
* CONCEPTS:
* - Public route for unauthenticated users
* - Delegating auth form logic to `AuthPanel`
* - Redirecting to private app after successful login/register
*/

import { Navigate } from 'react-router-dom';
import AuthPanel from '../components/AuthPanel';

const LoginPage = ({ user, onAuthSuccess }) => {
  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: '24px',
      }}
    >
      <section className="card" style={{ width: 'min(420px, 100%)', display: 'grid', gap: '12px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome to AfterHours</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Sign in first, then we’ll take you to your dream dashboard.
        </p>

        <AuthPanel user={null} onAuthSuccess={onAuthSuccess} onLogout={() => {}} />
      </section>
    </main>
  );
};

export default LoginPage;
