import { Card, Button, Empty, Space, Tag, Typography } from 'antd';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ASRequestListItem } from '../../../types/as-service.types';
import type { ASStatus } from '../../../types/as-service.types';
import { FAULT_TYPE_LABELS } from '../../../utils/constants';

interface ASRequestPanelProps {
  data?: ASRequestListItem[];
  loading?: boolean;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

function visitOrPreferredDate(item: ASRequestListItem): string | undefined {
  const v = item.visitScheduledDatetime ?? item.preferredVisitDatetime;
  return v ? dayjs(v).format('YYYY-MM-DD') : undefined;
}

function timelineSubText(item: ASRequestListItem): string {
  const received = dayjs(item.createdAt).format('YYYY-MM-DD');
  let s = `${received} 접수`;
  const visit = visitOrPreferredDate(item);
  if (visit && !['COMPLETED', 'CLOSED', 'CANCELLED'].includes(item.status)) {
    s += ` | 방문예정: ${visit}`;
  }
  const doneAt =
    item.completedAt ??
    (['COMPLETED', 'CLOSED'].includes(item.status) ? item.updatedAt : undefined);
  if (doneAt) {
    s += ` | 완료: ${dayjs(doneAt).format('YYYY-MM-DD')}`;
  }
  return s;
}

function statusChip(status: ASStatus): { label: string; color: string } {
  if (['COMPLETED', 'CLOSED'].includes(status)) {
    return { label: '완료', color: 'success' };
  }
  if (['CANCELLED'].includes(status)) {
    return { label: '취소', color: 'default' };
  }
  if (['PENDING', 'ACCEPTED'].includes(status)) {
    return { label: '접수 대기', color: 'warning' };
  }
  return { label: '방문 예정', color: 'blue' };
}

function itemTitle(item: ASRequestListItem): string {
  const fault = FAULT_TYPE_LABELS[item.faultType] ?? item.faultType;
  const equip = item.equipmentName?.trim() || '장비';
  return `${equip} ${fault} 점검`;
}

export default function ASRequestPanel({
  data,
  loading,
  showCreateButton,
  onCreateClick,
}: ASRequestPanelProps) {
  const navigate = useNavigate();

  const extra = (
    <Space>
      {showCreateButton && (
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onCreateClick}>
          A/S 신청
        </Button>
      )}
      <Link to="/as-service" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
        전체 보기 →
      </Link>
    </Space>
  );

  return (
    <Card
      loading={loading}
      size="small"
      style={{ borderRadius: 16, boxShadow: 'var(--card-shadow)', height: '100%' }}
      styles={{ body: { padding: '12px 16px 16px' } }}
      title={
        <Space size={8}>
          <ToolOutlined style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontWeight: 700 }}>A/S 요청 현황</span>
          <Tag>전체</Tag>
        </Space>
      }
      extra={extra}
    >
      {data && data.length > 0 ? (
        <div className="as-request-status-list">
          {data.map((item) => {
            const chip = statusChip(item.status);
            return (
              <div
                key={item.requestId}
                className="as-request-status-item"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/as-service', { state: { focusRequestId: item.requestId } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate('/as-service', { state: { focusRequestId: item.requestId } });
                  }
                }}
              >
                <div className="as-request-status-item-body">
                  <Typography.Text type="secondary" className="as-request-status-store" ellipsis>
                    {item.storeName}
                  </Typography.Text>
                  <div className="as-request-status-title-row">
                    <Typography.Text strong className="as-request-status-title">
                      {itemTitle(item)}
                    </Typography.Text>
                    <Tag color={chip.color}>{chip.label}</Tag>
                  </div>
                  <Typography.Text type="secondary" className="as-request-status-meta">
                    {timelineSubText(item)}
                  </Typography.Text>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty description="A/S 요청이 없습니다." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  );
}
