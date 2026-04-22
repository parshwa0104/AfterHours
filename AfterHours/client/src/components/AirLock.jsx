/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: AirLock.jsx — The UI Prompt
=============================================================================
*
* WHAT THIS COMPONENT DOES:
* AirLock is the "gateway" experience. It appears when headphones are detected. 
* The UX goal: create a deliberate, moment-of-intention before entering 
* deep focus. The user actively CHOOSES to "Enter the Zone."
*
* ANIMATION TECHNIQUE — CSS KEYFRAMES:
* We animate the AirLock in using a CSS `@keyframes` animation defined
* directly in a <style> tag inside the component.
* The card slides up from below and fades in. This creates a gentle,
* physical "arrival" feeling instead of a jarring pop-in.
*
* DIMMING TRICK:
* The entire screen behind the card is covered by a semi-transparent 
* `position: fixed` backdrop. This signals to the brain: 
*   "The world is getting quieter. Focus is coming."
*
* WHY WE PASS `isPlaying` AS A PROP:
* The AirLock doesn't own the audio state — the parent (App.jsx) does.
* The AirLock just tells the parent "the user clicked a button" by calling
* the callback props (onEnter, onDismiss). This is called "lifting state up"
* and is a fundamental React architecture pattern.
*
=============================================================================
*/

import React from 'react';

const AirLock = ({ onEnter, onDismiss, isPlaying }) => {
  return (
    <>
      {/* Built-in styles for the slide-up animation. We scope it only to
          AirLock so it doesn't pollute the global CSS. */}
      <style>{`
        @keyframes airlock-slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .airlock-card {
          animation: airlock-slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      {/* The darkened full-screen backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0, // shorthand for top/right/bottom/left: 0
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(4px)', // Blurs the content behind the modal
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        {/* The Card itself */}
        <div
          className="airlock-card"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '20px',
            padding: '40px 32px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Headphone icon using Unicode — no icon library needed */}
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎧</div>

          <h2 style={{ 
            fontSize: '1.4rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>
            Headphones Detected
          </h2>

          <p style={{ 
            color: 'var(--text-muted)', 
            lineHeight: '1.7', 
            marginBottom: '32px',
            fontSize: '0.95rem'
          }}>
            Ready to leave the day behind? Brown noise will fade in gently 
            as you enter your focus zone.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Primary CTA — triggers audio start */}
            <button
              onClick={onEnter}
              style={{
                padding: '14px 24px',
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
                fontWeight: '700',
                fontSize: '1rem',
                borderRadius: '12px',
                letterSpacing: '0.02em',
              }}
            >
              {isPlaying ? '✓ In the Zone' : '🌙 Enter the Zone'}
            </button>

            {/* Dismiss — no guilt, no pressure */}
            <button
              onClick={onDismiss}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: '500',
                fontSize: '0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
              }}
            >
              Not right now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AirLock;
