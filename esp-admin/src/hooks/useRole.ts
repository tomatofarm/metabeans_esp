import { useAuth } from './useAuth';
import type { UserRole } from '../types/auth.types';
import { hasMenuAccess, getAccessibleMenus } from '../utils/roleHelper';

/**
 * 역할 기반 권한 체크 훅
 */
export function useRole() {
  const { role } = useAuth();

  const checkMenuAccess = (menu: string): boolean => {
    if (!role) return false;
    return hasMenuAccess(role, menu);
  };

  const isAdmin = role === 'ADMIN';
  const isDealer = role === 'DEALER';
  const isHQ = role === 'HQ';
  const isOwner = role === 'OWNER';

  const hasRole = (targetRole: UserRole): boolean => role === targetRole;

  const menus = role ? getAccessibleMenus(role) : [];

  return {
    role,
    isAdmin,
    isDealer,
    isHQ,
    isOwner,
    hasRole,
    checkMenuAccess,
    menus,
  };
}
