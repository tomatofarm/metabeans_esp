import { useState } from 'react';
import { Select, DatePicker, Button, Spin, Empty } from 'antd';
import { ToolOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useASAlerts } from '../../api/as-service.api';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import type { ASAlert, AlertType, AlertSeverity } from '../../types/as-service.types';

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

const STORE_OPTIONS = [
  { value: 1, label: '강남점 (튀김)' },
  { value: 2, label: '홍대점 (굽기)' },
  { value: 3, label: '신촌점 (커피로스팅)' },
];

export default function ASAlertListPage() {
  const navigate = useNavigate();
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
      {/* 필터 바 */}
      <div className="as-filter">
        <Select
          placeholder="매장 선택"
          allowClear
          style={{ width: 180 }}
          options={STORE_OPTIONS}
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
                        <Button
                          type="primary"
                          size="small"
                          icon={<ToolOutlined />}
                          onClick={() => handleASRequest(alert)}
                        >
                          A/S 신청
                        </Button>
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
