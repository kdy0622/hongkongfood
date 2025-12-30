
// ContentDisplay.tsx: Component for displaying travel report content with tabbed navigation and verified sources.

import React, { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { GroundingSource } from '../types';

interface ContentDisplayProps {
  content: string;
  sources: GroundingSource[];
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, sources }) => {
  const [activeTab, setActiveTab] = useState<'맛집' | '가볼만한곳' | '꿀팁'>('맛집');

  // Parse sections
  const sections = {
    맛집: content.split('[SECTION: 맛집]')[1]?.split('[SECTION:')[0] || '',
    가볼만한곳: content.split('[SECTION: 가볼만한곳]')[1]?.split('[SECTION:')[0] || '',
    꿀팁: content.split('[SECTION: 꿀팁]')[1]?.split('[SECTION:')[0] || '',
  };

  const tabs = [
    { id: '맛집', label: '🍽️ 맛집보기', color: 'bg-red-600' },
    { id: '가볼만한곳', label: '📸 가볼만한곳', color: 'bg-amber-500' },
    { id: '꿀팁', label: '💡 김반장 꿀팁', color: 'bg-blue-500' },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6 sticky top-0 z-10 shadow-sm border border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 text-sm font-bold rounded-lg transition-all duration-200 ${
              activeTab === tab.id 
                ? `${tab.color} text-white shadow-md transform scale-[1.02]` 
                : 'text-slate-500 hover:bg-white hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[300px] animate-fade-in">
        {sections[activeTab].trim() ? (
          <MarkdownRenderer content={sections[activeTab]} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="text-4xl mb-4">✍️</div>
            <p>김반장이 내용을 정리하고 있습니다...</p>
          </div>
        )}
      </div>

      {/* Grounding Sources - MANDATORY: Extract and list URLs from groundingChunks as per Gemini API rules */}
      {sources.length > 0 && (
        <div className="mt-12 pt-8 border-t-2 border-slate-50 animate-in slide-in-from-bottom-4 duration-700">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
            <span className="w-4 h-px bg-slate-200"></span>
            AI Verified Sources & Grounding Data
          </h4>
          <div className="flex flex-wrap gap-2">
            {sources.map((source, idx) => {
              const data = source.web || source.maps;
              if (!data) return null;
              return (
                <a
                  key={idx}
                  href={data.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:border-red-200 hover:text-red-600 hover:shadow-sm transition-all group"
                >
                  <span className="opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                    {source.web ? '🌐' : '📍'}
                  </span>
                  {data.title || '출처 확인'}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentDisplay;
