
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  return (
    <div className="space-y-6 pb-20">
      {lines.map((line, index) => {
        // 섹션 제목 (맛집, 가볼만한곳 등)
        if (line.includes('[SECTION:')) return null;

        // 개별 장소 제목
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
        
        // 평점 및 예산
        if (line.startsWith('⭐') || line.startsWith('💰')) {
          return (
            <div key={index} className="text-slate-600 text-sm font-bold flex items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-fit mb-2">
              {line}
            </div>
          );
        }

        // 메뉴 (태그 형태)
        if (line.startsWith('🍴')) {
          const menuList = line.replace('🍴 메뉴:', '').replace('🍴', '').split(',').map(m => m.trim());
          return (
            <div key={index} className="flex flex-wrap gap-2 my-4">
              {menuList.map((menu, i) => (
                <span key={i} className="px-3 py-1.5 bg-white text-red-600 text-[11px] font-black rounded-lg border border-red-100 shadow-sm">
                  #{menu}
                </span>
              ))}
            </div>
          );
        }

        // 사진 검색 버튼
        if (line.includes('[사진검색키워드:')) {
          const keyword = line.match(/\[사진검색키워드:\s*(.*?)\]/)?.[1] || "홍콩 맛집";
          const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`;
          return (
            <div key={index} className="mb-4">
              <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                현장 사진 미리보기
              </a>
            </div>
          );
        }

        // 꿀팁/설명
        if (line.startsWith('💡')) {
          return (
            <div key={index} className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl shadow-sm mb-4">
              <p className="text-amber-900 text-sm leading-relaxed">
                <span className="font-black block text-[10px] text-amber-600 uppercase mb-1">Kim's Advice</span>
                {line.replace('💡', '').replace('김반장 꿀팁:', '').replace('설명:', '').trim()}
              </p>
            </div>
          );
        }

        // 지도 (핵심 기능)
        if (line.includes('📍')) {
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/g);
          const rawUrl = urlMatch ? urlMatch[0] : '';
          
          if (!rawUrl) return null;

          // Iframe용 임베드 주소 추출
          const searchParams = new URL(rawUrl).searchParams;
          const query = searchParams.get('query') || searchParams.get('q') || '';
          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
          
          // 모바일/PC 통합 길찾기 링크
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

          return (
            <div key={index} className="space-y-4 pt-4 pb-12 border-b border-slate-100 mb-10 last:border-0">
              {/* 지도 카드 */}
              <div className="w-full h-56 bg-slate-200 rounded-[2rem] overflow-hidden shadow-lg border border-slate-200 relative group">
                <iframe 
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  src={embedUrl}
                  title="Google Maps"
                  className="grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                ></iframe>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-slate-800 shadow-sm pointer-events-none">
                  GOOGLE MAPS LIVE
                </div>
              </div>
              
              {/* 길찾기 액션 버튼 */}
              <div className="flex gap-2">
                <a 
                  href={directionsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-red-600 transition-all shadow-xl active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  지금 길찾기 (Navi)
                </a>
                <a 
                  href={rawUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-4 bg-white border-2 border-slate-200 text-slate-800 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </div>
            </div>
          );
        }

        // 일반 텍스트
        return (
          <p key={index} className="text-slate-600 leading-relaxed text-sm md:text-base font-medium">
            {line}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
