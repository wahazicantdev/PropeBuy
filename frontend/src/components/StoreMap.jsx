import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Barangay Poblacion — where the map opens before a pin exists
const DEFAULT_CENTER = [14.3866, 121.0465];

// Black dot pin drawn with Tailwind, so no marker image files are needed
const pinIcon = L.divIcon({
  className: "",
  html: '<span class="block w-6 h-6 rounded-full bg-primary border-4 border-white shadow-lg"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Turns a tap on the map into a new pin position
const ClickToPin = ({ onPick }) => {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

// OpenStreetMap view. With onPick the seller taps to place the pin;
// without it the map is read only for buyers.
const StoreMap = ({ lat, lng, onPick, height = 260 }) => {
  const hasPin = lat != null && lng != null;
  return (
    // isolate keeps Leaflet's layers under the sticky headers and modals
    <div className="isolate rounded-xl overflow-hidden border border-black/10" style={{ height }}>
      <MapContainer
        center={hasPin ? [lat, lng] : DEFAULT_CENTER}
        zoom={hasPin ? 17 : 15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasPin && <Marker position={[lat, lng]} icon={pinIcon} />}
        {onPick && <ClickToPin onPick={onPick} />}
      </MapContainer>
    </div>
  );
};

export default StoreMap;
