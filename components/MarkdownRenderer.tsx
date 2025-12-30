
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  return (
    <div className="space-y-6 pb-20">
      {lines.map((line, index) => {
        if (line.includes('[SECTION:')) return null;

        // 장소 제목
        if (line.startsWith('###')) {
          const title = line.replace('###', '').trim();
          const namePart = title.replace(/\[TOP \d+\]/g, '').trim();
          const topBadge = title.match(/\[TOP \d+\]/)?.[0];
          
          return (
            <div key={index} className="mt-14 mb-6 animate-fade-in">
              {topBadge && (
                <span className="inline-block px-2.5 py-1 bg-red-600 text-white text-[10px] font-black rounded-md mb-3 shadow-sm uppercase tracking-tighter">
                  {topBadge}
                </span>
              )}
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {namePart}
              </h3>
            </div>
          );
        }
        
        // 평점
        if (line.startsWith('⭐')) {
          return (
            <div key={index} className="inline-flex items-center px-4 py-2 bg-amber-50 text-amber-700 rounded-2xl text-xs font-black border border-amber-100 shadow-sm mb-2">
              {line}
            </div>
          );
        }

        // 전체 예산
        if (line.startsWith('💰')) {
          return (
            <div key={index} className="text-slate-500 text-sm font-bold flex items-center mb-6">
              <span className="mr-2 text-lg">💵</span> {line.replace('💰', '').trim()}
            </div>
          );
        }

        // 메뉴 상세 카드 (프롬프트에서 약속된 [- [이름 / 가격 / 설명]] 형식 파싱)
        if (line.startsWith('- [') && line.includes('/')) {
          const contentInside = line.match(/\[(.*?)\]/)?.[1];
          if (!contentInside) return null;
          
          const parts = contentInside.split('/').map(p => p.trim());
          if (parts.length >= 2) {
            const [name, price, desc] = parts;
            return (
              <div key={index} className="bg-white border border-slate-100 rounded-2xl p-5 mb-3 shadow-sm hover:shadow-md transition-all border-l-4 border-l-red-500 group">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-black text-slate-800 text-base group-hover:text-red-600 transition-colors">{name}</span>
                  <span className="text-red-600 font-black text-[11px] shrink-0 ml-4 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">{price}</span>
                </div>
                {desc && (
                  <p className="text-slate-500 text-xs leading-relaxed font-medium italic">
                    "{desc}"
                  </p>
                )}
              </div>
            );
          }
        }

        // 사진 검색 버튼 (식당 / 메뉴 / 장소 분기 처리)
        if (line.includes('사진:')) {
          const isMenu = line.includes('메뉴사진');
          const isPlace = line.includes('장소사진');
          const keywordMatch = line.match(/:\s*(.*?)\]/);
          const keyword = keywordMatch ? keywordMatch[1] : "홍콩 맛집";
          
          const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`;
          
          return (
            <div key={index} className="inline-block mr-2 mb-4">
              <a 
                href={searchUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black transition-all active:scale-95 shadow-md border ${
                  isMenu 
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-200' 
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-red-600'
                }`}
              >
                {isMenu ? '🍱 메뉴 실물 확인' : (isPlace ? '📸 장소 현장 사진' : '🏢 식당 내부 사진')} 보기
              </a>
            </div>
          );
        }

        // 꿀팁
        if (line.startsWith('💡')) {
          return (
            <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-2xl shadow-sm my-6">
              <p className="text-blue-900 text-sm leading-relaxed">
                <span className="font-black block text-[10px] text-blue-600 uppercase mb-2 tracking-widest">Guide's Insight</span>
                {line.replace('💡', '').replace('김반장 꿀팁:', '').replace('설명:', '').trim()}
              </p>
            </div>
          );
        }

        // 지도 렌더링 및 길찾기 버튼
        if (line.includes('📍')) {
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/g);
          const rawUrl = urlMatch ? urlMatch[0] : '';
          if (!rawUrl) return null;

          const searchParams = new URL(rawUrl).searchParams;
          const query = searchParams.get('query') || searchParams.get('q') || 'Hong Kong';
          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

          return (
            <div key={index} className="space-y-4 pt-6 pb-12 border-b border-slate-100 mb-10 last:border-0">
              <div className="w-full h-72 bg-slate-200 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200 relative">
                <iframe 
                  width="100%" height="100%" frameBorder="0" 
                  src={embedUrl} title="Google Maps"
                  className="grayscale-[10%] hover:grayscale-0 transition-all duration-700"
                ></iframe>
                <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-slate-800 shadow-sm">
                  GOOGLE MAPS LIVE PREVIEW
                </div>
              </div>
              <div className="flex gap-3">
                <a 
                  href={directionsUrl} target="_blank" rel="noopener noreferrer" 
                  className="flex-[3] flex items-center justify-center gap-2 py-5 bg-slate-900 text-white rounded-[1.8rem] text-sm font-black hover:bg-red-600 transition-all shadow-xl active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  실시간 경로 찾기
                </a>
                <a 
                  href={rawUrl} target="_blank" rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center bg-white border-2 border-slate-200 text-slate-800 rounded-[1.8rem] hover:bg-slate-50 transition-all active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </div>
            </div>
          );
        }

        return (
          <p key={index} className="text-slate-600 leading-relaxed text-sm md:text-base font-medium mb-2">
            {line}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
