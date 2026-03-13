import { DashboardOutlined } from '@ant-design/icons';
import type { RealtimeMonitoringData } from '../../../types/sensor.types';
import {
  getConnectionStatusFromEpoch,
  propagateStatus,
  getBoardTempLevel,
  getSparkLevel,
  getPM25Level,
  getInletTempLevel,
  getStatusConfig,
} from '../../../utils/statusHelper';
import type { StatusLevel } from '../../../utils/constants';
import { LEVEL_TO_BADGE } from '../../../utils/constants';
import StatusBadge from '../../../components/common/StatusBadge';

interface EquipmentSensorSummaryProps {
  data: RealtimeMonitoringData;
}

export default function EquipmentSensorSummary({ data }: EquipmentSensorSummaryProps) {
  const controllers = data.controllers;

  // 연결 상태 집계
  const onlineCount = controllers.filter(
    (c) => getConnectionStatusFromEpoch(c.sensorData.timestamp) === 'green',
  ).length;
  const totalCount = controllers.length;

  // 각 컨트롤러의 상태 레벨 계산 후 전파
  const controllerStatuses: StatusLevel[] = controllers.map((c) => {
    const sd = c.sensorData;
    return propagateStatus([
      getConnectionStatusFromEpoch(sd.timestamp),
      sd.ppPower === 1 ? 'green' : 'red',
      getBoardTempLevel(sd.ppTemp),
      getSparkLevel(sd.ppSpark),
      getPM25Level(sd.pm25),
      getInletTempLevel(sd.inletTemp),
    ]);
  });
  const equipmentStatus = propagateStatus(controllerStatuses);
  const statusConfig = getStatusConfig(equipmentStatus);

  // 최고/평균 센서값
  const maxPpTemp = Math.max(...controllers.map((c) => c.sensorData.ppTemp));
  const maxSpark = Math.max(...controllers.map((c) => c.sensorData.ppSpark));
  const avgPm25 =
    controllers.reduce((sum, c) => sum + c.sensorData.pm25, 0) / (controllers.length || 1);
  const maxInletTemp = Math.max(...controllers.map((c) => c.sensorData.inletTemp));

  const connLevel: StatusLevel = onlineCount === totalCount ? 'green' : onlineCount > 0 ? 'yellow' : 'red';
  const boardTempLvl = getBoardTempLevel(maxPpTemp);
  const sparkLvl = getSparkLevel(maxSpark);
  const pm25Lvl = getPM25Level(avgPm25);
  const inletTempLvl = getInletTempLevel(maxInletTemp);

  const items: { label: string; value: string; level: StatusLevel; statusLabel: string }[] = [
    { label: '연결 상태', value: `${onlineCount} / ${totalCount}대`, level: connLevel, statusLabel: getStatusConfig(connLevel).label },
    { label: '최고 보드온도', value: `${maxPpTemp}°C`, level: boardTempLvl, statusLabel: getStatusConfig(boardTempLvl).label },
    { label: '최고 스파크', value: String(maxSpark), level: sparkLvl, statusLabel: getStatusConfig(sparkLvl).label },
    { label: 'PM2.5 평균', value: `${avgPm25.toFixed(1)} µg/m³`, level: pm25Lvl, statusLabel: getStatusConfig(pm25Lvl).label },
    { label: '최고 유입온도', value: `${maxInletTemp.toFixed(1)}°C`, level: inletTempLvl, statusLabel: getStatusConfig(inletTempLvl).label },
    { label: '종합 상태', value: statusConfig.label, level: equipmentStatus, statusLabel: data.storeName },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <DashboardOutlined style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>장비 요약 — {data.equipmentName}</span>
        <StatusBadge status={LEVEL_TO_BADGE[equipmentStatus]} label={statusConfig.label} />
      </div>
      <div className="status-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {items.map((item) => (
          <div key={item.label} className={`status-card status-card-${item.level}`}>
            <div className="status-card-label">{item.label}</div>
            <div className="status-card-value">{item.value}</div>
            <div className={`status-card-status status-card-status-${item.level}`}>{item.statusLabel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
