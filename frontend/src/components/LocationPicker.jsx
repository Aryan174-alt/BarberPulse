import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import MapCenter from './MapCenter.jsx'

function LocationClick({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lon: event.latlng.lng })
    },
  })
  return null
}

export default function LocationPicker({ location, onSelect }) {
  const center = [location.lat, location.lon]

  return (
    <MapContainer center={center} zoom={14} scrollWheelZoom className="h-72 w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapCenter center={center} />
      <LocationClick onSelect={onSelect} />
      <CircleMarker center={center} radius={10} pathOptions={{ color: '#1d4ed8' }} />
    </MapContainer>
  )
}
