import { useState, useMemo } from 'react';
import { Table, Checkbox, Button, message, Spin, Typography } from 'antd';
import { SaveOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePermissionMatrix, useUpdatePermissions } from '../../api/system.api';
import type { PermissionMatrix, FeatureCode } from '../../types/system.types';
import type { UserRole } from '../../types/auth.types';
import { ROLE_CONFIG, PRIMARY_COLOR } from '../../utils/constants';

const { Text } = Typography;

const ROLES: UserRole[] = ['ADMIN', 'DEALER', 'HQ', 'OWNER'];

export default function SystemPermissionTab() {
  const { data: response, isLoading } = usePermissionMatrix();
  const updateMutation = useUpdatePermissions();

  // 변경된 권한 추적
  const [changes, setChanges] = useState<
    Record<string, boolean>
  >({});

  const matrix = response?.data ?? [];

  const handleCheckboxChange = (
    featureCode: FeatureCode,
    role: UserRole,
    checked: boolean,
  ) => {
    const key = `${featureCode}:${role}`;
    const original = matrix.find((m) => m.featureCode === featureCode);
    if (original && original.permissions[role] === checked) {
      // 원래 값으로 돌아감 — 변경 취소
      setChanges((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setChanges((prev) => ({ ...prev, [key]: checked }));
    }
  };

  const getPermissionValue = (featureCode: FeatureCode, role: UserRole): boolean => {
    const key = `${featureCode}:${role}`;
    const changed = changes[key];
    if (changed !== undefined) return changed;
    const item = matrix.find((m) => m.featureCode === featureCode);
    return item?.permissions[role] ?? false;
  };

  const hasChanges = Object.keys(changes).length > 0;

  const handleSave = async () => {
    const changeList = Object.entries(changes).map(([key, isAllowed]) => {
      const [featureCode, role] = key.split(':') as [FeatureCode, UserRole];
      return { role, featureCode, isAllowed };
    });
    try {
      await updateMutation.mutateAsync({ changes: changeList });
      setChanges({});
      message.success('권한이 저장되었습니다.');
    } catch {
      message.error('권한 저장에 실패했습니다.');
    }
  };

  // 카테고리별 그룹핑 데이터
  const tableData = useMemo(() => {
    const categories = new Map<string, PermissionMatrix[]>();
    for (const item of matrix) {
      const list = categories.get(item.category) ?? [];
      list.push(item);
      categories.set(item.category, list);
    }

    const rows: Array<{
      key: string;
      featureCode: FeatureCode;
      label: string;
      category: string;
      isCategory: boolean;
      rowSpan?: number;
    }> = [];

    for (const [category, items] of categories) {
      items.forEach((item, idx) => {
        rows.push({
          key: item.featureCode,
          featureCode: item.featureCode,
          label: item.label,
          category,
          isCategory: false,
          rowSpan: idx === 0 ? items.length : 0,
        });
      });
    }
    return rows;
  }, [matrix]);

  const columns: ColumnsType<(typeof tableData)[number]> = [
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      onCell: (record) => ({
        rowSpan: record.rowSpan,
      }),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '기능',
      dataIndex: 'label',
      key: 'label',
      width: 200,
    },
    ...ROLES.map((role) => ({
      title: (
        <span className={`role-pill ${role}`}>
          {ROLE_CONFIG[role].label}
        </span>
      ),
      key: role,
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: (typeof tableData)[number]) => {
        const checked = getPermissionValue(record.featureCode, role);
        const key = `${record.featureCode}:${role}`;
        const isChanged = key in changes;
        return (
          <Checkbox
            checked={checked}
            onChange={(e) =>
              handleCheckboxChange(record.featureCode, role, e.target.checked)
            }
            style={isChanged ? { outline: `2px solid ${PRIMARY_COLOR}`, borderRadius: 2 } : undefined}
          />
        );
      },
    })),
  ];

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="system-section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text type="secondary">
            역할별 기능 접근 권한을 설정합니다. 변경 후 저장 버튼을 클릭하세요.
          </Text>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!hasChanges}
            loading={updateMutation.isPending}
          >
            저장
          </Button>
        </div>
        <Table
          className="system-table"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
}
