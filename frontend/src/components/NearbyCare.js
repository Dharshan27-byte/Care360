import React, { useCallback, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { api } from "../api";

const COIMBATORE = {
  lat: 11.0168,
  lon: 76.9558,
  label: "Coimbatore, Tamil Nadu",
};

const userIcon = L.divIcon({
  className: "care-map-pin care-map-pin-user",
  html: '<span aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function facilityIcon(selected) {
  return L.divIcon({
    className: `care-map-pin care-map-pin-facility${selected ? " is-selected" : ""}`,
    html: '<span aria-hidden="true"><i>+</i></span>',
    iconSize: [34, 40],
    iconAnchor: [17, 39],
  });
}

export function useNearbyCare(autoLocate = true) {
  const [location, setLocation] = useState(COIMBATORE);
  const [radius, setRadius] = useState(7000);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permission, setPermission] = useState("waiting");
  const [query, setQuery] = useState("");

  const search = useCallback(async (point, distance) => {
    setLoading(true);
    setError("");
    try {
      const result = await api(
        `/hospitals?lat=${point.lat}&lon=${point.lon}&radius=${distance}`,
      );
      setItems(result.hospitals || []);
    } catch (requestError) {
      setItems([]);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(location, radius);
  }, [location, radius, search]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unavailable");
      return;
    }
    setPermission("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: "Your current location",
        });
        setPermission("granted");
      },
      (locationError) => {
        setPermission(locationError.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    if (autoLocate) requestLocation();
    else setPermission("fallback");
  }, [autoLocate, requestLocation]);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.name} ${item.type} ${item.address}`
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);

  return {
    location,
    radius,
    setRadius,
    items: visibleItems,
    loading,
    error,
    permission,
    query,
    setQuery,
    requestLocation,
    refresh: () => search(location, radius),
  };
}

export function NearbyCareExplorer({
  care,
  selectable = false,
  selectedId,
  onChoose,
}) {
  const permissionMessage = {
    requesting: "Asking your browser for location access…",
    denied: "Location access is off. Showing care near Coimbatore instead.",
    unavailable:
      "Location is unavailable. Showing care near Coimbatore instead.",
    granted: "Using your current location",
    fallback: "Showing care near Coimbatore",
    waiting: "Finding care near you…",
  }[care.permission];

  return (
    <section className="nearby-panel panel">
      <div className="nearby-toolbar">
        <div className="nearby-heading">
          <span className="nearby-heading-icon">⌖</span>
          <div>
            <span className="eyebrow">NEARBY CARE</span>
            <h2>Hospitals and clinics around you</h2>
            <p>
              {care.location.label} · {permissionMessage}
            </p>
          </div>
        </div>
        <div className="nearby-controls">
          <label className="radius-select">
            <span className="sr-only">Search radius</span>
            <select
              value={care.radius}
              onChange={(event) => care.setRadius(Number(event.target.value))}
            >
              <option value={3000}>Within 3 km</option>
              <option value={7000}>Within 7 km</option>
              <option value={15000}>Within 15 km</option>
            </select>
          </label>
          <button
            className="button button-secondary location-button"
            onClick={care.requestLocation}
            disabled={care.permission === "requesting"}
          >
            {care.permission === "requesting"
              ? "Finding you…"
              : "Use my location"}
            <span>⌖</span>
          </button>
        </div>
      </div>

      {care.error && <div className="notice error-notice">{care.error}</div>}
      {care.permission === "denied" && (
        <div className="location-hint">
          To enable location later, allow it in your browser's site settings.
        </div>
      )}

      <div className="nearby-layout">
        <div className="care-map-frame">
          <CareMap
            location={care.location}
            items={care.items}
            selectedId={selectedId}
            selectable={selectable}
            onChoose={onChoose}
          />
          <div className="map-live-badge">
            <span /> LIVE MAP · OPENSTREETMAP
          </div>
        </div>

        <aside className="facility-panel">
          <div className="facility-panel-top">
            <div>
              <strong>Care nearby</strong>
              <span>
                {care.loading
                  ? "Updating results…"
                  : `${care.items.length} places listed`}
              </span>
            </div>
            <label className="facility-search">
              <span aria-hidden="true">⌕</span>
              <input
                value={care.query}
                onChange={(event) => care.setQuery(event.target.value)}
                placeholder="Search places"
                aria-label="Search nearby hospitals and clinics"
              />
            </label>
          </div>
          <div className="facility-list">
            {care.loading && care.items.length === 0 ? (
              <div className="facility-empty">
                <span className="loading-ring" />
                Finding nearby places…
              </div>
            ) : care.items.length === 0 ? (
              <div className="facility-empty">
                No listed places in this area. Try a wider radius.
              </div>
            ) : (
              care.items.map((item) => (
                <FacilityCard
                  key={item.id}
                  item={item}
                  selected={selectedId === item.id}
                  selectable={selectable}
                  onChoose={onChoose}
                />
              ))
            )}
          </div>
          <div className="map-credit">
            Facility data © OpenStreetMap contributors. Confirm hours and
            services directly with the facility.
          </div>
        </aside>
      </div>
    </section>
  );
}

function CareMap({ location, items, selectedId, selectable, onChoose }) {
  return (
    <MapContainer
      key={`${location.lat.toFixed(4)}-${location.lon.toFixed(4)}`}
      center={[location.lat, location.lon]}
      zoom={13}
      scrollWheelZoom
      className="care-leaflet-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.lat, location.lon]} icon={userIcon}>
        <Popup>
          <strong>{location.label}</strong>
          <br />
          Your search area
        </Popup>
      </Marker>
      {items.map((item) => (
        <Marker
          key={item.id}
          position={[item.latitude, item.longitude]}
          icon={facilityIcon(selectedId === item.id)}
          eventHandlers={{ click: () => onChoose?.(item) }}
        >
          <Popup>
            <div className="map-popup">
              <strong>{item.name}</strong>
              <span>
                {item.distanceKm} km · {item.type}
              </span>
              {selectable && (
                <button onClick={() => onChoose?.(item)}>
                  Use this location
                </button>
              )}
              <a href={item.mapUrl} target="_blank" rel="noreferrer">
                Open in OpenStreetMap ↗
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function FacilityCard({ item, selected, selectable, onChoose }) {
  return (
    <article
      className={`facility-card${selected ? " facility-card-selected" : ""}`}
    >
      <span className="facility-symbol">✚</span>
      <div className="facility-main">
        <div className="facility-name-row">
          <strong>{item.name}</strong>
          <span className="facility-distance">{item.distanceKm} km</span>
        </div>
        <span className="facility-kind">
          {item.type === "hospital" ? "Hospital" : "Clinic"}
        </span>
        <p>{item.address}</p>
        <div className="facility-actions">
          {item.phone && <a href={`tel:${item.phone}`}>Call</a>}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Directions ↗
          </a>
          {selectable && (
            <button onClick={() => onChoose?.(item)}>
              {selected ? "Selected" : "Choose"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
