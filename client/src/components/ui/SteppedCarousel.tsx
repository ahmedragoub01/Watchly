import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SteppedCarouselProps = {
  children: ReactNode;
  autoplay?: boolean;
  autoplayMs?: number;
  itemWidth?: number;
  onReachEnd?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

const DRAG_THRESHOLD = 20; // Increased to prevent false-positives when scrolling vertically

function measureStep(viewport: HTMLElement) {
  const track = viewport.firstElementChild as HTMLElement | null;
  const first = track?.firstElementChild as HTMLElement | null;
  if (!track || !first) return 0;
  const gap = Number.parseFloat(getComputedStyle(track).columnGap || '0') || 0;
  return first.getBoundingClientRect().width + gap;
}

export function SteppedCarousel({
  children,
  autoplay = true,
  autoplayMs = 2200,
  itemWidth = 160,
  onReachEnd,
  hasMore = false,
  loadingMore = false,
}: SteppedCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    captured: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    pointerId: -1,
  });
  const hoverRef = useRef(false);
  const visibleRef = useRef(true);
  const pausedUntilRef = useRef(0);
  const inertiaRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const [edges, setEdges] = useState({ prev: false, next: true });

  const onReachEndRef = useRef(onReachEnd);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(loadingMore);
  onReachEndRef.current = onReachEnd;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;

  const items = Children.toArray(children);
  const count = items.length;

  const pause = useCallback((ms = 4000) => {
    pausedUntilRef.current = Date.now() + ms;
  }, []);

  const checkEnd = useCallback(() => {
    const el = viewportRef.current;
    if (!el || !onReachEndRef.current) return;
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
    if (remaining < el.clientWidth * 1.2) onReachEndRef.current();
  }, []);

  const updateEdges = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const prev = el.scrollLeft > 4;
    const next = el.scrollLeft < el.scrollWidth - el.clientWidth - 4 || hasMoreRef.current;
    setEdges(e => (e.prev === prev && e.next === next ? e : { prev, next }));
    checkEnd();
  }, [checkEnd]);

  const onScroll = useCallback(() => {
    if (scrollRafRef.current != null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      updateEdges();
    });
  }, [updateEdges]);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [count, loadingMore, hasMore, updateEdges]);

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = viewportRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.3 },
    );
    io.observe(el);

    const id = window.setInterval(() => {
      if (
        !visibleRef.current ||
        document.hidden ||
        hoverRef.current ||
        drag.current.active ||
        Date.now() < pausedUntilRef.current
      ) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 8) return;
      const step = measureStep(el);
      if (!step) return;
      const next = el.scrollLeft + step;
      if (next >= max - 8) {
        if (hasMoreRef.current) return;
        el.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      el.scrollTo({ left: next, behavior: 'smooth' });
    }, autoplayMs);

    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, [autoplay, autoplayMs, count]);

  useEffect(() => () => {
    if (inertiaRef.current != null) cancelAnimationFrame(inertiaRef.current);
    if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = viewportRef.current;
    if (!el) return;
    if (inertiaRef.current != null) {
      cancelAnimationFrame(inertiaRef.current);
      inertiaRef.current = null;
    }
    const d = drag.current;
    d.active = true;
    d.captured = false;
    d.moved = false;
    d.startX = e.clientX;
    d.startScroll = el.scrollLeft;
    d.lastX = e.clientX;
    d.lastT = performance.now();
    d.velocity = 0;
    d.pointerId = e.pointerId;
    pause();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewportRef.current;
    const d = drag.current;
    if (!el || !d.active) return;

    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
      d.moved = true;
      el.setPointerCapture(d.pointerId);
      d.captured = true;
      el.classList.add('is-grabbing');
    }
    if (!d.moved) return;

    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.velocity = 0.8 * ((e.clientX - d.lastX) / dt) + 0.2 * d.velocity;
    d.lastX = e.clientX;
    d.lastT = now;
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = () => {
    const el = viewportRef.current;
    const d = drag.current;
    if (!el || !d.active) return;
    d.active = false;
    if (d.captured && el.hasPointerCapture(d.pointerId)) el.releasePointerCapture(d.pointerId);
    pause();

    if (!d.moved) return;

    let v = performance.now() - d.lastT > 80 ? 0 : d.velocity;
    const glide = () => {
      v *= 0.94;
      if (Math.abs(v) < 0.03) {
        inertiaRef.current = null;
        el.classList.remove('is-grabbing');
        return;
      }
      el.scrollLeft -= v * 16;
      inertiaRef.current = requestAnimationFrame(glide);
    };
    inertiaRef.current = requestAnimationFrame(glide);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drag.current.moved) return;
    e.preventDefault();
    e.stopPropagation();
    drag.current.moved = false;
  };

  const scrollPage = (dir: 1 | -1) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
    pause(6000);
  };

  return (
    <div className="carousel" style={{ '--card-w': `${itemWidth}px` } as CSSProperties}>
      {edges.prev && (
        <button
          type="button"
          className="carousel-arrow carousel-arrow--prev"
          aria-label="Scroll left"
          onClick={() => scrollPage(-1)}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div
        ref={viewportRef}
        className="stepped-carousel"
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={e => { if (e.pointerType === 'mouse') hoverRef.current = true; }}
        onPointerLeave={e => { if (e.pointerType === 'mouse') hoverRef.current = false; }}
        onClickCapture={onClickCapture}
        onDragStart={e => e.preventDefault()}
        onTouchStart={() => pause(5000)}
        onWheel={() => pause()}
      >
        <div className="stepped-carousel-track">
          {items.map((child, i) => (
            <div key={isValidElement(child) && child.key != null ? child.key : i} className="stepped-carousel-item">
              {child}
            </div>
          ))}
          {loadingMore && (
            <>
              <div className="stepped-carousel-item" aria-hidden="true"><div className="show-card-skeleton" /></div>
              <div className="stepped-carousel-item" aria-hidden="true"><div className="show-card-skeleton" /></div>
              <div className="stepped-carousel-item" aria-hidden="true"><div className="show-card-skeleton" /></div>
            </>
          )}
        </div>
      </div>

      {edges.next && (
        <button
          type="button"
          className="carousel-arrow carousel-arrow--next"
          aria-label="Scroll right"
          onClick={() => scrollPage(1)}
        >
          <ChevronRight size={22} />
        </button>
      )}
    </div>
  );
}