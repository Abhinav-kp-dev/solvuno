import React, { useMemo, useState } from 'react';
import { useAppContext, Issue, useRealTime } from '../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { MapPin, Clock, Wrench, CheckCheck, Award, TrendingUp, AlertCircle, CheckCircle2, Flame, Star, Edit2, Trash2, X, Check } from 'lucide-react';

function getTrackingStage(issue: Issue) {
  if (issue.status === 'resolved') return 3;
  if (issue.verificationUpvotes >= 3 || (issue.severityScore||0) >= 7) return 2;
  if (issue.verificationUpvotes >= 1 || issue.assignedDepartment) return 1;
  return 0;
}

const STAGES = [
  { label: 'Reported', icon: MapPin },
  { label: 'Review', icon: Clock },
  { label: 'Progress', icon: Wrench },
  { label: 'Done', icon: CheckCheck },
];

function CompactPipeline({ issue }: { issue: Issue }) {
  const stage = getTrackingStage(issue);
  return (
    <div className="flex items-center w-full mt-3">
      {STAGES.map((s, i) => {
        const done = i <= stage;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? issue.status === 'resolved' && i === 3 ? 'bg-green-500 border-green-500 text-white'
                  : i === stage && i < 3 ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-civic-ink border-civic-ink text-white'
                  : 'bg-white border-civic-border text-civic-border'
              }`}><Icon size={9} /></div>
              <span className={`font-mono text-[0.38rem] uppercase tracking-wider text-center ${done ? 'text-civic-ink' : 'text-civic-border'}`}>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && <div className={`h-[1.5px] flex-1 mb-4 rounded-full ${i < stage ? 'bg-civic-ink' : 'bg-civic-border'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function MyIssueCard({ issue }: { issue: Issue }) {
  const { deleteIssue, editIssue } = useAppContext();
  useRealTime();
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(issue.description);

  const handleEditSubmit = () => {
    if (editDescription.trim() && editDescription !== issue.description) {
      editIssue(issue.id, editDescription);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-civic-bg border border-civic-border rounded-xl p-4 flex flex-col civic-card cursor-default group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-mono text-[0.55rem] uppercase tracking-wider border rounded-full px-2 py-0.5 ${{
            pothole:'chip-pothole',streetlight:'chip-streetlight',water:'chip-water',
            public_works:'chip-public_works',other:'chip-other'
          }[issue.type] || 'chip-other'}`}>
            {issue.type.replace('_',' ')}
          </span>
          <span className="font-sans text-xs text-civic-muted">
            {formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}
          </span>
          {issue.severityScore >= 7 && (
            <span className="font-mono text-[0.5rem] uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Critical</span>
          )}
        </div>
        
        <div className="flex items-center gap-1.5">
          {issue.status === 'active' && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-1">
              <button onClick={() => setIsEditing(true)} className="p-1 text-civic-muted hover:text-civic-ink bg-civic-surface hover:bg-gray-100 border border-civic-border rounded transition-colors" title="Edit">
                <Edit2 size={10} />
              </button>
              <button onClick={() => deleteIssue(issue.id)} className="p-1 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors" title="Delete">
                <Trash2 size={10} />
              </button>
            </div>
          )}
          <span className={`font-mono text-[0.6rem] uppercase tracking-wider rounded-full px-2.5 py-1 border ${
            issue.status === 'resolved'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {issue.status}
          </span>
        </div>
      </div>
      
      {isEditing ? (
        <div className="mb-2 flex flex-col gap-1.5">
          <textarea
            className="w-full bg-white border border-civic-border rounded-lg p-2 font-sans text-sm text-civic-ink outline-none focus:border-civic-accent resize-none h-20"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div className="flex gap-1.5 justify-end">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-[0.65rem] font-semibold text-civic-muted hover:text-civic-ink bg-civic-surface border border-civic-border px-2 py-1 rounded">
              <X size={10} /> Cancel
            </button>
            <button onClick={handleEditSubmit} className="flex items-center gap-1 text-[0.65rem] font-semibold text-white bg-civic-accent hover:bg-civic-accent/90 px-2 py-1 rounded">
              <Check size={10} /> Save
            </button>
          </div>
        </div>
      ) : (
        <p className="font-sans text-sm text-civic-ink leading-snug mb-2 line-clamp-2">{issue.description}</p>
      )}

      <div className="font-mono text-[0.58rem] text-civic-muted flex items-center gap-1 mb-2">
        <MapPin size={10} />{issue.lat.toFixed(4)}, {issue.lng.toFixed(4)}
      </div>
      {issue.bountyPoints && (
        <div className="flex items-center gap-1.5 mb-1">
          <Award size={11} className="text-amber-500" />
          <span className="font-mono text-[0.58rem] text-amber-600 font-bold">+{issue.bountyPoints} BP earned</span>
        </div>
      )}
      <CompactPipeline issue={issue} />
    </div>
  );
}

const BADGE_GRADIENT: Record<string, string> = {
  Champion: 'from-amber-500 to-orange-500',
  Advocate: 'from-violet-500 to-purple-600',
  Defender: 'from-sky-500 to-cyan-500',
  Scout: 'from-emerald-500 to-green-600',
};

const RANK_THRESHOLDS = [
  { label: 'Scout', min: 0, max: 500, color: 'text-emerald-600' },
  { label: 'Defender', min: 500, max: 1000, color: 'text-sky-600' },
  { label: 'Advocate', min: 1000, max: 2000, color: 'text-violet-600' },
  { label: 'Champion', min: 2000, max: 5000, color: 'text-amber-600' },
];

export default function UserSection() {
  const { currentUser, issues, users, activeProfileId, setActiveProfileId, setCurrentView } = useAppContext();
  
  const displayUserId = activeProfileId || currentUser?.id;
  const displayUser = users.find(u => u.id === displayUserId);

  if (!displayUser) return null;
  const isMe = displayUser.id === currentUser?.id;

  const myIssues = issues.filter(i => i.reporterId === displayUser.id);
  const resolved = myIssues.filter(i => i.status === 'resolved').length;
  const active = myIssues.filter(i => i.status === 'active').length;
  const critical = myIssues.filter(i => i.severityScore >= 7).length;
  const totalLikes = myIssues.reduce((s, i) => s + (i.verificationUpvotes || 0), 0);

  const capturedBP = displayUser.capturedBP || 0;
  const pendingBP = displayUser.pendingBP || 0;
  const bp = capturedBP;
  const currentRank = RANK_THRESHOLDS.slice().reverse().find(r => bp >= r.min) || RANK_THRESHOLDS[0];
  const nextRank = RANK_THRESHOLDS.find(r => r.min > bp);
  const rankProgress = nextRank ? Math.round(((bp - currentRank.min) / (nextRank.min - currentRank.min)) * 100) : 100;

  const userRank = useMemo(() => {
    const sorted = [...users].sort((a, b) => (b.capturedBP||0) - (a.capturedBP||0));
    return sorted.findIndex(u => u.id === displayUser.id) + 1;
  }, [users, displayUser]);

  const trustColor = displayUser.civic_trust_score >= 70 ? 'text-green-600' : displayUser.civic_trust_score >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <section className="w-full max-w-5xl h-full flex gap-6 mx-auto animate-fade-in">
      {/* LEFT — Profile card */}
      <div className="w-[300px] shrink-0 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar">
        {/* Avatar + name */}
        <div className="bg-civic-surface border border-civic-border rounded-2xl p-6 flex flex-col items-center text-center relative">
          {!isMe && (
            <button 
              onClick={() => { setActiveProfileId(null); setCurrentView('community'); }}
              className="absolute top-4 left-4 text-civic-muted hover:text-civic-ink transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <div className="relative mb-4">
            <img src={displayUser.avatar} alt={displayUser.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br ${BADGE_GRADIENT[displayUser.badge] || 'from-slate-500 to-slate-600'} flex items-center justify-center border-2 border-white shadow-sm`}>
              <Star size={13} className="text-white fill-white" />
            </div>
          </div>
          <h2 className="font-serif text-xl font-bold text-civic-ink leading-none">{displayUser.name}</h2>
          <p className="font-mono text-xs text-civic-muted mt-1">{displayUser.handle || '@user'}</p>
          <div className={`mt-2 font-mono text-[0.6rem] uppercase tracking-widest font-bold ${currentRank.color}`}>
            {displayUser.badge}
          </div>
          
          {!isMe && (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-dm', { detail: displayUser.id }))}
              className="mt-4 w-full bg-civic-ink hover:bg-civic-accent text-white font-sans text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Message {displayUser.name.split(' ')[0]}
            </button>
          )}

          {userRank <= users.length && (
            <div className="mt-4 font-sans text-xs text-civic-muted">
              #{userRank} in your network
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Reports', value: myIssues.length, icon: MapPin, color: 'text-civic-ink' },
            { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Active', value: active, icon: AlertCircle, color: 'text-amber-600' },
            { label: 'Upvotes', value: totalLikes, icon: TrendingUp, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-civic-surface border border-civic-border rounded-xl p-3.5 flex flex-col items-center gap-1 civic-card">
              <s.icon size={14} className={s.color} strokeWidth={2} />
              <div className={`font-serif text-xl font-bold leading-none ${s.color}`}>{s.value}</div>
              <div className="font-mono text-[0.5rem] uppercase tracking-wider text-civic-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trust score */}
        <div className="bg-civic-surface border border-civic-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-civic-muted">Civic Trust</span>
            <span className={`font-serif text-2xl font-bold ${trustColor}`}>{displayUser.civic_trust_score}</span>
          </div>
          <div className="w-full h-2 bg-civic-border rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${displayUser.civic_trust_score}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-mono text-[0.5rem] text-civic-muted">0</span>
            <span className="font-mono text-[0.5rem] text-civic-muted">100</span>
          </div>
          {displayUser.requiresDoubleUpvotes && (
            <div className="mt-2 text-xs font-sans text-red-600 font-semibold text-center">⚠ Account Restricted</div>
          )}
        </div>

        {/* BP + Rank Progress */}
        <div className="bg-civic-surface border border-civic-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-civic-muted">Bounty Points</span>
            <Award size={14} className="text-amber-500" />
          </div>
          <div className="flex gap-4 mb-3">
            <div className="flex-1 bg-civic-bg p-3 rounded-xl border border-civic-border">
              <div className="font-serif text-2xl font-bold text-civic-ink">{capturedBP.toLocaleString()}</div>
              <div className="font-mono text-[0.55rem] uppercase text-civic-muted mt-1">captured_bp</div>
            </div>
            <div className="flex-1 bg-civic-bg p-3 rounded-xl border border-civic-border">
              <div className="font-serif text-2xl font-bold text-civic-ink">{pendingBP.toLocaleString()}</div>
              <div className="font-mono text-[0.55rem] uppercase text-civic-muted mt-1">pending_bp</div>
            </div>
          </div>
          {nextRank && (
            <>
              <div className="w-full h-1.5 bg-civic-border rounded-full overflow-hidden mb-1.5">
                <div className="progress-bar h-full" style={{ width: `${rankProgress}%` }} />
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[0.5rem] uppercase text-civic-muted">{currentRank.label}</span>
                <span className="font-mono text-[0.5rem] uppercase text-civic-muted">{nextRank.min - bp} BP to {nextRank.label}</span>
              </div>
            </>
          )}
          {!nextRank && <div className="font-mono text-[0.6rem] text-amber-600 uppercase tracking-wider">Max Rank Achieved 🏆</div>}
        </div>
      </div>

      {/* RIGHT — My Reports */}
      <div className="flex-1 min-w-0 bg-civic-surface border border-civic-border rounded-2xl flex flex-col h-full overflow-hidden">
        <div className="px-6 py-5 border-b border-civic-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-serif text-xl font-bold text-civic-ink">My Reports</h2>
            <p className="font-sans text-xs text-civic-muted mt-0.5">Track every issue you've submitted</p>
          </div>
          {critical > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
              <Flame size={12} className="text-red-500" />
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-red-700">{critical} Critical</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
          {myIssues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-civic-muted">
              <MapPin size={32} strokeWidth={1} className="mb-3 opacity-20" />
              <p className="font-sans font-medium text-base">No reports yet</p>
              <p className="font-sans text-sm mt-1 opacity-60">Submit your first civic report to get started</p>
            </div>
          ) : (
            myIssues.map(issue => <MyIssueCard key={issue.id} issue={issue} />)
          )}
        </div>
      </div>
    </section>
  );
}
