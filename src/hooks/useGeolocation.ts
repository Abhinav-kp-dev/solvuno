import { useState, useEffect, useRef } from 'react';

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy: number;
  source: 'manual' | 'gps' | 'stored' | 'ip';
}

export interface GeolocationState {
  location: GeoLocation | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Geolocation hook with robust IP-based fallback.
 *
 * Strategy:
 *  1. If a manual override is provided, use it immediately.
 *  2. If a stored fallback is provided, use it as the initial value while
 *     we attempt to get a more accurate position.
 *  3. Try the browser's native Geolocation API (getCurrentPosition only,
 *     no watchPosition — desktop browsers often fire repeated errors).
 *  4. If native geolocation fails, fall back to our server-side IP
 *     geolocation proxy (/api/location/ip), then external services.
 *  5. If everything fails, use a hardcoded default so the app is always
 *     functional.
 */
export function useGeolocation(
  override?: { lat: number; lng: number },
  fallback?: { lat: number; lng: number }
): GeolocationState {
  const hasValidOverride = override && typeof override.lat === 'number' && typeof override.lng === 'number' && !isNaN(override.lat) && !isNaN(override.lng);
  const hasValidFallback = fallback && typeof fallback.lat === 'number' && typeof fallback.lng === 'number' && !isNaN(fallback.lat) && !isNaN(fallback.lng);

  const [location, setLocation] = useState<GeoLocation | null>(
    hasValidOverride
      ? { lat: override!.lat, lng: override!.lng, accuracy: 25, source: 'manual' }
      : hasValidFallback
        ? { lat: fallback!.lat, lng: fallback!.lng, accuracy: 1000, source: 'stored' }
        : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const attemptedRef = useRef(false);

  useEffect(() => {
    let isSubscribed = true;
    let watchId: number | null = null;
    let fallbackTimeoutId: NodeJS.Timeout | null = null;

    if (hasValidOverride) {
      setLocation({ lat: override!.lat, lng: override!.lng, accuracy: 100, source: 'manual' });
      setError(null);
      setIsLoading(false);
      return;
    }

    const runIpFallbackAndSet = async () => {
      // 1. Our own backend proxy
      try {
        const res = await fetch('/api/location/ip');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
            setLocation({ lat: data.lat, lng: data.lon, accuracy: 5000, source: 'ip' });
            setIsLoading(false);
            return;
          }
        }
      } catch { /* continue */ }

      // 2. ip-api.com
      try {
        const res = await fetch('https://ip-api.com/json/');
        const data = await res.json();
        if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
          setLocation({ lat: data.lat, lng: data.lon, accuracy: 5000, source: 'ip' });
          setIsLoading(false);
          return;
        }
      } catch { /* continue */ }

      // Fallback
      if (hasValidFallback) {
        setLocation({ lat: fallback!.lat, lng: fallback!.lng, accuracy: 10000, source: 'stored' });
      } else {
        setLocation({ lat: 10.52, lng: 76.22, accuracy: 50000, source: 'ip' });
      }
      setIsLoading(false);
    };

    if ('geolocation' in navigator) {
      let hasReceivedPosition = false;

      const fetchLocation = () => {
        if (!isSubscribed) return;
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isSubscribed) return;
            hasReceivedPosition = true;
            if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              source: 'gps',
            });
            setError(null);
            setIsLoading(false);
          },
          (err) => {
            if (!isSubscribed) return;
            console.error("Geolocation error:", err);
            if (!hasReceivedPosition) {
              runIpFallbackAndSet();
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
      };

      // Poll every 2 seconds for TRUE real-time updates without relying on buggy watchPosition
      fetchLocation();
      watchId = setInterval(fetchLocation, 2000) as unknown as number;

      fallbackTimeoutId = setTimeout(() => {
        if (!hasReceivedPosition && isSubscribed) {
          runIpFallbackAndSet();
        }
      }, 5000);

    } else {
      runIpFallbackAndSet();
    }

    return () => {
      isSubscribed = false;
      if (watchId !== null) clearInterval(watchId);
      if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
    };
  }, [override?.lat, override?.lng, fallback?.lat, fallback?.lng]);

  return { location, error, isLoading };
}

/** Calculate distance between two lat/lng points in kilometers (Haversine formula) */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Format a km distance into a human-readable string */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}
