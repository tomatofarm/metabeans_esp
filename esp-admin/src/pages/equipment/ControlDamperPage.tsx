import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Button, Table, Space, Spin, Empty, Typography,
  InputNumber, Descriptions, message,
} from 'antd';
import {
  ControlOutlined,
  WarningOutlined,
  SwapOutlined,
  GatewayOutlined,
} from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge';
import type { ColumnsType } from 'antd/es/table';
import { useUiStore } from '../../stores/uiStore';
import { useRealtimeSensorData } from '../../api/monitoring.api';
import { useSendControlCommand, useControlHistory } from '../../api/control.api';
import { showConfirmModal } from '../../components/common/ConfirmModal';
import { DAMPER_ACTIONS, DAMPER_STEPS, DAMPER_ACTION_LABELS, CONTROL_TARGET_LABELS } from '../../types/control.types';
import type { ControlCommand, ControlTarget } from '../../types/control.types';
import { DAMPER_STEP_MAP } from '../../utils/constants';
import { formatDateTime, formatFlow, formatNumber } from '../../utils/formatters';

const { Text, Title } = Typography;

const DAMPER_SEGMENT_COLORS = [
  '#52c41a',
  '#49c97f',
  '#36cfc9',
  '#2db7f5',
  '#1890ff',
  '#3f87ff',
  '#5f7cff',
  '#6b73ff',
] as const;

// 개도율에 가장 가까운 단계를 찾기
function findClosestStep(opening: number): number {
  let closest = 0;
  let minDiff = Infinity;
  for (const s of DAMPER_STEP_MAP) {
    const diff = Math.abs(s.opening - opening);
    if (diff < minDiff) {
      minDiff = diff;
      closest = s.step;
    }
  }
  return closest;
}

function getDamperOpeningText(opening: number): string {
  if (opening <= 0) return '닫힘';
  if (opening >= 100) return '완전 개방';
  return '부분 개방';
}

function getHistoryActionLabel(target: ControlTarget, action: number, value?: number): string {
  if (target === 1) {
    const base = DAMPER_ACTION_LABELS[action] ?? `action=${action}`;
    if (action === 1 && value !== undefined) return `${base} (${value}%)`;
    if (action === 2) return `${base} (${value === 1 ? '자동' : '수동'})`;
    if (action === 3 && value !== undefined) return `${base} (${value} CMH)`;
    return base;
  }
  return `${CONTROL_TARGET_LABELS[target]} action=${action}`;
}

export default function ControlDamperPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const selectedControllerId = useUiStore((s) => s.selectedControllerId);
  const { data: realtimeData, isLoading: sensorLoading } = useRealtimeSensorData(selectedEquipmentId);
  const { data: historyData, isLoading: historyLoading } = useControlHistory(selectedEquipmentId);
  const sendCommand = useSendControlCommand();
  const [pendingCmds, setPendingCmds] = useState<Record<string, boolean>>({});
  const [targetFlowInputs, setTargetFlowInputs] = useState<Record<string, number>>({});
  /** 수동: 8단계 중 선택(0~7). 미설정 시 센서 기준 단계 사용 */
  const [manualDraftStepByCtrl, setManualDraftStepByCtrl] = useState<Record<string, number>>({});
  const prevDamperModes = useRef<Record<number, number>>({});
  const [safetyAlerts, setSafetyAlerts] = useState<Record<number, boolean>>({});

  // 안전 오버라이드 감지 (damper_mode가 1→0으로 변경)
  useEffect(() => {
    if (!realtimeData) return;
    for (const ctrl of realtimeData.controllers) {
      const prevMode = prevDamperModes.current[ctrl.controllerId];
      if (prevMode === 1 && ctrl.sensorData.damperMode === 0) {
        setSafetyAlerts((prev) => ({ ...prev, [ctrl.controllerId]: true }));
      }
      prevDamperModes.current[ctrl.controllerId] = ctrl.sensorData.damperMode;
    }
  }, [realtimeData]);

  const clearManualDraft = useCallback((draftKey: string) => {
    setManualDraftStepByCtrl((prev) => {
      if (!(draftKey in prev)) return prev;
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  }, []);

  const runDamperOpeningCommand = useCallback(
    (
      controllerId: string,
      controllerLabel: string,
      step: number,
      pendingKey: string,
      draftKey: string,
      displayStage: number,
    ) => {
      const stepInfo = DAMPER_STEPS[step];
      if (!stepInfo) return;

      setPendingCmds((prev) => ({ ...prev, [pendingKey]: true }));

      sendCommand.mutate(
        {
          target: 1,
          action: DAMPER_ACTIONS.SET_OPENING,
          value: stepInfo.value,
          equipmentId: 'esp-001',
          controllerId,
        },
        {
          onSuccess: (res) => {
            if (res.result === 'SUCCESS') {
              message.success(
                `${controllerLabel} 방화셔터 ${displayStage}단계 (${stepInfo.opening}%) 설정 성공`,
              );
              clearManualDraft(draftKey);
            } else {
              message.error(`댐퍼 제어 실패: ${res.failReason}`);
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
    [sendCommand, clearManualDraft],
  );

  const handleApplyManualDamper = useCallback(
    (
      controllerId: string,
      controllerLabel: string,
      step: number,
      pendingKey: string,
      draftKey: string,
    ) => {
      const stepInfo = DAMPER_STEPS[step];
      if (!stepInfo) return;
      const displayStage = step + 1;

      showConfirmModal({
        title: '방화셔터 개도 설정',
        content: `${controllerLabel}의 방화셔터를 ${displayStage}단계 (${stepInfo.opening}%)로 설정하시겠습니까?`,
        onOk: () =>
          runDamperOpeningCommand(
            controllerId,
            controllerLabel,
            step,
            pendingKey,
            draftKey,
            displayStage,
          ),
      });
    },
    [runDamperOpeningCommand],
  );

  const handleModeChange = useCallback(
    (controllerId: string, controllerLabel: string, autoMode: boolean) => {
      const modeLabel = autoMode ? '자동' : '수동';

      showConfirmModal({
        title: '댐퍼 제어 모드 전환',
        content: `${controllerLabel}의 댐퍼 제어 모드를 ${modeLabel}(으)로 전환하시겠습니까?`,
        onOk: () => {
          const key = `${controllerId}-mode`;
          setPendingCmds((prev) => ({ ...prev, [key]: true }));

          sendCommand.mutate(
            {
              target: 1,
              action: DAMPER_ACTIONS.SET_MODE,
              value: autoMode ? 1 : 0,
              equipmentId: 'esp-001',
              controllerId,
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`${controllerLabel} 댐퍼 ${modeLabel} 모드 전환 성공`);
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

  const handleSetTargetFlow = useCallback(
    (controllerId: string, controllerLabel: string, targetFlow: number) => {
      showConfirmModal({
        title: '목표 풍량 설정',
        content: `${controllerLabel}의 목표 풍량을 ${targetFlow} CMH로 설정하시겠습니까?`,
        onOk: () => {
          const key = `${controllerId}-flow`;
          setPendingCmds((prev) => ({ ...prev, [key]: true }));

          sendCommand.mutate(
            {
              target: 1,
              action: DAMPER_ACTIONS.SET_TARGET_FLOW,
              value: targetFlow,
              equipmentId: 'esp-001',
              controllerId,
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`${controllerLabel} 목표 풍량 ${targetFlow} CMH 설정 성공`);
                } else {
                  message.error(`목표 풍량 설정 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
              onError: () => {
                message.error('목표 풍량 설정 명령 전송 실패');
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
        title: '일괄 댐퍼 모드 전환',
        content: `모든 컨트롤러의 댐퍼 제어 모드를 ${modeLabel}(으)로 전환하시겠습니까?`,
        onOk: () => {
          setPendingCmds((prev) => ({ ...prev, batchMode: true }));
          sendCommand.mutate(
            {
              target: 1,
              action: DAMPER_ACTIONS.SET_MODE,
              value: autoMode ? 1 : 0,
              equipmentId: 'all',
              controllerId: 'all',
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`일괄 댐퍼 ${modeLabel} 모드 전환 성공`);
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

  // 댐퍼 제어 이력 필터
  const damperHistory = (historyData ?? []).filter((h) => h.target === 1);

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
              <ControlOutlined /> 일괄 댐퍼 모드 제어
            </Title>
            <Text type="secondary">모든 컨트롤러의 댐퍼 모드를 일괄 전환합니다</Text>
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

      {/* 컨트롤러별 댐퍼 제어 */}
      {(selectedControllerId
        ? realtimeData.controllers.filter((c) => c.controllerId === selectedControllerId)
        : realtimeData.controllers
      ).map((ctrl) => {
        const sd = ctrl.sensorData;
        const isAutoMode = sd.damperMode === 1;
        const isOnline = ctrl.connectionStatus === 'ONLINE';
        const currentStep = findClosestStep(sd.damper);
        const hasSafetyAlert = !!safetyAlerts[ctrl.controllerId];
        const damperKey = `${ctrl.controllerName}-damper`;
        const modeKey = `${ctrl.controllerName}-mode`;
        const flowKey = `${ctrl.controllerName}-flow`;
        const flowInput = targetFlowInputs[ctrl.controllerName] ?? 800;
        const damperDraftKey = `damper-draft-${ctrl.controllerId}`;
        const draftStep = manualDraftStepByCtrl[damperDraftKey] ?? currentStep;
        const displayStage = draftStep + 1;
        const draftOpening = DAMPER_STEP_MAP[draftStep]?.opening ?? 0;
        const draftOpeningText = getDamperOpeningText(draftOpening);

        return (
          <div className="control-card" key={ctrl.controllerId} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ControlOutlined />
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
              <Descriptions.Item label="현재 개도율">{formatNumber(sd.damper, 1)}%</Descriptions.Item>
              <Descriptions.Item label="현재 풍량">{formatFlow(sd.flow)}</Descriptions.Item>
              <Descriptions.Item label="현재 풍속">{formatNumber(sd.velocity, 1)} m/s</Descriptions.Item>
              <Descriptions.Item label="제어 모드">
                <StatusBadge status={isAutoMode ? 'info' : 'default'} label={isAutoMode ? '자동' : '수동'} />
              </Descriptions.Item>
            </Descriptions>

            {/* 방화셔터 제어: 제목 + 모드 탭 + (수동: 8단계 패널 / 자동: 목표 풍량) */}
            <div className="damper-shutter-section">
              <div className="damper-shutter-title-row">
                <GatewayOutlined className="damper-shutter-title-icon" />
                <Title level={5} style={{ margin: 0 }}>
                  방화셔터 제어
                </Title>
              </div>

              <div className="control-mode-group damper-shutter-mode-group">
                <button
                  type="button"
                  className={`control-mode-btn ${isAutoMode ? 'control-mode-btn-active' : ''}`}
                  disabled={!!pendingCmds[modeKey]}
                  onClick={() => {
                    if (!isAutoMode) handleModeChange(ctrl.controllerName, ctrl.controllerName, true);
                  }}
                >
                  자동
                </button>
                <button
                  type="button"
                  className={`control-mode-btn ${!isAutoMode ? 'control-mode-btn-active' : ''}`}
                  disabled={!!pendingCmds[modeKey]}
                  onClick={() => {
                    if (isAutoMode) handleModeChange(ctrl.controllerName, ctrl.controllerName, false);
                  }}
                >
                  수동
                </button>
              </div>

              {!isAutoMode && (
                <div className="damper-manual-panel">
                  <Text className="damper-manual-panel-label">
                    8단계 각도 조절 (수동)
                  </Text>

                  <div className="damper-eight-track" role="group" aria-label="방화셔터 8단계 선택">
                    {DAMPER_STEP_MAP.map((s) => {
                      const filled = s.step <= draftStep;
                      const segmentColor = DAMPER_SEGMENT_COLORS[s.step] ?? '#1890ff';
                      return (
                        <button
                          key={s.step}
                          type="button"
                          className={`damper-eight-segment ${filled ? 'damper-eight-segment--filled' : ''}`}
                          style={filled ? { backgroundColor: segmentColor } : undefined}
                          disabled={!!pendingCmds[damperKey] || !isOnline}
                          aria-pressed={draftStep === s.step}
                          aria-label={`${s.step + 1}단계 ${s.opening}% (${getDamperOpeningText(s.opening)})`}
                          onClick={() =>
                            setManualDraftStepByCtrl((prev) => ({
                              ...prev,
                              [damperDraftKey]: s.step,
                            }))
                          }
                        />
                      );
                    })}
                  </div>

                  <div className="damper-eight-nums" aria-hidden>
                    {DAMPER_STEP_MAP.map((s) => (
                      <span
                        key={s.step}
                        className={draftStep === s.step ? 'damper-eight-num damper-eight-num--active' : 'damper-eight-num'}
                      >
                        {s.step + 1}
                      </span>
                    ))}
                  </div>

                  <div className="damper-current-stage-box">
                    <Text type="secondary">현재 </Text>
                    <Text strong className="damper-current-stage-value">
                      {displayStage}
                    </Text>
                    <Text type="secondary"> 단계</Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      ({draftOpening}% · {draftOpeningText})
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    block
                    size="large"
                    className="damper-apply-btn"
                    loading={!!pendingCmds[damperKey]}
                    disabled={!isOnline || draftStep === currentStep}
                    onClick={() =>
                      handleApplyManualDamper(
                        ctrl.controllerName,
                        ctrl.controllerName,
                        draftStep,
                        damperKey,
                        damperDraftKey,
                      )
                    }
                  >
                    적용
                  </Button>
                </div>
              )}

              {isAutoMode && (
                <div className="damper-auto-panel">
                  <Text strong className="damper-manual-panel-label" style={{ display: 'block', marginBottom: 8 }}>
                    목표 풍량 (자동)
                  </Text>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <InputNumber
                      className="auto-target-input"
                      min={100}
                      max={2000}
                      step={10}
                      value={flowInput}
                      addonAfter="CMH"
                      style={{ width: 200 }}
                      onChange={(val) => {
                        if (val !== null) {
                          setTargetFlowInputs((prev) => ({ ...prev, [ctrl.controllerName]: val }));
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      loading={!!pendingCmds[flowKey]}
                      onClick={() => handleSetTargetFlow(ctrl.controllerName, ctrl.controllerName, flowInput)}
                    >
                      목표 풍량 적용
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
        <div style={{ fontWeight: 600, marginBottom: 12 }}>댐퍼 제어 이력</div>
        <Table
          className="equip-table"
          columns={historyColumns}
          dataSource={damperHistory}
          rowKey="commandId"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          loading={historyLoading}
        />
      </div>
    </div>
  );
}
