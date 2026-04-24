import { useEffect, useState, type ReactNode } from 'react';
import {
  InputNumber,
  Button,
  Slider,
  Table,
  message,
  Spin,
  Typography,
  Space,
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  RiseOutlined,
  FireOutlined,
  CloudOutlined,
  ExperimentOutlined,
  ControlOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useThresholdSettings, useUpdateThresholds } from '../../api/system.api';
import type { DamperAutoSetting, ThresholdSettings } from '../../types/system.types';
import {
  DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH,
  DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS,
} from '../../types/system.types';

const { Text } = Typography;
const DEFAULT_SPARK_BASE_TIME_SEC = 600;
const DEFAULT_CLEANING_THRESHOLD = {
  sparkThreshold: 700,
  sparkTimeWindow: 600,
  pressureBase: 20,
  pressureRate: 10,
} as const;
const DEFAULT_MONITORING_BY_NAME: Record<string, { yellowMin?: number; redMin?: number }> = {
  '보드 온도': { yellowMin: 60, redMin: 80 },
  '스파크': { yellowMin: 30, redMin: 60 },
  'PM2.5': { yellowMin: 35, redMin: 75 },
  'PM10': { yellowMin: 75, redMin: 100 },
  '차압 (필터 점검)': { yellowMin: 30, redMin: undefined },
  '유입 온도': { yellowMin: 70, redMin: 100 },
};

// Icon mapping for threshold metric names
const METRIC_ICON_MAP: Record<string, { icon: ReactNode; className: string }> = {
  '스파크':       { icon: <ThunderboltOutlined />, className: 'spark' },
  '차압':         { icon: <DashboardOutlined />,   className: 'pressure' },
  '변화율':       { icon: <RiseOutlined />,        className: 'rate' },
  '유입온도':     { icon: <FireOutlined />,         className: 'inlet-temp' },
  'PM2.5':       { icon: <CloudOutlined />,        className: 'pm25' },
  'PM10':        { icon: <ExperimentOutlined />,   className: 'pm10' },
};

function getMetricIcon(name: string) {
  for (const [key, val] of Object.entries(METRIC_ICON_MAP)) {
    if (name.includes(key)) return val;
  }
  return { icon: <DashboardOutlined />, className: 'pressure' };
}

export default function SystemThresholdTab() {
  const { data: response, isLoading } = useThresholdSettings();
  const updateMutation = useUpdateThresholds();

  const [localData, setLocalData] = useState<ThresholdSettings | null>(null);
  const [bulkDamperFlow, setBulkDamperFlow] = useState<number>(
    DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH,
  );
  const [bulkDamperVelocity, setBulkDamperVelocity] = useState<number>(
    DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS,
  );

  useEffect(() => {
    if (response?.data) {
      setLocalData(JSON.parse(JSON.stringify(response.data)));
    }
  }, [response]);

  if (isLoading || !localData) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleMonitoringChange = (
    thresholdId: number,
    field: 'yellowMin' | 'redMin',
    value: number | null,
  ) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        monitoringThresholds: prev.monitoringThresholds.map((t) =>
          t.thresholdId === thresholdId
            ? { ...t, [field]: value ?? undefined }
            : t,
        ),
      };
    });
  };

  const handleSparkBaseTimeChange = (value: number | null) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return { ...prev, sparkBaseTime: value ?? 600 };
    });
  };

  const handleDamperAutoChange = (
    settingId: number,
    field: 'targetFlowCmh' | 'targetVelocity',
    value: number | null,
  ) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        damperAutoSettings: prev.damperAutoSettings.map((s) =>
          s.settingId === settingId ? { ...s, [field]: value ?? 0 } : s,
        ),
      };
    });
  };

  const applyBulkDamperToAll = () => {
    const flow = bulkDamperFlow ?? DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH;
    const vel = bulkDamperVelocity ?? DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS;
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        damperAutoSettings: prev.damperAutoSettings.map((s) => ({
          ...s,
          targetFlowCmh: flow,
          targetVelocity: vel,
        })),
      };
    });
    message.success('입력한 값을 모든 집진기에 적용했습니다.');
  };

  const resetAllDamperToSystemDefault = () => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        damperAutoSettings: prev.damperAutoSettings.map((s) => ({
          ...s,
          targetFlowCmh: DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH,
          targetVelocity: DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS,
        })),
      };
    });
    message.info(
      '모든 집진기를 시스템 기본값으로 되돌렸습니다. 저장 시 서버에 반영됩니다.',
    );
  };

  const resetOneDamperToSystemDefault = (settingId: number) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        damperAutoSettings: prev.damperAutoSettings.map((s) =>
          s.settingId === settingId
            ? {
                ...s,
                targetFlowCmh: DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH,
                targetVelocity: DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS,
              }
            : s,
        ),
      };
    });
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(localData);
      message.success('기준수치가 저장되었습니다.');
    } catch {
      message.error('기준수치 저장에 실패했습니다.');
    }
  };

  const handleReset = () => {
    setLocalData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        monitoringThresholds: prev.monitoringThresholds.map((t) => {
          const d = DEFAULT_MONITORING_BY_NAME[t.metricName];
          if (!d) return t;
          return {
            ...t,
            yellowMin: d.yellowMin,
            redMin: d.redMin,
          };
        }),
        sparkBaseTime: DEFAULT_SPARK_BASE_TIME_SEC,
        damperAutoSettings: prev.damperAutoSettings.map((s) => ({
          ...s,
          targetFlowCmh: DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH,
          targetVelocity: DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS,
        })),
        cleaningThresholds: prev.cleaningThresholds.map((c) => ({
          ...c,
          sparkThreshold: DEFAULT_CLEANING_THRESHOLD.sparkThreshold,
          sparkTimeWindow: DEFAULT_CLEANING_THRESHOLD.sparkTimeWindow,
          pressureBase: DEFAULT_CLEANING_THRESHOLD.pressureBase,
          pressureRate: DEFAULT_CLEANING_THRESHOLD.pressureRate,
        })),
      };
    });
    message.info('기본값으로 복원되었습니다. 저장 시 서버에 반영됩니다.');
  };

  const damperColumns: ColumnsType<DamperAutoSetting> = [
    {
      title: '매장 · 집진기',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 280,
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: '목표 풍량 (CMH)',
      key: 'targetFlowCmh',
      width: 200,
      render: (_, record) => (
        <InputNumber
          value={record.targetFlowCmh}
          onChange={(v) => handleDamperAutoChange(record.settingId, 'targetFlowCmh', v)}
          min={0}
          max={2000}
          step={10}
          style={{ width: 150 }}
          addonAfter="CMH"
        />
      ),
    },
    {
      title: '목표 풍속 (m/s)',
      key: 'targetVelocity',
      width: 200,
      render: (_, record) => (
        <InputNumber
          value={record.targetVelocity}
          onChange={(v) => handleDamperAutoChange(record.settingId, 'targetVelocity', v)}
          min={0}
          max={20}
          step={0.1}
          style={{ width: 150 }}
          addonAfter="m/s"
        />
      ),
    },
    {
      title: '작업',
      key: 'resetRow',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            resetOneDamperToSystemDefault(record.settingId);
            message.success('이 집진기만 시스템 기본값으로 맞췄습니다.');
          }}
        >
          기본값으로
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header with action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text type="secondary">장비 상태 판정에 사용되는 기준값을 관리합니다.</Text>
        <Space>
          <Button icon={<UndoOutlined />} onClick={handleReset}>
            기본값 복원
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={updateMutation.isPending}
            style={{ padding: '8px 32px', height: 'auto' }}
          >
            저장
          </Button>
        </Space>
      </div>

      {/* 모니터링 지표 기준값 — 카드 그리드 */}
      <div className="threshold-grid">
        {localData.monitoringThresholds.map((t) => {
          const iconInfo = getMetricIcon(t.metricName);
          return (
            <div key={t.thresholdId} className="threshold-card">
              <div className="threshold-card-header">
                <div className={`threshold-icon ${iconInfo.className}`}>
                  {iconInfo.icon}
                </div>
                <div>
                  <div className="threshold-card-name">{t.metricName}</div>
                  <div className="threshold-card-desc">{t.description || `단위: ${t.unit}`}</div>
                </div>
              </div>

              {t.yellowMin !== undefined && (
                <div className="threshold-input-group">
                  <div className="threshold-input-label">주의 기준 (Yellow)</div>
                  <div className="threshold-input-wrap">
                    <InputNumber
                      value={t.yellowMin}
                      onChange={(v) => handleMonitoringChange(t.thresholdId, 'yellowMin', v)}
                      min={0}
                      style={{ width: '100%' }}
                      addonAfter={t.unit}
                    />
                  </div>
                </div>
              )}

              {t.redMin !== undefined && (
                <div className="threshold-input-group">
                  <div className="threshold-input-label">위험 기준 (Red)</div>
                  <div className="threshold-input-wrap">
                    <InputNumber
                      value={t.redMin}
                      onChange={(v) => handleMonitoringChange(t.thresholdId, 'redMin', v)}
                      min={0}
                      style={{ width: '100%' }}
                      addonAfter={t.unit}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 스파크 기준 시간 */}
      <div className="threshold-card" style={{ marginBottom: 20 }}>
        <div className="threshold-card-header">
          <div className="threshold-icon spark">
            <ThunderboltOutlined />
          </div>
          <div>
            <div className="threshold-card-name">튜닝 변수 — 스파크 기준 시간</div>
            <div className="threshold-card-desc">
              스파크가 이 시간(초) 이상 연속 발생 시 알람이 트리거됩니다.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text>기준 시간:</Text>
          <Slider
            value={localData.sparkBaseTime}
            onChange={handleSparkBaseTimeChange}
            min={60}
            max={3600}
            step={60}
            style={{ flex: 1, maxWidth: 400 }}
            marks={{
              60: '1분',
              300: '5분',
              600: '10분',
              1200: '20분',
              1800: '30분',
              3600: '60분',
            }}
          />
          <InputNumber
            value={localData.sparkBaseTime}
            onChange={handleSparkBaseTimeChange}
            min={60}
            max={3600}
            step={60}
            style={{ width: 120 }}
            addonAfter="초"
          />
          <Text type="secondary">
            ({Math.floor(localData.sparkBaseTime / 60)}분)
          </Text>
        </div>
      </div>

      {/* 댐퍼 자동제어 기본값 */}
      <div className="threshold-card" style={{ marginBottom: 20 }}>
        <div className="threshold-card-header">
          <div className="threshold-icon damper">
            <ControlOutlined />
          </div>
          <div>
            <div className="threshold-card-name">댐퍼/팬 자동제어 기본값</div>
            <div className="threshold-card-desc">
              집진기별로 값을 바꿀 수 있고, 위 일괄 입력으로 전체에 동일 값을 한 번에 넣을 수 있습니다. 행의 「기본값으로」는 해당 집진기만 시스템 기본(
              {DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH} CMH / {DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS}{' '}
              m/s)으로 되돌립니다.
            </div>
          </div>
        </div>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <Text strong>일괄 적용</Text>
          <Space size={8} wrap>
            <InputNumber
              value={bulkDamperFlow}
              onChange={(v) => setBulkDamperFlow(v ?? DAMPER_AUTO_SYSTEM_DEFAULT_FLOW_CMH)}
              min={0}
              max={2000}
              step={10}
              style={{ width: 150 }}
              addonBefore="풍량"
              addonAfter="CMH"
            />
            <InputNumber
              value={bulkDamperVelocity}
              onChange={(v) =>
                setBulkDamperVelocity(v ?? DAMPER_AUTO_SYSTEM_DEFAULT_VELOCITY_MS)
              }
              min={0}
              max={20}
              step={0.1}
              style={{ width: 150 }}
              addonBefore="풍속"
              addonAfter="m/s"
            />
            <Button type="primary" onClick={applyBulkDamperToAll}>
              모든 집진기에 적용
            </Button>
            <Button onClick={resetAllDamperToSystemDefault}>전체 시스템 기본값</Button>
          </Space>
        </div>
        <Table
          className="system-table"
          columns={damperColumns}
          dataSource={localData.damperAutoSettings}
          rowKey="settingId"
          pagination={false}
          size="small"
        />
      </div>

      {/* 청소/필터 판단 기준 */}
      <div className="threshold-card">
        <div className="threshold-card-header">
          <div className="threshold-icon cleaning">
            <ClearOutlined />
          </div>
          <div>
            <div className="threshold-card-name">청소/필터 판단 기준</div>
            <div className="threshold-card-desc">
              필터 청소 필요 여부를 판단하는 기준값입니다. (기본 장비 전체 적용)
            </div>
          </div>
        </div>
        {localData.cleaningThresholds.map((ct) => (
          <div
            key={`${ct.equipmentId}-${ct.thresholdId}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {ct.equipmentDisplayName ? (
              <div style={{ gridColumn: '1 / -1', marginBottom: 4 }}>
                <Text strong>{ct.equipmentDisplayName}</Text>
              </div>
            ) : null}
            <div className="threshold-input-group">
              <div className="threshold-input-label">스파크 임계값 (0-9999, pp_spark 스케일)</div>
              <div className="threshold-input-wrap">
                <InputNumber
                  value={ct.sparkThreshold}
                  onChange={(v) => {
                    setLocalData((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        cleaningThresholds: prev.cleaningThresholds.map((t) =>
                          t.equipmentId === ct.equipmentId
                            ? { ...t, sparkThreshold: v ?? 700 }
                            : t,
                        ),
                      };
                    });
                  }}
                  min={0}
                  max={9999}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="threshold-input-group">
              <div className="threshold-input-label">스파크 시간 창 (초)</div>
              <div className="threshold-input-wrap">
                <InputNumber
                  value={ct.sparkTimeWindow}
                  onChange={(v) => {
                    setLocalData((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        cleaningThresholds: prev.cleaningThresholds.map((t) =>
                          t.equipmentId === ct.equipmentId
                            ? { ...t, sparkTimeWindow: v ?? 600 }
                            : t,
                        ),
                      };
                    });
                  }}
                  min={60}
                  max={3600}
                  step={60}
                  style={{ width: '100%' }}
                  addonAfter="초"
                />
              </div>
            </div>
            <div className="threshold-input-group">
              <div className="threshold-input-label">차압 기준 (Pa)</div>
              <div className="threshold-input-wrap">
                <InputNumber
                  value={ct.pressureBase}
                  onChange={(v) => {
                    setLocalData((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        cleaningThresholds: prev.cleaningThresholds.map((t) =>
                          t.equipmentId === ct.equipmentId
                            ? { ...t, pressureBase: v ?? undefined }
                            : t,
                        ),
                      };
                    });
                  }}
                  min={0}
                  style={{ width: '100%' }}
                  addonAfter="Pa"
                />
              </div>
            </div>
            <div className="threshold-input-group">
              <div className="threshold-input-label">차압 증가율 (%)</div>
              <div className="threshold-input-wrap">
                <InputNumber
                  value={ct.pressureRate}
                  onChange={(v) => {
                    setLocalData((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        cleaningThresholds: prev.cleaningThresholds.map((t) =>
                          t.equipmentId === ct.equipmentId
                            ? { ...t, pressureRate: v ?? 10 }
                            : t,
                        ),
                      };
                    });
                  }}
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  addonAfter="%"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
