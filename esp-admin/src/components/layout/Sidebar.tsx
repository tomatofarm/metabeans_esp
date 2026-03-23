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

/**
 * URL에 특정 장비 id가 묶인 화면(편집·등록)에서는 사이드바로 다른 장비를 고를 때
 * 그대로 두면 라우트 param이 안 바뀌어 화면이 고정됨 → 일반 장비 탭으로 이동.
 */
function resolveEquipmentPathOnTreeSelect(currentPath: string): string {
  if (
    currentPath.startsWith('/equipment/edit/') ||
    currentPath === '/equipment/register'
  ) {
    return '/equipment';
  }
  if (currentPath.startsWith('/equipment')) {
    return currentPath;
  }
  return '/equipment';
}

export default function Sidebar() {
  const [searchText, setSearchText] = useState('');
  const {
    sidebarCollapsed,
    selectedStoreId,
    selectedEquipmentId,
    selectedControllerId,
    selectStore,
    selectEquipment,
    selectController,
    clearSelection,
  } = useUiStore();
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

  /** uiStore와 트리 하이라이트 동기화 (재클릭 시 선택 해제도 store에 반영) */
  const selectedTreeKeys = useMemo(() => {
    if (selectedControllerId != null) return [`controller-${selectedControllerId}`];
    if (selectedEquipmentId != null) return [`equipment-${selectedEquipmentId}`];
    if (selectedStoreId != null) return [`store-${selectedStoreId}`];
    return [];
  }, [selectedControllerId, selectedEquipmentId, selectedStoreId]);

  const handleSelect = (selectedKeys: React.Key[]) => {
    // 같은 매장/장비/컨트롤러를 다시 눌러 선택 해제된 경우 → 역할별 기본 대시보드로 복귀
    if (selectedKeys.length === 0) {
      clearSelection();
      navigate('/dashboard');
      return;
    }

    const key = selectedKeys[0]?.toString();
    if (!key) return;

    const [type, id] = key.split('-');
    const numId = parseInt(id ?? '0', 10);

    const equipPath = resolveEquipmentPathOnTreeSelect(location.pathname);

    switch (type) {
      case 'store':
        selectStore(numId);
        navigate('/dashboard');
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
          selectedKeys={selectedTreeKeys}
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
