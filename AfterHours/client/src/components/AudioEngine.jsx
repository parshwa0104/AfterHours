/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: AudioEngine.jsx — Side-Effect Bridge Component
=============================================================================
*
* WHAT THIS COMPONENT DOES:
* AudioEngine renders no UI. It is a "controller component" that translates
* app state (`isActive`) into side effects (`startAudio` / `stopAudio`).
*
* WHY THIS PATTERN MATTERS:
* - Keeps Web Audio logic encapsulated in a hook.
* - Keeps route/page components focused on presentation.
* - Centralizes "when should audio run?" in one small place.
*
* KEY CONCEPTS:
* 1) EFFECT-DRIVEN IMPERATIVE ACTIONS:
*    `useEffect` reacts to `isActive` changes and calls imperative methods.
*
* 2) OPTIONAL CALLBACKS:
*    `onAudioStateChange?.(true/false)` safely notifies parent state only if
*    a callback prop was provided.
*
* 3) NON-VISUAL COMPONENT:
*    Returning `null` is valid React. Components can exist purely to manage
*    behavior and side effects.
*
=============================================================================
*/

import { useEffect } from 'react';
import useAudioEngine from '../hooks/useAudioEngine';

const AudioEngine = ({ isActive, onAudioStateChange }) => {
  const { startAudio, stopAudio } = useAudioEngine();

  useEffect(() => {
    if (isActive) {
      startAudio();
      onAudioStateChange?.(true);
      return;
    }

    stopAudio();
    onAudioStateChange?.(false);
  }, [isActive, onAudioStateChange, startAudio, stopAudio]);

  return null;
};

export default AudioEngine;
