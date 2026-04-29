import { Card } from 'antd';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
import type { CustomerListItem } from '../../../types/customer.types';
import type { StoreStatus } from '../../../types/store.types';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';
import { createCustomerMarkerIcon, isPlottableLatLng } from '../../../utils/customerMapGeo';
import { useCustomerMapGeocode } from '../../../hooks/useCustomerMapGeocode';

const STATUS_CONFIG: Record<StoreStatus, { status: BadgeStatus; label: string }> = {
  ACTIVE: { status: 'success', label: '정상' },
  INACTIVE: { status: 'default', label: '비활성' },
  PENDING: { status: 'warning', label: '대기' },
};

/** 좌표 변경 시 bounds 맞춤(고객현황 지도의 MapSync 와 동일, 행 선택 없음) */
function MapFitBoundsSync({ customers }: { customers: CustomerListItem[] }) {
  const map = useMap();
  const boundsKey = useMemo(
    () =>
      customers
        .map((c) => `${c.storeId}:${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`)
        .sort()
        .join('|'),
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

  return null;
}

export interface StoreMapProps {
  /** 고객 현황 목록과 동일 출처(GET /customers/stores …) */
  customers?: CustomerListItem[];
  loading?: boolean;
  /** 대시보드 이슈 집계(선택): API `useStoreMapData` issueCount 를 매장별로 합친 맵 */
  issueCountByStoreId?: Record<number, number>;
}

export default function StoreMap({ customers = [], loading, issueCountByStoreId }: StoreMapProps) {
  const { customersForMap, geoStillPendingCount } = useCustomerMapGeocode(customers, null);

  const defaultCenter: [number, number] = [37.5326, 126.9786];
  const defaultZoom = 11;

  return (
    <Card title="매장 위치" loading={loading} styles={{ body: { padding: 0 } }}>
      {(geoStillPendingCount > 0 || customers.length === 0) && !loading ? (
        <div
          style={{
            fontSize: 12,
            color: '#8c8c8c',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {customers.length === 0
            ? '표시할 매장이 없습니다.'
            : `위·경도 없는 매장 ${geoStillPendingCount}곳은 주소로 위치 검색 중입니다(잠시 후 표시).`}
        </div>
      ) : null}
      <div style={{ height: 400 }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%', borderRadius: '0 0 8px 8px' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFitBoundsSync customers={customersForMap} />
          {customersForMap.map((store) => (
            <Marker
              key={store.storeId}
              position={[store.latitude, store.longitude]}
              icon={createCustomerMarkerIcon(store.status)}
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
                  {issueCountByStoreId?.[store.storeId] ? (
                    <div className="customer-map-popup-meta">
                      미해결 이슈 {issueCountByStoreId[store.storeId]}건
                    </div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
