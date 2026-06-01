import { Card } from 'antd';
import type { RealtimeControllerData } from '../../../types/sensor.types';
import type { StatusLevel } from '../../../utils/constants';
import {
  getConnectionStatusFromEpoch,
  getBoardTempLevel,
  getSparkLevel,
  getPowerStatus,
} from '../../../utils/statusHelper';
import { formatEpoch } from '../../../utils/formatters';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';

function levelToBadge(level: StatusLevel): BadgeStatus {
  if (level === 'green') return 'success';
  if (level === 'yellow') return 'warning';
  return 'danger';
}

function statusLabel(level: StatusLevel): string {
  if (level === 'green') return '정상';
  if (level === 'yellow') return '주의';
  return '위험';
}

interface MetricCardProps {
  name: string;
  value: string | number;
  unit?: string;
  sub?: string;
  level: StatusLevel;
  badge: string;
}

function MetricCard({ name, value, unit, sub, level, badge }: MetricCardProps) {
  return (
    <div className={`sensor-card sensor-card-${level}`}>
      <div className="sensor-card-name">{name}</div>
      <div className="sensor-card-value">{value}</div>
      {unit && <div className="sensor-card-unit">{unit}</div>}
      {sub && <div className="sensor-card-unit" style={{ marginTop: 2 }}>{sub}</div>}
      <div className="sensor-card-badge">
        <StatusBadge status={levelToBadge(level)} label={badge} />
      </div>
    </div>
  );
}

interface Props {
  controllers: RealtimeControllerData[];
  thresholds?: {
    boardTemp?: { yellowMin?: number; redMin?: number };
    spark?: { yellowMin?: number; redMin?: number };
  };
}

export default function ControllerBasicStatusSection({ controllers, thresholds }: Props) {
  if (controllers.length === 0) return null;

  return (
    <Card
      title="장비 기본 상태"
      size="small"
      extra={<span style={{ fontSize: 12, color: '#888' }}>파워팩별 데이터</span>}
    >
      {controllers.map((ctrl, idx) => {
        const sd = ctrl.sensorData;
        const connLevel = getConnectionStatusFromEpoch(sd.timestamp);
        const powerLevel = getPowerStatus(sd.ppPower);
        const tempLevel = getBoardTempLevel(
          sd.ppTemp,
          thresholds?.boardTemp?.yellowMin ?? 60,
          thresholds?.boardTemp?.redMin ?? 80,
        );
        const sparkLevel = getSparkLevel(
          sd.ppSpark,
          thresholds?.spark?.yellowMin ?? 3000,
          thresholds?.spark?.redMin ?? 7000,
        );

        return (
          <div key={ctrl.controllerId} style={{ marginBottom: idx < controllers.length - 1 ? 24 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className={`conn-dot ${connLevel === 'green' ? 'conn-dot-online' : 'conn-dot-offline'}`} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>{ctrl.controllerName}</span>
            </div>
            <div
              className="sensor-grid"
              style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
            >
              <MetricCard
                name="연결 상태"
                value={connLevel === 'green' ? '연결' : '끊김'}
                sub={`마지막: ${formatEpoch(sd.timestamp)}`}
                level={connLevel}
                badge={connLevel === 'green' ? '연결' : '끊김'}
              />
              <MetricCard
                name="전원 상태"
                value={sd.ppPower === 1 ? 'ON' : 'OFF'}
                level={powerLevel}
                badge={sd.ppPower === 1 ? 'ON' : 'OFF'}
              />
              <MetricCard
                name="보드 온도"
                value={sd.ppTemp}
                unit="°C"
                level={tempLevel}
                badge={statusLabel(tempLevel)}
              />
              <MetricCard
                name="스파크"
                value={sd.ppSpark}
                level={sparkLevel}
                badge={statusLabel(sparkLevel)}
              />
            </div>
          </div>
        );
      })}
    </Card>
  );
}
