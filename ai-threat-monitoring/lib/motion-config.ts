// Framer Motion & GSAP easing configurations with Sentinel AI alert aesthetic
export const easeTransition = [0.16, 1, 0.3, 1] as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeTransition } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const pulseAlert = {
  scale: [1, 1.04, 1],
  boxShadow: [
    '0 0 0 0 rgba(215, 0, 24, 0.4)',
    '0 0 0 14px rgba(215, 0, 24, 0)',
    '0 0 0 0 rgba(215, 0, 24, 0)',
  ],
  transition: {
    repeat: Infinity,
    duration: 1.5,
    ease: 'easeInOut',
  },
};

export const gaugeNeedleSpring = {
  type: 'spring',
  damping: 18,
  stiffness: 120,
};
