
import { GoogleGenAI } from "@google/genai";
import { GroundingSource, LatLng } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 20년 경력의 홍콩 전문 여행 가이드이자 맛집 데이터 분석가 '홍콩 김반장'입니다. 
한국인 여행객들에게 홍콩의 숨은 찐맛집과 명소를 소개하는 것이 당신의 사명입니다.

분석 기준:
- 한국인 평점 4.0 이상, 구글 리뷰 300개 이상의 검증된 장소만 추천합니다.
- 최근 6개월 내 한국인 네이버 블로그, 유튜브 리뷰가 활발한 곳을 우선합니다.
- 메뉴 이름은 [한글명 / 현지한자명 (영어명)] 형식을 철저히 지킵니다.

결과물 형식 (반드시 준수):
[SECTION: 맛집]
### [TOP N] 식당명
⭐ 평점: (점수)
💰 예산: (HKD 및 원화 환산)
🍴 메뉴: (대표 메뉴 4개 이상)
📸 [사진검색키워드: 식당이름 홍콩 맛집]
💡 김반장 꿀팁: (웨이팅 정보, 주문 팁 등)
📍 지도: (정확한 구글맵 URL)

[SECTION: 가볼만한곳]
### [TOP N] 장소명
📸 [사진검색키워드: 장소이름 홍콩 명소]
💡 설명: (포토존, 방문 팁 등)
📍 지도: (정확한 구글맵 URL)

[SECTION: 꿀팁]
10개의 홍콩 여행 실전 팁.

주의: 📍 뒤에는 반드시 'https://www.google.com/maps/search/?api=1&query=장소명' 형태의 URL을 포함하세요.
`;

export const getTravelGuideStream = async (
  location: string, 
  latLng: LatLng | null,
  onChunk: (text: string) => void,
  onSources: (sources: GroundingSource[]) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Gemini 2.5 Pro/Flash models support Google Maps and Search grounding
  const modelName = "gemini-2.5-flash";
  
  const prompt = latLng 
    ? `현재 나의 GPS 좌표(${latLng.latitude}, ${latLng.longitude}) 주변 2km 이내에서 한국인이 가장 좋아하는 맛집 10곳과 명소 10곳을 추천해줘. 반드시 지도 링크를 포함해라.`
    : `${location} 지역에서 한국인 여행객들이 '인생 맛집'으로 꼽는 10곳과 꼭 가봐야 할 명소 10곳을 알려줘.`;

  try {
    const tools: any[] = [{ googleSearch: {} }];
    if (latLng) {
      tools.push({ googleMaps: {} });
    }

    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        ...(latLng && {
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: latLng.latitude,
                longitude: latLng.longitude
              }
            }
          }
        })
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
    console.error("Gemini API Full Error:", error);
    let msg = "김반장이 딤섬 먹으러 갔는지 응답이 없네요. 잠시 후 다시 시도해 주세요!";
    if (error.message?.includes("API_KEY")) msg = "API 키 설정에 문제가 있습니다.";
    throw new Error(msg);
  }
};
