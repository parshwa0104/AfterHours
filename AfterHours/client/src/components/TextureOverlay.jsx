/* 
=============================================================================
* EDUCATIONAL WALKTHROUGH: SVG NOISE TEXTURE
=============================================================================
* 
* AESTHETIC GOAL: We want the screen to look like "physical paper" or 
* a canvas, rather than a glowing computer monitor. 
*
* HOW THIS WORKS:
* We are rendering a `<svg>` element that spans the entire screen 
* (using position: fixed).
* 
* Inside the SVG, we use a filter called `<feTurbulence>`. This is a 
* mathematical function natively built into web browsers that generates 
* Perlin Noise (random, organic-looking static).
* 
* By laying this static over our entire app with a very low opacity, 
* we achieve that "tactile, grainy" E-Ink feel without using a heavy 
* image file that would slow down the app.
*
* pointerEvents: "none" is CRITICAL. It ensures you can click *through* 
* the noise layer to interact with the buttons underneath.
=============================================================================
*/
import React from 'react';

const TextureOverlay = () => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', /* Let user clicks pass through to buttons */
        zIndex: 9999, /* Guarantee it stays on top of all other elements */
        opacity: 0.25, /* Kept subtle so it doesn't distract (tweak this!) */
        mixBlendMode: 'multiply' /* Blends the grain dark against the themes */
      }}
    >
      <svg width="100%" height="100%">
        {/* Defines the noise filter */}
        <filter id="noise">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.75" /* Grain density: higher is tighter, lower is cloudy */
            numOctaves="3" 
            stitchTiles="stitch" 
          />
        </filter>
        {/* Applies the filter to a full-screen rectangle */}
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
};

export default TextureOverlay;
