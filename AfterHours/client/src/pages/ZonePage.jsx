/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: ZonePage.jsx — Deep Focus Session Controller
=============================================================================
*
* WHAT THIS PAGE DOES:
* ZonePage is a focused, single-purpose screen for running one 25-minute
* deep-work session (a Pomodoro-like sprint).
*
* KEY REACT CONCEPTS USED HERE:
*
* 1) LIFTED STATE (Parent-owned session state)
*    `zoneActive` is owned by App-level state and passed down as props.
*    This keeps audio behavior and UI state synchronized across routes.
*
* 2) EFFECT + CLEANUP (Timer lifecycle)
*    We start an interval only when `zoneActive` is true.
*    The cleanup function clears the interval to prevent memory leaks or
*    duplicate timers after rerenders/unmounts.
*
* 3) FUNCTIONAL STATE UPDATES
*    `setSecondsLeft(prev => prev - 1)` avoids stale values because React
*    guarantees `prev` is the latest committed value.
*
* 4) DERIVED UI STATE via useMemo
*    `elapsedPercent` is computed from `secondsLeft` rather than stored.
*    This avoids redundant state and keeps logic predictable.
*
* 5) PRESENTATION DETAILS
*    - `fontVariantNumeric: 'tabular-nums'` prevents layout shifting
*      while time digits change.
*    - Progress width is mapped from elapsed session time.
*
=============================================================================
*/

import { useEffect, useMemo, useState } from 'react';

const TWENTY_FIVE_MINUTES = 25 * 60;

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

const ZonePage = ({ zoneActive, setZoneActive }) => {
  const [secondsLeft, setSecondsLeft] = useState(TWENTY_FIVE_MINUTES);

  useEffect(() => {
    if (!zoneActive) return;

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          setZoneActive(false);
          return TWENTY_FIVE_MINUTES;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [zoneActive, setZoneActive]);

  const elapsedPercent = useMemo(
    () => ((TWENTY_FIVE_MINUTES - secondsLeft) / TWENTY_FIVE_MINUTES) * 100,
    [secondsLeft],
  );

  const startSession = () => {
    setSecondsLeft(TWENTY_FIVE_MINUTES);
    setZoneActive(true);
  };

  const stopSession = () => {
    setZoneActive(false);
    setSecondsLeft(TWENTY_FIVE_MINUTES);
  };

  return (
    <div className="card" style={{ borderRadius: '16px' }}>
      <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', fontWeight: 700 }}>
        Focus Zone
      </p>
      <h2 style={{ fontSize: '1.5rem', marginTop: '8px', marginBottom: '8px' }}>One deep block. No hustle.</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Start a 25-minute session with brown noise. You can bail anytime with zero guilt.
      </p>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {formatTime(secondsLeft)}
        </div>
        <div style={{ marginTop: '12px', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${elapsedPercent}%`,
              borderRadius: '999px',
              transition: 'width 0.8s linear',
              backgroundColor: 'var(--accent-primary)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {!zoneActive ? (
          <button
            onClick={startSession}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--bg-primary)',
              fontWeight: 700,
            }}
          >
            ▶ Start 25 min
          </button>
        ) : (
          <button
            onClick={stopSession}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: '1px solid var(--accent-secondary)',
              color: 'var(--accent-secondary)',
              fontWeight: 700,
            }}
          >
            ⏹ End session
          </button>
        )}
      </div>
    </div>
  );
};

export default ZonePage;
