import { useState } from 'react';
import { Table, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useASStatusList, useASStoreOptions } from '../../api/as-service.api';
import { formatDateTime, formatDate, formatDateCompact } from '../../utils/formatters';
import { AS_STATUS_LABELS, FAULT_TYPE_LABELS } from '../../utils/constants';
import StatusBadge from '../../components/common/StatusBadge';
import type { BadgeStatus } from '../../components/common/StatusBadge';
import type { ASRequestListItem, ASStatus, FaultType } from '../../types/as-service.types';
import { useRole } from '../../hooks/useRole';

const { RangePicker } = DatePicker;

const AS_STATUS_BADGE: Record<string, BadgeStatus> = {
  PENDING: 'default', ACCEPTED: 'info', ASSIGNED: 'warning', VISIT_SCHEDULED: 'info',
  IN_PROGRESS: 'warning', COMPLETED: 'success', REPORT_SUBMITTED: 'info', CLOSED: 'default', CANCELLED: 'default',
};

const DEALER_OPTIONS = [
  { value: 1, label: '서울환경테크' },
  { value: 2, label: '경기설비' },
  { value: 3, label: '인천환경서비스' },
];

const STATUS_OPTIONS = Object.entries(AS_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface ASStatusPageProps {
  onRowClick?: (requestId: number) => void;
}

export default function ASStatusPage({ onRowClick }: ASStatusPageProps) {
  const { isAdmin, isDealer } = useRole();
  const showDealerFilter = isAdmin || isDealer;

  const { data: storeOptions = [] } = useASStoreOptions();
  const storeSelectOptions = storeOptions.map((s) => ({ value: s.storeId, label: s.storeName }));
  const [statusFilter, setStatusFilter] = useState<ASStatus | undefined>();
  const [storeId, setStoreId] = useState<number | undefined>();
  const [dealerId, setDealerId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const { data, isLoading } = useASStatusList({
    status: statusFilter,
    storeId,
    dealerId,
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
    {
      title: '매장명',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 160,
    },
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
      filters: STATUS_OPTIONS.map((opt) => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '담당 대리점',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 140,
      render: (val: string) => val ?? '-',
    },
    {
      title: '신청일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (val: string) => formatDate(val),
      sorter: (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      defaultSortOrder: 'ascend',
    },
    {
      title: '방문 희망 일시',
      dataIndex: 'preferredVisitDatetime',
      key: 'preferredVisitDatetime',
      width: 160,
      render: (val: string) => (val ? formatDateTime(val) : '-'),
    },
  ];

  return (
    <div>
      <div className="as-filter">
        <Select
          placeholder="상태"
          allowClear
          style={{ width: 140 }}
          options={STATUS_OPTIONS}
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
        {showDealerFilter && (
          <Select
            placeholder="대리점"
            allowClear
            style={{ width: 160 }}
            options={DEALER_OPTIONS}
            value={dealerId}
            onChange={(val) => setDealerId(val)}
          />
        )}
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
          size="middle"
          onRow={(record) => ({
            onClick: () => onRowClick?.(record.requestId),
            style: { cursor: onRowClick ? 'pointer' : 'default' },
          })}
        />
      </div>
    </div>
  );
}
