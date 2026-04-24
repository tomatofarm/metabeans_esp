import { Typography, Space, Row, Col, Card, Table, Empty } from 'antd';
import {
  ShopOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSystemUsers } from '../../api/system.api';
import {
  useRoleDashboardSummary,
  useRoleDashboardIssues,
  useRoleStoreList,
  useRoleDashboardPendingAs,
} from '../../api/dashboard.api';
import type { RoleDashboardSummary, StoreMapItem } from '../../types/dashboard.types';
import { STATUS_COLORS } from '../../utils/constants';
import IssuePanel from './components/IssuePanel';
import ASRequestPanel from './components/ASRequestPanel';
import TotalUserSummaryCard from './components/TotalUserSummaryCard';
import StatusTag from '../../components/common/StatusTag';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';

interface HQDashboardPageProps {
  onNavigateToStore: (storeId: number) => void;
  onNavigateToEquipment: (equipmentId: number) => void;
}

function HQSummaryCards({
  data,
  loading,
  showTotalUserCard,
  totalUsers,
  totalUsersLoading,
}: {
  data?: RoleDashboardSummary;
  loading?: boolean;
  showTotalUserCard?: boolean;
  totalUsers?: number;
  totalUsersLoading?: boolean;
}) {
  const cols = showTotalUserCard ? 3 : 2;
  if (loading) {
    return (
      <div className={`summary-grid summary-grid-${cols}`}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="summary-card">
            로딩중...
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`summary-grid summary-grid-${cols}`}>
      <div className="summary-card">
        <div className="summary-card-icon" style={{ background: 'linear-gradient(135deg, #4A6CF7, #6B7CFF)' }}>
          <ShopOutlined />
        </div>
        <div>
          <div className="summary-card-value">{data?.totalStores ?? 0}</div>
          <div className="summary-card-label">소속 매장</div>
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
      {showTotalUserCard && (
        <TotalUserSummaryCard value={totalUsers ?? 0} loading={totalUsersLoading} />
      )}
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

export default function HQDashboardPage({
  onNavigateToStore,
  onNavigateToEquipment,
}: HQDashboardPageProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];

  const { data: summary, isLoading: summaryLoading } = useRoleDashboardSummary(storeIds);
  const { data: issues, isLoading: issuesLoading } = useRoleDashboardIssues(storeIds);
  const { data: stores, isLoading: storesLoading } = useRoleStoreList(storeIds);
  const { data: pendingAs, isLoading: asLoading } = useRoleDashboardPendingAs(storeIds);
  const { isAllowed: canViewStoreOverview, isLoading: storeOverviewPermLoading } =
    useFeaturePermission('dashboard.total_stores');
  const showStoreOverview = storeOverviewPermLoading || canViewStoreOverview;
  const { isAllowed: canViewAsList, isLoading: asViewPermLoading } = useFeaturePermission('as.view');
  const { isAllowed: canCreateAs } = useFeaturePermission('as.create');
  const showAsPanel = asViewPermLoading || canViewAsList;
  const { isAllowed: canViewTotalUsers, isLoading: totalUsersPermLoading } =
    useFeaturePermission('dashboard.total_users');
  const { data: usersRes, isLoading: usersCountLoading } = useSystemUsers(
    { page: 1, pageSize: 1 },
    { enabled: !totalUsersPermLoading && canViewTotalUsers },
  );
  const totalUserCount = usersRes?.meta?.totalCount ?? usersRes?.data?.length ?? 0;
  const showTotalUserPermission = totalUsersPermLoading || canViewTotalUsers;
  const showUsersCardInSummaryGrid = showStoreOverview && showTotalUserPermission;
  const showUsersCardOnly = !showStoreOverview && showTotalUserPermission;

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          매장 본사 대시보드
        </Typography.Title>
        <Typography.Text type="secondary">
          소속 매장 현황 (읽기 전용)
        </Typography.Text>
      </div>

      {showStoreOverview && (
        <HQSummaryCards
          data={summary}
          loading={summaryLoading}
          showTotalUserCard={showUsersCardInSummaryGrid}
          totalUsers={totalUserCount}
          totalUsersLoading={usersCountLoading && canViewTotalUsers}
        />
      )}
      {showUsersCardOnly && (
        <div className="summary-grid summary-grid-1" style={{ maxWidth: 360 }}>
          <TotalUserSummaryCard
            value={totalUserCount}
            loading={usersCountLoading && canViewTotalUsers}
          />
        </div>
      )}

      {showStoreOverview && (
        <Card title="소속 매장 목록" size="small" loading={storesLoading} style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
          {stores && stores.length > 0 ? (
            <Table
              dataSource={stores}
              columns={storeColumns(onNavigateToStore)}
              rowKey="storeId"
              size="small"
              pagination={false}
              className="dashboard-table"
            />
          ) : (
            <Empty description="소속 매장이 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
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
    </Space>
  );
}
