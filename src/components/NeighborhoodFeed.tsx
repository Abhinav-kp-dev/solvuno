import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';

export default function NeighborhoodFeed() {
  const { aiGeneratedDailyBrief, syncAutonomousDailyBrief } = useAppContext();

  useEffect(() => {
    syncAutonomousDailyBrief();
  }, []); // Run once on mount

  return (
    <div className="bg-white border border-civic-border p-6 flex flex-col h-full">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[#888] mb-8">
        Neighborhood Feed
      </div>

      <div className="flex flex-col overflow-y-auto custom-scrollbar flex-1">
        <div className="prose prose-sm max-w-none font-sans text-[0.85rem] text-civic-ink leading-relaxed">
          <ReactMarkdown>{aiGeneratedDailyBrief}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
