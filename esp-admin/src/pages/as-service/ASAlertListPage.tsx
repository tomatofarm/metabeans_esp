import { useState } from 'react';
import { Select, DatePicker, Button, Spin, Empty, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ToolOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useASAlerts, useASRequests, useASStoreOptions } from '../../api/as-service.api';
import { useFeaturePermission } from '../../hooks/useFeaturePermission';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatRelativeTime, formatDate, formatDateCompact } from '../../utils/formatters';
import { AS_STATUS_LABELS, FAULT_TYPE_LABELS } from '../../utils/constants';
import type { BadgeStatus } from '../../components/common/StatusBadge';
import type { ASAlert, AlertType, AlertSeverity, ASRequestListItem, ASStatus, FaultType } from '../../types/as-service.types';

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

const AS_STATUS_BADGE: Record<string, BadgeStatus> = {
  PENDING: 'default',
  ACCEPTED: 'info',
  ASSIGNED: 'warning',
  VISIT_SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CLOSED: 'default',
  CANCELLED: 'default',
};

const { RangePicker } = DatePicker;

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  COMM_ERROR: '통신 오류',
  INLET_TEMP: '유입 온도 이상',
  FILTER_CHECK: '필터 청소 점검',
  DUST_REMOVAL: '먼지제거 성능',
  SPARK: '스파크 감지',
};

const SEVERITY_CLASS_MAP: Record<AlertSeverity, string> = {
  WARNING: 'warning',
  CRITICAL: 'critical',
};

/** Mock: 장비 실시간 알림 카드(설계 `GET /as-service/alerts` — 실 API는 미연동). */
function EquipmentAlertsMockView() {
  const navigate = useNavigate();
  const { isAllowed: canCreateAs } = useFeaturePermission('as.create');
  const { data: storeOptions = [] } = useASStoreOptions();
  const storeSelectOptions = storeOptions.map((s) => ({ value: s.storeId, label: s.storeName }));
  const [storeId, setStoreId] = useState<number | undefined>();
  const [alertType, setAlertType] = useState<AlertType | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data, isLoading } = useASAlerts({
    storeId,
    alertType,
    from: dateRange?.[0]?.toISOString(),
    to: dateRange?.[1]?.toISOString(),
  });

  const alerts = data?.data ?? [];
  const totalCount = data?.meta?.totalCount ?? 0;

  const handleASRequest = (alert: ASAlert) => {
    // 알림에서 A/S 신청: 매장/장비 정보를 query params로 전달
    const params = new URLSearchParams();
    params.set('storeId', String(alert.storeId));
    params.set('equipmentId', String(alert.equipmentId));
    params.set('alertType', alert.alertType);
    navigate(`/as-service/request?${params.toString()}`);
  };

  const getSeverityClass = (severity: AlertSeverity) => SEVERITY_CLASS_MAP[severity] ?? 'bad';

  return (
    <div>
      <div className="as-filter">
        <Select
          placeholder="매장 선택"
          allowClear
          style={{ width: 180 }}
          options={storeSelectOptions}
          value={storeId}
          onChange={(val) => setStoreId(val)}
        />
        <Select
          placeholder="알림 유형"
          allowClear
          style={{ width: 160 }}
          options={Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => ({
            value,
            label,
          }))}
          value={alertType}
          onChange={(val) => setAlertType(val as AlertType | undefined)}
        />
        <RangePicker
          onChange={(dates) =>
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
          }
        />
      </div>

      {/* 알람 카드 리스트 */}
      <div className="as-table-container">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : alerts.length === 0 ? (
          <Empty description="알림이 없습니다" />
        ) : (
          <>
            <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--color-mid)' }}>
              총 {totalCount}건
            </div>
            {alerts.map((alert) => {
              const sevClass = getSeverityClass(alert.severity);
              return (
                <div key={alert.alertId} className={`as-alert-card as-alert-${sevClass}`}>
                  <div className={`as-alert-icon as-alert-icon-${sevClass}`}>
                    {alert.severity === 'CRITICAL' ? <ExclamationCircleOutlined /> : <WarningOutlined />}
                  </div>
                  <div className="as-alert-body">
                    <div className="as-alert-type">
                      {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                      {alert.currentValue !== undefined && (
                        <span style={{ fontWeight: 400, marginLeft: 8, fontSize: '0.8rem', color: 'var(--color-mid)' }}>
                          {alert.currentValue}{alert.unit ?? ''}
                        </span>
                      )}
                    </div>
                    <div className="as-alert-location">
                      {alert.storeName} / {alert.equipmentName}
                      {alert.controllerName ? ` / ${alert.controllerName}` : ''}
                    </div>
                    <div className="as-alert-time" title={formatDateTime(alert.createdAt)}>
                      {formatRelativeTime(alert.createdAt)}
                    </div>
                  </div>
                  <div className="as-alert-actions">
                    {alert.isResolved ? (
                      <StatusBadge status="success" label="해결됨" />
                    ) : (
                      <>
                        <StatusBadge status="danger" label="미해결" />
                        {canCreateAs && (
                          <Button
                            type="primary"
                            size="small"
                            icon={<ToolOutlined />}
                            onClick={() => handleASRequest(alert)}
                          >
                            A/S 신청
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

/** 실 API: A/S **접수** 목록 — 대시보드 A/S 위젯과 동일 (`GET /as-service/requests` + 권한 매장 필터). */
function ASRequestInquiryRealView() {
  const { data: storeOptions = [] } = useASStoreOptions();
  const storeSelectOptions = storeOptions.map((s) => ({ value: s.storeId, label: s.storeName }));
  const [storeId, setStoreId] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<ASStatus | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data, isLoading } = useASRequests({
    storeId,
    status: statusFilter,
    from: dateRange?.[0]?.toISOString(),
    to: dateRange?.[1]?.toISOString(),
  });

  const requests = data?.data ?? [];
  const totalCount = data?.meta?.totalCount ?? 0;

  const columns: ColumnsType<ASRequestListItem> = [
    {
      title: '접수번호',
      key: 'requestId',
      width: 160,
      render: (_: unknown, record) => {
        const dateStr = formatDateCompact(record.createdAt);
        return `AS-${dateStr}-${String(record.requestId).slice(-3).padStart(3, '0')}`;
      },
    },
    { title: '매장명', dataIndex: 'storeName', key: 'storeName', width: 160 },
    {
      title: '장비명',
      dataIndex: 'equipmentName',
      key: 'equipmentName',
      width: 180,
      render: (val: string) => val ?? '-',
    },
    {
      title: '고장 유형',
      dataIndex: 'faultType',
      key: 'faultType',
      width: 120,
      render: (val: FaultType) => FAULT_TYPE_LABELS[val] ?? val,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val: ASStatus) => (
        <StatusBadge status={AS_STATUS_BADGE[val] ?? 'default'} label={AS_STATUS_LABELS[val] ?? val} />
      ),
    },
    {
      title: '신청일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (val: string) => formatDate(val),
    },
  ];

  return (
    <div>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
        권한이 있는 매장의 A/S 접수 목록입니다. 대시보드 «A/S 요청 현황»과 동일한 데이터를 사용합니다.
      </Typography.Paragraph>
      <div className="as-filter">
        <Select
          placeholder="상태"
          allowClear
          style={{ width: 140 }}
          options={Object.entries(AS_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as ASStatus | undefined)}
        />
        <Select
          placeholder="매장 선택"
          allowClear
          style={{ width: 180 }}
          options={storeSelectOptions}
          value={storeId}
          onChange={(val) => setStoreId(val)}
        />
        <RangePicker
          onChange={(dates) =>
            setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
          }
        />
      </div>
      <div className="as-table-container">
        <Table<ASRequestListItem>
          className="as-table"
          rowKey="requestId"
          columns={columns}
          dataSource={requests}
          loading={isLoading}
          pagination={{
            total: totalCount,
            pageSize: 20,
            showTotal: (total) => `총 ${total}건`,
            showSizeChanger: false,
          }}
        />
      </div>
    </div>
  );
}

export default function ASAlertListPage() {
  if (useRealApi) {
    return <ASRequestInquiryRealView />;
  }
  return <EquipmentAlertsMockView />;
}
