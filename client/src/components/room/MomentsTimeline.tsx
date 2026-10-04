import { useState } from 'react';
import type { Reaction, Moment, ReactionEmoji } from '@watchly/shared';

interface MomentsTimelineProps {
  reactions: Reaction[];
  duration: number;
  onSeek?: (time: number) => void;
}

function detectMoments(reactions: Reaction[], bucketSize: number = 10): Moment[] {
  if (reactions.length === 0) return [];

  const buckets = new Map<number, Reaction[]>();
  for (const r of reactions) {
    const key = Math.floor(r.videoTimestamp / bucketSize) * bucketSize;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r);
  }

  const maxDensity = Math.max(...Array.from(buckets.values()).map(b => b.length));
  if (maxDensity === 0) return [];

  const moments: Moment[] = [];
  for (const [startTime, rxns] of buckets) {
    const emojiCount = new Map<string, number>();
    const participants = new Set<string>();

    for (const r of rxns) {
      emojiCount.set(r.emoji, (emojiCount.get(r.emoji) || 0) + 1);
      participants.add(r.senderName);
    }

    let peakEmoji = rxns[0].emoji;
    let peakCount = 0;
    for (const [emoji, count] of emojiCount) {
      if (count > peakCount) {
        peakEmoji = emoji as ReactionEmoji;
        peakCount = count;
      }
    }

    moments.push({
      startTime,
      endTime: startTime + bucketSize,
      reactions: rxns,
      intensity: rxns.length / maxDensity,
      peakEmoji,
      participants: Array.from(participants),
    });
  }

  return moments.sort((a, b) => a.startTime - b.startTime);
}

export function MomentsTimeline({ reactions, duration, onSeek }: MomentsTimelineProps) {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const moments = detectMoments(reactions);

  return (
    <div style={{ width: '100%' }}>
      {/* Section label so users know this feature exists */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--color-text-muted)',
        marginBottom: '4px',
        padding: '0 2px',
      }}>
        <span>🔥</span>
        <span>Moments</span>
        {moments.length > 0 && (
          <span style={{ opacity: 0.6 }}>· {moments.length}</span>
        )}
      </div>

      {duration <= 0 ? (
        /* Placeholder when player hasn't loaded duration yet */
        <div style={{
          width: '100%',
          height: '36px',
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          opacity: 0.6,
        }}>
          Moments will appear as people react
        </div>
      ) : (
      <div
        style={{
          width: '100%',
          height: '36px',
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-sm)',
          position: 'relative',
          overflow: 'visible',
          cursor: onSeek ? 'pointer' : 'default',
      }}
      onClick={e => {
        if (!onSeek) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        onSeek(ratio * duration);
      }}
      onMouseLeave={() => setActiveTooltip(null)}
    >
      {moments.map((m, i) => {
        const left = (m.startTime / duration) * 100;
        const width = Math.max(((m.endTime - m.startTime) / duration) * 100, 0.5);

        return (
          <div
            key={i}
            role="button"
            aria-label={`${m.peakEmoji} ${m.reactions.length} reactions from ${m.participants.join(', ')}`}
            style={{
              position: 'absolute',
              left: `${left}%`,
              width: `${width}%`,
              bottom: 0,
              height: `${Math.max(m.intensity * 100, 15)}%`,
              background: m.intensity > 0.7
                ? 'var(--color-primary)'
                : m.intensity > 0.4
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
              opacity: activeTooltip === i ? '1' : String(0.7 + m.intensity * 0.3),
              transition: 'opacity var(--transition-fast)',
            }}
            onMouseEnter={() => setActiveTooltip(i)}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTooltip(i);
            }}
          >
            {activeTooltip === i && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                background: 'var(--color-bg-elevated)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-md)',
                zIndex: 50,
                pointerEvents: 'none',
              }}>
                {m.peakEmoji} {m.reactions.length} reactions from {m.participants.join(', ')}
              </div>
            )}
          </div>
        );
      })}
    </div>
      )}
    </div>
  );
}