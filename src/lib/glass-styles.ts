/**
 * ═══ DEEP-SPACE OBSERVATORY GLASSMORPHISM SYSTEM ═══
 * 
 * Shared style constants for premium multi-layer glass panels.
 * Every card, modal, and panel should use these for visual consistency.
 */

import { CSSProperties } from 'react';

/* ── Core frost backgrounds ── */
const FROST_DARK = 'rgba(8, 10, 28, 0.82)';
const FROST_MEDIUM = 'rgba(10, 13, 32, 0.78)';
export const FROST_LIGHT = 'rgba(14, 17, 38, 0.72)';

/* ── Specular & chrome edge colors ── */
const SPECULAR_TOP = 'hsla(220, 16%, 95%, 0.09)';
const SPECULAR_TOP_STRONG = 'hsla(220, 16%, 95%, 0.14)';
const CHROME_EDGE = 'hsla(220, 12%, 70%, 0.16)';
const CHROME_EDGE_SUBTLE = 'hsla(220, 12%, 70%, 0.1)';
const DEPTH_SHADOW = 'hsla(232, 30%, 2%, 0.55)';
const OUTER_SHADOW = '0 8px 36px -8px hsla(232, 30%, 2%, 0.75)';
const OUTER_SHADOW_DEEP = '0 12px 48px -8px hsla(232, 30%, 2%, 0.85)';

/* ── Gold accents ── */
const GOLD_BORDER = 'hsla(43, 96%, 56%, 0.3)';
const GOLD_SPECULAR = 'hsla(48, 100%, 80%, 0.14)';
const GOLD_OUTER_GLOW = '0 0 52px -12px hsla(43, 96%, 56%, 0.2)';

/**
 * Standard glass panel — the workhorse for cards, sections, containers.
 * Heavy blur, dark frost, chrome bevel, specular top edge.
 */
export const glassPanel: CSSProperties = {
  background: `linear-gradient(168deg, ${FROST_MEDIUM}, ${FROST_DARK})`,
  border: `1px solid ${CHROME_EDGE}`,
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  boxShadow: [
    `inset 0 1px 0 ${SPECULAR_TOP}`,
    `inset 0 -1px 0 ${DEPTH_SHADOW}`,
    OUTER_SHADOW,
    '0 2px 6px hsla(232, 30%, 2%, 0.45)',
  ].join(', '),
};

/**
 * Strong glass panel — extra heavy for modals, overlays, hero cards.
 * Deeper blur, stronger specular, more dramatic shadows.
 */
export const glassPanelStrong: CSSProperties = {
  background: `linear-gradient(168deg, rgba(10, 13, 32, 0.92), ${FROST_DARK})`,
  border: `1px solid ${CHROME_EDGE}`,
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  boxShadow: [
    `inset 0 1px 0 ${SPECULAR_TOP_STRONG}`,
    `inset 0 -1px 0 ${DEPTH_SHADOW}`,
    OUTER_SHADOW_DEEP,
    '0 2px 8px hsla(232, 30%, 2%, 0.5)',
  ].join(', '),
};

/**
 * Gold-accented glass panel — for hero/top-ranked items, Brier score, etc.
 * Gold border, gold specular top edge, warm outer glow.
 */
export const glassPanelGold: CSSProperties = {
  background: `linear-gradient(155deg, hsla(43, 40%, 10%, 0.78), ${FROST_DARK})`,
  border: `1px solid ${GOLD_BORDER}`,
  backdropFilter: 'blur(36px)',
  WebkitBackdropFilter: 'blur(36px)',
  boxShadow: [
    `inset 0 1px 0 ${GOLD_SPECULAR}`,
    `inset 0 -1px 0 ${DEPTH_SHADOW}`,
    GOLD_OUTER_GLOW,
    OUTER_SHADOW,
    '0 2px 6px hsla(232, 30%, 2%, 0.45)',
  ].join(', '),
};

/**
 * Chrome-accented glass panel — for secondary/analyst-mode elements.
 */
export const glassPanelChrome: CSSProperties = {
  background: `linear-gradient(168deg, rgba(12, 15, 34, 0.85), ${FROST_DARK})`,
  border: `1px solid ${CHROME_EDGE}`,
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  boxShadow: [
    `inset 0 1px 0 ${SPECULAR_TOP}`,
    `inset 0 -1px 0 ${DEPTH_SHADOW}`,
    OUTER_SHADOW,
    '0 1px 4px hsla(232, 30%, 2%, 0.4)',
  ].join(', '),
};

/**
 * Subtle inner glass — for nested elements inside glass panels.
 * Lighter treatment to avoid double-glass visual conflict.
 */
export const glassInner: CSSProperties = {
  background: `linear-gradient(168deg, rgba(14, 17, 38, 0.6), rgba(10, 13, 32, 0.5))`,
  border: `1px solid ${CHROME_EDGE_SUBTLE}`,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: [
    `inset 0 1px 0 hsla(220, 16%, 95%, 0.05)`,
    `inset 0 -1px 0 hsla(232, 30%, 2%, 0.35)`,
    '0 2px 8px -4px hsla(232, 30%, 2%, 0.4)',
  ].join(', '),
};

/**
 * Specular reflection overlay style — apply to a pseudo-element div
 * positioned at the top of the glass panel for a polished sheen.
 */
export const specularReflection: CSSProperties = {
  background: 'linear-gradient(180deg, hsla(220, 16%, 95%, 0.06) 0%, transparent 100%)',
  pointerEvents: 'none',
};

/**
 * Gold chrome top-line — horizontal accent line at top of panels.
 */
export const goldChromeLine: CSSProperties = {
  background: 'linear-gradient(90deg, transparent, hsla(43, 96%, 56%, 0.2), hsla(220, 14%, 88%, 0.1), hsla(43, 96%, 56%, 0.2), transparent)',
};

/**
 * Chrome top-line — subtle metallic accent for chrome-themed panels.
 */
export const chromeTopLine: CSSProperties = {
  background: 'linear-gradient(90deg, transparent, hsla(220, 14%, 88%, 0.1), transparent)',
};
