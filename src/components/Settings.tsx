import React, { useState, useEffect, useCallback, Component, type ErrorInfo, type ReactNode } from 'react';
import { MapPin, Crosshair, Loader2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';

// Error boundary to catch Google Maps rendering failures
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LocationPickerMap crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-civic-surface text-civic-muted">
          <AlertTriangle size={28} />
          <p className="font-mono text-xs">Map failed to load. Try refreshing.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="font-mono text-xs bg-civic-ink text-white px-4 py-2 rounded-lg hover:bg-black transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Sub-component: handles click-to-place marker
function LocationPickerMap({
  position,
  setPosition,
}: {
  position: { lat: number; lng: number } | null;
  setPosition: (p: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  // Fly to position when it changes
  useEffect(() => {
    if (map && position && position.lat != null && position.lng != null && isFinite(Number(position.lat)) && isFinite(Number(position.lng))) {
      map.panTo({ lat: Number(position.lat), lng: Number(position.lng) });
      map.setZoom(15);
    }
  }, [position?.lat, position?.lng, map]);

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.detail.latLng) {
        setPosition({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
      }
    },
    [setPosition]
  );

  const defaultCenter = position || { lat: 10.52, lng: 76.22 };

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={13}
      gestureHandling="greedy"
      disableDefaultUI={false}
      onClick={handleClick}
      mapId="solvuno-settings-map"
      style={{ width: '100%', height: '100%' }}
    >
      {position && (
        <AdvancedMarker position={position}>
          <div
            style={{
              width: 20,
              height: 20,
              background: '#111',
              borderRadius: '50%',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          />
        </AdvancedMarker>
      )}
    </Map>
  );
}

export default function Settings() {
  const { currentUser, setManualLocation, userLocation } = useAppContext();

  const parseCoord = (val: any) => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return isFinite(n) ? n : null;
  };

  const manualLatRaw = currentUser?.manualLocation?.lat;
  const manualLngRaw = currentUser?.manualLocation?.lng;
  const manualLatParsed = parseCoord(manualLatRaw);
  const manualLngParsed = parseCoord(manualLngRaw);

  const userLatRaw = userLocation?.lat;
  const userLngRaw = userLocation?.lng;
  const userLatParsed = parseCoord(userLatRaw);
  const userLngParsed = parseCoord(userLngRaw);

  const initialPos = (manualLatParsed !== null && manualLngParsed !== null)
    ? { lat: manualLatParsed, lng: manualLngParsed }
    : (userLatParsed !== null && userLngParsed !== null)
      ? { lat: userLatParsed, lng: userLngParsed }
      : { lat: 10.52, lng: 76.22 };

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialPos);
  const [address, setAddress] = useState<string>('Select a location on the map');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (manualLatParsed !== null && manualLngParsed !== null) {
      setPosition({ lat: manualLatParsed, lng: manualLngParsed });
    } else if (userLatParsed !== null && userLngParsed !== null) {
      setPosition({ lat: userLatParsed, lng: userLngParsed });
    }
  }, [manualLatParsed, manualLngParsed, userLatParsed, userLngParsed]);

  // Reverse geocode — only fire when lat/lng are valid finite numbers
  useEffect(() => {
    if (
      position &&
      parseCoord(position.lat) !== null &&
      parseCoord(position.lng) !== null
    ) {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.lat}&lon=${position.lng}&format=json`)
        .then(res => {
          if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setAddress(data.display_name || 'Unknown Location');
        })
        .catch(() => {
          setAddress('Location selected (address unavailable)');
        });
    }
  }, [position?.lat, position?.lng]);

  const handleSaveLocation = async () => {
    if (!position) return;
    setIsSaving(true);
    await setManualLocation(position.lat, position.lng);
    setIsSaving(false);
  };

  const handleClearLocation = async () => {
    setIsSaving(true);
    await setManualLocation(null, null);

    const resetPos = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 10.52, lng: 76.22 };

    setPosition(resetPos);
    setIsSaving(false);
  };

  const handleAutoLocate = async () => {
    // Try native browser geolocation first
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        return;
      } catch {
        // Native failed, fall through to IP
      }
    }

    // Fallback: use IP-based location from our server
    try {
      const res = await fetch('/api/location/ip');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
          setPosition({ lat: data.lat, lng: data.lon });
          return;
        }
      }
    } catch { /* ignore */ }

    alert('Could not determine your location. Please pick a location manually on the map.');
  };

  return (
    <div className="w-full h-full bg-civic-bg overflow-y-auto p-8 flex flex-col items-center">
      <div className="max-w-4xl w-full flex flex-col gap-8 h-full">

        <header className="border-b border-civic-border pb-4 shrink-0">
          <h2 className="text-[2rem] font-serif font-semibold text-civic-ink">Location Settings</h2>
          <p className="font-sans text-[0.85rem] text-[#666] mt-1">
            Tap anywhere on the map to set your active location. Your feed and leaderboards will filter to issues and users near this point.
          </p>
        </header>

        <section className="bg-civic-surface border border-civic-border rounded-2xl p-6 flex flex-col gap-4 flex-1 h-[500px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-civic-ink" />
              <h3 className="font-serif text-[1.2rem] font-semibold text-civic-ink">Interactive Location Picker</h3>
            </div>
            {currentUser?.manualLocation && (
              <div className="flex items-center gap-2">
                <Crosshair size={14} className="text-amber-500" />
                <span className="font-mono text-[0.65rem] font-bold text-civic-ink uppercase tracking-wider">
                  Location Overridden
                </span>
              </div>
            )}
          </div>

          <div className="w-full h-full flex-1 border border-civic-border relative z-0 rounded-xl overflow-hidden">
            <MapErrorBoundary>
              {parseCoord(position?.lat) !== null && parseCoord(position?.lng) !== null ? (
                <LocationPickerMap position={position} setPosition={setPosition} />
              ) : (
                <LocationPickerMap position={{ lat: 10.52, lng: 76.22 }} setPosition={setPosition} />
              )}
            </MapErrorBoundary>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 justify-between mt-2">
            <div className="font-sans text-[0.8rem] text-civic-ink flex-1 bg-white border border-civic-border p-3 line-clamp-2 leading-tight rounded-lg">
              {address}
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <button
                onClick={handleAutoLocate}
                className="bg-white text-civic-ink border border-civic-border px-4 py-3 font-mono text-[0.7rem] uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center gap-2 rounded-lg"
              >
                <Crosshair size={14} /> Auto-Locate
              </button>
              {currentUser?.manualLocation && (
                <button
                  onClick={handleClearLocation}
                  disabled={isSaving}
                  className="bg-civic-surface text-civic-ink border border-civic-border px-4 py-3 font-mono text-[0.7rem] uppercase tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2 rounded-lg"
                >
                  Clear Override
                </button>
              )}
              <button
                onClick={handleSaveLocation}
                disabled={isSaving || !position}
                className="bg-civic-ink text-white px-8 py-3 font-mono text-[0.7rem] uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2 rounded-lg"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Set Active Location'}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
