import { Card, Typography } from 'antd';
import type { StatusLevel } from '../../utils/constants';
import { getStatusConfig } from '../../utils/statusHelper';

const { Text } = Typography;

interface SensorGaugeProps {
  label: string;
  value: number | string;
  unit?: string;
  level?: StatusLevel;
}

/**
 * 센서 게이지 카드 (스켈레톤 - 상세 구현은 모니터링 화면에서)
 */
export default function SensorGauge({ label, value, unit, level }: SensorGaugeProps) {
  const config = level ? getStatusConfig(level) : null;

  return (
    <Card size="small" style={{ textAlign: 'center' }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Text>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: config?.color ?? '#000',
          margin: '8px 0 4px',
        }}
      >
        {value}
      </div>
      {unit && (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {unit}
        </Text>
      )}
    </Card>
  );
}
