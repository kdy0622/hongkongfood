
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple markdown-to-JSX parser for the specific structure requested
  const lines = content.split('\n');
  
  return (
    <div className="prose prose-slate max-w-none space-y-6 pb-20">
      {lines.map((line, index) => {
        if (line.startsWith('🇭🇰')) {
          return <h1 key={index} className="text-2xl md:text-3xl font-bold text-red-700 border-b-2 border-red-100 pb-2 mt-8">{line}</h1>;
        }
        if (line.match(/^\d+\./)) {
          return <h2 key={index} className="text-xl font-bold text-slate-800 mt-10 bg-slate-100 p-3 rounded-lg border-l-4 border-red-600">{line}</h2>;
        }
        if (line.startsWith('⭐')) {
          return <p key={index} className="text-amber-600 font-semibold text-lg flex items-center">{line}</p>;
        }
        if (line.includes('[📸')) {
          const description = line.replace(/\[📸|\]/g, '').trim();
          return (
            <div key={index} className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 my-4 flex flex-col items-center justify-center text-slate-400 italic text-center">
              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {description}
            </div>
          );
        }
        if (line.startsWith('🍽️')) {
          return <div key={index} className="font-bold text-slate-700 mt-2">{line}</div>;
        }
        if (line.startsWith('💡')) {
          return <div key={index} className="bg-blue-50 p-4 rounded-lg text-slate-700 my-2 leading-relaxed border-l-4 border-blue-400">{line}</div>;
        }
        if (line.startsWith('📍')) {
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
          const text = line.replace(/(https?:\/\/[^\s]+)/, '').trim();
          return (
            <div key={index} className="mt-2">
              <a 
                href={urlMatch ? urlMatch[0] : '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                {text || 'Google Maps에서 보기'}
              </a>
            </div>
          );
        }
        if (line.startsWith('🏙️')) {
          return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-16 border-t pt-8">{line}</h2>;
        }
        if (line.trim() === '') return <div key={index} className="h-2"></div>;
        
        return <p key={index} className="text-slate-600 leading-relaxed">{line}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;
