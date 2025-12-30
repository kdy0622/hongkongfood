
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
    const queryToUse = overrideQuery || state.query;
    
    if (!queryToUse.trim() && !latLngOverride) return;

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      result: null, 
      query: queryToUse || (latLngOverride ? '현재 위치 주변' : ''),
      userLocation: latLngOverride || null
    }));
    setStreamingContent('');
    setStreamingSources([]);
    
    try {
      await getTravelGuideStream(
        queryToUse, 
        latLngOverride || null,
        (text) => {
          setStreamingContent(text);
        },
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
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        result: { content: '', sources: [] }
      }));
    } catch (err: any) {
      console.error("Search Handler Error:", err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: typeof err === 'string' ? err : (err.message || "알 수 없는 오류가 발생했습니다.")
      }));
    }
  }, [state.query]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "이 브라우저에서는 GPS 기능을 지원하지 않습니다." }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LatLng = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        handleSearch(undefined, "현재 내 주변", coords);
      },
      (error) => {
        let errorMessage = "위치 정보를 가져올 수 없습니다.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "위치 정보 접근 권한이 거부되었습니다.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "위치 신호가 약합니다. 실외에서 시도해 주세요.";
            break;
          case error.TIMEOUT:
            errorMessage = "위치 확인 시간이 초과되었습니다.";
            break;
        }
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      },
      options
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      {/* 헤더 섹션 */}
      <header className="glass-header text-white pt-12 pb-24 px-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="text-[15rem] font-black absolute -bottom-10 -right-10 leading-none">HK</div>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] md:text-xs font-bold mb-6 backdrop-blur-md border border-white/30 uppercase tracking-widest">
            Expert Data Analytics • Real-time Location
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-2xl tracking-tighter">
            홍콩 김반장 <span className="text-amber-400">🇭🇰</span>
          </h1>
          <p className="text-sm md:text-lg opacity-90 font-bold max-w-md leading-relaxed">
            "거~ 근처 맛집 찾으세요? 김반장이 지금 바로<br/>한국인 찐맛집 TOP 10 싹 훑어드립니다!"
          </p>
        </div>
      </header>

      {/* 검색 바 영역 (스티키) */}
      <div className="sticky top-0 z-50 px-4 -mt-8 mb-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
              placeholder="지역명(예: 침사추이) 또는 메뉴 검색"
              className="w-full px-7 py-5 rounded-[2rem] shadow-2xl border-4 border-white focus:border-red-500 focus:ring-0 outline-none text-lg pr-16 bg-white transition-all placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              disabled={state.loading}
              className="absolute right-3 p-3.5 bg-red-600 text-white rounded-full hover:bg-slate-900 transition-all active:scale-90 disabled:opacity-50 shadow-lg"
            >
              {state.loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              )}
            </button>
          </form>
          
          <button
            onClick={handleCurrentLocation}
            disabled={state.loading}
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            📍 내 주변 찐맛집 지금 찾기 (GPS)
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 pb-20 overflow-visible">
        {/* 초기 화면 */}
        {!state.loading && !streamingContent && !state.error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-7xl mb-8 transform hover:scale-110 transition-transform cursor-default">🍜</div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">어디로 모실까요?</h2>
            <p className="text-slate-500 font-bold mb-12">GPS를 켜거나 아래 지역을 선택해 보세요.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['침사추이', '센트럴', '몽콕', '코즈웨이베이', '완차이', '야우마테이'].map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSearch(undefined, tag)}
                  className="px-6 py-5 bg-white rounded-2xl text-slate-800 font-black border border-slate-200 hover:border-red-500 hover:text-red-600 hover:shadow-xl hover:shadow-red-100 transition-all active:scale-95 text-sm"
                >
                  🏙️ {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 에러 화면 */}
        {state.error && (
          <div className="bg-white border border-red-100 rounded-[2.5rem] p-12 text-center shadow-2xl animate-fade-in mt-10">
            <div className="text-6xl mb-8">🫖</div>
            <div className="text-slate-900 font-black text-2xl mb-4">앗! 김반장 레이더에 문제가 생겼어요.</div>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">{state.error}</p>
            <button 
              onClick={() => handleSearch()}
              className="px-12 py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-xl shadow-red-200 active:scale-95"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {/* 로딩 화면 */}
        {state.loading && !streamingContent && <LoadingView />}

        {/* 콘텐츠 표시 */}
        {streamingContent && (
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-6 md:p-12 transition-all duration-700 overflow-visible animate-fade-in" ref={scrollRef}>
            <div className="flex items-center gap-5 mb-10 pb-8 border-b border-slate-100">
              <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-red-100 shrink-0">👨‍✈️</div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">
                  {state.userLocation ? "📍 내 주변 실시간 리포트" : `🏙️ ${state.query} 실시간 리포트`}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[11px] text-green-600 font-black uppercase tracking-widest">분석 완료 중...</p>
                </div>
              </div>
            </div>
            
            <ContentDisplay content={streamingContent} />
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-20 px-6 text-center shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-4 mb-8">
            <div className="w-12 h-1.5 bg-red-600 rounded-full"></div>
            <div className="w-12 h-1.5 bg-amber-500 rounded-full"></div>
            <div className="w-12 h-1.5 bg-white opacity-20 rounded-full"></div>
          </div>
          <p className="font-black tracking-[0.2em] text-slate-300 uppercase mb-4">Hong Kong Kim Ban Jang • AI Guide 2025</p>
          <p className="max-w-md mx-auto text-[11px] leading-relaxed opacity-60 font-medium">
            이 가이드는 실시간 구글 검색, 구글 맵, 유튜브 데이터를 분석하여 한국인 선호도를 반영해 제공됩니다. 현지 사정에 따라 내용이 다를 수 있으니 구글 맵을 최종 확인하세요.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
