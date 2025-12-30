
import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface ContentDisplayProps {
  content: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content }) => {
  const [activeTab, setActiveTab] = useState<'맛집' | '가볼만한곳' | '꿀팁'>('맛집');

  // Parse sections
  const sections = {
    맛집: content.split('[SECTION: 맛집]')[1]?.split('[SECTION:')[0] || '',
    가볼만한곳: content.split('[SECTION: 가볼만한곳]')[1]?.split('[SECTION:')[0] || '',
    꿀팁: content.split('[SECTION: 꿀팁]')[1]?.split('[SECTION:')[0] || '',
  };

  // Switch tab automatically if content for active tab is empty but others have content
  useEffect(() => {
    if (sections.맛집.length > 10) return;
    if (sections.가볼만한곳.length > 10 && activeTab === '맛집') {
      // Don't auto-switch, let user click, but show indicators
    }
  }, [content]);

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
    </div>
  );
};

export default ContentDisplay;
