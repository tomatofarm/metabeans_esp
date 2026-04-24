import { Typography, Space, Row, Col, Card, Table, List, Empty, Spin } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import { useStoreDashboard } from '../../api/dashboard.api';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import AirQualityCard from '../../components/common/AirQualityCard';
import StatusTag from '../../components/common/StatusTag';
import StatusBadge from '../../components/common/StatusBadge';
import type { BadgeStatus } from '../../components/common/StatusBadge';
import type { StoreEquipmentStatus, StoreAsRequest, DashboardIssueItem } from '../../types/dashboard.types';
import { formatRelativeTime } from '../../utils/formatters';
import { AS_STATUS_LABELS } from '../../utils/constants';

/**
 * `selectedStoreId`가 잡힌 뒤의 단일 매장 대시보드.
 * **역할은 `UserRole`로 구분** — 점주는 `OWNER` 하나이며, 이 화면은 OWNER뿐 아니라
 * 딜러·HQ·어드민이 매장을 선택해도 동일하게 사용한다 (구 `StoreDashboardPage`).
 */
interface SelectedStoreDashboardPageProps {
  storeId: number;
  onEquipmentClick: (equipmentId: number) => void;
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
  { title: '유형', dataIndex: 'issueType', key: 'issueType', width: 120,
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
  { title: '장비', dataIndex: 'equipmentName', key: 'equipmentName', width: 160 },
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
  { title: '내용', dataIndex: 'message', key: 'message', ellipsis: true },
  {
    title: '발생시간',
    dataIndex: 'occurredAt',
    key: 'occurredAt',
    width: 100,
    render: (v: string) => formatRelativeTime(v),
  },
];

export default function SelectedStoreDashboardPage({
  storeId,
  onEquipmentClick,
}: SelectedStoreDashboardPageProps) {
  const { data, isLoading } = useStoreDashboard(storeId);
  const { isAllowed: canViewIndoorAir, isLoading: indoorAirPermLoading } =
    useFeaturePermission('dashboard.indoor_air');
  const showIndoorAir = indoorAirPermLoading || canViewIndoorAir;
  const { isAllowed: canViewStoreOverview, isLoading: storeOverviewPermLoading } =
    useFeaturePermission('dashboard.total_stores');
  const showStoreOverview = storeOverviewPermLoading || canViewStoreOverview;
  const { isAllowed: canViewAs, isLoading: asViewPermLoading } = useFeaturePermission('as.view');
  const showRecentAs = asViewPermLoading || canViewAs;

  if (isLoading) {
    return <Spin tip="매장 데이터 로딩 중..." style={{ display: 'block', marginTop: 100 }} />;
  }

  if (!data) {
    return <Empty description="매장 데이터가 없습니다." />;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {data.storeName}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
          {data.address}
          {data.businessType ? ` · ${data.businessType}` : ''}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 2 }}>
          연락처 {data.phone || '-'}
        </Typography.Text>
      </div>

      {(showIndoorAir || showStoreOverview) && (
        <Row gutter={[16, 16]}>
          {showIndoorAir && (
            <Col xs={24} lg={showStoreOverview ? 12 : 24} style={{ minWidth: 0 }}>
              <AirQualityCard
                data={data.iaqData}
                floorIaqList={data.floorIaqList}
                storeName={data.storeName}
              />
            </Col>
          )}
          {showStoreOverview && (
            <Col xs={24} lg={showIndoorAir ? 12 : 24} style={{ minWidth: 0 }}>
              <Card title="장비 현황" size="small" style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
                <Table
                  dataSource={data.equipments}
                  columns={equipmentColumns(onEquipmentClick)}
                  rowKey="equipmentId"
                  size="small"
                  pagination={false}
                  className="dashboard-table"
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {showStoreOverview && (
        <Card title="매장 이슈" size="small" style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
          {data.issues.length > 0 ? (
            <Table
              dataSource={data.issues}
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

      {showRecentAs && (
        <Card title="최근 A/S 현황" size="small" style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
          {data.recentAsRequests.length > 0 ? (
            <List
              dataSource={data.recentAsRequests}
              renderItem={(item: StoreAsRequest) => (
                <List.Item
                  extra={
                    <StatusBadge
                      status={
                        ({ COMPLETED: 'success', PENDING: 'default', IN_PROGRESS: 'warning', ACCEPTED: 'info', ASSIGNED: 'warning' } as Record<string, BadgeStatus>)[item.status] ?? 'info'
                      }
                      label={AS_STATUS_LABELS[item.status] ?? item.status}
                    />
                  }
                >
                  <List.Item.Meta
                    title={item.equipmentName ?? '장비 미지정'}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="A/S 내역 없음" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      )}
    </Space>
  );
}
