import { Typography, Space, Row, Col, Card, Table, Empty } from 'antd';
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
  useStoreDashboard,
} from '../../api/dashboard.api';
import type { RoleDashboardSummary, StoreMapItem } from '../../types/dashboard.types';
import { STATUS_COLORS } from '../../utils/constants';
import { STORE_ID_MAP } from '../../api/mock/common.mock';
import IssuePanel from './components/IssuePanel';
import ASRequestPanel from './components/ASRequestPanel';
import AirQualityCard from '../../components/common/AirQualityCard';
import StatusTag from '../../components/common/StatusTag';

interface HQDashboardPageProps {
  onNavigateToStore: (storeId: number) => void;
  onNavigateToEquipment: (equipmentId: number) => void;
}

function HQSummaryCards({ data, loading }: { data?: RoleDashboardSummary; loading?: boolean }) {
  if (loading) return <div className="summary-grid summary-grid-2"><div className="summary-card">로딩중...</div><div className="summary-card">로딩중...</div></div>;
  return (
    <div className="summary-grid summary-grid-2">
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
    </div>
  );
}

function IAQOverview({ storeIds }: { storeIds: string[] }) {
  const numericIds = storeIds
    .filter((sid) => sid !== '*')
    .map((sid) => STORE_ID_MAP[sid])
    .filter((id): id is number => id !== undefined);

  // 첫 번째 소속 매장의 IAQ 데이터를 대표로 표시
  const firstStoreId = numericIds[0] ?? null;
  const { data } = useStoreDashboard(firstStoreId);

  if (!data?.iaqData) return null;

  return (
    <AirQualityCard
      data={data.iaqData}
      floorIaqList={data.floorIaqList}
      storeName={data.storeName}
    />
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
  const user = useAuthStore((s) => s.user);
  const storeIds = user?.storeIds ?? [];

  const { data: summary, isLoading: summaryLoading } = useRoleDashboardSummary(storeIds);
  const { data: issues, isLoading: issuesLoading } = useRoleDashboardIssues(storeIds);
  const { data: stores, isLoading: storesLoading } = useRoleStoreList(storeIds);
  const { data: pendingAs, isLoading: asLoading } = useRoleDashboardPendingAs(storeIds);

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

      <HQSummaryCards data={summary} loading={summaryLoading} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <IAQOverview storeIds={storeIds} />
        </Col>
        <Col xs={24} lg={12}>
          <Card title="소속 매장 목록" size="small" loading={storesLoading}>
            {stores && stores.length > 0 ? (
              <Table
                dataSource={stores}
                columns={storeColumns(onNavigateToStore)}
                rowKey="storeId"
                size="small"
                pagination={false}
              />
            ) : (
              <Empty description="소속 매장이 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <IssuePanel
        categories={issues}
        loading={issuesLoading}
        onEquipmentClick={onNavigateToEquipment}
      />

      <ASRequestPanel data={pendingAs} loading={asLoading} />
    </Space>
  );
}
