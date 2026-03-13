import { Card } from 'antd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { StoreMapItem } from '../../../types/dashboard.types';
import type { StatusLevel } from '../../../utils/constants';
import { getStatusConfig } from '../../../utils/statusHelper';

interface StoreMapProps {
  stores?: StoreMapItem[];
  loading?: boolean;
  onStoreClick?: (storeId: number) => void;
}

function createMarkerIcon(status: StatusLevel): L.DivIcon {
  const config = getStatusConfig(status);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${config.color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function StoreMap({ stores, loading, onStoreClick }: StoreMapProps) {
  const defaultCenter: [number, number] = [37.5326, 126.9786]; // Seoul center
  const defaultZoom = 12;

  return (
    <Card title="매장 위치" loading={loading} styles={{ body: { padding: 0 } }}>
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
          {stores?.map((store) => (
            <Marker
              key={store.storeId}
              position={[store.latitude, store.longitude]}
              icon={createMarkerIcon(store.status)}
              eventHandlers={{
                click: () => onStoreClick?.(store.storeId),
              }}
            >
              <Popup>
                <div>
                  <strong>{store.storeName}</strong>
                  <br />
                  <span style={{ fontSize: 12 }}>{store.address}</span>
                  <br />
                  <span style={{ fontSize: 12 }}>
                    장비: {store.equipmentCount}대 / 이슈: {store.issueCount}건
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
}
