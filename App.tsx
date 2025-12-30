
import React, { useState, useCallback, useRef } from 'react';
import { AppState, GroundingSource, LatLng } from './types';
import { getTravelGuideStream } from './services/geminiService';
import LoadingView from './components/LoadingView';
import ContentDisplay from './components/ContentDisplay';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    query: '',
    loading: false,
    result: null,
    error: null,
    userLocation: null,
  });
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<GroundingSource[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent, overrideQuery?: string, latLngOverride?: LatLng) => {
    if (e) e.preventDefault();
    const queryToUse = (overrideQuery || state.query).trim();
    
    if (!queryToUse && !latLngOverride) return;

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      result: null, 
      query: queryToUse || (latLngOverride ? '내 주변' : ''),
      userLocation: latLngOverride || null
    }));
    setStreamingContent('');
    setStreamingSources([]);
    
    try {
      await getTravelGuideStream(
        queryToUse, 
        latLngOverride || null,
        (text) => setStreamingContent(text),
        (sources) => setStreamingSources(prev => {
          const newSources = [...prev];
          sources.forEach(s => {
            const uri = (s as any).web?.uri || (s as any).maps?.uri;
            if (uri && !newSources.some(ns => ((ns as any).web?.uri || (ns as any).maps?.uri) === uri)) {
              newSources.push(s);
            }
          });
          return newSources;
        })
      );
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (err: any) {
      console.error("Search Error:", err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: err.message || "네트워크 연결이 원활하지 않습니다."
      }));
    }
  }, [state.query]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "GPS 기능을 지원하지 않는 기기입니다." }));
      return;
    }
    setState(prev => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LatLng = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        handleSearch(undefined, "", coords);
      },
      (error) => {
        setState(prev => ({ ...prev, loading: false, error: "위치 정보를 가져올 수 없습니다. GPS 권한을 확인해 주세요." }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRetry = () => {
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden selection:bg-red-100 selection:text-red-600">
      {/* 프리미엄 헤더 */}
      <header className="glass-header text-white pt-16 pb-32 px-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="text-[20rem] font-black absolute -bottom-20 -right-20 leading-none">HK</div>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] md:text-xs font-black mb-6 backdrop-blur-md border border-white/30 uppercase tracking-[0.3em]">
            20 Years Expertise • AI Analysis
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl tracking-tighter">
            홍콩 김반장 <span className="text-amber-400">🇭🇰</span>
          </h1>
          <p className="text-base md:text-xl opacity-90 font-bold max-w-lg leading-relaxed">
            "어이, 홍콩 찐맛집 찾으러 오셨나?<br/>김반장이 데이터로 싹 정리해줄게!"
          </p>
        </div>
      </header>

      {/* 검색 바 스테이션 */}
      <div className="sticky top-0 z-50 px-4 -mt-10 mb-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <form onSubmit={handleSearch} className="relative flex items-center group">
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
              placeholder="지역이나 식당을 입력하세요"
              className="w-full px-8 py-6 rounded-[2.5rem] shadow-2xl border-4 border-white focus:border-red-500 focus:ring-0 outline-none text-xl pr-20 bg-white transition-all placeholder:text-slate-300 font-bold"
            />
            <button
              type="submit"
              disabled={state.loading}
              className="absolute right-4 p-4 bg-red-600 text-white rounded-full hover:bg-slate-900 transition-all active:scale-90 disabled:opacity-50 shadow-lg"
            >
              {state.loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              )}
            </button>
          </form>
          
          <button
            onClick={handleCurrentLocation}
            disabled={state.loading}
            className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-2xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            현지 GPS 기반 내 주변 맛집 스캔
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 pb-24">
        {!state.loading && !streamingContent && !state.error && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-8xl mb-10 transform hover:rotate-12 transition-transform cursor-default">🥟</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">어디가 궁금하신가?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
              {['침사추이', '센트럴', '몽콕', '코즈웨이베이', '완차이', '소호'].map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSearch(undefined, tag)}
                  className="px-6 py-6 bg-white rounded-3xl text-slate-800 font-black border-2 border-slate-100 hover:border-red-500 hover:text-red-600 hover:shadow-2xl hover:shadow-red-500/10 transition-all active:scale-95 text-base shadow-sm"
                >
                  🏮 {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-white border-4 border-red-50 rounded-[3rem] p-16 text-center shadow-2xl animate-fade-in mt-10">
            <div className="text-7xl mb-8">🥘</div>
            <div className="text-slate-900 font-black text-3xl mb-4">어이쿠, 통신 상태가 별로네!</div>
            <p className="text-slate-500 mb-12 font-bold text-lg leading-relaxed">{state.error}</p>
            <button 
              onClick={handleRetry}
              className="px-16 py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-red-200 active:scale-95"
            >
              다시 연결 시도
            </button>
          </div>
        )}

        {state.loading && !streamingContent && <LoadingView />}

        {streamingContent && (
          <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-8 md:p-16 animate-fade-in overflow-hidden" ref={scrollRef}>
            <div className="flex items-center gap-6 mb-12 pb-10 border-b-4 border-slate-50">
              <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl text-white transform -rotate-6">👨‍✈️</div>
              <div>
                <h3 className="font-black text-slate-900 text-2xl md:text-3xl tracking-tighter leading-tight">
                  {state.userLocation ? "📍 실시간 내 주변 리포트" : `🏙️ ${state.query} 정밀 분석 완료`}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-xs text-green-600 font-black uppercase tracking-widest">Live Data Grounding Active</p>
                </div>
              </div>
            </div>
            
            <ContentDisplay content={streamingContent} />
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 opacity-50"></div>
        <p className="font-black tracking-[0.4em] text-slate-400 uppercase mb-6 text-sm">Hong Kong Kim Ban Jang • 2025</p>
        <p className="max-w-xl mx-auto text-xs leading-relaxed opacity-40 font-bold mb-8">
          이 데이터는 김반장의 20년 현지 경험과 실시간 구글 AI 분석을 결합하여 생성되었습니다.<br/>방문 전 영업 시간과 예약 여부를 꼭 확인하십시오.
        </p>
        <div className="flex justify-center gap-6 opacity-30">
          <span>🇭🇰</span><span>🍜</span><span>🥟</span><span>🏙️</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
