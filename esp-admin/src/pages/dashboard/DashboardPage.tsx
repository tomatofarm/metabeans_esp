import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import AdminDashboardPage from './AdminDashboardPage';
import DealerDashboardPage from './DealerDashboardPage';
import HQDashboardPage from './HQDashboardPage';
import OwnerDashboardPage from './OwnerDashboardPage';
import SelectedStoreDashboardPage from './SelectedStoreDashboardPage';

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    selectedStoreId,
    selectedEquipmentId,
    selectStore,
    selectEquipment,
  } = useUiStore();

  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'ADMIN';

  // Equipment selected → navigate to monitoring page (not rendered in dashboard)
  useEffect(() => {
    if (selectedEquipmentId) {
      navigate(`/equipment/${selectedEquipmentId}/monitoring`);
    }
  }, [selectedEquipmentId, navigate]);

  const handleNavigateToStore = (storeId: number) => {
    selectStore(storeId);
  };

  const handleNavigateToEquipment = (equipmentId: number) => {
    selectEquipment(equipmentId);
    navigate(`/equipment/${equipmentId}/monitoring`);
  };

  // If equipment is selected, don't render anything (navigating away)
  if (selectedEquipmentId) {
    return null;
  }

  // 매장 선택됨 → 단일 매장 대시보드 (역할 구분 아님; 점주·딜러·HQ·어드민 공통)
  if (selectedStoreId) {
    return (
      <SelectedStoreDashboardPage
        storeId={selectedStoreId}
        onEquipmentClick={handleNavigateToEquipment}
      />
    );
  }

  // No selection → show role-specific overview dashboard
  switch (role) {
    case 'DEALER':
      return (
        <DealerDashboardPage
          onNavigateToStore={handleNavigateToStore}
          onNavigateToEquipment={handleNavigateToEquipment}
        />
      );
    case 'HQ':
      return (
        <HQDashboardPage
          onNavigateToStore={handleNavigateToStore}
          onNavigateToEquipment={handleNavigateToEquipment}
        />
      );
    case 'OWNER':
      return (
        <OwnerDashboardPage
          onNavigateToEquipment={handleNavigateToEquipment}
        />
      );
    default:
      return (
        <AdminDashboardPage
          onNavigateToStore={handleNavigateToStore}
          onNavigateToEquipment={handleNavigateToEquipment}
        />
      );
  }
}
