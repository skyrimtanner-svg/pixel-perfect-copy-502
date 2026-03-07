import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHysteresis } from '@/hooks/useHysteresis';

describe('useHysteresis', () => {
  it('starts with zero consecutive drops and no demotion', () => {
    const { result } = renderHook(() => useHysteresis());
    expect(result.current.consecutiveDrops).toBe(0);
    expect(result.current.shouldDemote).toBe(false);
    expect(result.current.demotedArchetype).toBeNull();
  });

  it('increments consecutive drops when posterior < prior', () => {
    const { result } = renderHook(() => useHysteresis());
    act(() => result.current.recordUpdate(0.4, 0.5, 'breakthrough'));
    expect(result.current.consecutiveDrops).toBe(1);
    expect(result.current.shouldDemote).toBe(false);
  });

  it('resets consecutive drops when posterior >= prior', () => {
    const { result } = renderHook(() => useHysteresis());
    act(() => result.current.recordUpdate(0.4, 0.5, 'breakthrough'));
    act(() => result.current.recordUpdate(0.3, 0.4, 'breakthrough'));
    expect(result.current.consecutiveDrops).toBe(2);
    act(() => result.current.recordUpdate(0.6, 0.5, 'breakthrough'));
    expect(result.current.consecutiveDrops).toBe(0);
  });

  it('triggers demotion after 3 consecutive drops', () => {
    const { result } = renderHook(() => useHysteresis());
    act(() => result.current.recordUpdate(0.4, 0.5, 'breakthrough'));
    act(() => result.current.recordUpdate(0.3, 0.4, 'breakthrough'));
    act(() => result.current.recordUpdate(0.2, 0.3, 'breakthrough'));
    expect(result.current.shouldDemote).toBe(true);
    expect(result.current.demotedArchetype).toBe('bottleneck');
    expect(result.current.originalArchetype).toBe('breakthrough');
  });

  it('demotes all known archetypes to bottleneck', () => {
    const archetypes = ['breakthrough', 'convergence', 'sleeper', 'wildcard', 'anchor'];
    for (const arch of archetypes) {
      const { result } = renderHook(() => useHysteresis());
      act(() => result.current.recordUpdate(0.4, 0.5, arch));
      act(() => result.current.recordUpdate(0.3, 0.4, arch));
      act(() => result.current.recordUpdate(0.2, 0.3, arch));
      expect(result.current.demotedArchetype).toBe('bottleneck');
    }
  });

  it('reset clears all state', () => {
    const { result } = renderHook(() => useHysteresis());
    act(() => result.current.recordUpdate(0.4, 0.5, 'breakthrough'));
    act(() => result.current.recordUpdate(0.3, 0.4, 'breakthrough'));
    act(() => result.current.reset());
    expect(result.current.consecutiveDrops).toBe(0);
    expect(result.current.shouldDemote).toBe(false);
    expect(result.current.demotedArchetype).toBeNull();
  });
});
