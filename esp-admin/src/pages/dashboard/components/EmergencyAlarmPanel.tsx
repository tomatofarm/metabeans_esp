import { Badge, Button, Popover, List, Typography, Empty, Space } from 'antd';
import { BellOutlined, WarningOutlined } from '@ant-design/icons';
import StatusBadge from '../../../components/common/StatusBadge';
import { STATUS_COLORS, ALARM_TYPE_LABELS } from '../../../utils/constants';
import { useEmergencyAlarms } from '../../../api/dashboard.api';
import { useAlertStore } from '../../../stores/alertStore';
import type { EmergencyAlarm } from '../../../types/dashboard.types';
import { formatRelativeTime } from '../../../utils/formatters';
import { useEffect } from 'react';

const { Text } = Typography;

interface EmergencyAlarmPanelProps {
  onAlarmClick?: (equipmentId: number) => void;
}

function AlarmItem({ alarm, onClick }: { alarm: EmergencyAlarm; onClick?: () => void }) {
  return (
    <List.Item
      style={{ cursor: 'pointer', padding: '8px 0' }}
      onClick={onClick}
    >
      <List.Item.Meta
        avatar={<WarningOutlined style={{ color: STATUS_COLORS.DANGER.color, fontSize: 18 }} />}
        title={
          <Space size={4}>
            <Text strong style={{ fontSize: 13 }}>{alarm.storeName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {alarm.equipmentName}
            </Text>
          </Space>
        }
        description={
          <div>
            <StatusBadge status="danger" label={ALARM_TYPE_LABELS[alarm.alarmType] ?? alarm.alarmType} />
            <div style={{ fontSize: 12 }}>{alarm.message}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatRelativeTime(alarm.occurredAt)}
            </Text>
          </div>
        }
      />
    </List.Item>
  );
}

export default function EmergencyAlarmPanel({ onAlarmClick }: EmergencyAlarmPanelProps) {
  const { data: alarms } = useEmergencyAlarms();
  const { setAlerts, unreadCount } = useAlertStore();

  // API가 0건이면 스토어도 비움 (없어야 할 때 옛 알람이 남지 않도록)
  useEffect(() => {
    if (alarms === undefined) return;
    setAlerts(
      alarms.map((a: EmergencyAlarm) => ({
        alarmId: a.alarmId,
        storeId: a.storeId,
        equipmentId: a.equipmentId,
        controllerId: a.controllerId,
        alarmType: a.alarmType,
        severity: a.severity,
        message: a.message,
        occurredAt: a.occurredAt,
        status: a.status,
      })),
    );
  }, [alarms, setAlerts]);

  // 로딩 전에는 스토어 건수, 수신 후에는 항상 API 건수(0 포함)
  const count = alarms !== undefined ? alarms.length : unreadCount;

  const content = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ padding: '8px 0 4px', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14 }}>
          긴급 알람 <StatusBadge status="danger" label={`${count}건`} />
        </Text>
        <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
          Red 알람만 표시 (이메일 발송 대상)
        </Text>
      </div>
      {alarms && alarms.length > 0 ? (
        <List
          dataSource={alarms}
          renderItem={(alarm: EmergencyAlarm) => (
            <AlarmItem
              alarm={alarm}
              onClick={() => onAlarmClick?.(alarm.equipmentId)}
            />
          )}
        />
      ) : (
        <Empty
          description="긴급 알람 없음"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: 24 }}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      title={null}
      trigger="click"
      placement="bottomRight"
    >
      <Badge
        count={count}
        size="small"
        style={count > 0 ? {
          background: 'var(--color-danger)',
          fontSize: '0.65rem',
          borderRadius: 9,
          minWidth: 18,
          height: 18,
          lineHeight: '18px',
        } : undefined}
      >
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          className={count > 0 ? 'alarm-shake' : undefined}
          style={count > 0 ? { color: 'var(--color-danger)' } : undefined}
        />
      </Badge>
    </Popover>
  );
}
