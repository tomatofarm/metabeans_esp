import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Table, Select, Input, Button, Modal, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined, UserAddOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useCustomerList, useCustomerDealerOptions } from '../../api/customer.api';
import { REGION_OPTIONS, CUSTOMER_HQ_OPTIONS } from '../../api/mock/customer.mock';
import type { CustomerListItem, CustomerListParams } from '../../types/customer.types';
import type { StoreStatus } from '../../types/store.types';
import StatusBadge from '../../components/common/StatusBadge';
import type { BadgeStatus } from '../../components/common/StatusBadge';
import { STATUS_COLORS } from '../../utils/constants';
import { geocodeAddressToLatLng } from '../../utils/geocodePhoton';
import CustomerEditModal from './CustomerEditModal';

const LIST_FETCH_PAGE_SIZE = 500;
const TABLE_PAGE_SIZE = 10;

const EMPTY_CUSTOMERS: CustomerListItem[] = [];

const STATUS_CONFIG: Record<StoreStatus, { status: BadgeStatus; label: string }> = {
  ACTIVE: { status: 'success', label: '정상' },
  INACTIVE: { status: 'default', label: '비활성' },
  PENDING: { status: 'warning', label: '대기' },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'ACTIVE', label: '정상' },
  { value: 'PENDING', label: '대기' },
  { value: 'INACTIVE', label: '비활성' },
];

/** API가 위·경도를 안 주면 실 API 매핑에서 (0,0)이 됨 → 대서양으로 찍히는 것처럼 보임. 지도에는 유효 좌표만 사용. */
function isPlottableLatLng(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

function createCustomerMarkerIcon(status: StoreStatus): L.DivIcon {
  const color =
    status === 'ACTIVE'
      ? STATUS_COLORS.GOOD.color
      : status === 'PENDING'
        ? STATUS_COLORS.WARNING.color
        : '#bfbfbf';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/** 필터 결과가 바뀔 때 bounds 맞춤 / 행 선택 시 이동·팝업 */
function MapSync({
  customers,
  selectedStoreId,
  markerRefs,
}: {
  customers: CustomerListItem[];
  selectedStoreId: number | null;
  markerRefs: React.MutableRefObject<Map<number, L.Marker>>;
}) {
  const map = useMap();
  const boundsKey = useMemo(
    () =>
      customers
        .map((c) => c.storeId)
        .sort((a, b) => a - b)
        .join(','),
    [customers],
  );
  const prevBoundsKey = useRef<string>('');

  useEffect(() => {
    if (customers.length === 0) {
      prevBoundsKey.current = boundsKey;
      return;
    }
    if (boundsKey === prevBoundsKey.current) return;
    prevBoundsKey.current = boundsKey;
    const plotPoints = customers.filter((c) => isPlottableLatLng(c.latitude, c.longitude));
    if (plotPoints.length === 0) return;
    const bounds = L.latLngBounds(
      plotPoints.map((c) => [c.latitude, c.longitude] as L.LatLngTuple),
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.12));
    }
  }, [boundsKey, customers, map]);

  useEffect(() => {
    if (selectedStoreId == null) return;
    const c = customers.find((x) => x.storeId === selectedStoreId);
    if (!c) return;
    if (!isPlottableLatLng(c.latitude, c.longitude)) return;
    map.flyTo([c.latitude, c.longitude], 15, { duration: 0.4 });
    const m = markerRefs.current.get(selectedStoreId);
    window.setTimeout(() => m?.openPopup(), 450);
  }, [selectedStoreId, customers, map, markerRefs]);

  return null;
}

export default function CustomerListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | undefined>();
  const [hqFilter, setHqFilter] = useState<string | undefined>();
  const [regionFilter, setRegionFilter] = useState<string | undefined>();
  const [dealerFilter, setDealerFilter] = useState<number | undefined>();
  const [tablePage, setTablePage] = useState(1);

  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [editStoreId, setEditStoreId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const markerRefs = useRef<Map<number, L.Marker>>(new Map());
  /** API 좌표가 없을 때 Photon( 무료 OSM 검색 엔진) 주소 → 좌표 캐시 */
  const [geocodeOverrides, setGeocodeOverrides] = useState<
    Record<number, { lat: number; lng: number }>
  >({});
  const addressGeocodeDedupeRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  const listParams: CustomerListParams = {
    search: search || undefined,
    status: statusFilter,
    hqName: hqFilter,
    region: regionFilter,
    dealerId: dealerFilter,
    page: 1,
    pageSize: LIST_FETCH_PAGE_SIZE,
  };

  const { data: listData, isLoading } = useCustomerList(listParams);
  const { data: dealerOptions } = useCustomerDealerOptions();

  const allCustomers = listData?.data ?? EMPTY_CUSTOMERS;
  const totalCount = listData?.meta?.totalCount ?? allCustomers.length;

  const customersForMap = useMemo(() => {
    return allCustomers.flatMap((c) => {
      if (isPlottableLatLng(c.latitude, c.longitude)) return [c];
      const g = geocodeOverrides[c.storeId];
      if (g && isPlottableLatLng(g.lat, g.lng))
        return [{ ...c, latitude: g.lat, longitude: g.lng }];
      return [];
    });
  }, [allCustomers, geocodeOverrides]);

  const geocodeWorkKey = useMemo(
    () =>
      allCustomers
        .filter((c) => !isPlottableLatLng(c.latitude, c.longitude) && (c.address?.trim() ?? '').length >= 4)
        .map((c) => `${c.storeId}:${c.address?.trim() ?? ''}`)
        .sort()
        .join('|'),
    [allCustomers],
  );

  useEffect(() => {
    if (!geocodeWorkKey) return;
    let cancelled = false;

    (async () => {
      const need = allCustomers.filter(
        (c) =>
          !isPlottableLatLng(c.latitude, c.longitude) &&
          (c.address?.trim() ?? '').length >= 4,
      );
      for (const c of need) {
        if (cancelled) return;

        const normAddr = (c.address ?? '').trim().replace(/\s+/g, ' ');
        let pos = addressGeocodeDedupeRef.current.get(normAddr);
        if (!pos) {
          const hit = await geocodeAddressToLatLng(normAddr);
          await new Promise((r) => setTimeout(r, 450));
          if (cancelled) return;
          if (hit && isPlottableLatLng(hit.lat, hit.lng)) {
            addressGeocodeDedupeRef.current.set(normAddr, hit);
            pos = hit;
          }
        }
        if (pos && isPlottableLatLng(pos.lat, pos.lng)) {
          setGeocodeOverrides((prev) =>
            prev[c.storeId] ? prev : { ...prev, [c.storeId]: { lat: pos.lat, lng: pos.lng } },
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // geocodeWorkKey 는 allCustomers 기반 — 키가 바뀔 때 클로저의 allCustomers 는 최신 목록과 일치함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodeWorkKey]);

  useEffect(() => {
    setSelectedStoreId((prev) => {
      if (prev == null) return null;
      return allCustomers.some((c) => c.storeId === prev) ? prev : null;
    });
  }, [allCustomers]);

  /** 선택·목록이 바뀔 때 해당 행이 있는 페이지로 맞춤 (필터/정렬 등 목록 변화) */
  useEffect(() => {
    if (selectedStoreId == null) return;
    const idx = allCustomers.findIndex((c) => c.storeId === selectedStoreId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / TABLE_PAGE_SIZE) + 1;
    setTablePage((prev) => (prev === targetPage ? prev : targetPage));
  }, [selectedStoreId, allCustomers]);

  /** 지도 핀: 같은 고객을 다시 눌러도 selectedStoreId가 그대로일 수 있으므로 페이지는 항상 여기서 동기화 */
  const selectStoreFromMap = useCallback(
    (storeId: number) => {
      const idx = allCustomers.findIndex((c) => c.storeId === storeId);
      if (idx !== -1) {
        setTablePage(Math.floor(idx / TABLE_PAGE_SIZE) + 1);
      }
      setSelectedStoreId(storeId);
    },
    [allCustomers],
  );

  const pagedCustomers = useMemo(() => {
    const start = (tablePage - 1) * TABLE_PAGE_SIZE;
    return allCustomers.slice(start, start + TABLE_PAGE_SIZE);
  }, [allCustomers, tablePage]);

  const openEdit = useCallback((storeId: number) => {
    setEditStoreId(storeId);
    setModalOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setModalOpen(false);
    setEditStoreId(null);
  }, []);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setHqFilter(undefined);
    setRegionFilter(undefined);
    setDealerFilter(undefined);
    setTablePage(1);
    setSelectedStoreId(null);
  };

  const onFilterChange = () => {
    setTablePage(1);
    setSelectedStoreId(null);
  };

  const handleRegisterClick = () => {
    Modal.confirm({
      title: '고객 등록',
      content:
        '새 매장(점주)은 점주 회원가입 절차를 통해 등록됩니다. 점주 회원가입 화면으로 이동할까요?',
      okText: '이동',
      cancelText: '취소',
      onOk: () => navigate('/register/owner'),
    });
  };

  const hqSelectOptions = CUSTOMER_HQ_OPTIONS.map((name) => ({ value: name, label: name }));

  const columns: ColumnsType<CustomerListItem> = [
    {
      title: '매장명',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 200,
      ellipsis: true,
      sorter: (a, b) => a.storeName.localeCompare(b.storeName),
    },
    {
      title: '매장본사명',
      dataIndex: 'hqName',
      key: 'hqName',
      width: 140,
      ellipsis: true,
      render: (v: string | undefined) => v ?? '—',
      sorter: (a, b) => (a.hqName ?? '').localeCompare(b.hqName ?? ''),
    },
    {
      title: '장비',
      dataIndex: 'equipmentCount',
      key: 'equipmentCount',
      width: 72,
      align: 'center',
      render: (n: number) => `${n}대`,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      render: (val: StoreStatus) => {
        const cfg = STATUS_CONFIG[val];
        return <StatusBadge status={cfg.status} label={cfg.label} />;
      },
    },
    {
      title: '담당 대리점',
      dataIndex: 'dealerName',
      key: 'dealerName',
      width: 130,
      ellipsis: true,
    },
    {
      title: '작업',
      key: 'actions',
      width: 72,
      align: 'center',
      render: (_: unknown, record: CustomerListItem) => (
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          aria-label="수정"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(record.storeId);
          }}
        />
      ),
    },
  ];

  return (
    <div className="customer-page-body">
      <div className="customer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 className="customer-header-title">고객 현황</h2>
          <span className="customer-count-badge">{totalCount}개 매장</span>
        </div>
      </div>

      <div className="customer-filter customer-filter-toolbar">
        <Space wrap size={12} style={{ flex: 1 }}>
          <Input
            placeholder="매장명·주소·연락처 검색"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              onFilterChange();
            }}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="매장본사"
            allowClear
            style={{ width: 150 }}
            options={hqSelectOptions}
            value={hqFilter}
            onChange={(val) => {
              setHqFilter(val);
              onFilterChange();
            }}
          />
          <Select
            placeholder="담당 대리점"
            allowClear
            style={{ width: 160 }}
            options={dealerOptions?.map((d) => ({
              value: d.dealerId,
              label: d.dealerName,
            }))}
            value={dealerFilter}
            onChange={(val) => {
              setDealerFilter(val);
              onFilterChange();
            }}
          />
          <Select
            placeholder="상태"
            allowClear
            style={{ width: 120 }}
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val as StoreStatus | undefined);
              onFilterChange();
            }}
          />
          <Select
            placeholder="지역"
            allowClear
            style={{ width: 120 }}
            options={REGION_OPTIONS}
            value={regionFilter}
            onChange={(val) => {
              setRegionFilter(val);
              onFilterChange();
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={resetFilters}>
            초기화
          </Button>
        </Space>
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleRegisterClick}>
          고객등록
        </Button>
      </div>

      <div className="customer-page-layout">
        <div className="customer-map-panel">
          <div className="customer-map-legend" aria-hidden>
            <span className="customer-map-legend-item">
              <i className="customer-map-legend-dot" style={{ background: STATUS_COLORS.GOOD.color }} />
              정상
            </span>
            <span className="customer-map-legend-item">
              <i className="customer-map-legend-dot" style={{ background: STATUS_COLORS.WARNING.color }} />
              대기
            </span>
            <span className="customer-map-legend-item">
              <i className="customer-map-legend-dot" style={{ background: '#bfbfbf' }} />
              비활성
            </span>
          </div>
          <div className="customer-map-container-split">
            <MapContainer
              center={[37.5326, 126.9786]}
              zoom={11}
              style={{ height: '100%', width: '100%', borderRadius: 12 }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapSync
                customers={customersForMap}
                selectedStoreId={selectedStoreId}
                markerRefs={markerRefs}
              />
              {customersForMap.map((store) => (
                <Marker
                  key={store.storeId}
                  ref={(el) => {
                    if (el) markerRefs.current.set(store.storeId, el);
                    else markerRefs.current.delete(store.storeId);
                  }}
                  position={[store.latitude, store.longitude]}
                  icon={createCustomerMarkerIcon(store.status)}
                  eventHandlers={{
                    click: () => selectStoreFromMap(store.storeId),
                  }}
                >
                  <Popup>
                    <div className="customer-map-popup">
                      <strong>{store.storeName}</strong>
                      {store.hqName ? (
                        <div className="customer-map-popup-sub">{store.hqName}</div>
                      ) : null}
                      <div className="customer-map-popup-sub">{store.address}</div>
                      <div className="customer-map-popup-meta">
                        장비 {store.equipmentCount}대 ·{' '}
                        <StatusBadge
                          status={STATUS_CONFIG[store.status].status}
                          label={STATUS_CONFIG[store.status].label}
                        />
                      </div>
                      <div className="customer-map-popup-meta">담당 {store.dealerName}</div>
                      <Button
                        type="link"
                        size="small"
                        style={{ paddingLeft: 0 }}
                        onClick={() => openEdit(store.storeId)}
                      >
                        수정
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="customer-table-wrap customer-table-split">
          <div className="customer-table-header">
            <span className="customer-table-header-title">고객 목록</span>
            <span className="customer-table-header-count">{totalCount}건</span>
          </div>
          <Table<CustomerListItem>
            className="customer-table"
            rowKey="storeId"
            columns={columns}
            dataSource={pagedCustomers}
            loading={isLoading}
            pagination={{
              current: tablePage,
              total: totalCount,
              pageSize: TABLE_PAGE_SIZE,
              showTotal: (t) => `총 ${t}건`,
              showSizeChanger: false,
              onChange: (p) => setTablePage(p),
            }}
            size="middle"
            rowClassName={(record) =>
              record.storeId === selectedStoreId ? 'customer-table-row-selected' : ''
            }
            onRow={(record) => ({
              onClick: () => setSelectedStoreId(record.storeId),
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      </div>

      <CustomerEditModal storeId={editStoreId} open={modalOpen} onClose={closeEdit} />
    </div>
  );
}
