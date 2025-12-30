
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  return (
    <div className="space-y-8 pb-20">
      {lines.map((line, index) => {
        if (line.includes('[SECTION:')) return null;

        // 장소 제목
        if (line.startsWith('###')) {
          const title = line.replace('###', '').trim();
          const namePart = title.replace(/\[TOP \d+\]/g, '').trim();
          const topBadge = title.match(/\[TOP \d+\]/)?.[0];
          
          return (
            <div key={index} className="mt-20 mb-8 animate-fade-in group">
              {topBadge && (
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-lg mb-4 shadow-lg uppercase tracking-widest">
                  {topBadge}
                </span>
              )}
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight group-hover:text-red-600 transition-colors">
                {namePart}
              </h3>
            </div>
          );
        }
        
        // 평점 섹션
        if (line.startsWith('⭐')) {
          return (
            <div key={index} className="flex flex-wrap gap-2 mb-4">
              <div className="inline-flex items-center px-5 py-2.5 bg-amber-50 text-amber-700 rounded-full text-xs font-black border-2 border-amber-100 shadow-sm">
                {line}
              </div>
            </div>
          );
        }

        // 예산 정보
        if (line.startsWith('💰')) {
          return (
            <div key={index} className="text-slate-500 text-sm font-black flex items-center mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <span className="mr-3 text-2xl">🧾</span> {line.replace('💰', '').trim()}
            </div>
          );
        }

        // 프리미엄 메뉴 카드
        if (line.startsWith('- [') && line.includes('/')) {
          const contentInside = line.match(/\[(.*?)\]/)?.[1];
          if (!contentInside) return null;
          
          const parts = contentInside.split('/').map(p => p.trim());
          const [name, price, desc] = parts;
          
          return (
            <div key={index} className="bg-white border-2 border-slate-100 rounded-3xl p-6 mb-4 shadow-sm hover:shadow-xl hover:border-red-100 transition-all border-l-8 border-l-red-600 group">
              <div className="flex justify-between items-start mb-3">
                <span className="font-black text-slate-800 text-lg group-hover:text-red-600 transition-colors">{name}</span>
                <span className="text-red-600 font-black text-xs shrink-0 ml-4 bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 shadow-inner">
                  {price}
                </span>
              </div>
              {desc && (
                <p className="text-slate-500 text-xs leading-relaxed font-bold opacity-80 italic">
                  " {desc} "
                </p>
              )}
            </div>
          );
        }

        // 사진 검색 버튼 (식당 / 메뉴 / 장소 고도화)
        if (line.includes('사진:')) {
          const isMenu = line.includes('메뉴사진');
          const isPlace = line.includes('장소사진');
          const keywordMatch = line.match(/:\s*(.*?)\]/);
          const keyword = keywordMatch ? keywordMatch[1] : "홍콩 맛집";
          
          const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(keyword)}`;
          
          return (
            <div key={index} className="inline-block mr-3 mb-4">
              <a 
                href={searchUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[11px] font-black transition-all active:scale-95 shadow-xl border-2 ${
                  isMenu 
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-200' 
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-red-600'
                }`}
              >
                {isMenu ? '🍛 메뉴 실제 비주얼' : (isPlace ? '📸 현장 분위기 보기' : '🏢 식당 외부/내부')} 사진 확인
              </a>
            </div>
          );
        }

        // 김반장의 통찰 (꿀팁)
        if (line.startsWith('💡')) {
          return (
            <div key={index} className="bg-blue-600 border-2 border-blue-400 p-8 rounded-[2.5rem] shadow-2xl my-10 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 text-9xl opacity-10 font-black text-white group-hover:scale-110 transition-transform">TIP</div>
              <p className="text-white text-base md:text-lg leading-relaxed relative z-10 font-bold">
                <span className="font-black block text-[11px] text-blue-200 uppercase mb-4 tracking-[0.3em]">Ban-Jang's Secret Tip</span>
                {line.replace('💡', '').replace('김반장 꿀팁:', '').replace('설명:', '').trim()}
              </p>
            </div>
          );
        }

        // 지도 및 길찾기 액션
        if (line.includes('📍')) {
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/g);
          const rawUrl = urlMatch ? urlMatch[0] : '';
          if (!rawUrl) return null;

          const searchParams = new URL(rawUrl).searchParams;
          const query = searchParams.get('query') || searchParams.get('q') || 'Hong Kong';
          const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

          return (
            <div key={index} className="space-y-6 pt-10 pb-20 border-b-2 border-slate-50 mb-16 last:border-0">
              <div className="w-full h-80 bg-slate-200 rounded-[3rem] overflow-hidden shadow-inner border-4 border-white relative group">
                <iframe 
                  width="100%" height="100%" frameBorder="0" 
                  src={embedUrl} title="Google Maps"
                  className="grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000"
                ></iframe>
                <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black text-white shadow-2xl">
                  📍 LIVE GOOGLE MAPS DATA
                </div>
              </div>
              <div className="flex gap-4">
                <a 
                  href={directionsUrl} target="_blank" rel="noopener noreferrer" 
                  className="flex-[4] flex items-center justify-center gap-3 py-6 bg-red-600 text-white rounded-[2rem] text-base font-black hover:bg-slate-900 transition-all shadow-2xl active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  지금 여기로 길찾기
                </a>
                <a 
                  href={rawUrl} target="_blank" rel="noopener noreferrer" 
                  className="flex-1 flex items-center justify-center bg-white border-4 border-slate-100 text-slate-800 rounded-[2rem] hover:bg-slate-50 transition-all active:scale-95 shadow-lg"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              </div>
            </div>
          );
        }

        return (
          <p key={index} className="text-slate-700 leading-relaxed text-base font-bold mb-4 opacity-90">
            {line}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownRenderer;
