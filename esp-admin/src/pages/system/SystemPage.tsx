import { useEffect, useMemo } from 'react';
import { Tabs, Spin } from 'antd';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import SystemPermissionTab from './SystemPermissionTab';
import SystemApprovalTab from './SystemApprovalTab';
import SystemUserTab from './SystemUserTab';
import SystemThresholdTab from './SystemThresholdTab';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';

type SystemTabKey = 'permission' | 'approval' | 'users' | 'thresholds';

const TAB_PATH: Record<SystemTabKey, string> = {
  permission: '/system',
  approval: '/system/approval',
  users: '/system/users',
  thresholds: '/system/thresholds',
};

function SystemTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAllowed: canPermission, isLoading: permissionLoading } =
    useFeaturePermission('system.permission');
  const { isAllowed: canApproval, isLoading: approvalLoading } = useFeaturePermission('system.approval');
  const { isAllowed: canUser, isLoading: userLoading } = useFeaturePermission('system.user');
  const { isAllowed: canThreshold, isLoading: thresholdLoading } =
    useFeaturePermission('system.threshold');

  const showPermissionTab = permissionLoading || canPermission;
  const showApprovalTab = approvalLoading || canApproval;
  const showUsersTab = userLoading || canUser;
  const showThresholdsTab = thresholdLoading || canThreshold;

  const systemPermLoading =
    permissionLoading || approvalLoading || userLoading || thresholdLoading;

  const visibleTabKeys = useMemo(() => {
    const keys: SystemTabKey[] = [];
    if (showPermissionTab) keys.push('permission');
    if (showApprovalTab) keys.push('approval');
    if (showUsersTab) keys.push('users');
    if (showThresholdsTab) keys.push('thresholds');
    return keys;
  }, [showPermissionTab, showApprovalTab, showUsersTab, showThresholdsTab]);

  const visibleSet = useMemo(() => new Set(visibleTabKeys), [visibleTabKeys]);

  const firstTabPath = useMemo(() => {
    const first = visibleTabKeys[0];
    return first ? TAB_PATH[first] : '/system';
  }, [visibleTabKeys]);

  const getActiveTab = (): SystemTabKey => {
    if (location.pathname.includes('/system/approval')) return 'approval';
    if (location.pathname.includes('/system/users')) return 'users';
    if (location.pathname.includes('/system/thresholds')) return 'thresholds';
    return 'permission';
  };

  const rawActive = getActiveTab();
  const activeTab = visibleSet.has(rawActive) ? rawActive : visibleTabKeys[0] ?? 'permission';

  useEffect(() => {
    if (systemPermLoading || visibleTabKeys.length === 0) return;
    const path = location.pathname;
    if ((path === '/system' || path === '/system/') && !visibleSet.has('permission')) {
      navigate(firstTabPath, { replace: true });
      return;
    }
    if (path.includes('/system/approval') && !visibleSet.has('approval')) {
      navigate(firstTabPath, { replace: true });
      return;
    }
    if (path.includes('/system/users') && !visibleSet.has('users')) {
      navigate(firstTabPath, { replace: true });
      return;
    }
    if (path.includes('/system/thresholds') && !visibleSet.has('thresholds')) {
      navigate(firstTabPath, { replace: true });
    }
  }, [systemPermLoading, visibleTabKeys.length, location.pathname, navigate, visibleSet, firstTabPath]);

  const handleTabChange = (key: string) => {
    const k = key as SystemTabKey;
    if (!visibleSet.has(k)) return;
    navigate(TAB_PATH[k]);
  };

  const tabItems = useMemo(
    () =>
      [
        showPermissionTab ? { key: 'permission' as const, label: '권한 관리' } : null,
        showApprovalTab ? { key: 'approval' as const, label: '가입 승인' } : null,
        showUsersTab ? { key: 'users' as const, label: '사용자 관리' } : null,
        showThresholdsTab ? { key: 'thresholds' as const, label: '기준수치 관리' } : null,
      ].filter(Boolean) as { key: SystemTabKey; label: string }[],
    [showPermissionTab, showApprovalTab, showUsersTab, showThresholdsTab],
  );

  if (systemPermLoading) {
    return (
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>시스템 관리</h2>
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (visibleTabKeys.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const safeKey = visibleSet.has(activeTab) ? activeTab : visibleTabKeys[0]!;

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>시스템 관리</h2>
      <Tabs
        className="system-tabs"
        activeKey={safeKey}
        onChange={handleTabChange}
        items={tabItems}
      />
      {safeKey === 'permission' && <SystemPermissionTab />}
      {safeKey === 'approval' && <SystemApprovalTab />}
      {safeKey === 'users' && <SystemUserTab />}
      {safeKey === 'thresholds' && <SystemThresholdTab />}
    </div>
  );
}

export default function SystemPage() {
  return (
    <Routes>
      <Route path="*" element={<SystemTabs />} />
    </Routes>
  );
}
