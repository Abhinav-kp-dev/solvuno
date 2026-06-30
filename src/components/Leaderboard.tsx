import { useMemo } from 'react';
import { MapPin, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { distanceKm } from '../hooks/useGeolocation';

const NEARBY_RADIUS_KM = 10;

function isValidCoord(v: any): v is number {
  return v !== null && v !== undefined && typeof Number(v) === 'number' && isFinite(Number(v));
}

export default function Leaderboard() {
  const { users, userLocation } = useAppContext();

  const { displayUsers, isNearby } = useMemo(() => {
    // Sort all users by capturedBP desc, tie-break by civic_trust_score
    const allSorted = [...users].sort((a, b) => {
      const bpDiff = (b.capturedBP || 0) - (a.capturedBP || 0);
      if (bpDiff !== 0) return bpDiff;
      return (b.civic_trust_score || 0) - (a.civic_trust_score || 0);
    });

    // If we have a valid userLocation, try nearby filter first
    if (
      userLocation &&
      isValidCoord(userLocation.lat) &&
      isValidCoord(userLocation.lng)
    ) {
      const nearby = allSorted.filter(u => {
        if (
          !u.lastKnownLocation ||
          !isValidCoord(u.lastKnownLocation.lat) ||
          !isValidCoord(u.lastKnownLocation.lng)
        ) return false;
        const d = distanceKm(
          Number(userLocation.lat),
          Number(userLocation.lng),
          Number(u.lastKnownLocation.lat),
          Number(u.lastKnownLocation.lng)
        );
        return d <= NEARBY_RADIUS_KM;
      });

      // If nearby results exist, use them; otherwise fall back to global
      if (nearby.length > 0) {
        return { displayUsers: nearby, isNearby: true };
      }
    }

    // Fallback: show global leaderboard
    return { displayUsers: allSorted, isNearby: false };
  }, [users, userLocation]);

  const getUserDistance = (u: typeof users[0]) => {
    if (
      !userLocation ||
      !u.lastKnownLocation ||
      !isValidCoord(userLocation.lat) ||
      !isValidCoord(u.lastKnownLocation.lat)
    ) return null;
    const d = distanceKm(
      Number(userLocation.lat),
      Number(userLocation.lng),
      Number(u.lastKnownLocation.lat),
      Number(u.lastKnownLocation.lng)
    );
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  const rankColors = ['bg-amber-500', 'bg-slate-400', 'bg-amber-700/70'];

  return (
    <div className="bg-white border border-civic-border p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[#888]">
          Leader board
        </div>
        <div className="flex items-center gap-1.5">
          {isNearby ? (
            <>
              <MapPin size={10} className="text-civic-accent" />
              <span className="font-mono text-[0.55rem] uppercase tracking-wider text-civic-accent">
                {NEARBY_RADIUS_KM}km Radius
              </span>
            </>
          ) : (
            <>
              <Globe size={10} className="text-civic-muted" />
              <span className="font-mono text-[0.55rem] uppercase tracking-wider text-civic-muted">
                Global
              </span>
            </>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col overflow-y-auto custom-scrollbar gap-0.5">
        {displayUsers.map((user, index) => {
          const dist = getUserDistance(user);
          return (
            <div
              key={user.id}
              className={`flex items-center gap-3 py-3 px-2 rounded-lg border border-transparent transition-all hover:border-civic-border hover:bg-gray-50/60 ${
                index === 0 ? 'bg-amber-50/40' : ''
              }`}
            >
              {/* Rank badge */}
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                {index < 3 ? (
                  <div
                    className={`w-5 h-5 rounded-full text-white font-mono text-[0.45rem] font-bold flex items-center justify-center shadow-sm ${rankColors[index]}`}
                  >
                    {index + 1}
                  </div>
                ) : (
                  <span className="font-mono text-[0.6rem] text-civic-muted">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`w-9 h-9 rounded-full object-cover ring-1 ring-civic-border ${
                    user.activeCosmetics?.avatarBorder || ''
                  }`}
                />
              </div>

              {/* Name + title + distance */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p
                  className="font-sans text-[0.8rem] font-semibold text-civic-ink truncate"
                  style={{
                    textShadow: user.activeCosmetics?.glowColor
                      ? `0 0 8px ${user.activeCosmetics.glowColor}`
                      : undefined,
                  }}
                >
                  {user.name} {index === 0 && '👑'}
                </p>
                <div className="flex items-center gap-2">
                  {user.activeCosmetics?.currentTitle && (
                    <span className="font-mono text-[0.55rem] text-civic-accent opacity-80">
                      {user.activeCosmetics.currentTitle}
                    </span>
                  )}
                  {dist && (
                    <span className="font-mono text-[0.5rem] text-civic-muted flex items-center gap-0.5">
                      <MapPin size={7} />
                      {dist}
                    </span>
                  )}
                </div>
              </div>

              {/* BP points */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="font-mono text-[0.8rem] font-bold text-civic-accent">
                  {(user.capturedBP || 0).toLocaleString()}
                </span>
                <span className="font-mono text-[0.5rem] text-civic-muted uppercase tracking-wide">
                  BP
                </span>
              </div>
            </div>
          );
        })}

        {displayUsers.length === 0 && (
          <div className="py-10 text-center font-sans text-sm text-civic-muted">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
