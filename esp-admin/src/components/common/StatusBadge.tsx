import type { CSSProperties } from 'react';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
}

const STYLE_MAP: Record<BadgeStatus, CSSProperties> = {
  success: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success-text)',
  },
  warning: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-warning-text)',
  },
  danger: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger-text)',
  },
  info: {
    background: 'var(--color-info-bg)',
    color: 'var(--color-info-text)',
  },
  default: {
    background: '#F1F5F9',
    color: 'var(--color-mid)',
  },
};

const baseStyle: CSSProperties = {
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span style={{ ...baseStyle, ...STYLE_MAP[status] }}>
      {label}
    </span>
  );
}
