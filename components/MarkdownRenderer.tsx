
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  return (
    <div className="space-y-6 pb-20">
      {lines.map((line, index) => {
        // 제목 (TOP N + 병기 이름)
        if (line.startsWith('###')) {
          const isTopN = line.includes('[TOP');
          const title = line.replace('###', '').trim();
          const topMatch = title.match(/\[TOP \d+\]/);
          const topBadge = topMatch ? topMatch[0] : null;
          const namePart = title.replace(/\[TOP \d+\]/g, '').trim();
          
          return (
            <div key={index} className="mt-12 mb-4 animate-fade-in">
              {topBadge && (
                <span className="inline-block px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded mb-2 uppercase tracking-tighter shadow-sm">
                  {topBadge}
                </span>
              )}
              <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-start leading-tight">
                <span className="w-1.5 h-7 bg-red-600 rounded-full mr-3 shrink-0 mt-1"></span>
                <span>{namePart}</span>
              </h3>
            </div>
          );
        }
        
        // 평점
        if (line.startsWith('⭐')) {
          return (
            <div key={index} className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold mb-2 border border-amber-100 shadow-sm">
              {line}
            </div>
          );
        }

        // 메뉴 리스트
        if (line.startsWith('🍴')) {
          const menuList = line.replace('🍴 메뉴:', '').replace('🍴', '').split(',').map(m => m.trim());
          return (
            <div key={index} className="flex flex-wrap gap-2 my-4">
              {menuList.map((menu, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                  😋 {menu}
                </span>
              ))}
            </div>
          );
        }

        // 구글 이미지 검색 버튼 및 이미지 섹션
        if (line.includes('[사진검색키워드:')) {
          const keyword = line.match(/\[사진검색키워드:\s*(.*?)\]/)?.[1] || "";
          const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`;
          
          return (
            <div key={index} className="mb-6">
              <a 
                href={searchUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all duration-300 overflow-hidden relative"
              >
                <div className="flex flex-col items-center text-slate-400 group-hover:text-red-500 transition-colors">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-sm font-black">📸 {keyword.split(' ')[0]} 사진 보기 (구글 이미지)</span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                  Click to View
                </div>
              </a>
            </div>
          );
        }

        // 꿀팁/설명 (강조 카드)
        if (line.startsWith('💡')) {
          return (
            <div key={index} className="bg-white border-l-4 border-blue-500 p-5 rounded-r-2xl shadow-sm mb-4 border-y border-r border-slate-200 group hover:shadow-md transition-shadow">
              <p className="text-slate-700 text-sm leading-relaxed">
                <span className="font-black text-blue-600 mr-2 uppercase text-[10px] tracking-wider block mb-1">Kim Ban Jang's Tip</span>
                {line.replace('💡', '').replace('김반장 꿀팁:', '').replace('설명:', '').trim()}
              </p>
            </div>
          );
        }

        // 가격/예산
        if (line.startsWith('💰')) {
          return (
            <div key={index} className="text-slate-500 text-xs font-medium mb-3 flex items-center bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
              <span className="mr-2">💵</span> {line.replace('💰', '').trim()}
            </div>
          );
        }

        // 지도 링크 (큰 버튼)
        if (line.startsWith('📍')) {
          const urlMatch = line.match(/(https?:\/\/[^\s\)]+)/);
          const url = urlMatch ? urlMatch[0] : '#';
          return (
            <div key={index} className="pt-2 pb-10 border-b border-slate-100 mb-10 last:border-0">
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-all shadow-lg active:scale-95 group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                </svg>
                Google Maps 길찾기
              </a>
            </div>
          );
        }

        // 일반 텍스트
        return <p key={index} className="text-slate-600 leading-relaxed mb-4 text-sm md:text-base">{line}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;
