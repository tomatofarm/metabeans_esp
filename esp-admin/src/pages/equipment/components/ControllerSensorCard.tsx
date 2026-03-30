import { Card, Descriptions } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import StatusBadge from '../../../components/common/StatusBadge';
import type { RealtimeControllerData } from '../../../types/sensor.types';
import type { StatusLevel } from '../../../utils/constants';
import { FAN_SPEED_LABELS, LEVEL_TO_BADGE } from '../../../utils/constants';
import {
  getConnectionStatusFromEpoch,
  getPowerStatus,
  getBoardTempLevel,
  getSparkLevel,
  getPM25Level,
  getPM10Level,
  getFilterCheckLevel,
  getInletTempLevel,
  getStatusConfig,
  propagateStatus,
  FILTER_CHECK_MESSAGE,
  getOilLevelStatus,
} from '../../../utils/statusHelper';
import {
  formatTemp,
  formatFlow,
  formatVelocity,
  formatPressure,
  formatNumber,
} from '../../../utils/formatters';

interface ControllerSensorCardProps {
  controller: RealtimeControllerData;
  previousFilterStatus?: StatusLevel;
}

function SensorItem({
  label,
  value,
  level,
  suffix,
}: {
  label: string;
  value: string | number;
  level?: StatusLevel;
  suffix?: string;
}) {
  const bgClass = level ? `sensor-card-${level}` : 'sensor-card-default';
  return (
    <div className={`sensor-card ${bgClass}`}>
      <div className="sensor-card-name">{label}</div>
      <div className="sensor-card-value">{value}</div>
      {suffix && <span className="sensor-card-unit">{suffix}</span>}
      {level && (
        <div className="sensor-card-badge">
          <StatusBadge status={LEVEL_TO_BADGE[level]} label={getStatusConfig(level).label} />
        </div>
      )}
    </div>
  );
}

export default function ControllerSensorCard({
  controller,
  previousFilterStatus,
}: ControllerSensorCardProps) {
  const { sensorData: sd, controllerName } = controller;

  // 상태 판정
  const connectionLevel = getConnectionStatusFromEpoch(sd.timestamp);
  const powerLevel = getPowerStatus(sd.ppPower);
  const boardTempLevel = getBoardTempLevel(sd.ppTemp);
  const sparkLevel = getSparkLevel(sd.ppSpark);
  const pm25Level = getPM25Level(sd.pm25);
  const pm10Level = getPM10Level(sd.pm10);
  const filterLevel = getFilterCheckLevel(sd.diffPressure);
  const inletTempLevel = getInletTempLevel(sd.inletTemp);

  // 전체 컨트롤러 상태 (상태 전파)
  const overallStatus = propagateStatus([
    connectionLevel,
    powerLevel,
    boardTempLevel,
    sparkLevel,
    pm25Level,
    pm10Level,
    filterLevel,
    inletTempLevel,
  ]);
  const overallConfig = getStatusConfig(overallStatus);

  // 필터 상태 변경 알림 (정상 → 점검 필요)
  const showFilterAlert = previousFilterStatus === 'green' && filterLevel === 'yellow';

  return (
    <Card
      size="small"
      title={
        <span>
          <ThunderboltOutlined style={{ marginRight: 6 }} />
          {controllerName}
        </span>
      }
      extra={
        <StatusBadge status={LEVEL_TO_BADGE[overallStatus]} label={overallConfig.label} />
      }
      style={{ marginBottom: 16 }}
    >
      {showFilterAlert && (
        <div className="filter-alert">
          {FILTER_CHECK_MESSAGE}
        </div>
      )}

      {/* 연결/전원 상태 + 제어 모드 */}
      <Descriptions size="small" column={4} style={{ marginBottom: 12 }}>
        <Descriptions.Item label="연결 상태">
          {connectionLevel === 'green' ? (
            <StatusBadge status="success" label="연결" />
          ) : (
            <StatusBadge status="danger" label="끊김" />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="전원 상태">
          {powerLevel === 'green' ? (
            <StatusBadge status="success" label="ON" />
          ) : (
            <StatusBadge status="default" label="OFF" />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="팬 모드">
          <StatusBadge status={sd.fanMode === 1 ? 'info' : 'default'} label={sd.fanMode === 1 ? '자동' : `수동${sd.fanMode === 0 ? ` (${FAN_SPEED_LABELS[sd.fanSpeed] ?? 'OFF'})` : ''}`} />
          {sd.fanRunning === 1 && (
            <span style={{ marginLeft: 4 }}><StatusBadge status="info" label={`운전중 ${sd.fanFreq.toFixed(2)}Hz`} /></span>
          )}
          {sd.fanMode === 1 && (
            <span style={{ marginLeft: 4 }}><StatusBadge status="info" label={`목표 ${sd.fanTargetPct.toFixed(1)}%`} /></span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="댐퍼 모드">
          <StatusBadge status={sd.damperMode === 1 ? 'info' : 'default'} label={sd.damperMode === 1 ? '자동' : `수동 (${formatNumber(sd.damper, 1)}%)`} />
          {sd.damperCtrl !== undefined && (
            <span style={{ marginLeft: 4 }}><StatusBadge status="info" label={`명령 ${formatNumber(sd.damperCtrl, 1)}%`} /></span>
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* 센서 데이터 그리드 */}
      <div className="sensor-grid">
        <SensorItem label="보드 온도" value={formatTemp(sd.ppTemp, 0)} level={boardTempLevel} />
        <SensorItem label="스파크" value={sd.ppSpark} level={sparkLevel} />
        <SensorItem label="PM2.5" value={formatNumber(sd.pm25, 1)} level={pm25Level} suffix="µg/m³" />
        <SensorItem label="PM10" value={formatNumber(sd.pm10, 1)} level={pm10Level} suffix="µg/m³" />
        <SensorItem
          label="필터 점검"
          value={filterLevel === 'green' ? '정상' : '점검 필요'}
          level={filterLevel}
          suffix={`${formatNumber(sd.diffPressure, 1)} Pa`}
        />
        <SensorItem label="유입 온도" value={formatTemp(sd.inletTemp, 1)} level={inletTempLevel} />
        <SensorItem label="풍량" value={formatFlow(sd.flow)} />
        <SensorItem label="풍속" value={formatVelocity(sd.velocity)} />
        <SensorItem label="덕트 차압" value={formatPressure(sd.ductDp)} />
        <SensorItem
          label="오일 만수"
          value={getOilLevelStatus(sd.oilLevel).label}
          level={getOilLevelStatus(sd.oilLevel).level}
        />
      </div>
    </Card>
  );
}
