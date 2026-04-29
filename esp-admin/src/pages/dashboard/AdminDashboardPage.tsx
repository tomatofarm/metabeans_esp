import { Typography, Space, Row, Col } from 'antd';
import { useMemo } from 'react';
import {
  useDashboardSummary,
  useDashboardIssues,
  useStoreMapData,
  useEsgSummary,
  useDashboardPendingAs,
} from '../../api/dashboard.api';
import { useCustomerList } from '../../api/customer.api';
import { useSystemUsers } from '../../api/system.api';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import SummaryCards from './components/SummaryCards';
import IssuePanel from './components/IssuePanel';
import ASRequestPanel from './components/ASRequestPanel';
import EsgSummaryCard from './components/EsgSummaryCard';
import StoreMap from './components/StoreMap';

interface AdminDashboardPageProps {
  onNavigateToEquipment: (equipmentId: number) => void;
}

export default function AdminDashboardPage({ onNavigateToEquipment }: AdminDashboardPageProps) {
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: issues, isLoading: issuesLoading } = useDashboardIssues();
  const { data: storeMap } = useStoreMapData();
  const { data: esg, isLoading: esgLoading } = useEsgSummary();
  const { data: pendingAs, isLoading: asLoading } = useDashboardPendingAs();

  /** 고객현황과 동일 매장 목록 출처로 지도 표시(Mock: 전체 페이지 1·충분한 pageSize) */
  const dashboardStoreListParams = useMemo(() => ({ page: 1, pageSize: 500 }), []);
  const { data: customerListRes, isLoading: dashboardStoresLoading } = useCustomerList(
    dashboardStoreListParams,
  );
  const dashboardCustomers = customerListRes?.data ?? [];
  const issueCountByStoreId = useMemo(() => {
    const m: Record<number, number> = {};
    storeMap?.forEach((s) => {
      m[s.storeId] = s.issueCount;
    });
    return m;
  }, [storeMap]);

  const { isAllowed: canViewTotalUsers, isLoading: totalUsersPermLoading } =
    useFeaturePermission('dashboard.total_users');
  const { data: usersRes } = useSystemUsers(
    { page: 1, pageSize: 1 },
    { enabled: !totalUsersPermLoading && canViewTotalUsers },
  );
  const totalUsers = usersRes?.meta?.totalCount ?? usersRes?.data?.length ?? 0;
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
        customers={dashboardCustomers}
        /** 지도 매장 목록만 `useCustomerList` — 이슈 API(`mapLoading`)까지 기다리면 지도 노출이 늦어짐 */
        loading={dashboardStoresLoading}
        issueCountByStoreId={issueCountByStoreId}
      />
    </Space>
  );
}
