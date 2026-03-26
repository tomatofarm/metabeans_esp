import { useMemo, useState } from 'react';
import { Checkbox, Button, message, Spin, Table, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { usePermissionMatrix, useUpdatePermissions } from '../../api/system.api';
import type { PermissionMatrix, FeatureCode } from '../../types/system.types';
import type { UserRole } from '../../types/auth.types';
import { ROLE_CONFIG } from '../../utils/constants';

const { Text } = Typography;

const ROLES: UserRole[] = ['ADMIN', 'DEALER', 'HQ', 'OWNER'];

type TableRow =
  | { key: string; type: 'group'; category: string; featureCodes: FeatureCode[] }
  | { key: string; type: 'feature'; category: string; featureCode: FeatureCode; label: string };

const makeKey = (featureCode: FeatureCode, role: UserRole) => `${featureCode}:${role}`;

export default function SystemPermissionTab() {
  const { data: response, isLoading } = usePermissionMatrix();
  const updateMutation = useUpdatePermissions();

  const [changes, setChanges] = useState<Record<string, boolean>>({});

  const matrix = response?.data ?? [];

  const handleCheckboxChange = (featureCode: FeatureCode, role: UserRole, checked: boolean) => {
    const key = makeKey(featureCode, role);
    const original = matrix.find((m) => m.featureCode === featureCode);
    if (original && original.permissions[role] === checked) {
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
    const changed = changes[makeKey(featureCode, role)];
    if (changed !== undefined) return changed;
    return matrix.find((m) => m.featureCode === featureCode)?.permissions[role] ?? false;
  };

  const hasChanges = Object.keys(changes).length > 0;

  const handleSave = async () => {
    const changeList = Object.entries(changes).map(([key, isAllowed]) => {
      const [featureCode, role] = key.split(':') as [FeatureCode, UserRole];
      return { featureCode, role, isAllowed };
    });
    try {
      await updateMutation.mutateAsync({ changes: changeList });
      setChanges({});
      message.success('권한이 저장되었습니다.');
    } catch {
      message.error('권한 저장에 실패했습니다.');
    }
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, PermissionMatrix[]>();
    for (const item of matrix) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [matrix]);

  const tableRows = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = [];
    for (const [category, items] of categoryMap) {
      const featureCodes = items.map((i) => i.featureCode);
      rows.push({
        key: `group:${category}`,
        type: 'group',
        category,
        featureCodes,
      });
      for (const item of items) {
        rows.push({
          key: item.featureCode,
          type: 'feature',
          category,
          featureCode: item.featureCode,
          label: item.label,
        });
      }
    }
    return rows;
  }, [categoryMap]);

  const handleCategoryToggle = (category: string, role: UserRole, checked: boolean) => {
    const items = categoryMap.get(category) ?? [];
    setChanges((prev) => {
      const next = { ...prev };
      for (const item of items) {
        const key = makeKey(item.featureCode, role);
        if (item.permissions[role] === checked) {
          delete next[key];
        } else {
          next[key] = checked;
        }
      }
      return next;
    });
  };

  const columns: ColumnsType<TableRow> = [
    {
      title: '기능',
      dataIndex: 'label',
      key: 'label',
      width: 460,
      render: (_: unknown, record: TableRow) => {
        if (record.type === 'group') {
          return <Text strong>{record.category}</Text>;
        }
        return <span className="system-permission-feature-label">{record.label}</span>;
      },
    },
    ...ROLES.map((role) => ({
      title: (
        <span className={`role-pill ${role}`}>{ROLE_CONFIG[role].label}</span>
      ),
      key: role,
      width: 130,
      align: 'center' as const,
      render: (_: unknown, record: TableRow) => {
        if (record.type === 'group') {
          const values = record.featureCodes.map((code) => getPermissionValue(code, role));
          const allChecked = values.length > 0 && values.every(Boolean);
          return (
            <Checkbox
              checked={allChecked}
              onChange={(e) => handleCategoryToggle(record.category, role, e.target.checked)}
            />
          );
        }

        const checked = getPermissionValue(record.featureCode, role);
        return (
          <Checkbox
            checked={checked}
            onChange={(e) =>
              handleCheckboxChange(record.featureCode, role, e.target.checked)
            }
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
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
          dataSource={tableRows}
          rowKey="key"
          rowClassName={(record) =>
            record.type === 'group'
              ? 'system-permission-group-row'
              : 'system-permission-feature-row'
          }
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
}
