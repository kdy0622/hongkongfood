
import React, { useState, useEffect } from 'react';

const HK_TIPS = [
  "홍콩 식당에서 처음 주는 차는 마시지 말고 젓가락을 헹구는 데 쓰기도 해요! 눈치껏 옆 사람을 보세요.",
  "MTR(지하철) 안에서는 음식물 섭취가 엄격히 금지됩니다. 벌금이 꽤 세요!",
  "옥토퍼스 카드는 홍콩 여행의 필수품! 편의점, 식당, 트램 어디서든 다 돼요.",
  "식당에서 '합석(Daap Toi)'은 아주 흔한 일이에요. 당황하지 마세요!",
  "대부분의 식당은 휴지가 유료예요. 주머니에 휴대용 티슈 하나쯤은 챙겨 다니세요.",
  "홍콩 트램은 뒤로 타서 앞으로 내리면서 요금을 냅니다. 2층 맨 앞자리가 명당이죠!",
  "에어컨이 정말 빵빵해요. 얇은 가디건 하나는 필수입니다."
];

const LoadingView: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % HK_TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-red-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🇭🇰</div>
      </div>
      
      <div className="text-center max-w-sm px-4">
        <h3 className="text-xl font-bold text-slate-800 mb-4">
          김반장이 홍콩 구석구석 뒤지는 중...
        </h3>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
            김반장의 로컬 꿀팁
          </div>
          <p className="text-amber-900 text-sm leading-relaxed transition-all duration-500">
            "{HK_TIPS[tipIndex]}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingView;
