import { Typography, Space, Row, Col, Card, Table, Empty, Spin } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useSystemUsers } from '../../api/system.api';
import {
  useRoleDashboardIssues,
  useRoleDashboardPendingAs,
  useStoreDashboard,
} from '../../api/dashboard.api';
import type { StoreEquipmentStatus, DashboardIssueItem } from '../../types/dashboard.types';
import AirQualityCard from '../../components/common/AirQualityCard';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import ASRequestPanel from './components/ASRequestPanel';
import TotalUserSummaryCard from './components/TotalUserSummaryCard';
import StatusTag from '../../components/common/StatusTag';
import StatusBadge from '../../components/common/StatusBadge';
import { formatRelativeTime } from '../../utils/formatters';
import { STORE_ID_MAP } from '../../api/mock/common.mock';

interface OwnerDashboardPageProps {
  onNavigateToEquipment: (equipmentId: number) => void;
}

const equipmentColumns = (onEquipmentClick: (id: number) => void) => [
  {
    title: '장비명',
    dataIndex: 'equipmentName',
    key: 'equipmentName',
    render: (text: string, record: StoreEquipmentStatus) => (
      <a onClick={() => onEquipmentClick(record.equipmentId)}>
        <DesktopOutlined style={{ marginRight: 8 }} />
        {text}
      </a>
    ),
  },
  {
    title: '상태',
    dataIndex: 'status',
    key: 'status',
    width: 80,
    render: (level: StoreEquipmentStatus['status']) => <StatusTag level={level} />,
  },
  {
    title: '연결',
    dataIndex: 'connectionStatus',
    key: 'connectionStatus',
    width: 80,
    render: (status: string) =>
      status === 'ONLINE' ? (
        <StatusBadge status="success" label="연결" />
      ) : (
        <StatusBadge status="danger" label="끊김" />
      ),
  },
  {
    title: '파워팩',
    key: 'controllers',
    width: 120,
    render: (_: unknown, record: StoreEquipmentStatus) =>
      `${record.normalControllers}/${record.controllerCount} 정상`,
  },
  {
    title: '최근 통신',
    dataIndex: 'lastSeenAt',
    key: 'lastSeenAt',
    width: 120,
    render: (v: string) => formatRelativeTime(v),
  },
];

const issueColumns = [
  {
    title: '유형',
    dataIndex: 'issueType',
    key: 'issueType',
    width: 120,
    render: (type: string) => {
      const labels: Record<string, string> = {
        COMM_ERROR: '통신 오류',
        INLET_TEMP: '유입 온도',
        FILTER_CHECK: '필터 점검',
        DUST_REMOVAL: '먼지제거',
      };
      return labels[type] ?? type;
    },
  },
  {
    title: '장비',
    dataIndex: 'equipmentName',
    key: 'equipmentName',
    width: 160,
  },
  {
    title: '상태',
    dataIndex: 'severity',
    key: 'severity',
    width: 80,
    render: (level: DashboardIssueItem['severity']) => <StatusTag level={level} />,
  },
  {
    title: '현재값',
    key: 'currentValue',
    width: 100,
    render: (_: unknown, record: DashboardIssueItem) =>
      record.currentValue !== undefined
        ? `${record.currentValue}${record.unit ? ` ${record.unit}` : ''}`
        : '-',
  },
  {
    title: '내용',
    dataIndex: 'message',
    key: 'message',
    ellipsis: true,
  },
  {
    title: '발생시간',
    dataIndex: 'occurredAt',
    key: 'occurredAt',
    width: 100,
    render: (v: string) => formatRelativeTime(v),
  },
];

export default function OwnerDashboardPage({ onNavigateToEquipment }: OwnerDashboardPageProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];

  // OWNER는 매장 1개 → 첫 번째 storeId의 숫자 ID
  const numericStoreId = storeIds
    .map((sid) => STORE_ID_MAP[sid])
    .filter((id): id is number => id !== undefined)[0] ?? null;

  const { data: storeData, isLoading: storeLoading } = useStoreDashboard(numericStoreId);
  const { data: issues, isLoading: issuesLoading } = useRoleDashboardIssues(storeIds);
  const { data: pendingAs, isLoading: asLoading } = useRoleDashboardPendingAs(storeIds);
  const { isAllowed: canViewIndoorAir, isLoading: indoorAirPermLoading } =
    useFeaturePermission('dashboard.indoor_air');
  const showIndoorAir = indoorAirPermLoading || canViewIndoorAir;
  const { isAllowed: canViewStoreOverview, isLoading: storeOverviewPermLoading } =
    useFeaturePermission('dashboard.total_stores');
  const showStoreOverview = storeOverviewPermLoading || canViewStoreOverview;
  const { isAllowed: canViewAs, isLoading: asViewPermLoading } = useFeaturePermission('as.view');
  const { isAllowed: canCreateAs, isLoading: asCreatePermLoading } = useFeaturePermission('as.create');
  const showAsPanel = asViewPermLoading || asCreatePermLoading || canViewAs || canCreateAs;
  const { isAllowed: canViewTotalUsers, isLoading: totalUsersPermLoading } =
    useFeaturePermission('dashboard.total_users');
  const { data: usersRes, isLoading: usersCountLoading } = useSystemUsers(
    { page: 1, pageSize: 1 },
    { enabled: !totalUsersPermLoading && canViewTotalUsers },
  );
  const totalUserCount = usersRes?.meta?.totalCount ?? usersRes?.data?.length ?? 0;

  if (storeLoading) {
    return <Spin tip="매장 데이터 로딩 중..." style={{ display: 'block', marginTop: 100 }} />;
  }

  // 이슈 카테고리에서 전체 아이템 추출
  const allIssueItems = issues?.flatMap((cat) => cat.items) ?? [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          내 매장 대시보드
        </Typography.Title>
        {storeData && (
          <Typography.Text type="secondary">
            {storeData.storeName} · {storeData.address}
          </Typography.Text>
        )}
      </div>

      {(totalUsersPermLoading || canViewTotalUsers) && (
        <div className="summary-grid summary-grid-1" style={{ maxWidth: 360 }}>
          <TotalUserSummaryCard
            value={totalUserCount}
            loading={usersCountLoading && canViewTotalUsers}
          />
        </div>
      )}

      {(showIndoorAir || showStoreOverview) && (
        <Row gutter={[16, 16]}>
          {showIndoorAir && (
            <Col xs={24} lg={showStoreOverview ? 12 : 24} style={{ minWidth: 0 }}>
              <AirQualityCard
                data={storeData?.iaqData}
                floorIaqList={storeData?.floorIaqList}
                storeName={storeData?.storeName}
              />
            </Col>
          )}
          {showStoreOverview && (
            <Col xs={24} lg={showIndoorAir ? 12 : 24} style={{ minWidth: 0 }}>
              <Card title="장비 상태" size="small" style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
                {storeData && storeData.equipments.length > 0 ? (
                  <Table
                    dataSource={storeData.equipments}
                    columns={equipmentColumns(onNavigateToEquipment)}
                    rowKey="equipmentId"
                    size="small"
                    pagination={false}
                    className="dashboard-table"
                  />
                ) : (
                  <Empty description="장비가 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {showStoreOverview && (
        <Card title="이슈 알림" size="small" loading={issuesLoading} style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
          {allIssueItems.length > 0 ? (
            <Table
              dataSource={allIssueItems}
              columns={issueColumns}
              rowKey="issueId"
              size="small"
              pagination={false}
              className="dashboard-table"
            />
          ) : (
            <Empty description="이슈 없음" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      )}

      {showAsPanel && (
        <ASRequestPanel
          data={pendingAs}
          loading={asLoading}
          showCreateButton={canCreateAs}
          onCreateClick={() => navigate('/as-service/request')}
        />
      )}
    </Space>
  );
}
