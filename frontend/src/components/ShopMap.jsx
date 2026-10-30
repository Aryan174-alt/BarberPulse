import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'

import MapCenter from './MapCenter.jsx'

const jaipur = [26.9124, 75.7873]

export default function ShopMap({ shops, location = jaipur }) {
  return (
    <MapContainer center={location} zoom={12} scrollWheelZoom={false} className="h-[20rem] w-full rounded-2xl sm:h-[24rem]">
      <MapCenter center={location} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {shops.map((shop) => (
        <CircleMarker key={shop.id} center={[Number(shop.lat), Number(shop.lon)]} radius={8}>
          <Popup>
            <strong>{shop.name}</strong>
            <br />
            {shop.is_open ? 'Open' : 'Closed'} · {shop.estimated_wait_min} min wait
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
