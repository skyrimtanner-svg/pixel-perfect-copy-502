import { useCallback, useRef, useEffect } from 'react';

/**
 * useSpecularHighlight — GPU-accelerated mouse-tracking light refraction effect.
 * 
 * Attaches a radial gradient "specular spot" to an element that follows
 * the cursor, simulating real light hitting a glass surface.
 * 
 * Uses CSS custom properties + will-change for 60fps performance.
 * Automatically disables when prefers-reduced-motion is set.
 * 
 * @param options.intensity  Opacity of the highlight (0–1, default 0.07)
 * @param options.radius     Size of the radial gradient in px (default 280)
 * @param options.color      HSL base color (default gold: '43, 96%, 56%')
 */
interface SpecularOptions {
  intensity?: number;
  radius?: number;
  color?: string;
}

export function useSpecularHighlight<T extends HTMLElement = HTMLDivElement>(
  options: SpecularOptions = {}
) {
  const { intensity = 0.07, radius = 280, color = '43, 96%, 56%' } = options;
  const ref = useRef<T>(null);
  const rafRef = useRef<number>(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches && ref.current) {
        ref.current.style.removeProperty('--specular-x');
        ref.current.style.removeProperty('--specular-y');
        ref.current.style.removeProperty('--specular-opacity');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (prefersReducedMotion.current || !ref.current) return;
    
    // Cancel previous frame for throttling
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ref.current.style.setProperty('--specular-x', `${x}px`);
      ref.current.style.setProperty('--specular-y', `${y}px`);
      ref.current.style.setProperty('--specular-opacity', `${intensity}`);
    });
  }, [intensity]);

  const onMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (ref.current) {
      ref.current.style.setProperty('--specular-opacity', '0');
    }
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const specularStyle: React.CSSProperties = {
    '--specular-x': '50%',
    '--specular-y': '50%',
    '--specular-opacity': '0',
    '--specular-radius': `${radius}px`,
    '--specular-color': color,
  } as React.CSSProperties;

  return {
    ref,
    specularProps: {
      onMouseMove,
      onMouseLeave,
      style: specularStyle,
    },
  };
}
