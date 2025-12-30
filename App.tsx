
// App.tsx: Main component managing application state, search logic, and API key selection.

import React, { useState, useCallback, useRef } from 'react';
import { AppState, GroundingSource, LatLng } from './types';
import { getTravelGuideStream } from './services/geminiService';
import LoadingView from './components/LoadingView';
import ContentDisplay from './components/ContentDisplay';

// Extend window for aistudio tools. 
// Removed manual declaration of window.aistudio to resolve conflict with environment-provided types.

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

  const handleApiKeySetup = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setState(prev => ({ ...prev, error: null }));
      } else {
        setState(prev => ({ ...prev, error: "API 키 설정 도구를 찾을 수 없습니다." }));
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
      setState(prev => ({ ...prev, error: "API 키 선택 중 오류가 발생했습니다." }));
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
      result: null, 
      query: queryToUse || (latLngOverride ? '내 주변' : ''),
      userLocation: latLngOverride || null
    }));
    setStreamingContent('');
    setStreamingSources([]);
    
    try {
      // Mandatory API Key check for Gemini 3 models as per aistudio guidelines.
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // After openSelectKey, proceed immediately as the key is injected into process.env.API_KEY
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
      console.error("Search Fail Detail:", err);
      let errorMessage = err.message || "연결 오류가 발생했습니다.";
      
      // Specifically handle common API key or model errors
      if (errorMessage.includes("API key") || 
          errorMessage.includes("403") || 
          errorMessage.includes("401") || 
          errorMessage.includes("Requested entity was not found")) {
        errorMessage = "API 키가 유효하지 않거나 설정되지 않았습니다. 하단의 'API 키 재설정' 버튼을 눌러 승인해 주세요.";
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden selection:bg-red-100 selection:text-red-600">
      <header className="glass-header text-white pt-16 pb-32 px-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="text-[20rem] font-black absolute -bottom-20 -right-20 leading-none">HK</div>
        </div>
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] md:text-xs font-black mb-6 backdrop-blur-md border border-white/30 uppercase tracking-[0.3em]">
            Verified Local Grounding Engine
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl tracking-tighter">
            홍콩 김반장 <span className="text-amber-400">🇭🇰</span>
          </h1>
          <p className="text-base md:text-xl opacity-90 font-bold max-w-lg leading-relaxed">
            "불편을 드려 죄송합니다! 시스템 API 키를 재정비했으니<br/>이제 홍콩의 진짜 속살을 보여드리죠!"
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
            GPS 기반 내 주변 찐맛집 스캔
          </button>
        </div>
      </div>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 pb-24">
        {!state.loading && !streamingContent && !state.error && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-8xl mb-10 transform hover:scale-110 transition-transform cursor-default">🍜</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight">어디가 궁금하신가요?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
              {['침사추이', '센트럴', '몽콕', '코즈웨이베이', '완차이', '소호'].map(tag => (
                <button
                  key={tag}
                  onClick={() => handleSearch(undefined, tag)}
                  className="px-6 py-6 bg-white rounded-3xl text-slate-800 font-black border-2 border-slate-100 hover:border-red-500 hover:text-red-600 hover:shadow-2xl hover:shadow-red-500/10 transition-all active:scale-95 text-base shadow-sm"
                >
                  📍 {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-white border-4 border-red-50 rounded-[3rem] p-12 text-center shadow-2xl animate-fade-in mt-10">
            <div className="text-7xl mb-8">🛠️</div>
            <div className="text-slate-900 font-black text-2xl mb-4">김반장의 긴급 점검 공지!</div>
            <p className="text-slate-500 mb-10 font-bold text-lg leading-relaxed">{state.error}</p>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button 
                onClick={handleApiKeySetup}
                className="px-8 py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg hover:bg-slate-900 transition-all shadow-xl active:scale-95"
              >
                1. API 키 재설정 (필수)
              </button>
              <button 
                onClick={() => handleSearch()}
                className="px-8 py-5 bg-slate-200 text-slate-700 rounded-[2rem] font-black text-lg hover:bg-slate-300 transition-all active:scale-95"
              >
                2. 다시 시도
              </button>
            </div>
          </div>
        )}

        {state.loading && !streamingContent && <LoadingView />}

        {streamingContent && (
          <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 p-8 md:p-16 animate-fade-in overflow-hidden" ref={scrollRef}>
            <div className="flex items-center gap-6 mb-12 pb-10 border-b-4 border-slate-50">
              <div className="w-20 h-20 bg-red-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl text-white transform -rotate-3 font-black">🇭🇰</div>
              <div>
                <h3 className="font-black text-slate-900 text-2xl md:text-3xl tracking-tighter leading-tight">
                  {state.userLocation ? "📍 실시간 내 주변 보고서" : `🏙️ ${state.query} 지역 정밀 분석`}
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-xs text-green-600 font-black uppercase tracking-widest">Grounding System Active</p>
                </div>
              </div>
            </div>
            
            <ContentDisplay content={streamingContent} sources={streamingSources} />
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-400 to-red-600 opacity-50"></div>
        <p className="font-black tracking-[0.4em] text-slate-400 uppercase mb-6 text-sm">Hong Kong Kim Ban Jang • 2025</p>
        <p className="max-w-xl mx-auto text-xs leading-relaxed opacity-40 font-bold mb-8">
          본 서비스는 실시간 구글 AI 데이터를 기반으로 생성됩니다.<br/>정보의 정확성을 위해 방문 전 반드시 구글 맵의 영업시간을 다시 한 번 확인해 주세요.
        </p>
      </footer>
    </div>
  );
};

export default App;
