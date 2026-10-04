import { REACTION_EMOJIS } from '@watchly/shared';
import type { ReactionReceivedEvent } from '@watchly/shared';

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  recentReactions: ReactionReceivedEvent[];
}

export function ReactionBar({ onReact, recentReactions }: ReactionBarProps) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        gap: '4px',
        justifyContent: 'center',
        padding: '8px 0',
      }}>
        {REACTION_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={(e) => {
              // Brief "press" animation for tactile feedback
              e.currentTarget.style.transform = 'scale(0.8)';
              setTimeout(() => {
                if (e.currentTarget) e.currentTarget.style.transform = 'scale(1)';
              }, 120);
              onReact(emoji);
            }}
            style={{
              fontSize: '1.4rem',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-surface-hover)';
              e.currentTarget.style.transform = 'scale(1.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        height: '300px',
      }}>
        {recentReactions.map((r, i) => {
          const drift = (Math.random() - 0.5) * 60;
          const duration = 2 + Math.random() * 0.5;

          return (
            <span
              key={`${r.senderSessionId}-${r.videoTimestamp}-${i}`}
              style={{
                position: 'absolute',
                bottom: 0,
                left: `calc(50% + ${(Math.random() - 0.5) * 40}px)`,
                fontSize: '1.8rem',
                ['--drift' as any]: `${drift}px`,
                animation: `meetReactionFloat ${duration}s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
            >
              {r.emoji}
            </span>
          );
        })}
      </div>
    </div>
  );
}