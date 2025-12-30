
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
  
  // API 키 선택 도우미
  const fixConnection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setState(prev => ({ ...prev, error: null }));
    }
  };

  const handleSearch = useCallback(async (e?: React.FormEvent, overrideQuery?: string, latLngOverride?: LatLng) => {
    if (e) e.preventDefault();
    const queryToUse = (overrideQuery || state.query).trim();
    if (!queryToUse && !latLngOverride) return;

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      query: queryToUse || (latLngOverride ? '내 주변' : ''),
      userLocation: latLngOverride || null
    }));
    setStreamingContent('');
    setStreamingSources([]);
    
    try {
      // 검색 전 키 선택 여부 한 번 더 확인 (Gemini 3 모델 필수 사항)
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      }

      await getTravelGuideStream(
        queryToUse, 
        latLngOverride || null,
        (text) => setStreamingContent(text),
        (sources) => setStreamingSources(prev => {
          const newSources = [...prev];
          sources.forEach(s => {
            const uri = (s as any).web?.uri || (s as any).maps?.uri;
            if (uri && !newSources.some(ns => ((ns as any).web?.uri || (ns as any).maps?.uri) === uri)) {
              newSources.push(s as GroundingSource);
            }
          });
          return newSources;
        })
      );
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (err: any) {
      console.error("Search Error:", err);
      let errorMessage = "통신에 문제가 생겼습니다. 다시 시도해 주세요.";
      
      if (err.message?.includes("API key") || err.message?.includes("403") || err.message?.includes("401") || err.message?.includes("not found")) {
        errorMessage = "API 키 승인이 필요합니다. 아래 '연결 복구하기' 버튼을 눌러주세요.";
      }

      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      <header className="glass-header text-white pt-16 pb-32 px-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="text-[20rem] font-black absolute -bottom-20 -right-20 leading-none">HK</div>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl tracking-tighter">
            홍콩 김반장 <span className="text-amber-400">🇭🇰</span>
          </h1>
          <p className="text-base md:text-xl opacity-90 font-bold max-w-lg leading-relaxed">
            "20년 현지 경력과 실시간 구글 데이터의 만남!<br/>홍콩의 진짜 정보를 막힘없이 보여드립니다."
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-50 px-4 -mt-10 mb-10">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <form onSubmit={handleSearch} className="relative flex items-center group">
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
              placeholder="지역명(예: 침사추이) 또는 메뉴 검색"
              className="w-full px-8 py-6 rounded-[2.5rem] shadow-2xl border-4 border-white focus:border-red-500 focus:ring-0 outline-none text-xl bg-white font-bold"
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
            className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm shadow-2xl hover:bg-red-600 transition-all"
          >
            🗺️ 내 주변 실시간 스캔 (GPS)
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 pb-24">
        {!state.loading && !streamingContent && !state.error && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-8xl mb-10">🍜</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-12">어디로 모실까요?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {['침사추이', '센트럴', '몽콕', '코즈웨이베이', '완차이', '소호'].map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSearch(undefined, tag)}
                  className="px-6 py-6 bg-white rounded-3xl text-slate-800 font-black border-2 border-slate-100 hover:border-red-500 hover:text-red-600 shadow-sm transition-all"
                >
                  📍 {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-white border-4 border-red-50 rounded-[3rem] p-12 text-center shadow-2xl mt-10">
            <div className="text-7xl mb-8">⚠️</div>
            <p className="text-slate-800 mb-10 font-bold text-xl">{state.error}</p>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button 
                onClick={fixConnection}
                className="px-8 py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl"
              >
                연결 복구하기
              </button>
              <button 
                onClick={() => handleSearch()}
                className="px-8 py-5 bg-slate-200 text-slate-700 rounded-[2rem] font-black text-lg"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {state.loading && !streamingContent && <LoadingView />}

        {streamingContent && (
          <div className="bg-white rounded-[4rem] shadow-2xl p-8 md:p-16 animate-fade-in border border-slate-100">
            <div className="flex items-center gap-6 mb-12 pb-10 border-b-4 border-slate-50">
              <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl text-white transform -rotate-3 font-black">🇭🇰</div>
              <div>
                <h3 className="font-black text-slate-900 text-2xl md:text-3xl tracking-tighter">
                  {state.userLocation ? "📍 실시간 주변 분석 리포트" : `🏙️ ${state.query} 정밀 리포트`}
                </h3>
                <p className="text-xs text-green-600 font-black mt-2">GROUNDING ACTIVE</p>
              </div>
            </div>
            <ContentDisplay content={streamingContent} sources={streamingSources} />
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-16 px-8 text-center mt-auto">
        <p className="font-black tracking-[0.4em] uppercase mb-4 text-sm">Hong Kong Kim Ban Jang • 2025</p>
        <p className="text-xs opacity-40 font-bold">
          실시간 구글 AI 데이터를 기반으로 분석된 정보입니다.<br/>방문 전 구글 맵의 최신 영업시간을 확인하세요.
        </p>
      </footer>
    </div>
  );
};

export default App;
