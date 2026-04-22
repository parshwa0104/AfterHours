/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: AuthPanel.jsx — Register/Login gateway
=============================================================================
*
* Concepts:
* - Controlled inputs: field values are React state.
* - Async submit handling with loading/error messaging.
* - Mode switching (login vs register) with same form shell.
*/

import { useState } from 'react';
import { login, register, logout } from '../lib/authClient';

const AuthPanel = ({ user, onAuthSuccess, onLogout }) => {
  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = mode === 'register'
        ? await register({ displayName, email, password })
        : await login({ email, password });

      onAuthSuccess?.(payload.user);
      setPassword('');
    } catch (submitError) {
      setError(submitError.message || 'Auth failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Signed in as <strong style={{ color: 'var(--text-primary)' }}>{user.displayName}</strong>
        </span>
        <button
          onClick={() => {
            logout();
            onLogout?.();
          }}
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '6px', minWidth: '220px' }}>
      {mode === 'register' && (
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          required
          style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
        />
      )}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
        style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        minLength={6}
        required
        style={{ padding: '7px 9px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
      />

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '6px 10px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {submitting ? 'Please wait…' : mode === 'register' ? 'Register' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => setMode((prev) => (prev === 'register' ? 'login' : 'register'))}
          style={{
            padding: '6px 10px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
          }}
        >
          {mode === 'register' ? 'Have account?' : 'Create account'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--accent-secondary)', fontSize: '0.72rem' }}>{error}</p>}
    </form>
  );
};

export default AuthPanel;
