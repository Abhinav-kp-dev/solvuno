import React, { useEffect, useState } from 'react';
import { Zap, X, RefreshCw, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function DailyBriefBanner() {
  const { aiGeneratedDailyBrief, syncAutonomousDailyBrief, issues } = useAppContext();
  const [visible, setVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (issues.length > 0) syncAutonomousDailyBrief();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncAutonomousDailyBrief();
    setRefreshing(false);
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-civic-ink to-[#1e2430] rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 80% 50%, #1a6b3a 0%, transparent 60%)`
      }} />
      <div className="w-8 h-8 rounded-xl bg-civic-accent/20 flex items-center justify-center shrink-0 relative z-10">
        <Zap size={15} className="text-civic-accent fill-civic-accent" />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <div className="font-mono text-[0.55rem] uppercase tracking-widest text-white/40 mb-1">AI Daily Brief</div>
        <p className="font-sans text-xs text-white/70 leading-relaxed line-clamp-2">{aiGeneratedDailyBrief}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 relative z-10">
        <button onClick={handleRefresh} disabled={refreshing}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40">
          {refreshing ? <Loader2 size={12} className="text-white animate-spin" /> : <RefreshCw size={12} className="text-white/60" />}
        </button>
        <button onClick={() => setVisible(false)}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={12} className="text-white/60" />
        </button>
      </div>
    </div>
  );
}
