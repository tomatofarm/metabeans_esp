import { Card, Space, Typography } from 'antd';
import type { GatewaySensorData } from '../../types/sensor.types';
import StatusBadge from './StatusBadge';
import type { BadgeStatus } from './StatusBadge';
import { getIAQLevel } from '../../utils/statusHelper';

const { Text } = Typography;

function levelToBadge(level: ReturnType<typeof getIAQLevel>): { status: BadgeStatus; label: string } {
  switch (level) {
    case 'green':
      return { status: 'success', label: '좋음' };
    case 'yellow':
      return { status: 'warning', label: '보통' };
    case 'red':
      return { status: 'danger', label: '나쁨' };
    default:
      return { status: 'default', label: '—' };
  }
}

export default function NearbyAirQualityCard({ data }: { data?: GatewaySensorData | null }) {
  if (!data) {
    return <Card title="근처 대기질 정보" size="small">데이터 없음</Card>;
  }

  const pm25Level = getIAQLevel('pm2_5', data.pm2_5);
  const pm10Level = getIAQLevel('pm10', data.pm10);

  const pm25Badge = levelToBadge(pm25Level);
  const pm10Badge = levelToBadge(pm10Level);

  return (
    <Card
      title="근처 대기질 정보"
      size="small"
      extra={<span className="live-badge">● LIVE</span>}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>PM2.5</Text>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 700 }}>{data.pm2_5.toFixed(1)}</Text>
            <Text type="secondary">µg/m³</Text>
            <StatusBadge status={pm25Badge.status} label={pm25Badge.label} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>PM10</Text>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 700 }}>{data.pm10.toFixed(1)}</Text>
            <Text type="secondary">µg/m³</Text>
            <StatusBadge status={pm10Badge.status} label={pm10Badge.label} />
          </div>
        </div>
      </Space>
    </Card>
  );
}

