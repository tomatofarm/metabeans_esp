import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Table, Select, Input, Button, Space, Spin } from 'antd';
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useCustomerList, useCustomerDealerOptions, useCustomerHqOptions } from '../../api/customer.api';
import { REGION_OPTIONS } from '../../api/mock/customer.mock';
import type { CustomerListItem, CustomerListParams } from '../../types/customer.types';
import type { StoreStatus } from '../../types/store.types';
import StatusBadge from '../../components/common/StatusBadge';
import type { BadgeStatus } from '../../components/common/StatusBadge';
import { STATUS_COLORS } from '../../utils/constants';
import { isPlottableLatLng, createCustomerMarkerIcon } from '../../utils/customerMapGeo';
import CustomerEditModal from './CustomerEditModal';

const LIST_FETCH_PAGE_SIZE = 500;
const TABLE_PAGE_SIZE = 10;

const EMPTY_CUSTOMERS: CustomerListItem[] = [];
const GOOGLE_MAPS_LIBRARIES: ('maps' | 'places')[] = ['maps'];
const DEFAULT_CENTER = { lat: 37.5326, lng: 126.9786 };
const DEFAULT_ZOOM = 11;

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

export default function CustomerListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoreStatus | undefined>();
  const [hqFilter, setHqFilter] = useState<string | undefined>();
  const [regionFilter, setRegionFilter] = useState<string | undefined>();
  const [dealerFilter, setDealerFilter] = useState<number | undefined>();
  const [tablePage, setTablePage] = useState(1);

  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [activeInfoStoreId, setActiveInfoStoreId] = useState<number | null>(null);
  const [editStoreId, setEditStoreId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  const listParams: CustomerListParams = {
    search: search || undefined,
    status: statusFilter,
    hqName: hqFilter,
    region: regionFilter,
    dealerId: dealerFilter,
    page: 1,
    pageSize: LIST_FETCH_PAGE_SIZE,
  };

  const { data: listData, isLoading, isFetching } = useCustomerList(listParams);
  const { data: dealerOptions } = useCustomerDealerOptions();
  const { data: hqOptionsFromApi = [], isLoading: hqOptionsLoading } = useCustomerHqOptions();

  const allCustomers = listData?.data ?? EMPTY_CUSTOMERS;
  const totalCount = listData?.meta?.totalCount ?? allCustomers.length;

  const customersForMap = useMemo(
    () => allCustomers.filter((c) => isPlottableLatLng(c.latitude, c.longitude)),
    [allCustomers],
  );

  // 필터 변경 시 선택 해제
  useEffect(() => {
    setSelectedStoreId((prev) => {
      if (prev == null) return null;
      return allCustomers.some((c) => c.storeId === prev) ? prev : null;
    });
  }, [allCustomers]);

  // 선택된 행이 있는 테이블 페이지로 이동
  useEffect(() => {
    if (selectedStoreId == null) return;
    const idx = allCustomers.findIndex((c) => c.storeId === selectedStoreId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / TABLE_PAGE_SIZE) + 1;
    setTablePage((prev) => (prev === targetPage ? prev : targetPage));
  }, [selectedStoreId, allCustomers]);

  // 행 선택 시 지도 이동 + 팝업 열기
  useEffect(() => {
    if (!isLoaded || !mapRef.current || selectedStoreId == null) return;
    const c = customersForMap.find((x) => x.storeId === selectedStoreId);
    if (!c) return;
    mapRef.current.panTo({ lat: c.latitude, lng: c.longitude });
    mapRef.current.setZoom(15);
    setActiveInfoStoreId(selectedStoreId);
  }, [isLoaded, selectedStoreId, customersForMap]);

  // fitBounds: 필터 결과 변경 시
  const boundsKey = useMemo(
    () =>
      customersForMap
        .map((c) => `${c.storeId}:${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`)
        .sort()
        .join('|'),
    [customersForMap],
  );
  const prevBoundsKey = useRef('');

  useEffect(() => {
    if (!isLoaded || !mapRef.current || customersForMap.length === 0) return;
    if (selectedStoreId != null) return;
    if (boundsKey === prevBoundsKey.current) return;
    prevBoundsKey.current = boundsKey;

    const bounds = new window.google.maps.LatLngBounds();
    customersForMap.forEach((c) => bounds.extend({ lat: c.latitude, lng: c.longitude }));
    if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds);
  }, [isLoaded, boundsKey, customersForMap, selectedStoreId]);

  const selectStoreFromMap = useCallback(
    (storeId: number) => {
      const idx = allCustomers.findIndex((c) => c.storeId === storeId);
      if (idx !== -1) setTablePage(Math.floor(idx / TABLE_PAGE_SIZE) + 1);
      setSelectedStoreId(storeId);
      setActiveInfoStoreId(storeId);
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
    setActiveInfoStoreId(null);
  };

  const onFilterChange = () => {
    setTablePage(1);
    setSelectedStoreId(null);
    setActiveInfoStoreId(null);
  };

  const hqSelectOptions = hqOptionsFromApi.map((name) => ({ value: name, label: name }));
  const activeInfoStore = customersForMap.find((s) => s.storeId === activeInfoStoreId) ?? null;

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
            onChange={(e) => { setSearch(e.target.value); onFilterChange(); }}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="매장본사"
            allowClear
            loading={hqOptionsLoading}
            style={{ width: 150 }}
            options={hqSelectOptions}
            value={hqFilter}
            onChange={(val) => { setHqFilter(val); onFilterChange(); }}
          />
          <Select
            placeholder="담당 대리점"
            allowClear
            style={{ width: 160 }}
            options={dealerOptions?.map((d) => ({ value: d.dealerId, label: d.dealerName }))}
            value={dealerFilter}
            onChange={(val) => { setDealerFilter(val); onFilterChange(); }}
          />
          <Select
            placeholder="상태"
            allowClear
            style={{ width: 120 }}
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val as StoreStatus | undefined); onFilterChange(); }}
          />
          <Select
            placeholder="지역"
            allowClear
            style={{ width: 120 }}
            options={REGION_OPTIONS}
            value={regionFilter}
            onChange={(val) => { setRegionFilter(val); onFilterChange(); }}
          />
          <Button icon={<ReloadOutlined />} onClick={resetFilters}>초기화</Button>
        </Space>
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
          {isFetching && (
            <div className="customer-map-hint" style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
              고객 목록을 갱신 중입니다.
            </div>
          )}
          <div className="customer-map-container-split">
            {!isLoaded ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={{ height: '100%', width: '100%', borderRadius: 12 }}
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                onLoad={(map) => { mapRef.current = map; }}
                onUnmount={() => { mapRef.current = null; }}
                options={{ gestureHandling: 'greedy' }}
              >
                {customersForMap.map((store) => (
                  <Marker
                    key={store.storeId}
                    position={{ lat: store.latitude, lng: store.longitude }}
                    icon={createCustomerMarkerIcon(store.status)}
                    onClick={() => selectStoreFromMap(store.storeId)}
                  />
                ))}
                {activeInfoStore ? (
                  <InfoWindow
                    position={{ lat: activeInfoStore.latitude, lng: activeInfoStore.longitude }}
                    onCloseClick={() => setActiveInfoStoreId(null)}
                    options={{ pixelOffset: new window.google.maps.Size(0, -12) }}
                  >
                    <div className="customer-map-popup">
                      <strong>{activeInfoStore.storeName}</strong>
                      {activeInfoStore.hqName ? (
                        <div className="customer-map-popup-sub">{activeInfoStore.hqName}</div>
                      ) : null}
                      <div className="customer-map-popup-sub">{activeInfoStore.address}</div>
                      <div className="customer-map-popup-meta">
                        장비 {activeInfoStore.equipmentCount}대 ·{' '}
                        <StatusBadge
                          status={STATUS_CONFIG[activeInfoStore.status].status}
                          label={STATUS_CONFIG[activeInfoStore.status].label}
                        />
                      </div>
                      <div className="customer-map-popup-meta">담당 {activeInfoStore.dealerName}</div>
                      <Button
                        type="link"
                        size="small"
                        style={{ paddingLeft: 0 }}
                        onClick={() => openEdit(activeInfoStore.storeId)}
                      >
                        수정
                      </Button>
                    </div>
                  </InfoWindow>
                ) : null}
              </GoogleMap>
            )}
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
