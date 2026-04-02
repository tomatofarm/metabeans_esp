import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import CustomerListPage from './CustomerListPage';

export default function CustomerPage() {
  const { isAllowed: canAccess, isLoading } = useFeaturePermission('customer.access');

  if (isLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ padding: '0 0 24px' }}>
      <CustomerListPage />
    </div>
  );
}
