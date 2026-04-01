import { Card } from 'antd';
import type { RealtimeControllerData } from '../../../types/sensor.types';
import type { StatusLevel } from '../../../utils/constants';
import { getInletTempLevel } from '../../../utils/statusHelper';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';

function levelToBadge(level: StatusLevel): BadgeStatus {
  if (level === 'green') return 'success';
  if (level === 'yellow') return 'warning';
  return 'danger';
}

function inletTempLabel(level: StatusLevel): string {
  if (level === 'green') return '정상';
  if (level === 'yellow') return '주의';
  return '위험';
}

interface MetricCardProps {
  name: string;
  value: string | number;
  unit?: string;
  level?: StatusLevel;
  badge?: string;
}

function MetricCard({ name, value, unit, level, badge }: MetricCardProps) {
  const cardClass = level ? `sensor-card sensor-card-${level}` : 'sensor-card sensor-card-default';
  return (
    <div className={cardClass}>
      <div className="sensor-card-name">{name}</div>
      <div className="sensor-card-value">{value}</div>
      {unit && <div className="sensor-card-unit">{unit}</div>}
      {badge && level && (
        <div className="sensor-card-badge">
          <StatusBadge status={levelToBadge(level)} label={badge} />
        </div>
      )}
    </div>
  );
}

interface Props {
  controllers: RealtimeControllerData[];
}

export default function FireSensorSection({ controllers }: Props) {
  if (controllers.length === 0) return null;

  return (
    <Card
      title="화재 감지 센서"
      size="small"
      extra={<span style={{ fontSize: 12, color: '#888' }}>파워팩별 데이터</span>}
    >
      {controllers.map((ctrl, idx) => {
        const sd = ctrl.sensorData;
        const tempLevel = getInletTempLevel(sd.inletTemp);

        return (
          <div key={ctrl.controllerId} style={{ marginBottom: idx < controllers.length - 1 ? 24 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{ctrl.controllerName}</span>
            </div>
            <div
              className="sensor-grid"
              style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
              {/* 순서: 유입온도 → 풍량 → 풍속 → 압력 */}
              <MetricCard
                name="유입온도"
                value={sd.inletTemp.toFixed(1)}
                unit="°C"
                level={tempLevel}
                badge={inletTempLabel(tempLevel)}
              />
              <MetricCard
                name="풍량"
                value={sd.flow.toFixed(1)}
                unit="CMH"
              />
              <MetricCard
                name="풍속"
                value={sd.velocity.toFixed(1)}
                unit="m/s"
              />
              <MetricCard
                name="압력"
                value={sd.ductDp.toFixed(1)}
                unit="Pa"
              />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
