/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: GardenPage.jsx — Persistence + Reflection UI
=============================================================================
*
* WHAT THIS PAGE DOES:
* Shows the user's growth streak and a recap of completed tasks by reading
* the locally cached task tree (IndexedDB), then lets the user reset it.
*
* KEY REACT CONCEPTS USED HERE:
*
* 1) HYDRATION FROM PERSISTENCE
*    On first render, `hydrate()` loads cached data and maps it into a safe,
*    normalized state object (with fallbacks).
*
* 2) LOADING STATE GATE
*    The component renders a temporary loading card until hydration finishes.
*    This avoids flashing incorrect empty UI before data arrives.
*
* 3) DERIVED LISTS WITH useMemo
*    `completedTaskTitles` is computed from `tasks + completedIds` instead of
*    stored separately, reducing bugs from out-of-sync state.
*
* 4) IMMUTABLE UPDATE PATTERN
*    `nextState` is created with spread syntax before updates and save, which
*    keeps state updates predictable and React-friendly.
*
* 5) WRITE-THROUGH RESET
*    Reset updates both in-memory state and IndexedDB cache so refreshes keep
*    the same result. UI and persistence stay consistent.
*
=============================================================================
*/

import { useEffect, useMemo, useState } from 'react';
import GardenStreak from '../components/GardenStreak';
import { loadTaskTree, saveTaskTree } from '../lib/taskTreeCache';

const EMPTY_STATE = {
  tasks: [],
  completedIds: [],
  streakDays: 0,
  energyMode: 'flow',
};

const GardenPage = () => {
  const [state, setState] = useState(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const cached = await loadTaskTree();
        if (!mounted) return;
        setState({
          tasks: cached?.tasks ?? [],
          completedIds: cached?.completedIds ?? [],
          streakDays: cached?.streakDays ?? 0,
          energyMode: cached?.energyMode ?? 'flow',
        });
      } catch {
        if (mounted) setState(EMPTY_STATE);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const completedTaskTitles = useMemo(() => {
    const completed = new Set(state.completedIds);
    return state.tasks.filter((task) => completed.has(task.id)).map((task) => task.title);
  }, [state.completedIds, state.tasks]);

  const handleReset = async () => {
    const nextState = {
      ...state,
      completedIds: [],
      streakDays: 0,
    };

    setState(nextState);
    await saveTaskTree(nextState);
  };

  if (loading) {
    return <div className="card">Loading your garden…</div>;
  }

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <div className="card">
        <GardenStreak streakDays={state.streakDays} dreamName="Launch my first indie product 🚀" />
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Today&apos;s harvested wins</h3>
        {completedTaskTitles.length > 0 ? (
          <ul style={{ paddingInlineStart: '18px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {completedTaskTitles.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No completed tasks yet. Plant one small win 🌱</p>
        )}

        <button
          onClick={handleReset}
          style={{
            marginTop: '14px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'transparent',
            color: 'var(--text-muted)',
          }}
        >
          Reset local garden state
        </button>
      </div>
    </div>
  );
};

export default GardenPage;
