import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';
import React, { forwardRef, useEffect, useState, useRef } from 'react';

// --- Presets ---

export const fadePreset = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' } as any
};

export const slideUpPreset = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } as any
};

export const slideDownPreset = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } as any
};

export const slideLeftPreset = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } as any
};

export const slideRightPreset = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } as any
};

export const scalePreset = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as any
};

export const zoomInPreset = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: 'spring', damping: 20, stiffness: 200 } as any
};

export const zoomOutPreset = {
  initial: { opacity: 0, scale: 1.1 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 },
  transition: { duration: 0.35, ease: 'easeOut' } as any
};

export const dialogPreset = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { type: 'spring', damping: 25, stiffness: 300 } as any
};

export const wobblePreset = {
  initial: { opacity: 0, rotate: -3, scale: 0.95 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 3, scale: 0.95 },
  transition: { type: 'spring', damping: 12, stiffness: 200 } as any
};

export const popPreset = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { type: 'spring', damping: 15, stiffness: 400 } as any
};

// Using scale+opacity instead of filter:blur — blur animation is a major GPU performance killer
export const blurFadePreset = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.3, ease: 'easeOut' } as any
};

// --- Page Transition (wraps route content) ---

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as any
};

// --- Reusable Components ---

type MotionDivProps = HTMLMotionProps<"div">;

/** A wrapper that respects prefers-reduced-motion, falling back to simple fades if needed. */
export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>(({ ...props }, ref) => {
  const prefersReducedMotion = useReducedMotion();
  
  let overrideProps = { ...props };
  if (prefersReducedMotion) {
    if (overrideProps.initial && typeof overrideProps.initial === 'object' && !Array.isArray(overrideProps.initial)) {
      overrideProps.initial = { ...overrideProps.initial, y: 0, x: 0, scale: 1, rotate: 0, filter: 'none' } as any;
    }
    if (overrideProps.animate && typeof overrideProps.animate === 'object' && !Array.isArray(overrideProps.animate)) {
      overrideProps.animate = { ...overrideProps.animate, y: 0, x: 0, scale: 1, rotate: 0, filter: 'none' } as any;
    }
    if (overrideProps.exit && typeof overrideProps.exit === 'object' && !Array.isArray(overrideProps.exit)) {
      overrideProps.exit = { ...overrideProps.exit, y: 0, x: 0, scale: 1, rotate: 0, filter: 'none' } as any;
    }
  }

  return <motion.div ref={ref} {...overrideProps} />;
});
MotionDiv.displayName = 'MotionDiv';

// --- Convenience Wrappers ---

interface AnimWrapperProps { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string; 
  style?: React.CSSProperties;
}

export const FadeIn = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...fadePreset} transition={{ ...fadePreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const SlideUp = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...slideUpPreset} transition={{ ...slideUpPreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const SlideDown = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...slideDownPreset} transition={{ ...slideDownPreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const SlideLeft = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...slideLeftPreset} transition={{ ...slideLeftPreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const SlideRight = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...slideRightPreset} transition={{ ...slideRightPreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const ScaleIn = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...scalePreset} transition={{ ...scalePreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const ZoomIn = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...zoomInPreset} transition={{ ...zoomInPreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const BlurFade = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...blurFadePreset} transition={{ ...blurFadePreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

export const Pop = ({ children, delay = 0, className, style }: AnimWrapperProps) => (
  <MotionDiv {...popPreset} transition={{ ...popPreset.transition, delay }} className={className} style={style}>
    {children}
  </MotionDiv>
);

// --- Stagger ---

export const StaggerContainer = ({ children, className, style, staggerDelay = 0.06 }: AnimWrapperProps & { staggerDelay?: number }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={{
      animate: { transition: { staggerChildren: staggerDelay } }
    }}
    className={className}
    style={style}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => {
  const prefersReducedMotion = useReducedMotion();
  const variants = prefersReducedMotion 
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 12 } };

  return (
    <motion.div variants={variants} transition={slideUpPreset.transition} className={className} style={style}>
      {children}
    </motion.div>
  );
};

// --- Scroll-triggered Animation ---

export function ScrollReveal({ 
  children, 
  delay = 0, 
  direction = 'up',
  className,
  style 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  direction?: 'up' | 'down' | 'left' | 'right' | 'zoom';
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const directionMap = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: -40 },
    right: { x: 40 },
    zoom: { scale: 0.85 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isVisible ? { opacity: 1, y: 0, x: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] } as any}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// --- Animated Typewriter Text ---

export function TypewriterText({ text, delay = 0, speed = 30, className, style }: { 
  text: string; 
  delay?: number; 
  speed?: number; 
  className?: string; 
  style?: React.CSSProperties;
}) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [started, text, speed]);

  return (
    <span className={className} style={style}>
      {displayed}
      {displayed.length < text.length && <span style={{ opacity: 0.7, animation: 'blink 1s step-end infinite' }}>|</span>}
    </span>
  );
}

// --- Animated Counter ---

export function AnimatedCounter({ value, duration = 1.5, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    const startTime = Date.now();
    const frame = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [started, value, duration]);

  return <>{count}</>;
}

// --- Floating / Pulsing Glow ---

export function FloatingGlow({ color = 'rgba(255,255,255,0.05)', size = 400, style }: { color?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      } as any}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        pointerEvents: 'none',
        ...style
      }}
    />
  );
}

export { AnimatePresence, useReducedMotion, motion };
