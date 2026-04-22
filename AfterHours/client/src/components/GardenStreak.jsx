/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: GardenStreak.jsx — Soft Streaks, No Guilt
=============================================================================
*
* CORE PHILOSOPHY:
* Traditional streak apps use a "fire" 🔥 emoji that breaks if you miss a day.
* That is psychologically damaging for burnt-out users. We use a "Growing
* Garden" instead. Plants don't die if you forget to water them for a day —
* they just pause their growth until you return.
*
* HOW WE VISUALIZE GROWTH WITH PURE CSS:
* We use an array of "plot" objects to represent garden slots. Each plot
* is a small square div. Based on the streak day count, it gets a CSS class
* that applies a different color and scale transform:
*
*   'empty'   → gray, scale(0.7)   [not yet grown]
*   'sprout'  → light green        [Day 1–7]
*   'plant'   → lush green         [Day 8–30]
*   'tree'    → deep forest green  [Day 30+]
*
* ANIMATION — "staggered entrance":
* Each plot animates in with a slight delay based on its index position.
* This creates that satisfying "popping in one by one" effect you see in
* premium apps. We achieve this by setting:
*   animationDelay: `${index * 80}ms`
* on each element — a simple multiplication gives us staggered timing.
*
=============================================================================
*/

import React from 'react';

// The garden has a fixed grid of 28 plots (4 weeks worth of days)
const TOTAL_PLOTS = 28;

// Returns a display stage based on which day of the streak this plot is
const getPlotStage = (plotIndex, streakDays) => {
  if (plotIndex >= streakDays) return 'empty';
  if (plotIndex < 7)  return 'sprout';
  if (plotIndex < 30) return 'plant';
  return 'tree';
};

// Emoji per stage — gives the garden a living, physical quality
const STAGE_EMOJI = {
  empty:  '·',
  sprout: '🌱',
  plant:  '🌿',
  tree:   '🌳',
};

// Color of the plot background per stage
const STAGE_COLORS = {
  empty:  'var(--border-color)',
  sprout: '#A8C5A0',
  plant:  '#6B9E6B',
  tree:   '#3D7A3D',
};

const GardenStreak = ({ streakDays = 0, dreamName = 'Your Dream' }) => {
  // Build the array of 28 plots
  const plots = Array.from({ length: TOTAL_PLOTS }, (_, i) => ({
    index: i,
    stage: getPlotStage(i, streakDays),
  }));

  return (
    <div style={{ marginBottom: '8px' }}>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>🌱 Your Garden</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            {dreamName}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {/* The streak count is framed positively, never as a warning */}
          <span style={{
            fontSize: '1.6rem',
            fontWeight: '800',
            color: 'var(--accent-primary)',
            lineHeight: 1,
          }}>
            {streakDays}
          </span>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>days growing</p>
        </div>
      </div>

      {/* The garden grid — 7 columns, 4 rows = 4 weeks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)', // 7 columns, one per day of the week
        gap: '6px',
      }}>
        {plots.map(({ index, stage }) => (
          <div
            key={index}
            title={`Day ${index + 1}`}
            style={{
              // Each cell is a square. Padding-bottom trick creates a 1:1 aspect ratio.
              position: 'relative',
              paddingBottom: '100%',
              backgroundColor: STAGE_COLORS[stage],
              borderRadius: '6px',
              // Staggered entrance animation — each plot appears 80ms after the previous one
              animation: 'pop-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${index * 40}ms`,
              transition: 'transform 0.2s ease',
              cursor: 'default',
            }}
          >
            {/* The emoji sits absolutely centered inside the square */}
            <span style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: stage === 'empty' ? '1rem' : '1.1rem',
              opacity: stage === 'empty' ? 0.3 : 1,
            }}>
              {STAGE_EMOJI[stage]}
            </span>
          </div>
        ))}
      </div>

      {/* Motivational message — always gentle, never shaming */}
      <p style={{
        marginTop: '14px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        fontStyle: 'italic',
      }}>
        {streakDays === 0 && 'Plant your first seed today.'}
        {streakDays > 0 && streakDays < 7 && 'Your sprouts are finding the light. ✨'}
        {streakDays >= 7 && streakDays < 30 && 'A garden is taking shape. Keep showing up. 🌿'}
        {streakDays >= 30 && 'You grew a forest. One day at a time. 🌳'}
      </p>

      {/* The keyframe animation is defined here so it stays local to this component */}
      <style>{`
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default GardenStreak;
