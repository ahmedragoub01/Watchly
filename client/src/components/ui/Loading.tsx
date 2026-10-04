type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<SpinnerSize, string> = {
  sm: '20px',
  md: '32px',
  lg: '44px',
  xl: '64px',
};

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Spinner({ size = 'md', color, className = '', style }: SpinnerProps) {
  const pxSize = SIZE_MAP[size];
  return (
    <svg
      className={`spinner ${className}`}
      viewBox="0 0 50 50"
      style={{
        ['--spinner-size' as any]: pxSize,
        ...(color ? { ['--spinner-color' as any]: color } : {}),
        ...style,
      }}
    >
      <circle
        className="spinner-circle"
        cx="25"
        cy="25"
        r="20"
      />
    </svg>
  );
}

interface LoadingDotsProps {
  className?: string;
  style?: React.CSSProperties;
}

export function LoadingDots({ className = '', style }: LoadingDotsProps) {
  return (
    <span className={`loading-dots ${className}`} style={style}>
      <span />
      <span />
      <span />
    </span>
  );
}

interface LoadingCenterProps {
  size?: SpinnerSize;
  text?: string;
  variant?: 'spinner' | 'bar' | 'dots';
  style?: React.CSSProperties;
  className?: string;
}

export function LoadingCenter({
  size = 'lg',
  text = 'Loading',
  variant = 'spinner',
  style,
  className = '',
}: LoadingCenterProps) {
  return (
    <div className={`loading-center ${className}`} style={{ flex: 1, ...style }}>
      {variant === 'spinner' && <Spinner size={size} />}
      {variant === 'bar' && <div className="loading-bar" />}
      {variant === 'dots' && <LoadingDots />}
      {text && <div className="loading-center-text">{text}</div>}
    </div>
  );
}
