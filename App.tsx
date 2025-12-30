
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, GroundingSource } from './types';
import { getTravelGuideStream } from './services/geminiService';
import LoadingView from './components/LoadingView';
import MarkdownRenderer from './components/MarkdownRenderer';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    query: '',
    loading: false,
    result: null,
    error: null,
  });
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingSources, setStreamingSources] = useState<GroundingSource[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as content grows
  useEffect(() => {
    if (state.loading && scrollRef.current) {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [streamingContent, state.loading]);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!state.query.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null, result: null }));
    setStreamingContent('');
    setStreamingSources([]);
    
    try {
      await getTravelGuideStream(
        state.query, 
        (text) => setStreamingContent(text),
        (sources) => setStreamingSources(prev => {
          // Add only unique sources
          const newSources = [...prev];
          sources.forEach(s => {
            if (!newSources.some(ns => ns.web?.uri === s.web?.uri)) {
              newSources.push(s);
            }
          });
          return newSources;
        })
      );
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        result: { content: '', sources: [] } // Just to trigger the view state
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [state.query]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="hk-gradient text-white py-10 px-6 shadow-lg transition-all duration-500">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-4 backdrop-blur-sm">
            🇭🇰 홍콩 로컬 20년 경력
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-3 drop-shadow-md">
            홍콩 김반장
          </h1>
          <p className="text-lg opacity-90 font-medium">
            "거~ 답답하게 기다리지 마세요! 바로바로 띄워드립니다."
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-50 px-4 -mt-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={state.query}
              onChange={(e) => setState(prev => ({ ...prev, query: e.target.value }))}
              placeholder="센트럴, 침사추이, 몽콕... 어디가 궁금해?"
              className="w-full px-6 py-4 rounded-2xl shadow-xl border-none focus:ring-4 focus:ring-red-200 outline-none text-lg pr-16 bg-white"
            />
            <button
              type="submit"
              disabled={state.loading}
              className="absolute right-2 p-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 md:px-6 py-10">
        {!state.loading && !streamingContent && !state.error && (
          <div className="text-center py-20 opacity-80">
            <div className="text-7xl mb-6">🚋</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">홍콩 찐맛집, 김반장이 다 압니다.</h2>
            <p className="text-slate-500">원하시는 지역이나 역 이름을 던져주세요!</p>
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {['침사추이', '센트럴', '몽콕', '코즈웨이베이', '완차이', '케네디타운'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setState(prev => ({ ...prev, query: tag }));
                    setTimeout(() => handleSearch(), 10);
                  }}
                  className="px-4 py-2 bg-white rounded-xl text-slate-600 border border-slate-200 hover:border-red-400 hover:text-red-600 transition-all shadow-sm"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="text-red-600 text-4xl mb-4">😅</div>
            <div className="text-red-800 font-bold text-lg mb-2">에고, 김반장이 길을 잃었나 봐요.</div>
            <p className="text-red-600/80 mb-6">{state.error}</p>
            <button 
              onClick={() => handleSearch()}
              className="px-8 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              다시 부르기
            </button>
          </div>
        )}

        {state.loading && !streamingContent && <LoadingView />}

        {streamingContent && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-12 transition-all duration-500 overflow-hidden" ref={scrollRef}>
            <div className="flex items-center space-y-0 space-x-3 mb-8 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">👨‍✈️</div>
              <div>
                <h3 className="font-bold text-slate-800">홍콩 김반장의 로컬 추천</h3>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">LIVE UPDATING...</p>
              </div>
            </div>
            
            <MarkdownRenderer content={streamingContent} />
            
            {streamingSources.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-100 animate-in fade-in duration-1000">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Information Sources</h3>
                <div className="flex flex-wrap gap-2">
                  {streamingSources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.web?.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all truncate max-w-[180px] border border-slate-100"
                    >
                      {source.web?.title || 'Google Search'}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 px-6 text-center text-sm">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-center space-x-4">
            <span className="w-2 h-2 bg-red-600 rounded-full"></span>
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          </div>
          <p>© 2025 홍콩 김반장 - Real-time Local Guide</p>
          <p className="opacity-60">본 서비스는 최신 구글 검색 데이터를 기반으로 한 AI 가이드입니다.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
