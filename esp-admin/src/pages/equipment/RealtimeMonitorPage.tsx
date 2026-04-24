import { useMemo } from 'react';
import { Row, Col, Spin, Empty, Typography, Tag } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useRealtimeSensorData, useSensorHistory } from '../../api/monitoring.api';
import { useThresholdSettings } from '../../api/system.api';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import { SENSOR_INTERVAL_MS } from '../../utils/constants';
import ControllerBasicStatusSection from './components/ControllerBasicStatusSection';
import FilterCheckSection from './components/FilterCheckSection';
import FireSensorSection from './components/FireSensorSection';
import MonitoringEsgSection from './components/MonitoringEsgSection';
import BoardTempChart from '../../components/charts/BoardTempChart';
import SparkChart from '../../components/charts/SparkChart';

const { Text } = Typography;

export default function RealtimeMonitorPage() {
  const selectedEquipmentId = useUiStore((s) => s.selectedEquipmentId);
  const selectedControllerId = useUiStore((s) => s.selectedControllerId);
  const role = useAuthStore((s) => s.user?.role);

  const { isAllowed: canEquipmentStatus, isLoading: equipmentStatusLoading } =
    useFeaturePermission('monitoring.equipment_status');
  const { isAllowed: canEsg, isLoading: esgLoading } = useFeaturePermission('monitoring.esg');
  const { isAllowed: canFireDetection, isLoading: fireLoading } =
    useFeaturePermission('monitoring.fire_detection');
  const { isAllowed: canFilterStatus, isLoading: filterLoading } =
    useFeaturePermission('monitoring.filter_status');
  const { isAllowed: canBoardTemp, isLoading: boardTempLoading } =
    useFeaturePermission('monitoring.board_temp');
  const { isAllowed: canSpark, isLoading: sparkLoading } = useFeaturePermission('monitoring.spark');

  const showEquipmentStatus = equipmentStatusLoading || canEquipmentStatus;
  const showEsg = esgLoading || canEsg;
  const showFireDetection = fireLoading || canFireDetection;
  const showFilterStatus = filterLoading || canFilterStatus;
  const showBoardTemp = boardTempLoading || canBoardTemp;
  const showSpark = sparkLoading || canSpark;

  const permLoading =
    equipmentStatusLoading ||
    esgLoading ||
    fireLoading ||
    filterLoading ||
    boardTempLoading ||
    sparkLoading;

  const { data: realtimeData, isLoading, dataUpdatedAt } = useRealtimeSensorData(selectedEquipmentId);
  const { data: historyData } = useSensorHistory(selectedEquipmentId);
  const { data: thresholdResponse } = useThresholdSettings(role === 'ADMIN');

  const monitoringThresholdByName = useMemo(() => {
    const map = new Map<string, { yellowMin?: number; redMin?: number }>();
    for (const t of thresholdResponse?.data.monitoringThresholds ?? []) {
      map.set(t.metricName, { yellowMin: t.yellowMin, redMin: t.redMin });
    }
    return map;
  }, [thresholdResponse?.data.monitoringThresholds]);

  const selectedEquipmentCleaning = useMemo(() => {
    if (!selectedEquipmentId) return null;
    return (
      thresholdResponse?.data.cleaningThresholds.find((c) => c.equipmentId === selectedEquipmentId) ??
      thresholdResponse?.data.cleaningThresholds[0] ??
      null
    );
  }, [selectedEquipmentId, thresholdResponse?.data.cleaningThresholds]);

  const filteredControllers = useMemo(() => {
    if (!realtimeData) return [];
    if (selectedControllerId) {
      return realtimeData.controllers.filter((c) => c.controllerId === selectedControllerId);
    }
    return realtimeData.controllers;
  }, [realtimeData, selectedControllerId]);

  const filteredHistory = useMemo(() => {
    if (!historyData) return [];
    if (!selectedControllerId) return historyData;
    const selectedCtrl = realtimeData?.controllers.find((c) => c.controllerId === selectedControllerId);
    if (!selectedCtrl) return historyData;
    return historyData.filter((p) => p.controllerName === selectedCtrl.controllerName);
  }, [historyData, selectedControllerId, realtimeData]);

  const hasTopRow = showEquipmentStatus || showEsg || showFireDetection || showFilterStatus;
  const hasChartRow = showBoardTemp || showSpark;

  const hasAnyPanel = useMemo(() => {
    if (permLoading) return true;
    return hasTopRow || hasChartRow;
  }, [permLoading, hasTopRow, hasChartRow]);

  if (!selectedEquipmentId) {
    return <Empty description="좌측 트리에서 장비를 선택하세요" />;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">센서 데이터를 불러오는 중...</Text>
        </div>
      </div>
    );
  }

  if (!realtimeData) {
    return <Empty description="센서 데이터가 없습니다" />;
  }

  if (!hasAnyPanel) {
    return <Empty description="조회 가능한 모니터링 항목이 없습니다." />;
  }

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR') : '-';

  const hasLeftCol = showEquipmentStatus || showEsg;
  const hasRightCol = showFireDetection || showFilterStatus;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        <Tag icon={<SyncOutlined spin />} color="processing">
          {SENSOR_INTERVAL_MS / 1000}초 자동 갱신
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          마지막 갱신: {lastUpdated}
        </Text>
      </div>

      {hasTopRow && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {hasLeftCol && (
            <Col xs={24} xl={hasRightCol ? 12 : 24}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {showEquipmentStatus && (
                  <ControllerBasicStatusSection
                    controllers={filteredControllers}
                    thresholds={{
                      boardTemp: monitoringThresholdByName.get('보드 온도'),
                      spark: monitoringThresholdByName.get('스파크'),
                      pm25: monitoringThresholdByName.get('PM2.5'),
                      pm10: monitoringThresholdByName.get('PM10'),
                    }}
                  />
                )}
                {showEsg && (
                  <MonitoringEsgSection
                    controllers={filteredControllers}
                    equipmentName={realtimeData.equipmentName}
                  />
                )}
              </div>
            </Col>
          )}
          {hasRightCol && (
            <Col xs={24} xl={hasLeftCol ? 12 : 24}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {showFireDetection && (
                  <FireSensorSection
                    controllers={filteredControllers}
                    inletTempThreshold={monitoringThresholdByName.get('유입 온도')}
                  />
                )}
                {showFilterStatus && (
                  <FilterCheckSection
                    controllers={filteredControllers}
                    historyData={filteredHistory}
                    criteria={
                      selectedEquipmentCleaning
                        ? {
                            sparkThreshold: selectedEquipmentCleaning.sparkThreshold,
                            sparkTimeWindowSec: selectedEquipmentCleaning.sparkTimeWindow,
                            pressureBase: selectedEquipmentCleaning.pressureBase,
                            pressureRatePercent: selectedEquipmentCleaning.pressureRate,
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            </Col>
          )}
        </Row>
      )}

      {hasChartRow && (
        <Row gutter={[16, 16]}>
          {showBoardTemp && (
            <Col xs={24} xl={showSpark ? 12 : 24}>
              <BoardTempChart historyData={filteredHistory} />
            </Col>
          )}
          {showSpark && (
            <Col xs={24} xl={showBoardTemp ? 12 : 24}>
              <SparkChart historyData={filteredHistory} />
            </Col>
          )}
        </Row>
      )}
    </div>
  );
}
