import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Button, Table, Space, Spin, Empty, Typography,
  InputNumber, Descriptions, message,
} from 'antd';
import {
  WarningOutlined, SwapOutlined,
} from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge';
import type { ColumnsType } from 'antd/es/table';
import { useUiStore } from '../../stores/uiStore';
import { useRealtimeSensorData } from '../../api/monitoring.api';
import { useSendControlCommand, useControlHistory } from '../../api/control.api';
import { showConfirmModal } from '../../components/common/ConfirmModal';
import { FAN_ACTIONS, FAN_ACTION_LABELS, CONTROL_TARGET_LABELS } from '../../types/control.types';
import type { ControlCommand, ControlTarget } from '../../types/control.types';
import { FAN_SPEED_LABELS } from '../../utils/constants';
import { formatDateTime, formatVelocity, formatFlow } from '../../utils/formatters';

const { Text, Title } = Typography;

const FanIcon = SwapOutlined;

function getHistoryActionLabel(target: ControlTarget, action: number, value?: number): string {
  if (target === 2) {
    const base = FAN_ACTION_LABELS[action] ?? `action=${action}`;
    if (action === 4) return `${base} (${value === 1 ? '자동' : '수동'})`;
    if (action === 5 && value !== undefined) return `${base} (${value} m/s)`;
    return base;
  }
  return `${CONTROL_TARGET_LABELS[target]} action=${action}`;
}

const MANUAL_FAN_LEVEL_OPTIONS = [
  { value: FAN_ACTIONS.OFF, label: '끄기', icon: '⏻', freq: '0 Hz' },
  { value: FAN_ACTIONS.LOW, label: '하', icon: '🌀', freq: '15 Hz' },
  { value: FAN_ACTIONS.MID, label: '중', icon: '🌀🌀', freq: '30 Hz' },
  { value: FAN_ACTIONS.HIGH, label: '상', icon: '🌀🌀🌀', freq: '50 Hz' },
] as const;

export default function ControlFanPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const selectedControllerId = useUiStore((s) => s.selectedControllerId);
  const { data: realtimeData, isLoading: sensorLoading } = useRealtimeSensorData(selectedEquipmentId);
  const { data: historyData, isLoading: historyLoading } = useControlHistory(selectedEquipmentId);
  const sendCommand = useSendControlCommand();
  const [pendingCmds, setPendingCmds] = useState<Record<string, boolean>>({});
  const [targetVelocityInputs, setTargetVelocityInputs] = useState<Record<string, number>>({});
  const [manualDraftFanActionByCtrl, setManualDraftFanActionByCtrl] = useState<Record<string, number>>({});
  const prevFanModes = useRef<Record<number, number>>({});
  const [safetyAlerts, setSafetyAlerts] = useState<Record<number, boolean>>({});

  // 안전 오버라이드 감지 (fan_mode가 1→0으로 변경)
  useEffect(() => {
    if (!realtimeData) return;
    for (const ctrl of realtimeData.controllers) {
      const prevMode = prevFanModes.current[ctrl.controllerId];
      if (prevMode === 1 && ctrl.sensorData.fanMode === 0) {
        setSafetyAlerts((prev) => ({ ...prev, [ctrl.controllerId]: true }));
      }
      prevFanModes.current[ctrl.controllerId] = ctrl.sensorData.fanMode;
    }
  }, [realtimeData]);

  const clearManualFanDraft = useCallback((draftKey: string) => {
    setManualDraftFanActionByCtrl((prev) => {
      if (!(draftKey in prev)) return prev;
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  }, []);

  const handleApplyManualFanSpeed = useCallback(
    (controllerId: string, controllerLabel: string, action: number, pendingKey: string, draftKey: string) => {
      const selected = MANUAL_FAN_LEVEL_OPTIONS.find((o) => o.value === action);
      const speedLabel = selected ? `${selected.label} (${selected.freq})` : `action=${action}`;

      showConfirmModal({
        title: '팬 속도 제어',
        content: `${controllerLabel}의 팬 속도를 ${speedLabel}(으)로 설정하시겠습니까?`,
        onOk: () => {
          setPendingCmds((prev) => ({ ...prev, [pendingKey]: true }));

          sendCommand.mutate(
            {
              target: 2,
              action,
              equipmentId: 'esp-001',
              controllerId,
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`${controllerLabel} 팬 ${speedLabel} 설정 성공`);
                  clearManualFanDraft(draftKey);
                } else {
                  message.error(`팬 제어 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, [pendingKey]: false }));
              },
              onError: () => {
                message.error('제어 명령 전송 실패');
                setPendingCmds((prev) => ({ ...prev, [pendingKey]: false }));
              },
            },
          );
        },
      });
    },
    [sendCommand, clearManualFanDraft],
  );

  const handleModeChange = useCallback(
    (controllerId: string, controllerLabel: string, autoMode: boolean) => {
      const modeLabel = autoMode ? '자동' : '수동';

      showConfirmModal({
        title: '팬 제어 모드 전환',
        content: `${controllerLabel}의 팬 제어 모드를 ${modeLabel}(으)로 전환하시겠습니까?`,
        onOk: () => {
          const key = `${controllerId}-mode`;
          setPendingCmds((prev) => ({ ...prev, [key]: true }));

          sendCommand.mutate(
            {
              target: 2,
              action: FAN_ACTIONS.SET_MODE,
              value: autoMode ? 1 : 0,
              equipmentId: 'esp-001',
              controllerId,
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`${controllerLabel} 팬 ${modeLabel} 모드 전환 성공`);
                } else {
                  message.error(`모드 전환 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
              onError: () => {
                message.error('모드 전환 명령 전송 실패');
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
            },
          );
        },
      });
    },
    [sendCommand],
  );

  const handleSetTargetVelocity = useCallback(
    (controllerId: string, controllerLabel: string, targetVelocity: number) => {
      showConfirmModal({
        title: '목표 풍속 설정',
        content: `${controllerLabel}의 목표 풍속을 ${targetVelocity} m/s로 설정하시겠습니까?`,
        onOk: () => {
          const key = `${controllerId}-velocity`;
          setPendingCmds((prev) => ({ ...prev, [key]: true }));

          sendCommand.mutate(
            {
              target: 2,
              action: FAN_ACTIONS.SET_TARGET_VELOCITY,
              value: targetVelocity,
              equipmentId: 'esp-001',
              controllerId,
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`${controllerLabel} 목표 풍속 ${targetVelocity} m/s 설정 성공`);
                } else {
                  message.error(`목표 풍속 설정 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
              onError: () => {
                message.error('목표 풍속 설정 명령 전송 실패');
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
            },
          );
        },
      });
    },
    [sendCommand],
  );

  const handleBatchMode = useCallback(
    (autoMode: boolean) => {
      const modeLabel = autoMode ? '자동' : '수동';

      showConfirmModal({
        title: '일괄 팬 모드 전환',
        content: `모든 컨트롤러의 팬 제어 모드를 ${modeLabel}(으)로 전환하시겠습니까?`,
        onOk: () => {
          setPendingCmds((prev) => ({ ...prev, batchMode: true }));
          sendCommand.mutate(
            {
              target: 2,
              action: FAN_ACTIONS.SET_MODE,
              value: autoMode ? 1 : 0,
              equipmentId: 'all',
              controllerId: 'all',
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`일괄 팬 ${modeLabel} 모드 전환 성공`);
                } else {
                  message.error(`일괄 모드 전환 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, batchMode: false }));
              },
              onError: () => {
                message.error('일괄 모드 전환 명령 전송 실패');
                setPendingCmds((prev) => ({ ...prev, batchMode: false }));
              },
            },
          );
        },
      });
    },
    [sendCommand],
  );

  // 팬 제어 이력 필터
  const fanHistory = (historyData ?? []).filter((h) => h.target === 2);

  const historyColumns: ColumnsType<ControlCommand> = [
    {
      title: '시간',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '대상',
      dataIndex: 'controllerIdMqtt',
      key: 'controllerIdMqtt',
      width: 100,
    },
    {
      title: '명령',
      key: 'action',
      width: 160,
      render: (_: unknown, record: ControlCommand) => getHistoryActionLabel(record.target, record.action, record.value),
    },
    {
      title: '결과',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (result: string) => {
        const statusMap: Record<string, 'success' | 'danger' | 'info' | 'default'> = { SUCCESS: 'success', FAIL: 'danger', PENDING: 'info' };
        const labelMap: Record<string, string> = { SUCCESS: '성공', FAIL: '실패', PENDING: '대기중' };
        return <StatusBadge status={statusMap[result] ?? 'default'} label={labelMap[result] ?? result} />;
      },
    },
    {
      title: '응답 시간',
      dataIndex: 'respondedAt',
      key: 'respondedAt',
      width: 170,
      render: (v: string | undefined) => (v ? formatDateTime(v) : '-'),
    },
  ];

  if (!selectedEquipmentId) {
    return <Empty description="좌측 트리에서 장비를 선택하세요" />;
  }

  if (sensorLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">데이터를 불러오는 중...</Text>
        </div>
      </div>
    );
  }

  if (!realtimeData) {
    return <Empty description="장비 데이터가 없습니다" />;
  }

  return (
    <div>
      {/* 일괄 제어 */}
      <div className="control-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              <FanIcon /> 일괄 팬 모드 제어
            </Title>
            <Text type="secondary">모든 컨트롤러의 팬 모드를 일괄 전환합니다</Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<SwapOutlined />}
              loading={!!pendingCmds['batchMode']}
              onClick={() => handleBatchMode(true)}
            >
              전체 자동
            </Button>
            <Button
              icon={<SwapOutlined />}
              loading={!!pendingCmds['batchMode']}
              onClick={() => handleBatchMode(false)}
            >
              전체 수동
            </Button>
          </Space>
        </div>
      </div>

      {/* 컨트롤러별 팬 제어 */}
      {(selectedControllerId
        ? realtimeData.controllers.filter((c) => c.controllerId === selectedControllerId)
        : realtimeData.controllers
      ).map((ctrl) => {
        const sd = ctrl.sensorData;
        const isAutoMode = sd.fanMode === 1;
        const isOnline = ctrl.connectionStatus === 'ONLINE';
        const hasSafetyAlert = !!safetyAlerts[ctrl.controllerId];
        const fanKey = `${ctrl.controllerName}-fan`;
        const modeKey = `${ctrl.controllerName}-mode`;
        const velocityKey = `${ctrl.controllerName}-velocity`;
        const velocityInput = targetVelocityInputs[ctrl.controllerName] ?? 5.0;
        const fanDraftKey = `fan-draft-${ctrl.controllerId}`;
        const isManualSpeed = sd.fanSpeed === FAN_ACTIONS.OFF
          || sd.fanSpeed === FAN_ACTIONS.LOW
          || sd.fanSpeed === FAN_ACTIONS.MID
          || sd.fanSpeed === FAN_ACTIONS.HIGH;
        const currentManualAction = isManualSpeed ? sd.fanSpeed : FAN_ACTIONS.OFF;
        const draftManualAction = manualDraftFanActionByCtrl[fanDraftKey] ?? currentManualAction;

        return (
          <div className="control-card" key={ctrl.controllerId} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FanIcon />
              <span style={{ fontWeight: 600 }}>{ctrl.controllerName}</span>
              {isOnline ? (
                <StatusBadge status="success" label="연결" />
              ) : (
                <StatusBadge status="danger" label="끊김" />
              )}
              <StatusBadge status={isAutoMode ? 'info' : 'default'} label={isAutoMode ? '자동 모드' : '수동 모드'} />
            </div>

            {hasSafetyAlert && (
              <div className="safety-alert" style={{ marginBottom: 12 }}>
                <WarningOutlined style={{ marginRight: 6 }} />
                안전 오버라이드: 비상 상황으로 자동 모드가 해제되었습니다.
                <button
                  style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                  onClick={() => setSafetyAlerts((prev) => ({ ...prev, [ctrl.controllerId]: false }))}
                >
                  ✕
                </button>
              </div>
            )}

            {!isOnline && (
              <div className="filter-alert" style={{ marginBottom: 12 }}>
                통신 끊김 상태에서는 제어가 불가능할 수 있습니다.
              </div>
            )}

            {/* 현재 상태 */}
            <Descriptions size="small" column={4} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="팬 속도">
                <StatusBadge status={sd.fanSpeed > 0 ? 'info' : 'default'} label={FAN_SPEED_LABELS[sd.fanSpeed] ?? 'OFF'} />
              </Descriptions.Item>
              <Descriptions.Item label="현재 풍속">{formatVelocity(sd.velocity)}</Descriptions.Item>
              <Descriptions.Item label="현재 풍량">{formatFlow(sd.flow)}</Descriptions.Item>
              <Descriptions.Item label="제어 모드">
                <StatusBadge status={isAutoMode ? 'info' : 'default'} label={isAutoMode ? '자동' : '수동'} />
              </Descriptions.Item>
            </Descriptions>

            <div className="fan-control-section">
              <div className="fan-control-title-row">
                <FanIcon className="fan-control-title-icon" />
                <Title level={5} style={{ margin: 0 }}>
                  송풍기 팬 모터 제어
                </Title>
              </div>

              {/* 모드 전환 */}
              <div className="control-mode-group fan-control-mode-group">
                <button
                  type="button"
                  className={`control-mode-btn ${isAutoMode ? 'control-mode-btn-active' : ''}`}
                  disabled={!!pendingCmds[modeKey]}
                  onClick={() => { if (!isAutoMode) handleModeChange(ctrl.controllerName, ctrl.controllerName, true); }}
                >
                  자동
                </button>
                <button
                  type="button"
                  className={`control-mode-btn ${!isAutoMode ? 'control-mode-btn-active' : ''}`}
                  disabled={!!pendingCmds[modeKey]}
                  onClick={() => { if (isAutoMode) handleModeChange(ctrl.controllerName, ctrl.controllerName, false); }}
                >
                  수동
                </button>
              </div>

              {/* 수동 제어 */}
              {!isAutoMode && (
                <div className="fan-manual-panel">
                  <Text className="fan-manual-panel-label">풍량 선택</Text>
                  <div className="fan-manual-level-grid">
                    {MANUAL_FAN_LEVEL_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`fan-manual-level-btn ${draftManualAction === opt.value ? 'fan-manual-level-btn-active' : ''}`}
                        disabled={!!pendingCmds[fanKey] || !isOnline}
                        aria-pressed={draftManualAction === opt.value}
                        onClick={() => {
                          setManualDraftFanActionByCtrl((prev) => ({ ...prev, [fanDraftKey]: opt.value }));
                        }}
                      >
                        <div className="fan-manual-level-icon">{opt.icon}</div>
                        <div className="fan-manual-level-label">{opt.label}</div>
                        <div className="fan-manual-level-hz">{opt.freq}</div>
                      </button>
                    ))}
                  </div>
                  <div className="fan-manual-warning">
                    ⚠ 수동 모드: 센서 감지 무관 강제 동작
                  </div>
                  <Button
                    type="primary"
                    block
                    size="large"
                    className="fan-manual-apply-btn"
                    loading={!!pendingCmds[fanKey]}
                    disabled={!isOnline || draftManualAction === currentManualAction}
                    onClick={() => handleApplyManualFanSpeed(
                      ctrl.controllerName,
                      ctrl.controllerName,
                      draftManualAction,
                      fanKey,
                      fanDraftKey,
                    )}
                  >
                    적용
                  </Button>
                </div>
              )}

              {/* 자동 제어: 목표 풍속 입력 */}
              {isAutoMode && (
                <div className="fan-auto-panel">
                  <Text strong>목표 풍속 (m/s)</Text>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
                    <InputNumber
                      className="auto-target-input"
                      min={0.5}
                      max={20.0}
                      step={0.5}
                      value={velocityInput}
                      addonAfter="m/s"
                      style={{ width: 200 }}
                      onChange={(val) => {
                        if (val !== null) {
                          setTargetVelocityInputs((prev) => ({ ...prev, [ctrl.controllerName]: val }));
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      loading={!!pendingCmds[velocityKey]}
                      onClick={() => handleSetTargetVelocity(ctrl.controllerName, ctrl.controllerName, velocityInput)}
                    >
                      목표 풍속 적용
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 제어 이력 */}
      <div className="control-card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>팬 제어 이력</div>
        <Table
          className="equip-table"
          columns={historyColumns}
          dataSource={fanHistory}
          rowKey="commandId"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          loading={historyLoading}
        />
      </div>
    </div>
  );
}
