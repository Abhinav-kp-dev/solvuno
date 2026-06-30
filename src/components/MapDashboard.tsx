import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Navigation, Locate } from 'lucide-react';
import { useAppContext, IssueType } from '../context/AppContext';
import { Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import ReactMarkdown from 'react-markdown';
import { distanceKm, formatDistance } from '../hooks/useGeolocation';

// Sub-component: auto-pans map to a given position (once)
function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasFlownRef = useRef(false);
  useEffect(() => {
    if (map && !hasFlownRef.current) {
      map.panTo({ lat, lng });
      map.setZoom(14);
      hasFlownRef.current = true;
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapDashboard() {
  const { nearbyIssues: issues, users, runCityPlannerAnalysis, userLocation, currentUser, mapFocusLocation, setMapFocusLocation } = useAppContext();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(true); // Auto-track by default
  const map = useMap();

  const parseCoord = (val: any) => {
    if (val === null || val === undefined) return null;
    const n = Number(val);
    return isFinite(n) ? n : null;
  };

  const userLatParsed = parseCoord(userLocation?.lat);
  const userLngParsed = parseCoord(userLocation?.lng);

  const gpsLocation = (userLatParsed !== null && userLngParsed !== null)
    ? { lat: userLatParsed, lng: userLngParsed, accuracy: 100 }
    : null;
  const gpsLoading = !gpsLocation;
  const gpsError = null;

  // Reverse geocode to get neighborhood name
  useEffect(() => {
    if (!gpsLocation) return;
    const { lat, lng } = gpsLocation;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(data => {
        const addr = data.address;
        const label =
          addr?.neighbourhood ||
          addr?.suburb ||
          addr?.village ||
          addr?.town ||
          addr?.city ||
          addr?.county ||
          null;
        setNeighborhood(label);
      })
      .catch(() => {});
  }, [gpsLocation?.lat, gpsLocation?.lng]);

  const getMarkerColor = (severity: number): string => {
    if (severity >= 7) return '#ef4444'; // red-500
    if (severity >= 4) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const visibleIssues = issues.filter(issue => {
    if (issue.status !== 'active') return false;
    const reporter = users.find(u => u.id === issue.reporterId);
    if (reporter && reporter.requiresDoubleUpvotes) return issue.verificationUpvotes >= 2;
    return true;
  });

  const nearbyCount = userLocation
    ? visibleIssues.filter(i => distanceKm(userLocation.lat, userLocation.lng, i.lat, i.lng) <= 5).length
    : 0;

  const handleAnalyticsToggle = async () => {
    if (!showAnalytics) {
      setShowAnalytics(true);
      if (!analyticsData) {
        setIsAnalyzing(true);
        try {
          const data = await runCityPlannerAnalysis();
          setAnalyticsData(data);
        } catch (err) {
          console.error(err);
          setAnalyticsData('Error: Unable to fetch analysis at this time.');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } else {
      setShowAnalytics(false);
    }
  };

  const handleRecenter = useCallback(() => {
    if (map && gpsLocation) {
      map.panTo({ lat: gpsLocation.lat, lng: gpsLocation.lng });
      map.setZoom(16);
      setIsTracking(true);
    }
  }, [map, gpsLocation]);

  // Real-time tracking: pan map whenever GPS location updates (if tracking is active)
  useEffect(() => {
    if (isTracking && map && gpsLocation) {
      map.panTo({ lat: gpsLocation.lat, lng: gpsLocation.lng });
    }
  }, [gpsLocation?.lat, gpsLocation?.lng, isTracking, map]);

  // Handle focus from external link (e.g. CommunityFeed)
  useEffect(() => {
    if (map && mapFocusLocation) {
      map.panTo({ lat: mapFocusLocation.lat, lng: mapFocusLocation.lng });
      map.setZoom(17);
      
      // Find the issue at this location to open its popup automatically
      const issueAtLocation = visibleIssues.find(i => 
        Math.abs(i.lat - mapFocusLocation.lat) < 0.0001 && 
        Math.abs(i.lng - mapFocusLocation.lng) < 0.0001
      );
      if (issueAtLocation) {
        setSelectedIssueId(issueAtLocation.id);
      }
      
      // Clear the focus so normal panning works again
      setMapFocusLocation(null);
    }
  }, [map, mapFocusLocation, setMapFocusLocation, visibleIssues]);


  const issuesLatParsed = issues.length > 0 ? parseCoord(issues[0].lat) : null;
  const issuesLngParsed = issues.length > 0 ? parseCoord(issues[0].lng) : null;

  const defaultCenter = gpsLocation
    ? { lat: gpsLocation.lat, lng: gpsLocation.lng }
    : (issuesLatParsed !== null && issuesLngParsed !== null)
      ? { lat: issuesLatParsed, lng: issuesLngParsed }
      : { lat: 10.52, lng: 76.22 };

  const selectedIssue = selectedIssueId ? visibleIssues.find(i => i.id === selectedIssueId) : null;

  return (
    <div className="border border-civic-border bg-white overflow-hidden flex flex-col w-full h-full relative rounded-2xl">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex gap-3 z-[10] pointer-events-none">
        <div className="flex-1 bg-white/90 backdrop-blur-md border border-civic-border px-4 py-[0.6rem] shadow-lg flex items-center pointer-events-auto rounded-xl">
          {gpsLoading ? (
            <span className="font-mono text-[0.65rem] text-blue-500 uppercase tracking-wider animate-pulse">
              Acquiring Location...
            </span>
          ) : gpsError ? (
            <span className="font-mono text-[0.65rem] text-red-400 uppercase tracking-wider">
              Location Unavailable
            </span>
          ) : (
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2 w-full">
                <Navigation size={12} className="text-blue-500 shrink-0" />
                <span className="font-mono text-[0.65rem] text-civic-ink uppercase tracking-wider truncate">
                  {neighborhood ? neighborhood : gpsLocation ? `${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}` : 'Locating...'}
                </span>
                <span className={`ml-auto font-mono text-[0.55rem] uppercase tracking-wider whitespace-nowrap flex items-center gap-1 ${isTracking ? 'text-green-600' : 'text-amber-500'}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {isTracking ? 'TRACKING LIVE' : 'TRACKING PAUSED'}
                </span>
              </div>
              <div className="font-mono text-[0.45rem] text-civic-muted mt-0.5">
                RAW DB STATE: lat={userLocation?.lat ?? 'null'} lng={userLocation?.lng ?? 'null'}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyticsToggle}
          className={`bg-white/90 backdrop-blur-md border border-civic-border px-4 py-[0.6rem] font-mono text-[0.65rem] flex items-center gap-2 cursor-pointer transition-all duration-200 uppercase pointer-events-auto rounded-xl ${showAnalytics ? 'bg-civic-ink text-white' : 'text-civic-ink hover:bg-gray-50'}`}
        >
          <Activity size={12} />
          {showAnalytics ? 'CLOSE' : 'ANALYTICS'}
        </button>
      </div>

      {/* Recenter Button */}
      {gpsLocation && (
        <button
          onClick={handleRecenter}
          title="Center on my location"
          className="absolute bottom-16 right-4 z-[10] bg-white/90 backdrop-blur-sm border border-civic-border shadow-lg w-11 h-11 flex items-center justify-center hover:bg-blue-50 transition-all duration-200 rounded-xl"
        >
          <Locate size={18} className="text-blue-600" />
        </button>
      )}

      {/* Map Area */}
      <div className="relative w-full h-full bg-[#fdfdfb]">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapId="solvuno-main-map"
          style={{ width: '100%', height: '100%' }}
          onDragStart={() => setIsTracking(false)}
          onZoomChanged={() => setIsTracking(false)}
        >
          {/* Auto fly-to on first location fix */}
          {gpsLocation && <FlyToLocation lat={gpsLocation.lat} lng={gpsLocation.lng} />}

          {/* Live user location marker */}
          {gpsLocation && (
            <AdvancedMarker position={{ lat: gpsLocation.lat, lng: gpsLocation.lng }}>
              <div className="user-location-marker">
                <div className="ring"></div>
                <div className="ring ring-2"></div>
                <div className="dot"></div>
              </div>
            </AdvancedMarker>
          )}

          {/* Issue markers */}
          {visibleIssues.map((issue) => {
            const color = getMarkerColor(issue.severityScore);
            return (
              <AdvancedMarker
                key={issue.id}
                position={{ lat: issue.lat, lng: issue.lng }}
                onClick={() => setSelectedIssueId(issue.id === selectedIssueId ? null : issue.id)}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    background: 'white',
                    border: `2px solid ${color}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 8px ${color}44, 0 4px 12px rgba(0,0,0,0.15)`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: color,
                    }}
                  />
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window for selected issue */}
          {selectedIssue && (
            <InfoWindow
              position={{ lat: selectedIssue.lat, lng: selectedIssue.lng }}
              onCloseClick={() => setSelectedIssueId(null)}
            >
              <div className="p-2 font-sans text-civic-ink min-w-[180px] max-w-[280px]">
                <div
                  className="font-mono text-[0.65rem] uppercase tracking-[0.1em] mb-1 font-bold"
                  style={{
                    color: getMarkerColor(selectedIssue.severityScore),
                  }}
                >
                  {selectedIssue.type.replace('_', ' ')}
                </div>
                <div className="text-[0.85rem] font-medium leading-tight mb-2">
                  {selectedIssue.description}
                </div>
                <div className="text-[0.65rem] opacity-60 mb-1">
                  Status: <span className="font-semibold">{selectedIssue.status}</span>
                </div>
                <div className="text-[0.65rem] opacity-80 mb-0.5">
                  Assigned: {selectedIssue.assignedDepartment || 'Pending'}
                </div>
                <div className="text-[0.65rem] opacity-80 mb-1">
                  Severity: {selectedIssue.severityScore || 'N/A'}/10
                </div>
                {userLocation && (
                  <div className="font-mono text-[0.65rem] text-blue-600 mt-1 pt-1 border-t border-gray-100 font-semibold">
                    📍 {formatDistance(distanceKm(userLocation.lat, userLocation.lng, selectedIssue.lat, selectedIssue.lng))}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Analytics Slide Out Panel */}
        {showAnalytics && (
          <div className="absolute top-16 right-4 w-[350px] max-h-[calc(100%-80px)] bg-white/95 backdrop-blur-md border border-civic-border shadow-2xl z-[10] overflow-y-auto custom-scrollbar flex flex-col pointer-events-auto rounded-2xl">
            <div className="p-4 border-b border-civic-border bg-[#fdfdfb] sticky top-0 z-10 flex flex-col rounded-t-2xl">
              <h3 className="font-serif font-semibold text-lg text-civic-ink">Predictive Infrastructure Analytics</h3>
              <div className="font-mono text-[0.6rem] uppercase tracking-wide text-[#888] mt-1">Powered by City Planner AI</div>
            </div>
            <div className="p-5 font-sans text-sm text-civic-ink leading-relaxed">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4 opacity-70">
                  <Activity className="animate-pulse" size={24} />
                  <span className="font-mono text-[0.7rem] uppercase tracking-widest animate-pulse">Running Spatial Analysis...</span>
                </div>
              ) : (
                <div className="markdown-body prose prose-sm max-w-none">
                  <ReactMarkdown>{analyticsData || ''}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Footer Overlay */}
      <div className="absolute bottom-6 left-6 font-mono text-[0.6rem] opacity-60 uppercase pointer-events-none text-civic-ink z-[10] bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        {userLocation
          ? `${nearbyCount} ISSUE${nearbyCount !== 1 ? 'S' : ''} NEARBY · LOCATION ACTIVE`
          : 'AWAITING LOCATION...'}
      </div>
    </div>
  );
}
