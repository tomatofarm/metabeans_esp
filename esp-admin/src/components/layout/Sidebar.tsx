import type { ReactNode } from 'react';
import { Tree, Input, Empty } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  ShopOutlined,
  DesktopOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import type { StoreTreeNode } from '../../types/equipment.types';
import { mockStoreTree, STORE_ID_MAP } from '../../api/mock/common.mock';

const { Search } = Input;

// --- 상태 dot ---

type DotStatus = 'GOOD' | 'WARNING' | 'DANGER' | 'NONE';

const DOT_COLORS: Record<DotStatus, string> = {
  GOOD: 'var(--color-success)',
  WARNING: 'var(--color-warning)',
  DANGER: 'var(--color-danger)',
  NONE: 'var(--color-light)',
};

function StatusDot({ status }: { status: DotStatus }) {
  return (
    <span
      className={status === 'DANGER' ? 'status-dot-pulse' : undefined}
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: DOT_COLORS[status],
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

function TreeTitle({ name, status }: { name: string; status?: DotStatus }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      {status && <StatusDot status={status} />}
    </div>
  );
}

/** connectionStatus → DotStatus */
function connToDot(conn: string): DotStatus {
  return conn === 'ONLINE' ? 'GOOD' : 'DANGER';
}

/** 하위 connectionStatus 배열로 부모 상태 결정 */
function propagateDot(statuses: string[]): DotStatus {
  if (statuses.length === 0) return 'NONE';
  const offlineCount = statuses.filter((s) => s !== 'ONLINE').length;
  if (offlineCount === 0) return 'GOOD';
  if (offlineCount === statuses.length) return 'DANGER';
  return 'WARNING';
}

function filterStoresByRole(stores: StoreTreeNode[], storeIds: string[]): StoreTreeNode[] {
  if (storeIds.includes('*')) return stores;
  const numericIds = storeIds
    .map((sid) => STORE_ID_MAP[sid])
    .filter((id): id is number => id !== undefined);
  return stores.filter((s) => numericIds.includes(s.storeId));
}

function buildTreeData(stores: StoreTreeNode[], searchText: string): DataNode[] {
  const filtered = searchText
    ? stores.filter((s) => s.storeName.toLowerCase().includes(searchText.toLowerCase()))
    : stores;

  return filtered.map((store) => {
    // 업체명 > 집진기 > 콘트롤러 (층/게이트웨이는 평탄화)
    const allEquipments: DataNode[] = [];
    const allEquipConns: string[] = [];

    for (const fl of store.floors) {
      for (const gw of fl.gateways) {
        for (const equip of gw.equipments) {
          allEquipConns.push(equip.connectionStatus);
          const ctrlConns = equip.controllers.map((c) => c.connectionStatus);
          const equipStatus: DotStatus =
            equip.connectionStatus === 'OFFLINE'
              ? 'DANGER'
              : propagateDot(ctrlConns);

          allEquipments.push({
            title: (
              <TreeTitle
                name={equip.equipmentName ?? equip.mqttEquipmentId}
                status={equipStatus}
              />
            ),
            key: `equipment-${equip.equipmentId}`,
            icon: <DesktopOutlined />,
            children: equip.controllers.map((ctrl) => ({
              title: (
                <TreeTitle
                  name={ctrl.ctrlDeviceId}
                  status={connToDot(ctrl.connectionStatus)}
                />
              ),
              key: `controller-${ctrl.controllerId}`,
              icon: <ControlOutlined />,
              isLeaf: true,
            })),
          });
        }
      }
    }

    const storeStatus: DotStatus =
      store.status !== 'ACTIVE' ? 'NONE' : propagateDot(allEquipConns);

    return {
      title: <TreeTitle name={store.storeName} status={storeStatus} />,
      key: `store-${store.storeId}`,
      icon: <ShopOutlined />,
      children: allEquipments,
    };
  });
}

// controllerId → equipmentId 매핑 빌드
function buildControllerToEquipmentMap(stores: StoreTreeNode[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const store of stores) {
    for (const fl of store.floors) {
      for (const gw of fl.gateways) {
        for (const equip of gw.equipments) {
          for (const ctrl of equip.controllers) {
            map[ctrl.controllerId] = equip.equipmentId;
          }
        }
      }
    }
  }
  return map;
}

export default function Sidebar() {
  const [searchText, setSearchText] = useState('');
  const { sidebarCollapsed, selectStore, selectEquipment, selectController } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  const roleFilteredStores = useMemo(
    () => filterStoresByRole(mockStoreTree, user?.storeIds ?? ['*']),
    [user?.storeIds],
  );

  const controllerToEquipment = useMemo(
    () => buildControllerToEquipmentMap(roleFilteredStores),
    [roleFilteredStores],
  );

  const treeData = useMemo(
    () => buildTreeData(roleFilteredStores, searchText),
    [roleFilteredStores, searchText],
  );

  const handleSelect = (selectedKeys: React.Key[]) => {
    const key = selectedKeys[0]?.toString();
    if (!key) return;

    const [type, id] = key.split('-');
    const numId = parseInt(id ?? '0', 10);

    // 이미 장비 관련 페이지에 있으면 현재 경로 유지, 아니면 /equipment로 이동
    const equipPath = location.pathname.startsWith('/equipment') ? location.pathname : '/equipment';

    switch (type) {
      case 'store':
        selectStore(numId);
        break;
      case 'equipment':
        selectEquipment(numId);
        navigate(equipPath);
        break;
      case 'controller': {
        const parentEquipmentId = controllerToEquipment[numId];
        if (parentEquipmentId) {
          selectEquipment(parentEquipmentId);
        }
        selectController(numId);
        navigate(equipPath);
        break;
      }
    }
  };

  if (sidebarCollapsed) return null;

  return (
    <aside
      style={{
        width: 240,
        background: 'var(--color-white)',
        borderRight: '1px solid var(--color-border)',
        position: 'fixed',
        top: 64,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        padding: '16px 8px',
      }}
    >
      <div style={{ padding: '0 4px 12px' }}>
        <Search
          placeholder="매장 검색"
          allowClear
          size="small"
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      {treeData.length > 0 ? (
        <Tree
          showIcon
          defaultExpandAll
          treeData={treeData}
          onSelect={handleSelect}
          className="sidebar-tree"
          style={{ padding: '0 4px' }}
        />
      ) : (
        <Empty description="매장 없음" style={{ marginTop: 40 }} />
      )}
    </aside>
  );
}
