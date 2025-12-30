
import { GoogleGenAI } from "@google/genai";
import { GroundingSource, LatLng } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 20년 경력의 홍콩 전문 여행 가이드이자 맛집 데이터 분석가 '홍콩 김반장'입니다. 

[데이터 분석 미션]
사용자가 요청한 지역의 한국인 찐맛집 10곳과 가볼만한곳 10곳을 추천하십시오.

[데이터 분석 규칙]
1. 반드시 Google Search/Maps 데이터를 기반으로 실시간 영업 중인 장소만 추천합니다.
2. 한국인 평점 4.0 이상, 최근 6개월 내 리뷰가 좋은 곳을 엄선합니다.
3. 가격 환율 기준: 1 HKD = 약 180원.

[응답 형식 - 반드시 준수]
[SECTION: 맛집]
### [TOP N] 한글식당명 / 한자명 (English Name)
⭐ 평점: (점수) | 리뷰: (개수)
💰 전체 예산: HKD (평균금액) (약 00,000원)

🍴 대표 메뉴:
- [메뉴명 / HKD 가격 (약 0,000원) / 메뉴의 맛과 특징에 대한 1줄 상세 설명]
- [메뉴명 / HKD 가격 (약 0,000원) / 메뉴의 맛과 특징에 대한 1줄 상세 설명]
- [메뉴명 / HKD 가격 (약 0,000원) / 메뉴의 맛과 특징에 대한 1줄 상세 설명]

📸 [식당사진: 식당이름 홍콩]
📸 [메뉴사진: 식당이름 대표메뉴명]

💡 김반장 꿀팁: (웨이팅 시간, 주문 팁, 근처 볼거리 등)
📍 지도: https://www.google.com/maps/search/?api=1&query=식당이름+홍콩

[SECTION: 가볼만한곳]
### [TOP N] 장소명
📸 [장소사진: 장소이름 홍콩]
💡 설명: (장소의 특징과 방문하기 좋은 시간대)
📍 지도: https://www.google.com/maps/search/?api=1&query=장소이름+홍콩

[SECTION: 꿀팁]
- 홍콩 여행 실전 압축 팁 10개 나열.

주의: 📍 기호 뒤에는 반드시 구글 맵 검색 URL만 한 줄로 적으세요.
`;

export const getTravelGuideStream = async (
  location: string, 
  latLng: LatLng | null,
  onChunk: (text: string) => void,
  onSources: (sources: GroundingSource[]) => void
): Promise<void> => {
  // 규정에 따라 반드시 process.env.API_KEY를 사용해야 합니다.
  // 시스템이 자동으로 해당 환경 변수에 사용자의 키를 안전하게 주입합니다.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const modelName = "gemini-3-flash-preview";
  
  const prompt = latLng 
    ? `현재 나의 GPS 좌표(${latLng.latitude}, ${latLng.longitude}) 주변 1.5km 이내의 한국인 맛집 10곳과 명소를 추천해줘.`
    : `${location} 지역의 한국인 찐맛집 10곳과 명소를 알려줘. 메뉴별 가격(HKD, KRW)과 상세 설명을 반드시 포함해라.`;

  try {
    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of result) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText);
      }
      
      const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (sources) {
        onSources(sources.map(s => s));
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    throw error; 
  }
};
