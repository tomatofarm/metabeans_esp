import { useEffect, useState } from 'react';
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
import type {
  MonitoringThreshold,
  DamperAutoSetting,
  ThresholdSettings,
} from '../../types/system.types';

const { Text } = Typography;

// Icon mapping for threshold metric names
const METRIC_ICON_MAP: Record<string, { icon: React.ReactNode; className: string }> = {
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

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(localData);
      message.success('기준수치가 저장되었습니다.');
    } catch {
      message.error('기준수치 저장에 실패했습니다.');
    }
  };

  const handleReset = () => {
    if (response?.data) {
      setLocalData(JSON.parse(JSON.stringify(response.data)));
      message.info('원래 값으로 복원되었습니다.');
    }
  };

  const damperColumns: ColumnsType<DamperAutoSetting> = [
    {
      title: '장비',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 200,
      render: (text: string, record) => (
        <Text strong={record.equipmentId === 0}>{text}</Text>
      ),
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
              자동 제어 모드에서 사용되는 목표 풍량(CMH)과 목표 풍속(m/s) 기본값입니다.
            </div>
          </div>
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
            key={ct.thresholdId}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <div className="threshold-input-group">
              <div className="threshold-input-label">스파크 임계값 (0-99)</div>
              <div className="threshold-input-wrap">
                <InputNumber
                  value={ct.sparkThreshold}
                  onChange={(v) => {
                    setLocalData((prev) => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        cleaningThresholds: prev.cleaningThresholds.map((t) =>
                          t.thresholdId === ct.thresholdId
                            ? { ...t, sparkThreshold: v ?? 70 }
                            : t,
                        ),
                      };
                    });
                  }}
                  min={0}
                  max={99}
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
                          t.thresholdId === ct.thresholdId
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
                          t.thresholdId === ct.thresholdId
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
                          t.thresholdId === ct.thresholdId
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
