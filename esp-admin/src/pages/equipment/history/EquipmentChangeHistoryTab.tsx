import { Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEquipmentChangeHistory } from '../../../api/history.api';
import type { EquipmentChangeHistory } from '../../../types/equipment.types';
import { formatDateTime } from '../../../utils/formatters';

const { Text } = Typography;

interface EquipmentChangeHistoryTabProps {
  equipmentId: number;
}

export default function EquipmentChangeHistoryTab({ equipmentId }: EquipmentChangeHistoryTabProps) {
  const { data, isLoading } = useEquipmentChangeHistory(equipmentId);

  const columns: ColumnsType<EquipmentChangeHistory> = [
    {
      title: '변경일시',
      dataIndex: 'changedAt',
      key: 'changedAt',
      width: 170,
      render: (v: string) => formatDateTime(v),
      sorter: (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: '변경 항목',
      dataIndex: 'changedField',
      key: 'changedField',
      width: 140,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: '이전값',
      dataIndex: 'oldValue',
      key: 'oldValue',
      width: 200,
      render: (v: string) => <Text type="secondary">{v}</Text>,
    },
    {
      title: '변경값',
      dataIndex: 'newValue',
      key: 'newValue',
      width: 200,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '변경자',
      dataIndex: 'changedBy',
      key: 'changedBy',
      width: 120,
    },
  ];

  return (
    <div className="control-card">
      <div style={{ fontWeight: 600, marginBottom: 12 }}>장비 변경 이력</div>
      <Table
        className="equip-table"
        columns={columns}
        dataSource={data ?? []}
        rowKey="changeId"
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        loading={isLoading}
      />
    </div>
  );
}
