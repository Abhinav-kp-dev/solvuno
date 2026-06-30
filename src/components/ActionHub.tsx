import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UploadCloud, CheckCircle2, Navigation, Crosshair, ShieldAlert, ShieldCheck, Film, ImageIcon, X, Loader2, AlertTriangle, Search, MapPin } from 'lucide-react';
import { useAppContext, IssueType } from '../context/AppContext';
import { Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';

// Sub-component to pick location by clicking
function LocationPicker({ lat, lng, setLat, setLng }: { lat: number | null, lng: number | null, setLat: (lat: number) => void, setLng: (lng: number) => void }) {
  return lat && lng ? (
    <AdvancedMarker position={{ lat, lng }}>
      <div style={{ width: 16, height: 16, background: '#111', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
    </AdvancedMarker>
  ) : null;
}

// Sub-component: pans map to given coords
function FlyToCoord({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map && typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  }, [lat, lng, map]);
  return null;
}

type VerificationState = 'idle' | 'analyzing' | 'valid' | 'invalid';

interface VerificationResult {
  state: VerificationState;
  reason?: string;
  deduction?: number;
  severity?: number;
  department?: string;
  category?: string;
  visualAssessment?: string;
  confidenceScore?: number;
  bountyTier?: string;
  bountyPoints?: number;
}

export default function ActionHub() {
  const { addIssue, currentUser, updateTrustScore, userLocation } = useAppContext();
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

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [type, setType] = useState<IssueType | ''>('');
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Verification state
  const [verification, setVerification] = useState<VerificationResult>({ state: 'idle' });
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Place search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced place search via Nominatim
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectPlace = (place: { display_name: string; lat: string; lon: string }) => {
    const placeLat = parseFloat(place.lat);
    const placeLng = parseFloat(place.lon);
    
    if (isNaN(placeLat) || isNaN(placeLng)) {
      alert('Selected location has invalid coordinates.');
      return;
    }

    setLat(placeLat);
    setLng(placeLng);
    setFlyTarget({ lat: placeLat, lng: placeLng });
    setTimeout(() => setFlyTarget(null), 100);
    setSearchQuery(place.display_name.split(',').slice(0, 2).join(','));
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Auto-fill GPS coords on mount if available
  useEffect(() => {
    if (gpsLocation && lat === null) {
      setLat(gpsLocation.lat);
      setLng(gpsLocation.lng);
    }
  }, [gpsLocation]);

  const handleUseMyLocation = () => {
    const source = gpsLocation || userLocation;
    if (source) {
      setLat(source.lat);
      setLng(source.lng);
      setFlyTarget({ lat: source.lat, lng: source.lng });
      setTimeout(() => setFlyTarget(null), 100);
    }
  };

  const loadFile = (file: File) => {
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const isVid = videoTypes.includes(file.type) || file.name.match(/\.(mp4|webm|ogg|mov|avi)$/i) !== null;

    setMediaFile(file);
    setIsVideo(isVid);
    setVerification({ state: 'idle' });

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setMediaBase64(result);
      setMediaPreview(isVid ? URL.createObjectURL(file) : result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const clearMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaFile(null);
    setMediaPreview(null);
    setMediaBase64(null);
    setIsVideo(false);
    setVerification({ state: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run Gemini verification immediately on upload
  const runVerification = async (base64: string) => {
    setVerification({ state: 'analyzing' });
    try {
      const response = await fetch('/api/verify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaBase64: base64, description: description || 'No description provided yet.' })
      });

      if (!response.ok) throw new Error('Verification failed');
      const result = await response.json();

      if (!result.is_valid_infrastructure_issue) {
        setVerification({
          state: 'invalid',
          reason: result.rejection_reason || 'Media content flagged as spam.',
          deduction: result.trust_score_deduction || 20,
        });
        if (currentUser) {
          updateTrustScore(currentUser.id, -(result.trust_score_deduction || 20));
        }
      } else {
        setVerification({
          state: 'valid',
          severity: result.severity_score_1_to_10,
          department: result.assigned_department,
          category: result.inferred_category,
          visualAssessment: result.visual_severity_assessment,
          confidenceScore: result.confidence_score_0_to_1 ?? 1,
          bountyTier: result.bountyTier,
          bountyPoints: result.bountyPoints,
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerification({ state: 'idle' });
    }
  };

  // Trigger verification when base64 data is loaded
  useEffect(() => {
    if (mediaBase64) {
      runVerification(mediaBase64);
    }
  }, [mediaBase64]);

  const handleSubmit = async () => {
    if (!type || lat === null || lng === null || !description) {
      alert('Please fill out all fields and select a location.');
      return;
    }
    if (verification.state !== 'valid') {
      alert('Please upload a valid media file that passes AI verification first.');
      return;
    }
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await addIssue({
        type: type as IssueType,
        lat,
        lng,
        description: type === 'other' && customType.trim()
          ? `[${customType.trim()}] ${description}`
          : description,
        image: mediaBase64 || undefined,
        severityScore: verification.severity || 5,
        assignedDepartment: verification.department || 'General Services',
        confidenceScore: verification.confidenceScore ?? 1,
        bountyTier: verification.bountyTier,
        bountyPoints: verification.bountyPoints,
        district: currentUser.district || 'District 4',
      });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      // Reset form
      setType('');
      setCustomType('');
      setDescription('');
      clearMedia({ stopPropagation: () => {} } as any);
      setVerification({ state: 'idle' });
      setLat(null);
      setLng(null);
    } catch (err: any) {
      alert('Failed to upload issue: ' + (err.message || 'Unknown error'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const trustScore = currentUser?.civic_trust_score ?? 100;
  const trustColor = trustScore >= 70 ? 'text-green-600' : trustScore >= 40 ? 'text-amber-600' : 'text-red-600';
  const trustBg = trustScore >= 70 ? 'bg-green-50 border-green-200' : trustScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <section className="w-full max-w-4xl h-full flex flex-col bg-civic-surface border border-civic-border rounded-2xl p-8 overflow-y-auto custom-scrollbar mx-auto relative shadow-sm">

      {/* Success toast */}
      {showToast && (
        <div className="absolute top-6 right-6 border border-green-200 bg-green-50 text-green-800 px-4 py-3.5 font-sans text-sm font-semibold rounded-xl shadow-xl flex items-center gap-2 z-50">
          <CheckCircle2 size={14} className="text-green-600" />
          Report Verified & Submitted
        </div>
      )}

      {/* Header */}
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="font-serif text-[2rem] font-bold text-civic-ink leading-none mb-1">Report an Issue</h2>
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[#888]">Infrastructure Protocol // V 4.2</div>
        </div>
        {/* Trust Score */}
        {currentUser && (
          <div className={`flex flex-col items-center border rounded-xl px-4 py-2.5 ${trustBg}`}>
            <div className={`font-mono text-[1.4rem] font-bold leading-none ${trustColor}`}>{trustScore}</div>
            <div className="font-mono text-[0.5rem] uppercase tracking-widest text-[#888] mt-0.5">Trust Score</div>
          </div>
        )}
      </header>

      <div className="flex flex-col gap-6 flex-1">

        {/* ── Media Upload ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[0.75rem] font-semibold text-[#444]">Visual Evidence</label>
            <span className="font-mono text-[0.55rem] uppercase tracking-wider text-[#999]">Image or Video · AI-Verified</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime,.mov,.avi"
            className="hidden"
          />

          {/* Drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden ${
              isDragging ? 'border-blue-400 bg-blue-50' : mediaPreview ? 'border-civic-border' : 'border-civic-border bg-civic-bg hover:border-civic-ink'
            } ${mediaPreview ? 'h-[180px]' : 'h-[130px]'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !mediaPreview && fileInputRef.current?.click()}
          >
            {mediaPreview ? (
              <>
                {isVideo ? (
                  <video
                    ref={videoRef}
                    src={mediaPreview}
                    className="w-full h-full object-cover"
                    controls
                    muted
                  />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                )}
                {/* Clear button */}
                <button
                  onClick={clearMedia}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                >
                  <X size={12} />
                </button>
                {/* Media type badge */}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white font-mono text-[0.55rem] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                  {isVideo ? <Film size={9} /> : <ImageIcon size={9} />}
                  {isVideo ? 'Video' : 'Image'}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
                <UploadCloud size={20} className="opacity-30" />
                <span className="font-mono text-[0.65rem] opacity-40 uppercase tracking-wider">Drop image or video · or click to browse</span>
                <span className="font-mono text-[0.5rem] opacity-30">MP4 · WebM · JPG · PNG · GIF</span>
              </div>
            )}
          </div>

          {/* ── AI Verification Status Panel ─────────────────────── */}
          {verification.state !== 'idle' && (
            <div className={`mt-3 p-4 rounded-xl border transition-all ${
              verification.state === 'analyzing' ? 'border-blue-200 bg-blue-50' :
              verification.state === 'valid'     ? 'border-green-200 bg-green-50' :
                                                   'border-red-200 bg-red-50'
            }`}>
              {verification.state === 'analyzing' && (
                <div className="flex items-center gap-3">
                  <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />
                  <div>
                    <div className="font-mono text-[0.65rem] uppercase tracking-wider text-blue-700">Spam Shield · Analyzing</div>
                    <div className="font-sans text-[0.75rem] text-blue-600 mt-0.5">Gemini is verifying your media for civic relevance...</div>
                  </div>
                </div>
              )}

              {verification.state === 'valid' && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-green-600 shrink-0" />
                    <div className="font-mono text-[0.65rem] uppercase tracking-wider text-green-700">Verified by Gemini AI · Valid Report</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    <div className="bg-white border border-green-200 p-2 text-center">
                      <div className="font-mono text-[0.9rem] font-bold text-green-700">{verification.severity}/10</div>
                      <div className="font-mono text-[0.5rem] uppercase tracking-wider text-[#888] mt-0.5">Severity</div>
                    </div>
                    <div className="bg-white border border-green-200 p-2 text-center">
                      <div className="font-mono text-[0.65rem] font-bold text-green-700 leading-tight">{verification.category}</div>
                      <div className="font-mono text-[0.5rem] uppercase tracking-wider text-[#888] mt-0.5">Category</div>
                    </div>
                    <div className="bg-white border border-green-200 p-2 text-center">
                      <div className={`font-mono text-[0.65rem] font-bold leading-tight ${
                        verification.visualAssessment === 'Critical' ? 'text-red-600' :
                        verification.visualAssessment === 'Medium' ? 'text-amber-600' : 'text-green-600'
                      }`}>{verification.visualAssessment}</div>
                      <div className="font-mono text-[0.5rem] uppercase tracking-wider text-[#888] mt-0.5">Level</div>
                    </div>
                  </div>
                  <div className="mt-2 font-mono text-[0.55rem] text-[#888] uppercase tracking-wider">
                    → {verification.department}
                  </div>
                </div>
              )}

              {verification.state === 'invalid' && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <ShieldAlert size={14} className="text-red-600 shrink-0" />
                    <div className="font-mono text-[0.65rem] uppercase tracking-wider text-red-700">Flagged by Spam Shield</div>
                  </div>
                  <p className="font-sans text-[0.8rem] text-red-900 mb-2 leading-relaxed">{verification.reason}</p>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={11} className="text-red-500" />
                    <div className="font-mono text-[0.6rem] text-red-700">
                      Trust Score Deducted: <span className="font-bold">-{verification.deduction}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 font-mono text-[0.6rem] uppercase tracking-wider text-red-600 border border-red-300 px-3 py-1.5 hover:bg-red-50 transition-colors"
                  >
                    Upload Different Media
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Location ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[0.75rem] font-semibold text-[#444]">Location Identity</label>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={!gpsLocation && !userLocation}
              className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-blue-600 border border-blue-200 px-2 py-1 hover:bg-blue-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Crosshair size={10} />
              Use My Location
            </button>
          </div>

          {/* Place Search */}
          <div ref={searchRef} className="relative mb-2">
            <div className="flex items-center border border-civic-border bg-civic-bg rounded-xl px-3 py-2.5 gap-2 focus-within:border-civic-ink transition-colors">
              {isSearching
                ? <Loader2 size={13} className="text-[#999] animate-spin shrink-0" />
                : <Search size={13} className="text-[#999] shrink-0" />
              }
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search for a place or address..."
                className="flex-1 bg-transparent outline-none font-sans text-[0.82rem] placeholder:text-[#bbb]"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowDropdown(false); }}>
                  <X size={12} className="text-[#aaa] hover:text-[#555]" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-civic-border shadow-xl z-[500] max-h-[200px] overflow-y-auto rounded-xl mt-1">
                {searchResults.map((place, i) => {
                  const parts = place.display_name.split(',');
                  const title = parts.slice(0, 2).join(',').trim();
                  const subtitle = parts.slice(2, 4).join(',').trim();
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left px-3 py-2.5 hover:bg-civic-bg transition-colors border-b border-civic-border last:border-0 flex items-start gap-2.5"
                    >
                      <MapPin size={12} className="text-[#999] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-sans text-[0.8rem] text-civic-ink font-medium leading-tight">{title}</div>
                        {subtitle && <div className="font-sans text-[0.65rem] text-[#999] mt-0.5">{subtitle}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {showDropdown && searchQuery.trim() && searchResults.length === 0 && !isSearching && (
              <div className="absolute top-full left-0 right-0 bg-white border border-civic-border shadow-lg z-[500] px-3 py-3">
                <span className="font-mono text-[0.65rem] text-[#aaa] uppercase tracking-wider">No results found</span>
              </div>
            )}
          </div>

          <div className="w-full h-[220px] border border-civic-border bg-civic-bg mb-2 relative z-0 rounded-xl overflow-hidden">
            <Map
              defaultCenter={
                parseCoord(lat) !== null && parseCoord(lng) !== null
                  ? { lat: parseCoord(lat) as number, lng: parseCoord(lng) as number }
                  : gpsLocation 
                    ? { lat: gpsLocation.lat, lng: gpsLocation.lng } 
                    : { lat: 10.52, lng: 76.22 }
              }
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI={true}
              mapId="solvuno-actionhub-map"
              style={{ height: '100%', width: '100%' }}
              onClick={(e: MapMouseEvent) => {
                if (e.detail.latLng) {
                  setLat(e.detail.latLng.lat);
                  setLng(e.detail.latLng.lng);
                }
              }}
            >
              <LocationPicker lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
              {flyTarget && <FlyToCoord lat={flyTarget.lat} lng={flyTarget.lng} />}
            </Map>
          </div>
          {lat && lng && (
            <div className="font-mono text-[0.6rem] text-[#888]">
              COORD_LOCKED: {lat.toFixed(4)}, {lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ── Issue Type ──────────────────────────────────────────── */}
        <div>
          <label className="block text-[0.75rem] font-semibold text-[#444] mb-2">Issue Classification</label>
          <select
            value={type}
            onChange={(e) => { setType(e.target.value as IssueType); if (e.target.value !== 'other') setCustomType(''); }}
            className="w-full py-3 px-3 border border-civic-border bg-civic-bg rounded-xl font-sans text-[0.9rem] outline-none focus:border-civic-ink transition-colors appearance-none cursor-pointer"
          >
            <option value="" disabled>Select category...</option>
            <option value="pothole">Roadway Fracture (Pothole)</option>
            <option value="streetlight">Lighting Failure</option>
            <option value="water">Utility Leakage</option>
            <option value="public_works">Vandalism / Public Works</option>
            <option value="other">Other (specify below)</option>
          </select>

          {/* Custom classification input — shown only when 'Other' is selected */}
          {type === 'other' && (
            <div className="mt-3 relative">
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. Fallen tree, Broken bench, Graffiti..."
                maxLength={60}
                className="w-full py-2.5 px-0 border-b border-civic-border bg-transparent font-sans text-[0.9rem] outline-none focus:border-civic-ink transition-colors placeholder:text-[#bbb]"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-[0.55rem] uppercase tracking-wider text-[#aaa]">Custom classification</span>
                <span className="font-mono text-[0.55rem] text-[#bbb]">{customType.length}/60</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Description ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-[90px]">
          <label className="block text-[0.75rem] font-semibold text-[#444] mb-2">Analytical Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detail your observations..."
            className="w-full flex-1 py-3 px-3 border border-civic-border bg-civic-bg rounded-xl font-sans text-[0.9rem] outline-none focus:border-civic-ink transition-colors resize-none min-h-[80px]"
          />
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────── */}
      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || verification.state !== 'valid' || !type || !description || lat === null}
          className="w-full bg-civic-ink text-white border-none py-4 font-sans text-sm font-semibold cursor-pointer transition-colors hover:bg-civic-accent disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md"
        >
          {isSubmitting ? 'Submitting...' : verification.state === 'valid' ? 'Execute Submission' : verification.state === 'analyzing' ? 'Verifying Media...' : 'Upload Media to Proceed'}
        </button>
        <p className="text-[10px] mt-3 opacity-40 text-center font-sans">
          All reports are AI-verified before being published · Spam reduces your Trust Score
        </p>
      </div>
    </section>
  );
}
