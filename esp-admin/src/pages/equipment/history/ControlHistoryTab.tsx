import { useState } from 'react';
import { DatePicker, Select, Table, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useControlHistoryRange } from '../../../api/history.api';
import type { ControlCommand, ControlTarget } from '../../../types/control.types';
import {
  CONTROL_TARGET_LABELS,
  POWERPACK_ACTION_LABELS,
  DAMPER_ACTION_LABELS,
  FAN_ACTION_LABELS,
} from '../../../types/control.types';
import { formatDateTime } from '../../../utils/formatters';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const RANGE_PRESETS: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: '최근 1일', value: [dayjs().subtract(1, 'day'), dayjs()] },
  { label: '최근 7일', value: [dayjs().subtract(7, 'day'), dayjs()] },
  { label: '최근 30일', value: [dayjs().subtract(30, 'day'), dayjs()] },
];

const TARGET_OPTIONS = [
  { value: undefined, label: '전체' },
  { value: 0, label: '파워팩' },
  { value: 1, label: '댐퍼' },
  { value: 2, label: '시로코팬' },
];

const REQUESTOR_LABELS: Record<number, string> = {
  1: '관리자',
  2: '김대리',
  3: '박본사',
};

function getActionLabel(target: ControlTarget, action: number, value?: number): string {
  let label = '';
  switch (target) {
    case 0:
      label = POWERPACK_ACTION_LABELS[action] ?? `action=${action}`;
      break;
    case 1:
      label = DAMPER_ACTION_LABELS[action] ?? `action=${action}`;
      if (action === 1 && value !== undefined) label += ` (${value}%)`;
      if (action === 2) label += value === 1 ? ' (자동)' : ' (수동)';
      if (action === 3 && value !== undefined) label += ` (${value} CMH)`;
      break;
    case 2:
      label = FAN_ACTION_LABELS[action] ?? `action=${action}`;
      if (action === 4) label += value === 1 ? ' (자동)' : ' (수동)';
      if (action === 5 && value !== undefined) label += ` (${value} m/s)`;
      break;
  }
  return label;
}

interface ControlHistoryTabProps {
  equipmentId: number;
}

export default function ControlHistoryTab({ equipmentId }: ControlHistoryTabProps) {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [targetFilter, setTargetFilter] = useState<ControlTarget | undefined>(undefined);

  const from = dateRange[0].unix();
  const to = dateRange[1].unix();

  const { data, isLoading } = useControlHistoryRange(equipmentId, from, to, targetFilter);

  const columns: ColumnsType<ControlCommand> = [
    {
      title: '시간',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
      sorter: (a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '제어 유형',
      dataIndex: 'target',
      key: 'target',
      width: 100,
      render: (v: ControlTarget) => CONTROL_TARGET_LABELS[v],
    },
    {
      title: '대상',
      key: 'targetDevice',
      width: 140,
      render: (_: unknown, record: ControlCommand) =>
        `${record.equipmentIdMqtt} / ${record.controllerIdMqtt}`,
    },
    {
      title: '동작',
      key: 'action',
      width: 160,
      render: (_: unknown, record: ControlCommand) =>
        getActionLabel(record.target, record.action, record.value),
    },
    {
      title: '모드',
      dataIndex: 'controlMode',
      key: 'controlMode',
      width: 80,
      render: (v: string) => (
        <StatusBadge status={v === 'AUTO' ? 'info' : 'default'} label={v === 'AUTO' ? '자동' : '수동'} />
      ),
    },
    {
      title: '결과',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (v: string) => {
        const statusMap: Record<string, BadgeStatus> = { SUCCESS: 'success', FAIL: 'danger', PENDING: 'info' };
        const labelMap: Record<string, string> = { SUCCESS: '성공', FAIL: '실패', PENDING: '대기중' };
        return <StatusBadge status={statusMap[v] ?? 'default'} label={labelMap[v] ?? v} />;
      },
    },
    {
      title: '실행자',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 90,
      render: (v: number) => REQUESTOR_LABELS[v] ?? `사용자#${v}`,
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

  return (
    <div>
      {/* 필터 */}
      <div className="period-filter">
        <Space wrap>
          <Text strong>기간:</Text>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]]);
              }
            }}
            presets={RANGE_PRESETS}
            allowClear={false}
          />
          <Text strong>제어 유형:</Text>
          <Select
            value={targetFilter}
            onChange={setTargetFilter}
            style={{ width: 130 }}
            options={TARGET_OPTIONS}
          />
        </Space>
      </div>

      {/* 테이블 */}
      <div className="control-card">
        <div style={{ fontWeight: 600, marginBottom: 12 }}>제어 이력</div>
        <Table
          className="equip-table"
          columns={columns}
          dataSource={data ?? []}
          rowKey="commandId"
          size="small"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
