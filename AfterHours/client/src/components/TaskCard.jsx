/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: TaskCard.jsx — The 15-Minute Micro-Task
=============================================================================
*
* WHAT THIS COMPONENT DOES:
* Displays a single 15-minute micro-task. The core interaction is:
*   1. User reads the task
*   2. User clicks "Start 15 min" — a countdown timer begins
*   3. The card visually transforms into "focus mode" (only the task remains)
*   4. When done, the user clicks "Mark Complete" — the card celebrates and closes
*
* CONCEPTS TO LEARN FROM THIS FILE:
*
* 1. DERIVED STATE vs. STORED STATE:
*    The `timeLeft` changes every second but is derived from the `startTime`.
*    We store `startTime` (when the timer began) in state and calculate
*    `timeLeft` in the render. We do NOT store `timeLeft` itself — that would
*    make our state stale every second unnecessarily.
*
* 2. useRef FOR THE INTERVAL:
*    The countdown uses `setInterval` to tick every second. We store this
*    interval in a `ref` (not state) because:
*    - We need it to persist across renders
*    - Changing it should NOT trigger a re-render
*    - We need to `clearInterval` on cleanup
*
* 3. ENERGY MODE FILTERING:
*    Each task has a `difficulty` (1=easy, 2=medium, 3=hard). The parent
*    Dashboard passes `energyMode` ('survival'|'flow'|'build'). This
*    component shows an orange dot on tasks not recommended in Survival mode,
*    nudging the user to pick easier wins.
*
=============================================================================
*/

import React, { useState, useEffect, useRef } from 'react';

const FIFTEEN_MINUTES = 15 * 60; // 900 seconds

const TaskCard = ({ task, energyMode, onComplete }) => {
  // 'idle' → 'running' → 'done'
  const [status, setStatus] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(FIFTEEN_MINUTES);
  const intervalRef = useRef(null); // holds the setInterval ID

  // -- Clean up the interval when the component unmounts --
  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const startTimer = () => {
    setStatus('running');
    // Tick every 1000ms (1 second), decrementing timeLeft
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current); // Stop at zero
          setStatus('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleComplete = () => {
    clearInterval(intervalRef.current);
    setStatus('done');
    // Notify the parent Dashboard that this task is finished
    // (so it can update the streak count)
    setTimeout(() => onComplete(task.id), 600); // small delay for the celebration flash
  };

  // -- Format seconds as MM:SS for display --
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Warn in Survival mode if this task is too demanding
  const isTooHardForSurvival = energyMode === 'survival' && task.difficulty > 1;

  // Visual state of the card: idle (normal), running (focused), done (celebration)
  const cardStyle = {
    backgroundColor: status === 'done'
      ? 'color-mix(in srgb, var(--accent-primary) 20%, var(--bg-secondary))' // subtle green tint on complete
      : 'var(--bg-secondary)',
    borderRadius: '14px',
    padding: '20px',
    border: status === 'running'
      ? '1.5px solid var(--accent-primary)' // ring highlights active task
      : '1.5px solid transparent',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  };

  return (
    <div style={cardStyle}>

      {/* Progress bar: fills from left to right as time runs down */}
      {status === 'running' && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: '3px',
          // Width is the percentage of time ELAPSED (not remaining)
          width: `${((FIFTEEN_MINUTES - timeLeft) / FIFTEEN_MINUTES) * 100}%`,
          backgroundColor: 'var(--accent-primary)',
          transition: 'width 1s linear', // smooth 1-second tick
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: '16px' }}>

          {/* Task category tag */}
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '600',
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {task.category} · 15 min
          </span>

          {/* Task title */}
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginTop: '6px',
            marginBottom: '8px',
            color: status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: status === 'done' ? 'line-through' : 'none',
            transition: 'color 0.3s ease',
          }}>
            {status === 'done' ? '✓ ' : ''}{task.title}
          </h3>

          {/* Tags row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {task.isOffline && (
              <span style={{
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px',
                backgroundColor: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)',
                color: 'var(--accent-secondary)',
              }}>
                📵 No-WiFi
              </span>
            )}
            {isTooHardForSurvival && (
              <span style={{
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px',
                backgroundColor: 'rgba(255,160,80,0.15)',
                color: '#C88040',
              }}>
                ⚡ Save for later
              </span>
            )}
          </div>
        </div>

        {/* Right side: timer display or action button */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {status === 'idle' && (
            <button
              onClick={startTimer}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                fontWeight: '600',
                fontSize: '0.85rem',
                borderRadius: '8px',
              }}
            >
              Start
            </button>
          )}

          {status === 'running' && (
            <div>
              {/* The live countdown display */}
              <div style={{
                fontSize: '1.4rem',
                fontWeight: '800',
                fontVariantNumeric: 'tabular-nums', // prevents layout shift as digits change
                color: timeLeft < 60 ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                lineHeight: 1,
              }}>
                {formatTime(timeLeft)}
              </div>
              <button
                onClick={handleComplete}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: 'var(--accent-primary)',
                  fontWeight: '600',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  border: '1px solid var(--accent-primary)',
                }}
              >
                Done ✓
              </button>
            </div>
          )}

          {status === 'done' && (
            <span style={{ fontSize: '1.5rem' }}>🌱</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
