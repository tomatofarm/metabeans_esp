import { Card, Spin } from 'antd';
import { GoogleMap, OverlayViewF, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { CustomerListItem } from '../../../types/customer.types';
import type { StoreStatus } from '../../../types/store.types';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';
import { STATUS_COLORS } from '../../../utils/constants';
import { useCustomerMapGeocode } from '../../../hooks/useCustomerMapGeocode';

const GOOGLE_MAPS_LIBRARIES: ('maps' | 'places')[] = ['maps'];
const DEFAULT_CENTER = { lat: 37.5326, lng: 126.9786 };
const DEFAULT_ZOOM = 11;

const STATUS_CONFIG: Record<StoreStatus, { status: BadgeStatus; label: string }> = {
  ACTIVE: { status: 'success', label: '정상' },
  INACTIVE: { status: 'default', label: '비활성' },
  PENDING: { status: 'warning', label: '대기' },
};

export interface StoreMapProps {
  customers?: CustomerListItem[];
  loading?: boolean;
  issueCountByStoreId?: Record<number, number>;
}

export default function StoreMap({ customers = [], loading, issueCountByStoreId }: StoreMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'ko',
    region: 'KR',
  });

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

  const { customersForMap, geoStillPendingCount } = useCustomerMapGeocode(customers, null);

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
    if (!isLoaded || !mapInstance || customersForMap.length === 0) return;
    if (boundsKey === prevBoundsKey.current) return;
    prevBoundsKey.current = boundsKey;

    const bounds = new window.google.maps.LatLngBounds();
    customersForMap.forEach((c) => bounds.extend({ lat: c.latitude, lng: c.longitude }));
    if (!bounds.isEmpty()) mapInstance.fitBounds(bounds);
  }, [isLoaded, mapInstance, boundsKey, customersForMap]);

  const activeStore = customersForMap.find((s) => s.storeId === activeStoreId) ?? null;

  return (
    <Card title="매장 위치" loading={loading} styles={{ body: { padding: 0 } }}>
      {!loading && (customers.length === 0 || geoStillPendingCount > 0) ? (
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
            : `위·경도 없는 매장 ${geoStillPendingCount}곳 — 주소로 위치를 찾는 중입니다(잠시 후 표시).`}
        </div>
      ) : null}
      <div style={{ height: 400 }}>
        {!isLoaded ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spin />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%', borderRadius: '0 0 8px 8px' }}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={setMapInstance}
            onUnmount={() => setMapInstance(null)}
            options={{ gestureHandling: 'greedy', clickableIcons: false }}
          >
            {customersForMap.map((store) => {
              const mc =
                store.status === 'ACTIVE'
                  ? STATUS_COLORS.GOOD.color
                  : store.status === 'PENDING'
                    ? STATUS_COLORS.WARNING.color
                    : '#bfbfbf';
              return (
                <OverlayViewF
                  key={store.storeId}
                  position={{ lat: store.latitude, lng: store.longitude }}
                  mapPaneName="overlayMouseTarget"
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); setActiveStoreId(store.storeId); }}
                    style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: mc, border: '3px solid white',
                      boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                      cursor: 'pointer', transform: 'translate(-50%,-50%)',
                    }}
                  />
                </OverlayViewF>
              );
            })}
            {activeStore ? (
              <OverlayViewF
                position={{ lat: activeStore.latitude, lng: activeStore.longitude }}
                mapPaneName="floatPane"
              >
                <div
                  className="customer-map-popup"
                  style={{
                    transform: 'translate(-50%, calc(-100% - 14px))',
                    position: 'relative',
                    background: 'white',
                    borderRadius: 8,
                    boxShadow: '0 2px 12px rgba(0,0,0,.25)',
                    padding: '10px 14px 8px',
                    minWidth: 180,
                    pointerEvents: 'auto',
                    cursor: 'default',
                  }}
                >
                  <button
                    onClick={() => setActiveStoreId(null)}
                    style={{
                      position: 'absolute', top: 4, right: 6,
                      background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 16, lineHeight: 1, color: '#666',
                    }}
                  >×</button>
                  <strong>{activeStore.storeName}</strong>
                  {activeStore.hqName ? (
                    <div className="customer-map-popup-sub">{activeStore.hqName}</div>
                  ) : null}
                  <div className="customer-map-popup-sub">{activeStore.address}</div>
                  <div className="customer-map-popup-meta">
                    장비 {activeStore.equipmentCount}대 ·{' '}
                    <StatusBadge
                      status={STATUS_CONFIG[activeStore.status].status}
                      label={STATUS_CONFIG[activeStore.status].label}
                    />
                  </div>
                  <div className="customer-map-popup-meta">담당 {activeStore.dealerName}</div>
                  {issueCountByStoreId?.[activeStore.storeId] ? (
                    <div className="customer-map-popup-meta">
                      미해결 이슈 {issueCountByStoreId[activeStore.storeId]}건
                    </div>
                  ) : null}
                </div>
              </OverlayViewF>
            ) : null}
          </GoogleMap>
        )}
      </div>
    </Card>
  );
}
