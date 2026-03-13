import { Tag } from 'antd';
import type { UserRole } from '../../types/auth.types';
import { ROLE_CONFIG } from '../../utils/constants';

interface RoleBadgeProps {
  role: UserRole;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  return <Tag color={config.color}>{config.label}</Tag>;
}
