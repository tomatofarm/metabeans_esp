import type { StatusLevel } from '../../utils/constants';
import { getStatusConfig } from '../../utils/statusHelper';
import StatusBadge from './StatusBadge';
import type { BadgeStatus } from './StatusBadge';

interface StatusTagProps {
  level: StatusLevel;
  label?: string;
}

const LEVEL_TO_STATUS: Record<StatusLevel, BadgeStatus> = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
};

export default function StatusTag({ level, label }: StatusTagProps) {
  const config = getStatusConfig(level);
  return <StatusBadge status={LEVEL_TO_STATUS[level]} label={label ?? config.label} />;
}
