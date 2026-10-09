/** JS mirror of the motion tokens in styles/tokens.css. */
export const ease = {
  outSoft: [0.2, 0.8, 0.2, 1],
  inSoft: [0.4, 0, 1, 1],
}

export const duration = { enter: 0.28, exit: 0.18, fast: 0.16 }

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 },
  soft: { type: 'spring', stiffness: 260, damping: 26 },
  bouncy: { type: 'spring', stiffness: 600, damping: 14 },
}

export const STAGGER = 0.04
