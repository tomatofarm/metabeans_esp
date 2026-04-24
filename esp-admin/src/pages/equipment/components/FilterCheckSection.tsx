import { useRef } from 'react';
import { Card } from 'antd';
import { CheckCircleFilled, ExclamationCircleFilled, WarningOutlined } from '@ant-design/icons';
import type { RealtimeControllerData, SensorHistoryDataPoint } from '../../../types/sensor.types';
import type { StatusLevel } from '../../../utils/constants';
import {
  computeSparkWindowAvg,
  getFilterCheckResult,
  FILTER_CHECK_MESSAGE,
} from '../../../utils/statusHelper';

interface CriteriaRowProps {
  met: boolean;
  label: string;
  current: string;
  threshold: string;
}

function CriteriaRow({ met, label, current, threshold }: CriteriaRowProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: met ? '#faad14' : '#52c41a',
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div style={{ color: '#555', lineHeight: 1.6 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <br />
        <span style={{ color: '#888', fontSize: 12 }}>
          현재 {current}&nbsp;/&nbsp;기준 {threshold}
        </span>
      </div>
    </div>
  );
}

interface Props {
  controllers: RealtimeControllerData[];
  historyData: SensorHistoryDataPoint[];
  criteria?: {
    sparkThreshold?: number;
    sparkTimeWindowSec?: number;
    pressureBase?: number;
    pressureRatePercent?: number;
  };
}

export default function FilterCheckSection({ controllers, historyData, criteria }: Props) {
  const prevLevelsRef = useRef<Record<number, StatusLevel>>({});
  const sparkThreshold = criteria?.sparkThreshold ?? 700;
  const sparkWindowSec = criteria?.sparkTimeWindowSec ?? 600;
  const sparkWindowMin = Math.max(1, Math.round(sparkWindowSec / 60));
  const pressureBase = criteria?.pressureBase ?? 20;
  const pressureRate = (criteria?.pressureRatePercent ?? 10) / 100;
  const pressureLimit = parseFloat((pressureBase * (1 + pressureRate)).toFixed(1));

  if (controllers.length === 0) return null;

  return (
    <Card
      title="필터 점검 상태"
      size="small"
      extra={<span style={{ fontSize: 12, color: '#888' }}>파워팩별 데이터</span>}
    >
      {controllers.map((ctrl, idx) => {
        const sd = ctrl.sensorData;
        const sparkAvg = computeSparkWindowAvg(historyData, ctrl.controllerName, sparkWindowMin);
        const result = getFilterCheckResult(sd.diffPressure, sparkAvg, sparkThreshold, pressureBase, pressureRate);

        const prevLevel = prevLevelsRef.current[ctrl.controllerId];
        const showAlert = prevLevel === 'green' && result.level === 'yellow';
        prevLevelsRef.current[ctrl.controllerId] = result.level;

        const isClean = result.level === 'green';

        return (
          <div key={ctrl.controllerId} style={{ marginBottom: idx < controllers.length - 1 ? 20 : 0 }}>
            {/* 컨트롤러명 */}
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#555' }}>
              {ctrl.controllerName}
            </div>

            {/* 상태 전환 경고 메시지 */}
            {showAlert && (
              <div className="filter-alert" style={{ marginBottom: 12 }}>
                <WarningOutlined style={{ fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                <span>{FILTER_CHECK_MESSAGE}</span>
              </div>
            )}

            {/* 본문: 좌 상태카드 + 우 판단기준 */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
              {/* 좌: 청소 상태 카드 */}
              <div
                className={`sensor-card sensor-card-${isClean ? 'green' : 'yellow'}`}
                style={{
                  flex: '0 0 38%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 12px',
                  gap: 6,
                }}
              >
                <div className="sensor-card-name">청소 상태</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isClean
                    ? <CheckCircleFilled style={{ fontSize: 20, color: '#52c41a' }} />
                    : <ExclamationCircleFilled style={{ fontSize: 20, color: '#faad14' }} />}
                  <span style={{ fontWeight: 700, fontSize: 18 }}>
                    {isClean ? '정상' : '청소 필요'}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>
                  필터 차압&nbsp;{sd.diffPressure.toFixed(0)}&nbsp;Pa
                </div>
              </div>

              {/* 우: 판단 기준 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>판단 기준</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <CriteriaRow
                    met={result.sparkConditionMet}
                    label={`스파크 평균 ≥ ${sparkThreshold}`}
                    current={`${Math.round(result.sparkAvg)}`}
                    threshold={`${sparkThreshold} (최근 ${sparkWindowMin}분)`}
                  />
                  <CriteriaRow
                    met={result.pressureConditionMet}
                    label={`차압 ≥ ${pressureLimit} Pa`}
                    current={`${sd.diffPressure.toFixed(1)} Pa`}
                    threshold={`${pressureBase} Pa + ${(pressureRate * 100).toFixed(0)}%`}
                  />
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: '#bbb' }}>
                  ※ 두 조건 동시 충족 시 청소 필요
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  );
}
