import React, { useState, useEffect, useMemo } from 'react';
import { BarChart2, TrendingUp, Users, CheckCircle2, AlertCircle, MapPin, Zap, RefreshCw, Loader2, Flame, Award, Clock, Mail } from 'lucide-react';
import { useAppContext, Issue, User } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';
import { distanceKm } from '../hooks/useGeolocation';

const TYPE_COLORS: Record<string, string> = {
  pothole: '#ef4444',
  streetlight: '#f59e0b',
  water: '#3b82f6',
  public_works: '#8b5cf6',
  other: '#6b7280',
};
const TYPE_LABELS: Record<string, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  water: 'Water Leak',
  public_works: 'Public Works',
  other: 'Other',
};

function weeklyActivity(issues: Issue[]) {
  const days: number[] = Array(7).fill(0);
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const now = Date.now();
  issues.forEach(i => {
    const diffDays = Math.floor((now - new Date(i.timestamp).getTime()) / 86400000);
    if (diffDays < 7) days[6 - diffDays]++;
  });
  return { days, labels };
}

function StatCard({ label, value, sub, color = 'text-civic-ink', icon: Icon, bg = 'bg-civic-surface' }: {
  label: string; value: string|number; sub?: string; color?: string; icon?: any; bg?: string;
}) {
  return (
    <div className={`${bg} border border-civic-border rounded-2xl p-5 flex flex-col gap-2 civic-card`}>
      <div className="flex items-start justify-between">
        <div className={`font-serif text-[2.2rem] font-bold leading-none ${color}`}>{value}</div>
        {Icon && <div className={`w-9 h-9 rounded-xl bg-civic-bg flex items-center justify-center`}><Icon size={16} className={color} strokeWidth={2}/></div>}
      </div>
      <div className="font-mono text-[0.58rem] uppercase tracking-wider text-civic-muted">{label}</div>
      {sub && <div className="font-sans text-[0.7rem] text-civic-muted">{sub}</div>}
    </div>
  );
}

function TypeBreakdownCard({ issues }: { issues: Issue[] }) {
  const groups = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach(i => { map[i.type] = (map[i.type] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [issues]);
  const max = groups[0]?.[1] || 1;

  return (
    <div className="bg-civic-surface border border-civic-border rounded-2xl p-5 civic-card">
      <h3 className="font-mono text-[0.62rem] uppercase tracking-wider text-civic-muted mb-4">Issue Types</h3>
      <div className="flex flex-col gap-3.5">
        {groups.map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <div className="w-[80px] font-mono text-[0.62rem] text-civic-ink shrink-0">{TYPE_LABELS[type] || type}</div>
            <div className="flex-1 h-2 bg-civic-bg rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(count / max) * 100}%`, backgroundColor: TYPE_COLORS[type] || '#6b7280' }} />
            </div>
            <div className="font-mono text-[0.68rem] font-bold text-civic-ink w-5 text-right">{count}</div>
          </div>
        ))}
        {groups.length === 0 && <p className="font-sans text-sm text-civic-muted">No data yet</p>}
      </div>
    </div>
  );
}

function ActivityChart({ issues }: { issues: Issue[] }) {
  const { days, labels } = weeklyActivity(issues);
  const max = Math.max(...days, 1);

  return (
    <div className="bg-civic-surface border border-civic-border rounded-2xl p-5 civic-card">
      <h3 className="font-mono text-[0.62rem] uppercase tracking-wider text-civic-muted mb-4">Reports This Week</h3>
      <div className="flex items-end gap-2 h-[80px]">
        {days.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t-md transition-all duration-700 bg-civic-ink/80 hover:bg-civic-accent"
              style={{ height: `${max > 0 ? (v / max) * 64 : 4}px`, minHeight: v > 0 ? '6px' : '2px' }}
              title={`${v} report${v !== 1 ? 's' : ''}`} />
            <span className="font-mono text-[0.45rem] text-civic-muted">{labels[i]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-right font-mono text-[0.55rem] text-civic-muted">
        Total: {days.reduce((a,b)=>a+b,0)} this week
      </div>
    </div>
  );
}

function HotspotCard({ issues }: { issues: Issue[] }) {
  const hotspots = useMemo(() => {
    const grid: Record<string, {count:number;lat:number;lng:number;types:string[]}> = {};
    issues.forEach(i => {
      const key = `${(i.lat/0.05).toFixed(0)},${(i.lng/0.05).toFixed(0)}`;
      if (!grid[key]) grid[key] = { count: 0, lat: i.lat, lng: i.lng, types: [] };
      grid[key].count++;
      if (!grid[key].types.includes(i.type)) grid[key].types.push(i.type);
    });
    return Object.values(grid).sort((a,b) => b.count - a.count).slice(0,4);
  }, [issues]);

  const intensityClass = (i: number) =>
    i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : i === 2 ? 'bg-amber-400' : 'bg-yellow-300';

  return (
    <div className="bg-civic-surface border border-civic-border rounded-2xl p-5 civic-card">
      <h3 className="font-mono text-[0.62rem] uppercase tracking-wider text-civic-muted mb-4">Issue Hotspots</h3>
      {hotspots.length === 0 ? (
        <p className="font-sans text-sm text-civic-muted">No data yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {hotspots.map((h, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-civic-bg rounded-xl">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${intensityClass(i)}`} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[0.62rem] text-civic-ink truncate flex items-center gap-1">
                  <MapPin size={9} />{h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                </div>
                <div className="font-mono text-[0.5rem] text-civic-muted mt-0.5">
                  {h.types.map(t => TYPE_LABELS[t] || t).join(' · ')}
                </div>
              </div>
              <div className="font-mono text-[0.68rem] font-bold text-civic-ink shrink-0">{h.count} issue{h.count!==1?'s':''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardCard({ users, issues, radius, userLocation }: { users: User[]; issues: Issue[]; radius: string; userLocation: { lat: number; lng: number } | null }) {
  const { currentUser } = useAppContext();
  const rankIcons = ['🥇','🥈','🥉'];
  
  const filteredUsers = useMemo(() => {
    if (!userLocation) return users;
    let maxDist = Infinity;
    if (radius === 'Local (5km)') maxDist = 5;
    else if (radius === 'Local (10km)') maxDist = 10;
    // 'Citywide' means no filter
    
    if (maxDist === Infinity) return users;
    return users.filter(u => {
      if (!u.lastKnownLocation) return false;
      return distanceKm(userLocation.lat, userLocation.lng, u.lastKnownLocation.lat, u.lastKnownLocation.lng) <= maxDist;
    });
  }, [users, userLocation, radius]);

  const withCount = filteredUsers.map(u => ({
    ...u,
    reportCount: issues.filter(i => i.reporterId === u.id).length
  })).sort((a,b) => (b.capturedBP||0) - (a.capturedBP||0)).slice(0,5);

  return (
    <div className="bg-civic-surface border border-civic-border rounded-2xl p-5 civic-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[0.62rem] uppercase tracking-wider text-civic-muted">Leader board</h3>
        <span className="font-mono text-[0.55rem] uppercase tracking-wider text-civic-ink bg-civic-bg border border-civic-border rounded-full px-2 py-0.5">{radius}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {withCount.length === 0 ? (
          <p className="font-sans text-sm text-civic-muted">No users found</p>
        ) : withCount.map((u, i) => {
          const isMe = currentUser?.id === u.id;
          return (
            <div key={u.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${i === 0 ? 'bg-amber-50 border border-amber-100' : 'bg-civic-bg'} group`}>
              <span className="text-base w-5 text-center">{rankIcons[i] || `#${i+1}`}</span>
              <img 
                src={u.avatar} 
                alt={u.name} 
                onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: u.id }))}
                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity" 
              />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="min-w-0">
                  <div 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: u.id }))}
                    className="font-sans text-sm font-semibold text-civic-ink truncate cursor-pointer hover:underline"
                  >
                    {u.name}
                  </div>
                  <div className="font-mono text-[0.55rem] text-civic-muted">{u.reportCount} reports · {u.badge}</div>
                </div>
                {!isMe && (
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-dm', { detail: u.id }))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-civic-muted hover:text-civic-ink hover:bg-white rounded border border-transparent hover:border-civic-border"
                    title={`Message ${u.name.split(' ')[0]}`}
                  >
                    <Mail size={12} />
                  </button>
                )}
              </div>
              <div className="font-mono text-[0.68rem] font-bold text-civic-ink shrink-0">{(u.capturedBP||0).toLocaleString()} BP</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeverityDistribution({ issues }: { issues: Issue[] }) {
  const buckets = useMemo(() => {
    const low = issues.filter(i => (i.severityScore||0) < 4).length;
    const med = issues.filter(i => (i.severityScore||0) >= 4 && (i.severityScore||0) < 7).length;
    const high = issues.filter(i => (i.severityScore||0) >= 7).length;
    const total = low + med + high || 1;
    return [
      { label: 'Low (1-3)', count: low, pct: Math.round((low/total)*100), color: 'bg-green-500' },
      { label: 'Medium (4-6)', count: med, pct: Math.round((med/total)*100), color: 'bg-amber-500' },
      { label: 'High (7-10)', count: high, pct: Math.round((high/total)*100), color: 'bg-red-500' },
    ];
  }, [issues]);

  return (
    <div className="bg-civic-surface border border-civic-border rounded-2xl p-5 civic-card">
      <h3 className="font-mono text-[0.62rem] uppercase tracking-wider text-civic-muted mb-4">Severity Distribution</h3>
      <div className="w-full h-3 rounded-full overflow-hidden flex gap-0.5 mb-4">
        {buckets.map(b => (
          <div key={b.label} className={`${b.color} h-full transition-all duration-700`} style={{width:`${b.pct}%`}} />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {buckets.map(b => (
          <div key={b.label} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${b.color}`} />
            <span className="font-sans text-xs text-civic-ink flex-1">{b.label}</span>
            <span className="font-mono text-xs font-bold text-civic-ink">{b.count}</span>
            <span className="font-mono text-[0.58rem] text-civic-muted w-8 text-right">{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightsPanel() {
  const { runCityPlannerAnalysis, nearbyIssues: issues } = useAppContext();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setInsight(await runCityPlannerAnalysis()); }
    catch (e: any) { setError(e.message || 'Failed to load insights'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (issues.length > 0) load(); }, []);

  return (
    <div className="bg-gradient-to-br from-civic-ink to-[#1e2430] border border-civic-ink rounded-2xl p-6 col-span-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-civic-accent/20 flex items-center justify-center">
            <Zap size={15} className="text-civic-accent" fill="currentColor" />
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold text-white">AI City Planner Analysis</h3>
            <p className="font-mono text-[0.55rem] uppercase tracking-wider text-white/40 mt-0.5">Powered by Gemini AI</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-white/60 border border-white/20 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors disabled:opacity-40">
          {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {loading && !insight && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <Loader2 size={18} className="animate-spin text-civic-accent" />
          <span className="font-sans text-sm text-white/50">Gemini is analyzing your city data...</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3">
          <AlertCircle size={13} /><span className="font-sans text-sm">{error}</span>
        </div>
      )}
      {insight && !loading && (
        <div className="prose prose-sm max-w-none text-white/80 [&_h1]:font-serif [&_h1]:text-white [&_h2]:font-mono [&_h2]:text-[0.65rem] [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-white/50 [&_strong]:text-white [&_ul]:pl-4 [&_li]:mb-1 [&_p]:leading-relaxed">
          <ReactMarkdown>{insight}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function InsightsDashboard() {
  const { nearbyIssues: issues, users, userLocation } = useAppContext();
  const [radius, setRadius] = useState('Local (10km)');

  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  const critical = issues.filter(i => (i.severityScore||0) >= 7 && i.status === 'active').length;
  const verified = issues.filter(i => i.communityVerified).length;
  const resRate = total > 0 ? Math.round((resolved/total)*100) : 0;
  const avgSeverity = total > 0 ? (issues.reduce((s,i) => s+(i.severityScore||0),0)/total).toFixed(1) : '0';

  return (
    <section className="w-full h-full overflow-y-auto custom-scrollbar bg-civic-bg">
      <div className="max-w-4xl mx-auto p-6 pb-28 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-[1.8rem] font-bold text-civic-ink leading-none">Impact Dashboard</h1>
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-civic-muted mt-2">City-wide civic intelligence · Live</p>
          </div>
          <select value={radius} onChange={e => setRadius(e.target.value)}
            className="bg-civic-surface border border-civic-border rounded-xl font-mono text-[0.6rem] uppercase tracking-wider text-civic-ink px-3 py-2 outline-none">
            <option>Local (5km)</option>
            <option>Local (10km)</option>
            <option>Citywide</option>
          </select>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Reports" value={total} icon={BarChart2} />
          <StatCard label="Resolved" value={resolved} color="text-green-600" sub={`${resRate}% resolution rate`} icon={CheckCircle2} />
          <StatCard label="Critical Active" value={critical} color="text-red-600" sub="Severity ≥ 7" icon={Flame} />
          <StatCard label="Community Verified" value={verified} color="text-blue-600" sub={`of ${total} total`} icon={Users} />
          <StatCard label="Avg Severity" value={avgSeverity} sub="Out of 10" icon={TrendingUp} />
          <StatCard label="Avg Resolution" value={resolved > 0 ? '~3.2d' : 'N/A'} sub="Estimated" icon={Clock} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TypeBreakdownCard issues={issues} />
          <ActivityChart issues={issues} />
        </div>

        {/* Severity + Hotspots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SeverityDistribution issues={issues} />
          <HotspotCard issues={issues} />
        </div>

        {/* Leaderboard */}
        <LeaderboardCard users={users} issues={issues} radius={radius} userLocation={userLocation} />

        {/* AI Insights */}
        <div className="grid grid-cols-1">
          <AIInsightsPanel />
        </div>

      </div>
    </section>
  );
}
