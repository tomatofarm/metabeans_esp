import { Typography, Space, Row, Col } from 'antd';
import {
  useDashboardSummary,
  useDashboardIssues,
  useStoreMapData,
  useEsgSummary,
  useDashboardPendingAs,
} from '../../api/dashboard.api';
import { useSystemUsers } from '../../api/system.api';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import SummaryCards from './components/SummaryCards';
import IssuePanel from './components/IssuePanel';
import ASRequestPanel from './components/ASRequestPanel';
import EsgSummaryCard from './components/EsgSummaryCard';
import StoreMap from './components/StoreMap';

interface AdminDashboardPageProps {
  onNavigateToStore: (storeId: number) => void;
  onNavigateToEquipment: (equipmentId: number) => void;
}

export default function AdminDashboardPage({
  onNavigateToStore,
  onNavigateToEquipment,
}: AdminDashboardPageProps) {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: issues, isLoading: issuesLoading } = useDashboardIssues();
  const { data: storeMap, isLoading: mapLoading } = useStoreMapData();
  const { data: esg, isLoading: esgLoading } = useEsgSummary();
  const { data: pendingAs, isLoading: asLoading } = useDashboardPendingAs();
  const { data: usersRes } = useSystemUsers({ page: 1, pageSize: 1 });
  const totalUsers = usersRes?.meta?.totalCount ?? usersRes?.data?.length ?? 0;
  const { isAllowed: canViewTotalUsers } = useFeaturePermission('dashboard.total_users');
  const { isAllowed: canViewTotalStores } = useFeaturePermission('dashboard.total_stores');

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        전체 현황 대시보드
      </Typography.Title>

      <SummaryCards
        data={summary}
        loading={summaryLoading}
        showTotalStores={canViewTotalStores}
        totalUsers={canViewTotalUsers ? totalUsers : undefined}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ASRequestPanel data={pendingAs} loading={asLoading} />
        </Col>
        <Col xs={24} lg={12}>
          <IssuePanel
            categories={issues}
            loading={issuesLoading}
            onEquipmentClick={onNavigateToEquipment}
          />
        </Col>
      </Row>

      <EsgSummaryCard data={esg} loading={esgLoading} />

      <StoreMap
        stores={storeMap}
        loading={mapLoading}
        onStoreClick={onNavigateToStore}
      />
    </Space>
  );
}
