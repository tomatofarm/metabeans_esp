import { Card, Table, Button, Empty, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { ASRequestListItem } from '../../../types/as-service.types';
import { AS_STATUS_LABELS, FAULT_TYPE_LABELS } from '../../../utils/constants';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';
import { formatRelativeTime } from '../../../utils/formatters';

interface ASRequestPanelProps {
  data?: ASRequestListItem[];
  loading?: boolean;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

const columns = [
  {
    title: '접수일시',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 110,
    render: (v: string) => formatRelativeTime(v),
  },
  {
    title: '매장명',
    dataIndex: 'storeName',
    key: 'storeName',
    width: 140,
    ellipsis: true,
  },
  {
    title: '장비명',
    dataIndex: 'equipmentName',
    key: 'equipmentName',
    width: 160,
    ellipsis: true,
    render: (v?: string) => v ?? '-',
  },
  {
    title: '고장 유형',
    dataIndex: 'faultType',
    key: 'faultType',
    width: 100,
    render: (type: string) => FAULT_TYPE_LABELS[type] ?? type,
  },
  {
    title: '현재 상태',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => {
      const statusMap: Record<string, BadgeStatus> = {
        PENDING: 'default',
        ACCEPTED: 'info',
        ASSIGNED: 'warning',
        VISIT_SCHEDULED: 'info',
        IN_PROGRESS: 'warning',
        COMPLETED: 'success',
        REPORT_SUBMITTED: 'info',
        CLOSED: 'default',
        CANCELLED: 'default',
      };
      return (
        <StatusBadge
          status={statusMap[status] ?? 'default'}
          label={AS_STATUS_LABELS[status] ?? status}
        />
      );
    },
  },
  {
    title: '담당 대리점',
    dataIndex: 'dealerName',
    key: 'dealerName',
    width: 120,
    render: (v?: string) => v ?? '미배정',
  },
];

export default function ASRequestPanel({
  data,
  loading,
  showCreateButton,
  onCreateClick,
}: ASRequestPanelProps) {
  const extra = (
    <Space>
      {showCreateButton && (
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onCreateClick}
        >
          A/S 신청하기
        </Button>
      )}
      <Link to="/as-service" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>전체 보기 →</Link>
    </Space>
  );

  return (
    <Card title="미처리 A/S 요청" size="small" loading={loading} extra={extra} style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)' }}>
      {data && data.length > 0 ? (
        <Table
          dataSource={data}
          columns={columns}
          rowKey="requestId"
          size="small"
          pagination={false}
          scroll={{ x: 700 }}
          className="dashboard-table"
        />
      ) : (
        <Empty description="미처리 A/S 요청 없음" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
}
