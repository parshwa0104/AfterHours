/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: useHeadphones.js — Custom React Hook
=============================================================================
*
* WHAT IS A CUSTOM HOOK?
* In React, a "hook" is a function that lets you tap into React's state
* and lifecycle features (useState, useEffect, etc.) from a reusable place.
* Any function that starts with "use" and calls other hooks is a custom hook.
*
* WHAT THIS HOOK DOES:
* It taps into a browser API called `navigator.mediaDevices`.
* The browser lets you listen to a special event called `devicechange`.
* This fires whenever a user plugs in OR unplugs a headset, speaker, or mic.
*
* HOW WE DISTINGUISH HEADPHONES:
* We call `navigator.mediaDevices.enumerateDevices()` which returns the 
* ENTIRE list of audio/video devices the browser knows about.
* We then count how many `audiooutput` devices exist. If the count GOES UP 
* after a devicechange event, a new audio output (likely headphones) has 
* been plugged in.
*
* WHY A CUSTOM HOOK?
* We could jam all this logic inside App.jsx, but pulling it into its own 
* file means we never have to think about it again. Any component in the 
* whole app can just call `useHeadphones()` to know if headphones are 
* connected. That's the "reusable" power of hooks.
*
=============================================================================
*/

import { useState, useEffect, useRef } from 'react';

const useHeadphones = () => {
  // `headphonesConnected` tracks the current state (yes/no)
  const [headphonesConnected, setHeadphonesConnected] = useState(false);

  // `justConnected` is a one-shot signal—it's true only the moment 
  // headphones are plugged in, so we can show the "Enter the Zone?" prompt.
  const [justConnected, setJustConnected] = useState(false);

  // We store the previous audio output count in a ref.
  // A "ref" is like a variable that React DOES NOT re-render the page for
  // when it changes. Perfect for comparisons in effects.
  const prevAudioOutputCount = useRef(0);

  useEffect(() => {
    // -- STEP 1: Helper to count audio output devices --
    const getAudioOutputCount = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        // Filter the full device list to only audio output devices (speakers, headphones)
        return devices.filter(device => device.kind === 'audiooutput').length;
      } catch {
        // If the browser doesn't support this API, fail silently.
        return 0;
      }
    };

    // -- STEP 2: Initialize the baseline count on first render --
    const init = async () => {
      const count = await getAudioOutputCount();
      prevAudioOutputCount.current = count;
      // If headphones are already plugged in when the app loads,
      // we should set the connected state to true immediately.
      setHeadphonesConnected(count > 1); // >1 because built-in speaker is always device #1
    };
    init();

    // -- STEP 3: The Watcher — fires on every device change --
    const handleDeviceChange = async () => {
      const newCount = await getAudioOutputCount();
      const oldCount = prevAudioOutputCount.current;

      if (newCount > oldCount) {
        // Count went UP → something was plugged in!
        setHeadphonesConnected(true);
        setJustConnected(true); // Fire the one-shot "Enter the Zone?" signal
      } else if (newCount < oldCount) {
        // Count went DOWN → headphones were unplugged.
        setHeadphonesConnected(false);
        setJustConnected(false);
      }

      // Update our baseline for the next comparison
      prevAudioOutputCount.current = newCount;
    };

    // -- STEP 4: Attach the listener --
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    // -- STEP 5: Cleanup (CRITICAL) --
    // When the component using this hook unmounts (leaves the screen),
    // we MUST remove the event listener. If we don't, it leaks memory 
    // because the browser keeps calling `handleDeviceChange` even after 
    // the component is gone.
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, []); // Empty array = run this effect only once on mount.

  // Expose these two values to any component that calls this hook.
  return { headphonesConnected, justConnected, setJustConnected };
};

export default useHeadphones;
