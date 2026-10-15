import React, { useEffect, useState } from 'react';
import { Cpu, Sparkles } from 'lucide-react';
import appLogo from '../assets/icon.png';

interface SplashScreenProps {
  isLoading: boolean;
  fileCount?: number;
}

export default function SplashScreen({ isLoading, fileCount = 0 }: SplashScreenProps): React.JSX.Element | null {
  const [shouldRender, setShouldRender] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>('Initializing studio engine...');
  const [progress, setProgress] = useState<number>(20);

  useEffect(() => {
    // Stage 1: Starting headless Chromium rasterizer
    const t1 = setTimeout(() => {
      setStatusText('Starting headless Chromium rasterizer...');
      setProgress(40);
    }, 200);

    // Stage 2: Chromium pre-warmed & ready
    const t2 = setTimeout(() => {
      setStatusText('Headless Chromium warm & ready');
      setProgress(75);
    }, 600);

    // Stage 3: Vector assets loaded
    const t3 = setTimeout(() => {
      setStatusText(fileCount > 0 ? `Loaded ${fileCount} vector assets` : 'Workspace ready');
      setProgress(95);
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [fileCount]);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      setStatusText('Ready');
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 450); // Matches transition duration
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
    }
  }, [isLoading]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`splash-overlay ${!isLoading ? 'splash-exit' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#09090b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitAppRegion: 'drag' as any,
        transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isLoading ? 1 : 0,
        transform: isLoading ? 'scale(1)' : 'scale(1.02)',
        pointerEvents: isLoading ? 'all' : 'none'
      }}
    >
      {/* Background Ambient Radial Glow */}
      <div 
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(56, 189, 248, 0.05) 45%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Branding Card */}
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 16,
          maxWidth: 360,
          padding: '24px 20px'
        }}
      >
        {/* Animated App Icon */}
        <div 
          style={{
            position: 'relative',
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4
          }}
        >
          {/* Subtle Outer Pulse Ring */}
          <div 
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(56, 189, 248, 0.3))',
              filter: 'blur(8px)',
              animation: 'pulse 2.5s ease-in-out infinite'
            }}
          />
          <img 
            src={appLogo} 
            alt="AnySVG" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: 20,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(168, 85, 247, 0.25)',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>

        {/* Title & Badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.5px',
                margin: 0,
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              AnySVG
            </h1>
            <span 
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 9999,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e4e4e7',
                fontFamily: 'monospace'
              }}
            >
              Studio v1.0
            </span>
          </div>

          <p 
            style={{
              fontSize: 12,
              color: '#a1a1aa',
              margin: 0,
              lineHeight: 1.4,
              letterSpacing: '0.1px'
            }}
          >
            Studio-Grade Vector Rasterization & Optimization
          </p>
        </div>

        {/* Progress Bar & Live Status */}
        <div 
          style={{
            width: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginTop: 8
          }}
        >
          {/* Progress Bar Track */}
          <div 
            style={{
              width: '100%',
              height: 4,
              borderRadius: 9999,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div 
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #a855f7 0%, #38bdf8 100%)',
                borderRadius: 9999,
                transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
              }}
            />
          </div>

          {/* Status Text with Spinner */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: '#71717a',
              fontFamily: 'monospace'
            }}
          >
            <Sparkles size={11} style={{ color: '#a855f7' }} />
            <span>{statusText}</span>
          </div>
        </div>
      </div>

      {/* Footer Specs Pill */}
      <div 
        style={{
          position: 'absolute',
          bottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 10,
          color: '#52525b',
          fontFamily: 'monospace'
        }}
      >
        <Cpu size={11} />
        <span>Hardware-Accelerated Engine • Electron & Sharp</span>
      </div>
    </div>
  );
}
