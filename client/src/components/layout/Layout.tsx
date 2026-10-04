import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { FadeIn } from '../ui/motion';

export function Layout({ children, disablePadding = false }: { children: ReactNode, disablePadding?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'transparent', position: 'relative' }}>
      {/* Aurora Background Elements — subtle ambient glow for depth */}
      <div className="aurora-bg" />
      <div className="aurora-orb-1" />
      <div className="aurora-orb-2" />

      <Navbar />
      <FadeIn className={disablePadding ? 'layout-content layout-content--flush' : 'layout-content'} style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        maxWidth: disablePadding ? 'none' : '1600px',
        margin: disablePadding ? 0 : '0 auto',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        {children}
      </FadeIn>
    </div>
  );
}
