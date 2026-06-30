import React, { useState, useMemo } from 'react';
import { AlertTriangle, ArrowUp, ArrowUpCircle, ArrowDownCircle, CheckCircle2, ChevronRight, Clock, Flame, Heart, Lock, Loader2, MessageCircle, MoreHorizontal, Shield, MapPin, CheckCheck, Trash2, Edit2, X, Check, Wrench, Send, TrendingUp, Star, Filter, Mail } from 'lucide-react';
import { Issue, useAppContext, useRealTime } from '../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { distanceKm } from '../hooks/useGeolocation';

const ISSUE_TYPE_CHIP: Record<string, string> = {
  pothole: 'chip-pothole',
  streetlight: 'chip-streetlight',
  water: 'chip-water',
  public_works: 'chip-public_works',
  other: 'chip-other',
};

const ISSUE_TYPE_LABEL: Record<string, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  water: 'Water Leak',
  public_works: 'Public Works',
  other: 'Other',
};

function getTrackingStage(issue: Issue) {
  if (issue.status === 'resolved') return 3;
  if (issue.verificationUpvotes >= 3 || issue.severityScore >= 7) return 2;
  if (issue.verificationUpvotes >= 1 || issue.assignedDepartment) return 1;
  return 0;
}

const STAGES = [
  { label: 'Reported', icon: MapPin },
  { label: 'Under Review', icon: Clock },
  { label: 'In Progress', icon: Wrench },
  { label: 'Resolved', icon: CheckCheck },
];

function StatusPipeline({ issue }: { issue: Issue }) {
  const stage = getTrackingStage(issue);
  return (
    <div className="flex items-center w-full">
      {STAGES.map((s, i) => {
        const done = i <= stage;
        const active = i === stage;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                done
                  ? issue.status === 'resolved' && i === 3
                    ? 'bg-green-500 border-green-500 text-white shadow-sm shadow-green-200'
                    : active && i < 3
                    ? 'bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-200'
                    : 'bg-civic-ink border-civic-ink text-white'
                  : 'bg-white border-civic-border text-civic-border'
              }`}>
                <Icon size={12} />
              </div>
              <span className={`font-mono text-[0.42rem] uppercase tracking-wider text-center leading-tight ${done ? 'text-civic-ink' : 'text-civic-border'}`}>
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-[2px] flex-1 mb-5 transition-all rounded-full ${i < stage ? 'bg-civic-ink' : 'bg-civic-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type FilterMode = 'all' | 'critical' | 'nearby' | 'trending';

function Post({ issue, userLocation }: { issue: Issue; userLocation: {lat:number;lng:number}|null }) {
  const { users, upvoteToVerify, downvoteAsSpam, addComment, currentUser, submitProofOfFix, deleteIssue, editIssue, setCurrentView, setMapFocusLocation } = useAppContext();
  useRealTime();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(issue.description);
  const [isVerifying, setIsVerifying] = useState(false);

  const author = users.find(u => u.id === issue.reporterId);
  if (!author) return null;

  const hasUpvoted = currentUser ? issue.upvotedBy?.includes(currentUser.id) : false;
  const hasDownvoted = currentUser ? issue.downvotedBy?.includes(currentUser.id) : false;

  const isLowConfidence = !issue.communityVerified;
  const votesNeeded = Math.max(0, 5 - (issue.verificationUpvotes || 0));
  const isMyIssue = currentUser?.id === issue.reporterId;
  const dist = userLocation ? distanceKm(userLocation.lat, userLocation.lng, issue.lat, issue.lng) : null;


  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(issue.id, commentText);
    setCommentText('');
  };

  const handleEditSubmit = () => {
    if (editDescription.trim() && editDescription !== issue.description) {
      editIssue(issue.id, editDescription);
    }
    setIsEditing(false);
  };

  const isCritical = issue.severityScore >= 7;

  return (
    <article className={`border-b border-civic-border p-5 flex flex-col gap-4 animate-slide-up transition-colors hover:bg-civic-bg/40 ${
      isCritical && issue.status === 'active' ? 'border-l-2 border-l-red-400' : ''
    } ${isLowConfidence ? 'opacity-85' : ''}`}>

      {/* Critical banner */}
      {isCritical && issue.status === 'active' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Flame size={13} className="text-red-500 shrink-0" />
          <span className="font-sans text-xs font-semibold text-red-700">Critical Issue · Severity {issue.severityScore}/10</span>
          <span className="ml-auto font-mono text-[0.6rem] uppercase tracking-wider text-red-500 border border-red-200 rounded px-1.5 py-0.5 bg-white">
            {issue.bountyTier || 'High Priority'}
          </span>
        </div>
      )}

      {/* Verification warning */}
      {isLowConfidence && !isCritical && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-sans text-xs font-semibold text-amber-800">Awaiting community verification</div>
            <div className="font-sans text-[0.72rem] text-amber-700 mt-0.5">
              AI confidence {Math.round((issue.confidenceScore ?? 0) * 100)}% · {votesNeeded} more upvote{votesNeeded !== 1 ? 's' : ''} needed
            </div>
          </div>
        </div>
      )}

      {/* Community verified */}
      {issue.communityVerified && issue.confidenceScore < 0.7 && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Shield size={12} className="text-green-600" />
          <span className="font-sans text-xs font-semibold text-green-700">Community Verified</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img 
            src={author.avatar} 
            alt={author.name} 
            onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: author.id }))}
            className={`w-9 h-9 rounded-full object-cover border-2 border-civic-border cursor-pointer hover:opacity-80 transition-opacity ${author.activeCosmetics?.avatarBorder || ''}`} 
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                onClick={() => window.dispatchEvent(new CustomEvent('open-profile', { detail: author.id }))}
                className="font-sans font-semibold text-sm text-civic-ink cursor-pointer hover:underline"
              >
                {author.name}
              </span>
              <span className="font-mono text-[0.6rem] text-civic-muted">{author.handle}</span>
              {author.achievedBadges && author.achievedBadges.length > 0 && (
                <span className="font-mono text-[0.5rem] uppercase tracking-wider text-white bg-amber-500 px-1.5 py-0.5 rounded-full">
                  {author.achievedBadges[0]}
                </span>
              )}
              {currentUser && currentUser.id !== author.id && (
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('open-dm', { detail: author.id }))}
                  className="flex items-center gap-1 font-sans text-[0.65rem] font-semibold text-civic-accent hover:text-civic-ink hover:bg-civic-surface border border-transparent hover:border-civic-border px-1.5 py-0.5 rounded-md transition-colors ml-1"
                >
                  <Mail size={10} /> Message
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`font-mono text-[0.6rem] uppercase tracking-wider border px-2 py-0.5 rounded-full ${ISSUE_TYPE_CHIP[issue.type] || 'chip-other'}`}>
                {ISSUE_TYPE_LABEL[issue.type] || issue.type}
              </span>
              <span className="font-sans text-[0.7rem] text-civic-muted">
                {formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}
              </span>
              {dist !== null && (
                <button 
                  onClick={() => {
                    setMapFocusLocation({ lat: issue.lat, lng: issue.lng });
                    setCurrentView('map');
                  }}
                  className="font-mono text-[0.6rem] text-civic-accent flex items-center gap-1 hover:underline hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="View on Map"
                >
                  <MapPin size={10} />
                  {issue.district ? `${issue.district} · ` : ''}
                  {dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`}
                </button>
              )}
            </div>
          </div>
        </div>
        {issue.bountyPoints && issue.bountyPoints > 0 && (
          <div className="shrink-0 flex flex-col items-center bg-civic-ink text-white rounded-xl px-3 py-1.5 min-w-[52px]">
            <span className="font-serif text-[0.95rem] font-bold leading-none">{issue.bountyPoints}</span>
            <span className="font-mono text-[0.42rem] uppercase tracking-wider mt-0.5 text-white/60">BP</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {isEditing ? (
          <div className="mb-3 flex flex-col gap-2">
            <textarea
              className="w-full bg-white border border-civic-border rounded-xl p-3 font-sans text-[0.9rem] text-civic-ink outline-none focus:border-civic-accent resize-none h-24"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1 text-xs font-semibold text-civic-muted hover:text-civic-ink bg-civic-surface border border-civic-border px-3 py-1.5 rounded-lg">
                <X size={12} /> Cancel
              </button>
              <button onClick={handleEditSubmit} className="flex items-center gap-1 text-xs font-semibold text-white bg-civic-accent hover:bg-civic-accent/90 px-3 py-1.5 rounded-lg">
                <Check size={12} /> Save
              </button>
            </div>
          </div>
        ) : (
          <p className="font-sans text-[0.9rem] text-civic-ink leading-relaxed mb-3">{issue.description}</p>
        )}
        {issue.image && (
          <div className="w-full overflow-hidden rounded-xl border border-civic-border mb-3">
            {issue.image.startsWith('data:video/') ? (
              <video src={issue.image} controls className="w-full h-auto object-cover max-h-[400px]" />
            ) : (
              <img src={issue.image} alt="Issue evidence" className="w-full h-auto object-cover max-h-[280px]" />
            )}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono text-civic-muted">
          <span>Severity: <span className={`font-bold ${issue.severityScore >= 7 ? 'text-red-600' : issue.severityScore >= 4 ? 'text-amber-600' : 'text-green-600'}`}>{issue.severityScore}/10</span></span>
          <span className="text-civic-border">·</span>
          <span className="text-civic-muted">{issue.assignedDepartment}</span>
          {issue.district && <><span className="text-civic-border">·</span><span>{issue.district}</span></>}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="bg-civic-bg rounded-xl p-3.5 border border-civic-border">
        <div className="font-mono text-[0.55rem] uppercase tracking-wider text-civic-muted mb-2.5">Resolution Status</div>
        <StatusPipeline issue={issue} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5 pt-2 border-t border-civic-border/60">
        <button
          onClick={() => !hasUpvoted && !hasDownvoted && upvoteToVerify(issue.id)}
          disabled={hasUpvoted || hasDownvoted}
          className={`flex items-center gap-1.5 font-mono text-[0.75rem] transition-colors ${(hasUpvoted || hasDownvoted) ? (hasUpvoted ? 'text-civic-accent cursor-not-allowed' : 'text-[#888] opacity-50 cursor-not-allowed') : 'text-[#888] hover:text-civic-accent'}`}
        >
          <ArrowUpCircle size={17} className={hasUpvoted ? "fill-civic-accent/10" : ""} />
          <span>{issue.verificationUpvotes}</span>
        </button>

        <button
          onClick={() => !hasDownvoted && !hasUpvoted && downvoteAsSpam(issue.id)}
          disabled={hasDownvoted || hasUpvoted}
          className={`flex items-center gap-1.5 font-mono text-[0.75rem] transition-colors ${(hasDownvoted || hasUpvoted) ? (hasDownvoted ? 'text-red-500 cursor-not-allowed' : 'text-[#888] opacity-50 cursor-not-allowed') : 'text-[#888] hover:text-red-500'}`}
        >
          <ArrowDownCircle size={17} className={hasDownvoted ? "fill-red-500/10" : ""} />
          <span>{issue.spamDownvotes}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-sans text-civic-muted hover:text-civic-ink transition-colors"
        >
          <MessageCircle size={17} />
          {issue.comments.length > 0 && <span className="font-medium">{issue.comments.length}</span>}
        </button>

        {isMyIssue && issue.status === 'active' && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-civic-muted hover:text-civic-ink bg-civic-surface hover:bg-gray-100 border border-civic-border rounded-lg px-2.5 py-1.5 transition-colors"
              title="Edit post"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => deleteIssue(issue.id)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-2.5 py-1.5 transition-colors"
              title="Delete post"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {issue.status === 'active' && currentUser && isMyIssue && (
          <div className="ml-auto flex items-center gap-1.5 text-[0.65rem] font-mono tracking-wider border rounded-md px-2 py-1 text-civic-muted border-civic-border bg-civic-surface cursor-not-allowed opacity-60">
            <Lock size={10} />
            [ your_post ]
          </div>
        )}

        {!isMyIssue && issue.status === 'active' && currentUser && (
          <div className="ml-auto">
            {issue.fixWitnesses?.includes(currentUser.id) ? (
              <div className="flex items-center gap-1.5 text-[0.65rem] font-mono tracking-wider border rounded-md px-2 py-1 transition-colors text-emerald-600 bg-emerald-50 border-emerald-200 cursor-not-allowed">
                <CheckCircle2 size={11} />
                [ verification_recorded ]
              </div>
            ) : (
              <button 
                onClick={async () => {
                  setIsVerifying(true);
                  await submitProofOfFix(issue.id, currentUser!.id);
                  setIsVerifying(false);
                }}
                disabled={isVerifying}
                className={`flex items-center gap-1.5 text-[0.65rem] font-mono tracking-wider border rounded-md px-2 py-1 transition-all text-white bg-emerald-500 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.5)] ${isVerifying ? 'opacity-70 cursor-wait' : 'hover:bg-emerald-600 cursor-pointer'}`}
              >
                {isVerifying ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                [ verify_fix : {issue.fixWitnesses?.length || 0}/5 ]
              </button>
            )}
          </div>
        )}


        {issue.status === 'resolved' && (
          <div className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-green-600">
            <CheckCheck size={14} />
            Resolved
          </div>
        )}
      </div>

      {/* Instagram Style Comments */}
      {showComments && (
        <div className="pt-3 border-t border-civic-border/50 flex flex-col gap-2">
          {issue.comments.map(comment => {
            const cAuthor = users.find(u => u.id === comment.userId);
            return (
              <div key={comment.id} className="flex gap-2 items-start group">
                <img 
                  src={cAuthor?.avatar} 
                  alt={cAuthor?.name} 
                  onClick={() => cAuthor && window.dispatchEvent(new CustomEvent('open-profile', { detail: cAuthor.id }))}
                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity" 
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span 
                      onClick={() => cAuthor && window.dispatchEvent(new CustomEvent('open-profile', { detail: cAuthor.id }))}
                      className="font-sans font-bold text-[0.8rem] text-civic-ink cursor-pointer hover:underline"
                    >
                      {cAuthor?.handle || cAuthor?.name}
                    </span>
                    <span className="font-sans text-[0.8rem] text-civic-ink/90">{comment.text}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-sans text-[0.65rem] text-civic-muted font-medium">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</span>
                    <button className="font-sans text-[0.65rem] text-civic-muted font-semibold hover:text-civic-ink opacity-0 group-hover:opacity-100 transition-opacity">Reply</button>
                  </div>
                </div>
                <button className="text-civic-muted/50 hover:text-red-400 mt-1 transition-colors">
                  <Heart size={10} />
                </button>
              </div>
            );
          })}

          <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center mt-2">
            <img src={currentUser?.avatar} alt="You" className="w-7 h-7 rounded-full object-cover shrink-0" />
            <div className="flex-1 relative">
              <input
                type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-transparent font-sans text-[0.85rem] text-civic-ink placeholder-civic-muted/70 outline-none py-1.5"
              />
              {commentText.trim() && (
                <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 font-sans font-semibold text-sm text-civic-accent hover:text-civic-ink transition-colors">
                  Post
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

export default function CommunityFeed() {
  const { nearbyIssues: issues, users, currentUser, userLocation, setActiveProfileId, setCurrentView } = useAppContext();
  const [filter, setFilter] = useState<FilterMode>('all');

  const topUsers = useMemo(() => [...users]
    .filter(u => {
      if (!userLocation || !u.lastKnownLocation) return false;
      return distanceKm(userLocation.lat, userLocation.lng, u.lastKnownLocation.lat, u.lastKnownLocation.lng) <= 10;
    })
    .sort((a, b) => (b.capturedBP || 0) - (a.capturedBP || 0))
    .slice(0, 5), [users, userLocation]);

  const openProfile = (userId: string) => {
    setActiveProfileId(userId);
    setCurrentView('public-profile');
  };

  const filteredIssues = useMemo(() => {
    let base = issues.filter(issue => {
      if (issue.status === 'moderated_fake') return false;
      if (!userLocation) return true;
      return distanceKm(userLocation.lat, userLocation.lng, issue.lat, issue.lng) <= 10;
    });
    if (filter === 'critical') return base.filter(i => i.severityScore >= 7 && i.status === 'active');
    if (filter === 'trending') return [...base].sort((a, b) => b.verificationUpvotes - a.verificationUpvotes);
    if (filter === 'nearby' && userLocation) return [...base].sort((a, b) => distanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) - distanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng));
    return base;
  }, [issues, filter, userLocation]);

  const criticalCount = issues.filter(i => i.severityScore >= 7 && i.status === 'active').length;

  const FILTERS: { id: FilterMode; label: string; icon: any }[] = [
    { id: 'all', label: 'All', icon: null },
    { id: 'critical', label: `Critical${criticalCount > 0 ? ` (${criticalCount})` : ''}`, icon: Flame },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'nearby', label: 'Nearest', icon: MapPin },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col border-x border-civic-border bg-civic-surface overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-civic-border sticky top-0 bg-civic-surface/95 backdrop-blur z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-serif text-[1.6rem] font-bold text-civic-ink leading-none">Community Feed</h2>
            <p className="font-mono text-[0.6rem] uppercase tracking-widest text-civic-muted mt-1">
              {userLocation ? 'Local · 10km radius' : 'All reports'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[0.6rem] uppercase tracking-wider text-civic-muted">Live</span>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all ${
                filter === f.id
                  ? f.id === 'critical'
                    ? 'bg-red-500 text-white border-red-500 shadow-sm'
                    : 'bg-civic-ink text-white border-civic-ink'
                  : 'border-civic-border text-civic-muted hover:border-civic-ink hover:text-civic-ink bg-transparent'
              }`}
            >
              {f.icon && <f.icon size={10} />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Hall of Heroes */}
        {topUsers.length > 0 && (
          <div className="border-b border-civic-border p-5 bg-gradient-to-br from-amber-50/60 to-civic-bg">
            <div className="flex items-center gap-2 mb-4">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <h3 className="font-mono text-[0.6rem] uppercase tracking-wider text-civic-muted">Leader board · Your Area</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-1 custom-scrollbar">
              {topUsers.map((u, i) => (
                <div 
                  key={u.id} 
                  onClick={() => openProfile(u.id)}
                  className="flex flex-col items-center shrink-0 w-[72px] text-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="relative">
                    <img src={u.avatar} alt={u.name} className={`w-11 h-11 rounded-full object-cover border-2 border-white shadow-md ${u.activeCosmetics?.avatarBorder || ''}`} />
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white font-mono text-[0.45rem] font-bold flex items-center justify-center border-2 border-white shadow-sm ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700/70'
                    }`}>#{i+1}</div>
                  </div>
                  <div className="font-sans text-[0.68rem] font-semibold text-civic-ink truncate w-full">{u.name.split(' ')[0]}</div>
                  <div className="font-mono text-[0.55rem] font-bold text-civic-ink dark:text-white">{(u.capturedBP||0).toLocaleString()} BP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        {filteredIssues.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-civic-muted">
            <Filter size={28} strokeWidth={1.5} className="mb-3 opacity-30" />
            <p className="font-sans text-base font-medium">No issues match this filter</p>
            <button onClick={() => setFilter('all')} className="mt-3 font-mono text-xs uppercase tracking-wider text-civic-accent hover:underline">
              Show all
            </button>
          </div>
        ) : (
          filteredIssues.map(issue => <Post key={issue.id} issue={issue} userLocation={userLocation} />)
        )}
      </div>
    </div>
  );
}
