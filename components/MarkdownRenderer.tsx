
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  return (
    <div className="space-y-6 pb-20">
      {lines.map((line, index) => {
        // 제목
        if (line.startsWith('###')) {
          const title = line.replace('###', '').trim();
          const topMatch = title.match(/\[TOP \d+\]/);
          const topBadge = topMatch ? topMatch[0] : null;
          const namePart = title.replace(/\[TOP \d+\]/g, '').trim();
          
          return (
            <div key={index} className="mt-12 mb-4 animate-fade-in">
              {topBadge && (
                <span className="inline-block px-2 py-0.5 bg-red-600 text-white text-[10px] font-black rounded mb-2 tracking-tighter shadow-sm">
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

        // 메뉴
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

        // 사진 검색
        if (line.includes('[사진검색키워드:')) {
          const keyword = line.match(/\[사진검색키워드:\s*(.*?)\]/)?.[1] || "";
          const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`;
          return (
            <div key={index} className="mb-6">
              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="group block aspect-video bg-slate-100 rounded-2xl overflow-hidden relative border-2 border-dashed border-slate-300 hover:border-red-400 transition-all">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-red-500">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="text-sm font-black">📸 {keyword.split(' ')[0]} 사진 보기</span>
                </div>
              </a>
            </div>
          );
        }

        // 꿀팁
        if (line.startsWith('💡')) {
          return (
            <div key={index} className="bg-white border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm mb-4 border border-slate-200">
              <p className="text-slate-700 text-sm leading-relaxed">
                <span className="font-black text-blue-600 mr-2 text-[10px] tracking-wider block mb-1">KIM'S TIP</span>
                {line.replace('💡', '').replace('김반장 꿀팁:', '').replace('설명:', '').trim()}
              </p>
            </div>
          );
        }

        // 지도 (가장 중요한 부분)
        if (line.includes('📍')) {
          const urlMatch = line.match(/(https?:\/\/[^\s\)]+)/);
          const rawUrl = urlMatch ? urlMatch[0] : '';
          if (!rawUrl) return null;

          // 길찾기 최적화 URL (PC/모바일 공용)
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(rawUrl)}`;
          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(rawUrl)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

          return (
            <div key={index} className="space-y-3 pt-2 pb-10 border-b border-slate-100 mb-10 last:border-0">
              {/* 지도 미리보기 */}
              <div className="w-full h-48 bg-slate-200 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight={0} 
                  marginWidth={0} 
                  src={embedUrl}
                ></iframe>
              </div>
              
              {/* 길찾기 버튼 */}
              <div className="flex gap-2">
                <a 
                  href={rawUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl text-sm font-black hover:bg-slate-50 transition-all active:scale-95"
                >
                  위치상세
                </a>
                <a 
                  href={directionsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-[2] flex items-center justify-center px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-all shadow-lg active:scale-95 group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  </svg>
                  Google Maps 길찾기
                </a>
              </div>
            </div>
          );
        }

        // 예산
        if (line.startsWith('💰')) {
          return (
            <div key={index} className="text-slate-500 text-xs font-medium mb-3 flex items-center bg-slate-50 px-3 py-1.5 rounded-lg w-fit">
              <span className="mr-2">💵</span> {line.replace('💰', '').trim()}
            </div>
          );
        }

        return <p key={index} className="text-slate-600 leading-relaxed mb-4 text-sm md:text-base">{line}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;
