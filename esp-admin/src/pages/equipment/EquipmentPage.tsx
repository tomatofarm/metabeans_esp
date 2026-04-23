import { useEffect } from 'react';
import { Tabs, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import { useUiStore } from '../../stores/uiStore';
import EquipmentInfoPage from './EquipmentInfoPage';
import RealtimeMonitorPage from './RealtimeMonitorPage';
import DeviceControlPage from './DeviceControlPage';
import HistoryPage from './HistoryPage';
import EquipmentRegisterPage from './EquipmentRegisterPage';
import EquipmentEditPage from './EquipmentEditPage';

const { Title } = Typography;

function EquipmentTabs() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAllowed: canViewEquipmentInfo, isLoading: infoPermLoading } =
    useFeaturePermission('equipment.view');
  const showEquipmentInfoTab = infoPermLoading || canViewEquipmentInfo;
  const { isAllowed: canViewMonitoring, isLoading: monitoringPermLoading } =
    useFeaturePermission('monitoring.view');
  const showMonitoringTab = monitoringPermLoading || canViewMonitoring;
  const { isAllowed: canCreate, isLoading: createPermLoading } = useFeaturePermission('equipment.create');
  const canRegister = createPermLoading || canCreate;
  const { isAllowed: canPower, isLoading: powerPermLoading } = useFeaturePermission('control.power');
  const { isAllowed: canDamper, isLoading: damperPermLoading } = useFeaturePermission('control.damper');
  const { isAllowed: canFan, isLoading: fanPermLoading } = useFeaturePermission('control.fan');
  const showControlTab =
    powerPermLoading ||
    damperPermLoading ||
    fanPermLoading ||
    canPower ||
    canDamper ||
    canFan;
  const controlPermLoading = powerPermLoading || damperPermLoading || fanPermLoading;
  const { isAllowed: canViewHistory, isLoading: historyPermLoading } =
    useFeaturePermission('history.view');
  const showHistoryTab = historyPermLoading || canViewHistory;
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);

  const firstAvailableTab = (): 'info' | 'monitoring' | 'control' | 'history' => {
    if (showEquipmentInfoTab) return 'info';
    if (showMonitoringTab) return 'monitoring';
    if (showControlTab) return 'control';
    if (showHistoryTab) return 'history';
    return 'info';
  };

  // 현재 활성 탭 결정
  const getActiveTab = () => {
    if (location.pathname.includes('/equipment/monitoring')) return 'monitoring';
    if (location.pathname.includes('/equipment/control')) return 'control';
    if (location.pathname.includes('/equipment/history')) return 'history';
    return 'info';
  };

  const rawActiveTab = getActiveTab();
  let activeTab = rawActiveTab;
  if (activeTab === 'info' && !showEquipmentInfoTab) activeTab = firstAvailableTab();
  if (activeTab === 'monitoring' && !showMonitoringTab) activeTab = firstAvailableTab();
  if (activeTab === 'control' && !showControlTab) activeTab = firstAvailableTab();
  if (activeTab === 'history' && !showHistoryTab) activeTab = firstAvailableTab();

  const resolvedFallbackTab = firstAvailableTab();
  const fallbackPath =
    resolvedFallbackTab === 'info' ? '/equipment' : `/equipment/${resolvedFallbackTab}`;

  useEffect(() => {
    if (infoPermLoading || monitoringPermLoading) return;
    if (!showEquipmentInfoTab && location.pathname === '/equipment') {
      navigate(fallbackPath, { replace: true });
    }
  }, [infoPermLoading, monitoringPermLoading, showEquipmentInfoTab, location.pathname, navigate, fallbackPath]);

  useEffect(() => {
    if (infoPermLoading || monitoringPermLoading) return;
    if (!showMonitoringTab && location.pathname.includes('/equipment/monitoring')) {
      navigate(fallbackPath, { replace: true });
    }
  }, [
    infoPermLoading,
    monitoringPermLoading,
    showMonitoringTab,
    location.pathname,
    navigate,
    fallbackPath,
  ]);

  useEffect(() => {
    if (infoPermLoading || monitoringPermLoading || controlPermLoading) return;
    if (!showControlTab && location.pathname.includes('/equipment/control')) {
      navigate(fallbackPath, { replace: true });
    }
  }, [
    infoPermLoading,
    monitoringPermLoading,
    controlPermLoading,
    showControlTab,
    location.pathname,
    navigate,
    fallbackPath,
  ]);

  useEffect(() => {
    if (infoPermLoading || monitoringPermLoading || historyPermLoading) return;
    if (!showHistoryTab && location.pathname.includes('/equipment/history')) {
      navigate(fallbackPath, { replace: true });
    }
  }, [
    infoPermLoading,
    monitoringPermLoading,
    historyPermLoading,
    showHistoryTab,
    location.pathname,
    navigate,
    fallbackPath,
  ]);

  const handleTabChange = (key: string) => {
    switch (key) {
      case 'info':
        navigate('/equipment');
        break;
      case 'monitoring':
        navigate('/equipment/monitoring');
        break;
      case 'control':
        navigate('/equipment/control');
        break;
      case 'history':
        navigate('/equipment/history');
        break;
    }
  };

  const tabItems = [
    ...(showEquipmentInfoTab ? [{ key: 'info' as const, label: '장비 정보' }] : []),
    ...(showMonitoringTab
      ? [{ key: 'monitoring' as const, label: '실시간 모니터링', disabled: !selectedEquipmentId }]
      : []),
    ...(showControlTab
      ? [{ key: 'control' as const, label: '장치 제어', disabled: !selectedEquipmentId }]
      : []),
    ...(showHistoryTab
      ? [
          {
            key: 'history' as const,
            label: '이력 조회',
            disabled: !selectedEquipmentId,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          장비관리
        </Title>
        {canRegister && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/equipment/register')}
          >
            장비 등록
          </Button>
        )}
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        className="equip-tabs"
      />
      {activeTab === 'info' && <EquipmentInfoPage />}
      {activeTab === 'monitoring' && showMonitoringTab && <RealtimeMonitorPage />}
      {activeTab === 'control' && showControlTab && <DeviceControlPage />}
      {activeTab === 'history' && showHistoryTab && <HistoryPage />}
    </div>
  );
}

export default function EquipmentPage() {
  return (
    <Routes>
      <Route path="register" element={<EquipmentRegisterPage />} />
      <Route path="edit/:equipmentId" element={<EquipmentEditPage />} />
      <Route path="*" element={<EquipmentTabs />} />
    </Routes>
  );
}
