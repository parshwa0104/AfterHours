/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: Dashboard.jsx — The Heart of AfterHours
=============================================================================
*
* WHAT THIS PAGE DOES:
* This is the main screen users see when they open the app after work.
* It combines three ideas:
*   1. Dream Deconstructor — a user's big goal broken into 15-min micro-tasks
*   2. Energy Mode Selector — users tell the app how tired they are
*   3. Growing Garden — a visual, guilt-free streak tracker
*
* DATA ARCHITECTURE — "Mock Data First":
* We're not hitting an API yet. We have an array of pre-made task objects
* (`MOCK_DREAM_TASKS`). This is deliberately called "mock data" or a
* "fixture." Writing UI against mock data first is a professional practice:
*   - Design and interact with the UI before the backend is ready
*   - Later, swap the mock array for a real API call (just one line changes)
*
* THE ENERGY MODE CONCEPT:
* The app doesn't ask "how much will you do today?" It asks
* "how much energy do you have right now?" This is a subtle but important
* framing shift. The three modes filter which tasks are shown:
*   🌙 Survival (10%) → only difficulty 1 tasks
*   🌤️ Flow (50%)     → difficulty 1 and 2
*   ⚡ Build (100%)   → all tasks
*
* STREAK LOGIC:
* We store `completedIds` (a Set of task IDs). When all tasks for today
* are complete, the streak increments. This is a simplified prototype model —
* in production this would persist to a backend with daily reset logic.
*
=============================================================================
*/

import React, { useEffect, useState } from 'react';
import TaskCard from '../components/TaskCard';
import GardenStreak from '../components/GardenStreak';
import { loadTaskTree, saveTaskTree } from '../lib/taskTreeCache';
import { authFetch, getStoredToken } from '../lib/authClient';

// --- MOCK DATA: This stands in for what an AI would generate ---
// Each task has: id, title, category, difficulty (1-3), isOffline flag
const MOCK_DREAM_TASKS = [
  {
    id: 1,
    title: 'Write a 3-sentence intro for your blog post',
    category: 'Writing',
    difficulty: 1,
    isOffline: true,
  },
  {
    id: 2,
    title: 'Sketch a rough wireframe of your app\'s home screen',
    category: 'Design',
    difficulty: 1,
    isOffline: true,
  },
  {
    id: 3,
    title: 'Research 3 competitors in your niche — just take notes',
    category: 'Business',
    difficulty: 2,
    isOffline: false,
  },
  {
    id: 4,
    title: 'Record a 2-minute voice note explaining your idea out loud',
    category: 'Clarity',
    difficulty: 1,
    isOffline: true,
  },
  {
    id: 5,
    title: 'Write the function signature for one feature of your side project',
    category: 'Code',
    difficulty: 3,
    isOffline: false,
  },
];

// --- ENERGY MODES ---
const ENERGY_MODES = [
  { id: 'survival', label: '🌙 Survival', subtitle: '10% energy', maxDifficulty: 1 },
  { id: 'flow',     label: '🌤️ Flow',     subtitle: '50% energy', maxDifficulty: 2 },
  { id: 'build',    label: '⚡ Build',    subtitle: '100% energy', maxDifficulty: 3 },
];

const Dashboard = ({ user = null }) => {
  const DEFAULT_DREAM_NAME = 'Launch my first indie product 🚀';
  const [dreamName, setDreamName] = useState('Launch my first indie product 🚀');
  const [energyMode, setEnergyMode] = useState('flow'); // Default: medium energy
  const [completedIds, setCompletedIds] = useState(new Set()); // Tracks completed task IDs
  const [streakDays, setStreakDays] = useState(12); // Mock: user has a 12-day streak
  const [taskTree, setTaskTree] = useState(MOCK_DREAM_TASKS);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState(1);
  const [newTaskOffline, setNewTaskOffline] = useState(true);
  const [dreamId, setDreamId] = useState(null);
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const hydrateFromCache = async () => {
      try {
        const cached = await loadTaskTree();
        if (!isMounted || !cached) return;
        setDreamName(cached.dreamName ?? 'Launch my first indie product 🚀');
        setTaskTree(cached.tasks ?? MOCK_DREAM_TASKS);
        setEnergyMode(cached.energyMode ?? 'flow');
        setCompletedIds(new Set(cached.completedIds ?? []));
        setStreakDays(cached.streakDays ?? 12);
      } catch {
        // Keep default local mock state if IndexedDB read fails.
      } finally {
        if (isMounted) setCacheReady(true);
      }
    };
    hydrateFromCache();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user || !getStoredToken()) return;

    let mounted = true;

    const hydrateFromApi = async () => {
      try {
        const dreamsResponse = await authFetch('/api/dreams');
        if (!dreamsResponse.ok) return;

        const dreams = await dreamsResponse.json();
        let activeDream = dreams[0] || null;

        // Auto-create a first dream for smoother onboarding.
        if (!activeDream) {
          const createResponse = await authFetch('/api/dreams', {
            method: 'POST',
            body: JSON.stringify({ title: DEFAULT_DREAM_NAME }),
          });
          if (createResponse.ok) {
            activeDream = await createResponse.json();
          }
        }

        if (!mounted || !activeDream?._id) return;

        setDreamId(activeDream._id);
        setDreamName(activeDream.title || DEFAULT_DREAM_NAME);

        const tasksResponse = await authFetch(`/api/dreams/${activeDream._id}/tasks`);
        if (!tasksResponse.ok) return;
        const tasks = await tasksResponse.json();

        if (!mounted) return;

        const normalizedTasks = tasks.map((task) => ({
          id: task._id,
          title: task.title,
          category: task.category,
          difficulty: task.difficulty,
          isOffline: task.isOffline,
          status: task.status,
        }));

        setTaskTree(normalizedTasks.length ? normalizedTasks : MOCK_DREAM_TASKS);
        setCompletedIds(new Set(normalizedTasks.filter((task) => task.status === 'done').map((task) => task.id)));
      } catch {
        // Local fallback remains available if API fetch fails.
      }
    };

    hydrateFromApi();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!cacheReady) return;
    saveTaskTree({
      dreamName,
      tasks: taskTree,
      energyMode,
      completedIds: Array.from(completedIds),
      streakDays,
    }).catch(() => {
      // Silent fallback keeps prototype usable in unsupported environments.
    });
  }, [cacheReady, dreamName, taskTree, energyMode, completedIds, streakDays]);

  // -- Filter tasks based on energy mode --
  // `find` returns the first match from our ENERGY_MODES array
  const currentMode = ENERGY_MODES.find(m => m.id === energyMode);
  const visibleTasks = taskTree.filter(t => t.difficulty <= currentMode.maxDifficulty);

  // -- Handler called by TaskCard when a task is completed --
  const handleTaskComplete = (taskId) => {
    // `new Set(completedIds)` creates a copy (we never mutate state directly)
    const updated = new Set(completedIds);
    updated.add(taskId);
    setCompletedIds(updated);

    // If all VISIBLE tasks are now complete, increment the streak
    const allDone = visibleTasks.every(t => updated.has(t.id));
    if (allDone) {
      setStreakDays(prev => prev + 1);
    }

    // If authenticated and this is a server task, mirror completion to backend.
    if (user && getStoredToken() && dreamId && typeof taskId === 'string') {
      authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      }).catch(() => {
        // keep optimistic UI in prototype mode
      });
    }
  };

  const completedCount = visibleTasks.filter(t => completedIds.has(t.id)).length;
  const progress = visibleTasks.length > 0
    ? Math.round((completedCount / visibleTasks.length) * 100)
    : 0;

  const handleAddTask = async () => {
    const trimmedTitle = newTaskTitle.trim();
    if (!trimmedTitle) return;

    // We generate a stable id from timestamp to avoid collisions in local mode.
    const nextTask = {
      id: Date.now(),
      title: trimmedTitle,
      category: newTaskCategory.trim() || 'General',
      difficulty: Number(newTaskDifficulty),
      isOffline: Boolean(newTaskOffline),
    };

    setTaskTree((prev) => [nextTask, ...prev]);

    if (user && getStoredToken() && dreamId) {
      try {
        const response = await authFetch(`/api/dreams/${dreamId}/tasks`, {
          method: 'POST',
          body: JSON.stringify({
            title: trimmedTitle,
            category: nextTask.category,
            difficulty: nextTask.difficulty,
            isOffline: nextTask.isOffline,
          }),
        });

        if (response.ok) {
          const created = await response.json();
          setTaskTree((prev) => prev.map((task) => (
            task.id === nextTask.id
              ? {
                  ...task,
                  id: created._id,
                }
              : task
          )));
        }
      } catch {
        // keep local task if API write fails
      }
    }

    setNewTaskTitle('');
  };

  return (
    <div style={{ paddingBottom: '48px' }}>

      {/* ── DREAM HEADER ─────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
          Your current dream
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px' }}>
          {dreamName}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {completedCount} of {visibleTasks.length} tasks done today
        </p>

        {/* Daily progress bar */}
        <div style={{
          marginTop: '12px',
          height: '6px',
          backgroundColor: 'var(--border-color)',
          borderRadius: '99px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: 'var(--accent-primary)',
            borderRadius: '99px',
            transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </div>

      {/* ── DREAM + TASK BUILDER ─────────────────────────────── */}
      <div className="card" style={{ marginBottom: '20px', display: 'grid', gap: '10px' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Update dream and add micro-tasks. (Everything saves locally via IndexedDB.)
        </p>

        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} htmlFor="dreamNameInput">
            Dream title
          </label>
          <input
            id="dreamNameInput"
            value={dreamName}
            onChange={(e) => setDreamName(e.target.value)}
            placeholder="e.g. Launch my first indie product 🚀"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: '8px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} htmlFor="newTaskTitleInput">
            New micro-task
          </label>
          <input
            id="newTaskTitleInput"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="e.g. Draft hero section copy"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            placeholder="Category"
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          />
          <select
            value={newTaskDifficulty}
            onChange={(e) => setNewTaskDifficulty(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
          >
            <option value={1}>Difficulty 1 (easy)</option>
            <option value={2}>Difficulty 2 (medium)</option>
            <option value={3}>Difficulty 3 (hard)</option>
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={newTaskOffline}
            onChange={(e) => setNewTaskOffline(e.target.checked)}
          />
          Can be done offline
        </label>

        <button
          onClick={handleAddTask}
          style={{
            justifySelf: 'start',
            padding: '8px 14px',
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--bg-primary)',
            fontWeight: '700',
          }}
        >
          + Add task
        </button>
      </div>

      {/* ── ENERGY MODE SELECTOR ──────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
          How much energy do you have right now?
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {ENERGY_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => setEnergyMode(mode.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: '600',
                border: energyMode === mode.id
                  ? '1.5px solid var(--accent-primary)'
                  : '1.5px solid var(--border-color)',
                backgroundColor: energyMode === mode.id
                  ? 'color-mix(in srgb, var(--accent-primary) 15%, var(--bg-secondary))'
                  : 'var(--bg-secondary)',
                color: energyMode === mode.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                lineHeight: 1.3,
              }}
            >
              <div>{mode.label}</div>
              <div style={{ fontWeight: '400', fontSize: '0.72rem', marginTop: '2px' }}>
                {mode.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── MICRO-TASK LIST ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {visibleTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '2rem' }}>🌙</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>
              Survival mode is on. Just rest. You showed up.
            </p>
          </div>
        ) : (
          visibleTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              energyMode={energyMode}
              onComplete={handleTaskComplete}
            />
          ))
        )}
      </div>

      {/* ── GROWING GARDEN STREAK ─────────────────────────── */}
      <div className="card">
        <GardenStreak
          streakDays={streakDays}
          dreamName={dreamName}
        />
      </div>

    </div>
  );
};

export default Dashboard;
