import { Typography, Space, Card, Table, Empty, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  ShopOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import {
  useRoleDashboardSummary,
  useRoleDashboardIssues,
  useRoleStoreList,
  useRoleDashboardPendingAs,
} from '../../api/dashboard.api';
import type { RoleDashboardSummary, StoreMapItem } from '../../types/dashboard.types';
import { STATUS_COLORS } from '../../utils/constants';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import IssuePanel from './components/IssuePanel';
import ASRequestPanel from './components/ASRequestPanel';
import StatusTag from '../../components/common/StatusTag';

interface DealerDashboardPageProps {
  onNavigateToStore: (storeId: number) => void;
  onNavigateToEquipment: (equipmentId: number) => void;
}

function DealerSummaryCards({ data, loading }: { data?: RoleDashboardSummary; loading?: boolean }) {
  if (loading) return <div className="summary-grid summary-grid-2"><div className="summary-card">로딩중...</div><div className="summary-card">로딩중...</div></div>;
  return (
    <div className="summary-grid summary-grid-2">
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #4A6CF7, #6B7CFF)' }}>
          <ShopOutlined />
        </div>
        <div>
          <div className="summary-card-value">{data?.totalStores ?? 0}</div>
          <div className="summary-card-label">관할 매장</div>
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>
          <DesktopOutlined />
        </div>
        <div>
          <div className="summary-card-value">{data?.totalEquipments ?? 0}</div>
          <div className="summary-card-label">전체 장비</div>
          <div className="summary-card-sub">정상 {data?.normalEquipments ?? 0}</div>
        </div>
      </div>
    </div>
  );
}

const storeColumns = (onStoreClick: (storeId: number) => void) => [
  {
    title: '매장명',
    dataIndex: 'storeName',
    key: 'storeName',
    render: (text: string, record: StoreMapItem) => (
      <a onClick={() => onStoreClick(record.storeId)}>
        <ShopOutlined style={{ marginRight: 8 }} />
        {text}
      </a>
    ),
  },
  {
    title: '주소',
    dataIndex: 'address',
    key: 'address',
    ellipsis: true,
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    render: (level: StoreMapItem['status']) => <StatusTag level={level} />,
  },
  {
    title: '장비',
    dataIndex: 'equipmentCount',
    key: 'equipmentCount',
    width: 80,
    render: (count: number) => `${count}대`,
  },
  {
    title: '이슈',
    dataIndex: 'issueCount',
    key: 'issueCount',
    width: 80,
    render: (count: number) => (
      <span style={{ color: count > 0 ? STATUS_COLORS.DANGER.color : undefined }}>{count}건</span>
    ),
  },
];

export default function DealerDashboardPage({
  onNavigateToStore,
  onNavigateToEquipment,
}: DealerDashboardPageProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];

  const { data: summary, isLoading: summaryLoading } = useRoleDashboardSummary(storeIds);
  const { data: issues, isLoading: issuesLoading } = useRoleDashboardIssues(storeIds);
  const { data: stores, isLoading: storesLoading } = useRoleStoreList(storeIds);
  const { data: pendingAs, isLoading: asLoading } = useRoleDashboardPendingAs(storeIds);

  /** '전체 가맹점' 권한 — 관할 요약·매장 목록·이슈 패널(대시보드 개요) */
  const { isAllowed: canViewStoreOverview, isLoading: storeOverviewPermLoading } =
    useFeaturePermission('dashboard.total_stores');
  const showStoreOverview = storeOverviewPermLoading || canViewStoreOverview;
  const { isAllowed: canViewAsList, isLoading: asViewPermLoading } = useFeaturePermission('as.view');
  const { isAllowed: canCreateAs } = useFeaturePermission('as.create');
  const showAsPanel = asViewPermLoading || canViewAsList;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          대리점 대시보드
        </Typography.Title>
        <Typography.Text type="secondary">
          관할 매장 현황
        </Typography.Text>
      </div>

      {showStoreOverview && (
        <DealerSummaryCards data={summary} loading={summaryLoading} />
      )}

      {(showStoreOverview || showAsPanel) && (
        <Row gutter={[16, 16]}>
          {showAsPanel && (
            <Col xs={24} lg={showStoreOverview ? 12 : 24}>
              <ASRequestPanel
                data={pendingAs}
                loading={asLoading}
                showCreateButton={canCreateAs}
                onCreateClick={() => navigate('/as-service/request')}
              />
            </Col>
          )}
          {showStoreOverview && (
            <Col xs={24} lg={showAsPanel ? 12 : 24}>
              <IssuePanel
                categories={issues}
                loading={issuesLoading}
                onEquipmentClick={onNavigateToEquipment}
              />
            </Col>
          )}
        </Row>
      )}

      {showStoreOverview && (
        <Card title="관할 매장 목록" size="small" loading={storesLoading}>
          {stores && stores.length > 0 ? (
            <Table
              dataSource={stores}
              columns={storeColumns(onNavigateToStore)}
              rowKey="storeId"
              size="small"
              pagination={false}
            />
          ) : (
            <Empty description="관할 매장이 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      )}
    </Space>
  );
}
