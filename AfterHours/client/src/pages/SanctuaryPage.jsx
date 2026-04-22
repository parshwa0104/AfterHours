/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: SanctuaryPage.jsx — API-driven Collaboration Feed
=============================================================================
*
* WHAT THIS PAGE DOES:
* Fetches collaboration offers from the backend and renders a resilient feed
* with loading, error, empty, and success states.
*
* KEY REACT CONCEPTS USED HERE:
*
* 1) ASYNC SIDE EFFECTS IN useEffect
*    Data fetching belongs in `useEffect` because it's an effect caused by
*    rendering this page, not by JSX itself.
*
* 2) MULTI-STATE UI MODEL
*    We model the request lifecycle explicitly:
*      - `loading`  -> show spinner text
*      - `error`    -> show fallback guidance
*      - empty data -> show empty-state message
*      - data       -> render cards
*
* 3) "isMounted" GUARD
*    We avoid setting state after unmount (e.g., fast route change) by using
*    a local flag. This is a common defensive pattern for async effects.
*
* 4) ENV-DRIVEN API BASE URL
*    `import.meta.env.VITE_API_BASE_URL` lets this page point to different
*    backends per environment without changing source code.
*
* 5) DERIVED FILTERED DATA (useMemo)
*    `openOffers` is derived from `offers` and memoized for readability and
*    to avoid unnecessary recalculation during unrelated rerenders.
*
=============================================================================
*/

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const moodByCategory = {
  Design: '🎨',
  Writing: '✍️',
  Business: '📈',
  Code: '💻',
  General: '🤝',
};

const SanctuaryPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchOffers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/offers`);
        if (!response.ok) {
          throw new Error(`Failed to load offers (${response.status})`);
        }

        const payload = await response.json();
        if (isMounted) {
          setOffers(Array.isArray(payload) ? payload : []);
        }
      } catch {
        if (isMounted) {
          setError('Live offers unavailable right now. Start the server to enable this tab.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOffers();
    return () => {
      isMounted = false;
    };
  }, []);

  const openOffers = useMemo(() => offers.filter((offer) => offer.status !== 'closed'), [offers]);

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div className="card">
        <p style={{ color: 'var(--accent-primary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          Skill Sanctuary
        </p>
        <h2 style={{ fontSize: '1.35rem', marginTop: '8px' }}>Trade momentum, not pressure</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Browse collaboration offers from the local API. This page auto-connects when your backend is running.
        </p>
      </div>

      <div className="card">
        {loading && <p>Loading offers…</p>}

        {!loading && error && (
          <p style={{ color: 'var(--accent-secondary)' }}>{error}</p>
        )}

        {!loading && !error && openOffers.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>
            No open offers yet. Seed one with a POST to `/api/offers` and it will appear here.
          </p>
        )}

        {!loading && !error && openOffers.length > 0 && (
          <div style={{ display: 'grid', gap: '10px' }}>
            {openOffers.map((offer) => (
              <article
                key={offer._id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 75%, transparent)',
                }}
              >
                <p style={{ color: 'var(--text-muted)', marginBottom: '6px', fontSize: '0.8rem' }}>
                  {moodByCategory[offer.category] || moodByCategory.General} {offer.category}
                </p>
                <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{offer.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{offer.description || 'No description provided.'}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SanctuaryPage;
