import React from 'react';

interface WorkspaceBannerProps {
  count: number;
}

export function WorkspaceBanner({ count }: WorkspaceBannerProps): React.JSX.Element | null {
  if (count <= 0) return null;

  return (
    <div
      style={{
        margin: '0 14px 8px 14px',
        padding: '4px 10px',
        borderRadius: 6,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 28,
        minHeight: 28,
        flexShrink: 0
      }}
    >
      <span style={{ fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#71717a' }} />
        <strong style={{ color: '#e4e4e7', fontWeight: 600 }}>{count} project SVGs</strong>
      </span>
      <span
        style={{
          fontSize: 10,
          color: '#a1a1aa',
          background: '#18181b',
          padding: '1px 6px',
          borderRadius: 4,
          border: '1px solid #27272a'
        }}
      >
        Imported ({count})
      </span>
    </div>
  );
}
