import { Tabs } from 'antd';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import SystemPermissionTab from './SystemPermissionTab';
import SystemApprovalTab from './SystemApprovalTab';
import SystemUserTab from './SystemUserTab';
import SystemThresholdTab from './SystemThresholdTab';

function SystemTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.includes('/system/approval')) return 'approval';
    if (location.pathname.includes('/system/users')) return 'users';
    if (location.pathname.includes('/system/thresholds')) return 'thresholds';
    return 'permission';
  };

  const handleTabChange = (key: string) => {
    switch (key) {
      case 'permission':
        navigate('/system');
        break;
      case 'approval':
        navigate('/system/approval');
        break;
      case 'users':
        navigate('/system/users');
        break;
      case 'thresholds':
        navigate('/system/thresholds');
        break;
    }
  };

  const tabItems = [
    { key: 'permission', label: '권한 관리' },
    { key: 'approval', label: '가입 승인' },
    { key: 'users', label: '사용자 관리' },
    { key: 'thresholds', label: '기준수치 관리' },
  ];

  const activeTab = getActiveTab();

  return (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>시스템 관리</h2>
      <Tabs className="system-tabs" activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      {activeTab === 'permission' && <SystemPermissionTab />}
      {activeTab === 'approval' && <SystemApprovalTab />}
      {activeTab === 'users' && <SystemUserTab />}
      {activeTab === 'thresholds' && <SystemThresholdTab />}
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
