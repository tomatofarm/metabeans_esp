import { Tabs, Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
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
  const { isAdmin, isDealer, isOwner } = useRole();
  const canRegister = isAdmin || isDealer;
  const canControl = !isOwner;
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);

  // 현재 활성 탭 결정
  const getActiveTab = () => {
    if (location.pathname.includes('/equipment/monitoring')) return 'monitoring';
    if (location.pathname.includes('/equipment/control')) return 'control';
    if (location.pathname.includes('/equipment/history')) return 'history';
    return 'info';
  };

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
    {
      key: 'info',
      label: '장비 정보',
    },
    {
      key: 'monitoring',
      label: '실시간 모니터링',
      disabled: !selectedEquipmentId,
    },
    {
      key: 'control',
      label: '장치 제어',
      disabled: !selectedEquipmentId || !canControl,
    },
    {
      key: 'history',
      label: '이력 조회',
      disabled: !selectedEquipmentId,
    },
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
        activeKey={getActiveTab()}
        onChange={handleTabChange}
        items={tabItems}
        className="equip-tabs"
      />
      {getActiveTab() === 'info' && <EquipmentInfoPage />}
      {getActiveTab() === 'monitoring' && <RealtimeMonitorPage />}
      {getActiveTab() === 'control' && <DeviceControlPage />}
      {getActiveTab() === 'history' && <HistoryPage />}
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
