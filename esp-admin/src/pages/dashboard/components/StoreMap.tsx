import { Card, Spin } from 'antd';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useRef, useMemo } from 'react';
import type { CustomerListItem } from '../../../types/customer.types';
import type { StoreStatus } from '../../../types/store.types';
import StatusBadge from '../../../components/common/StatusBadge';
import type { BadgeStatus } from '../../../components/common/StatusBadge';
import { createCustomerMarkerIcon, isPlottableLatLng } from '../../../utils/customerMapGeo';

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

  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);

  const customersForMap = useMemo(
    () => customers.filter((c) => isPlottableLatLng(c.latitude, c.longitude)),
    [customers],
  );

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
    if (boundsKey === prevBoundsKey.current) return;
    prevBoundsKey.current = boundsKey;

    const bounds = new window.google.maps.LatLngBounds();
    customersForMap.forEach((c) => bounds.extend({ lat: c.latitude, lng: c.longitude }));
    if (!bounds.isEmpty()) mapRef.current.fitBounds(bounds);
  }, [isLoaded, boundsKey, customersForMap]);

  const activeStore = customersForMap.find((s) => s.storeId === activeStoreId) ?? null;

  return (
    <Card title="매장 위치" loading={loading} styles={{ body: { padding: 0 } }}>
      {customers.length === 0 && !loading ? (
        <div
          style={{
            fontSize: 12,
            color: '#8c8c8c',
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          표시할 매장이 없습니다.
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
            onLoad={(map) => { mapRef.current = map; }}
            onUnmount={() => { mapRef.current = null; }}
            options={{ gestureHandling: 'greedy' }}
          >
            {customersForMap.map((store) => (
              <Marker
                key={store.storeId}
                position={{ lat: store.latitude, lng: store.longitude }}
                icon={createCustomerMarkerIcon(store.status)}
                onClick={() => setActiveStoreId(store.storeId)}
              />
            ))}
            {activeStore ? (
              <InfoWindow
                position={{ lat: activeStore.latitude, lng: activeStore.longitude }}
                onCloseClick={() => setActiveStoreId(null)}
                options={{ pixelOffset: new window.google.maps.Size(0, -12) }}
              >
                <div className="customer-map-popup">
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
              </InfoWindow>
            ) : null}
          </GoogleMap>
        )}
      </div>
    </Card>
  );
}
