import { Card } from 'antd';
import type { RealtimeControllerData } from '../../../types/sensor.types';
import type { StatusLevel } from '../../../utils/constants';
import { getPM25Level, getPM10Level } from '../../../utils/statusHelper';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';

function levelToBadge(level: StatusLevel): BadgeStatus {
  if (level === 'green') return 'success';
  if (level === 'yellow') return 'warning';
  return 'danger';
}

function pmLabel(level: StatusLevel): string {
  if (level === 'green') return '좋음';
  if (level === 'yellow') return '보통';
  return '점검 필요';
}

interface MetricCardProps {
  name: string;
  subLabel: string;
  value: string;
  unit: string;
  level: StatusLevel;
}

function MetricCard({ name, subLabel, value, unit, level }: MetricCardProps) {
  return (
    <div className={`sensor-card sensor-card-${level}`}>
      <div className="sensor-card-name">{name}</div>
      <div className="sensor-card-unit" style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
        {subLabel}
      </div>
      <div className="sensor-card-value">{value}</div>
      <div className="sensor-card-unit">{unit}</div>
      <div className="sensor-card-badge">
        <StatusBadge status={levelToBadge(level)} label={pmLabel(level)} />
      </div>
    </div>
  );
}

interface Props {
  controllers: RealtimeControllerData[];
  pm25Threshold?: { yellowMin?: number; redMin?: number };
  pm10Threshold?: { yellowMin?: number; redMin?: number };
}

export default function DustRemovalSection({ controllers, pm25Threshold, pm10Threshold }: Props) {
  if (controllers.length === 0) return null;

  return (
    <Card
      title="먼지 제거 성능"
      size="small"
      extra={<span style={{ fontSize: 12, color: '#888' }}>파워팩별 데이터</span>}
    >
      {controllers.map((ctrl, idx) => {
        const sd = ctrl.sensorData;
        const pm25Level = getPM25Level(
          sd.pm25,
          pm25Threshold?.yellowMin ?? 35,
          pm25Threshold?.redMin ?? 75,
        );
        const pm10Level = getPM10Level(
          sd.pm10,
          pm10Threshold?.yellowMin ?? 75,
          pm10Threshold?.redMin ?? 100,
        );

        return (
          <div
            key={ctrl.controllerId}
            style={{ marginBottom: idx < controllers.length - 1 ? 24 : 0 }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#555' }}>
              {ctrl.controllerName}
            </div>
            <div className="sensor-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <MetricCard
                name="PM2.5"
                subLabel="PM2.5 측정값"
                value={sd.pm25.toFixed(1)}
                unit="µg/m³"
                level={pm25Level}
              />
              <MetricCard
                name="PM10"
                subLabel="PM10 측정값"
                value={sd.pm10.toFixed(1)}
                unit="µg/m³"
                level={pm10Level}
              />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
