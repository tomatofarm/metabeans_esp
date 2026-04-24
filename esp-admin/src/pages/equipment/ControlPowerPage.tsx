import { useState, useCallback } from 'react';
import { Button, Table, Space, Spin, Empty, Typography, message } from 'antd';
import { PoweroffOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge';
import type { ColumnsType } from 'antd/es/table';
import { useUiStore } from '../../stores/uiStore';
import { useRealtimeSensorData } from '../../api/monitoring.api';
import { useSendControlCommand, useControlHistory } from '../../api/control.api';
import { showConfirmModal } from '../../components/common/ConfirmModal';
import { POWERPACK_ACTIONS, CONTROL_TARGET_LABELS, POWERPACK_ACTION_LABELS } from '../../types/control.types';
import type { ControlCommand, ControlTarget } from '../../types/control.types';
import { formatDateTime } from '../../utils/formatters';

const { Text, Title } = Typography;

// 제어 이력 액션 라벨
function getHistoryActionLabel(target: ControlTarget, action: number, value?: number): string {
  if (target === 0) return POWERPACK_ACTION_LABELS[action] ?? `action=${action}`;
  return `${CONTROL_TARGET_LABELS[target]} action=${action}${value !== undefined ? ` (${value})` : ''}`;
}

export default function ControlPowerPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const selectedControllerId = useUiStore((s) => s.selectedControllerId);
  const { data: realtimeData, isLoading: sensorLoading } = useRealtimeSensorData(selectedEquipmentId);
  const { data: historyData, isLoading: historyLoading } = useControlHistory(selectedEquipmentId);
  const sendCommand = useSendControlCommand();
  const [pendingCmds, setPendingCmds] = useState<Record<string, boolean>>({});

  const handlePowerControl = useCallback(
    (controllerId: string, controllerLabel: string, action: number) => {
      const actionLabel = action === POWERPACK_ACTIONS.ON ? '켜' : action === POWERPACK_ACTIONS.OFF ? '끄' : '리셋하';

      showConfirmModal({
        title: '전원 제어 확인',
        content: `파워팩 [${controllerLabel}]의 전원을 ${actionLabel}시겠습니까?`,
        onOk: () => {
          if (!realtimeData?.gatewayId) {
            message.error('게이트웨이 정보가 없어 제어할 수 없습니다.');
            return;
          }
          const key = `${controllerId}-power`;
          setPendingCmds((prev) => ({ ...prev, [key]: true }));

          sendCommand.mutate(
            {
              gatewayId: realtimeData.gatewayId,
              target: 0,
              action,
              equipmentId: realtimeData.mqttEquipmentId ?? 'all',
              controllerId,
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`${controllerLabel} ${POWERPACK_ACTION_LABELS[action]} 명령 성공`);
                } else {
                  message.error(`${controllerLabel} 제어 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
              onError: () => {
                message.error('제어 명령 전송 실패');
                setPendingCmds((prev) => ({ ...prev, [key]: false }));
              },
            },
          );
        },
      });
    },
    [sendCommand, realtimeData],
  );

  const handleBatchPower = useCallback(
    (action: number) => {
      const actionLabel = action === POWERPACK_ACTIONS.ON ? '켜' : '끄';

      showConfirmModal({
        title: '일괄 전원 제어',
        content: `이 장비의 모든 파워팩 전원을 ${actionLabel}시겠습니까?`,
        onOk: () => {
          if (!realtimeData?.gatewayId) {
            message.error('게이트웨이 정보가 없어 제어할 수 없습니다.');
            return;
          }
          setPendingCmds((prev) => ({ ...prev, batch: true }));
          sendCommand.mutate(
            {
              gatewayId: realtimeData.gatewayId,
              target: 0,
              action,
              equipmentId: realtimeData.mqttEquipmentId ?? 'all',
              controllerId: 'all',
            },
            {
              onSuccess: (res) => {
                if (res.result === 'SUCCESS') {
                  message.success(`일괄 ${POWERPACK_ACTION_LABELS[action]} 명령 성공`);
                } else {
                  message.error(`일괄 제어 실패: ${res.failReason}`);
                }
                setPendingCmds((prev) => ({ ...prev, batch: false }));
              },
              onError: () => {
                message.error('일괄 제어 명령 전송 실패');
                setPendingCmds((prev) => ({ ...prev, batch: false }));
              },
            },
          );
        },
      });
    },
    [sendCommand, realtimeData],
  );

  // 제어 이력 테이블 (전원만 필터)
  const powerHistory = (historyData ?? []).filter((h) => h.target === 0);

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
      width: 100,
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
    {
      title: '실패 사유',
      dataIndex: 'failReason',
      key: 'failReason',
      render: (v: string | undefined) => v ?? '-',
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
              <ThunderboltOutlined /> 일괄 전원 제어
            </Title>
            <Text type="secondary">이 장비의 모든 파워팩을 일괄 제어합니다</Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PoweroffOutlined />}
              loading={!!pendingCmds['batch']}
              onClick={() => handleBatchPower(POWERPACK_ACTIONS.ON)}
            >
              전체 ON
            </Button>
            <Button
              danger
              icon={<PoweroffOutlined />}
              loading={!!pendingCmds['batch']}
              onClick={() => handleBatchPower(POWERPACK_ACTIONS.OFF)}
            >
              전체 OFF
            </Button>
          </Space>
        </div>
      </div>

      {/* 파워팩별 제어 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        {(selectedControllerId
          ? realtimeData.controllers.filter((c) => c.controllerId === selectedControllerId)
          : realtimeData.controllers
        ).map((ctrl) => {
          const isPowerOn = ctrl.sensorData.ppPower === 1;
          const isOnline = ctrl.connectionStatus === 'ONLINE';
          const key = `${ctrl.controllerName}-power`;
          const isPending = !!pendingCmds[key];

          return (
            <div className="control-card" key={ctrl.controllerId}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ThunderboltOutlined />
                <span style={{ fontWeight: 600 }}>{ctrl.controllerName}</span>
                {isOnline ? (
                  <StatusBadge status="success" label="연결" />
                ) : (
                  <StatusBadge status="danger" label="끊김" />
                )}
              </div>

              {!isOnline && (
                <div className="filter-alert" style={{ marginBottom: 12 }}>
                  통신 끊김 상태에서는 제어가 불가능할 수 있습니다.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <div
                  className={`power-toggle ${isPowerOn ? 'power-toggle-on' : 'power-toggle-off'}`}
                  onClick={() => {
                    if (!isPending) {
                      handlePowerControl(
                        ctrl.controllerName,
                        ctrl.controllerName,
                        isPowerOn ? POWERPACK_ACTIONS.OFF : POWERPACK_ACTIONS.ON,
                      );
                    }
                  }}
                >
                  <PoweroffOutlined style={{ fontSize: 28 }} />
                  <div style={{ fontSize: '0.75rem', marginTop: 4 }}>{isPowerOn ? 'ON' : 'OFF'}</div>
                </div>
              </div>

              <Button
                block
                icon={<ReloadOutlined />}
                loading={isPending}
                onClick={() => handlePowerControl(ctrl.controllerName, ctrl.controllerName, POWERPACK_ACTIONS.RESET)}
              >
                파워팩 리셋
              </Button>
            </div>
          );
        })}
      </div>

      {/* 제어 이력 */}
      <div className="control-card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>전원 제어 이력</div>
        <Table
          className="equip-table"
          columns={historyColumns}
          dataSource={powerHistory}
          rowKey="commandId"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          loading={historyLoading}
        />
      </div>
    </div>
  );
}
