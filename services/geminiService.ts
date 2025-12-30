
import { GoogleGenAI } from "@google/genai";
import { GroundingSource, LatLng } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 20년 경력의 홍콩 전문 여행 가이드이자 맛집 데이터 분석가 '홍콩 김반장'입니다. 

[미션]
사용자가 요청한 지역의 한국인 찐맛집 10곳과 가볼만한곳 10곳을 추천하십시오.

[데이터 분석 규칙]
1. 반드시 Google Maps 데이터를 기반으로 실제 존재하는 장소만 추천합니다.
2. 한국인 평점 4.0 이상, 리뷰가 풍부한 곳을 엄선합니다.
3. 모든 장소에는 반드시 정확한 구글 맵 주소(URL)를 포함해야 합니다.

[응답 형식 - 반드시 준수]
[SECTION: 맛집]
### [TOP N] 한글식당명 / 한자명 (English Name)
⭐ 평점: (점수) | 리뷰: (개수)
💰 예산: HKD (금액) (약 00,000원)
🍴 메뉴: (인기 메뉴 4개 이상 나열)
📸 [사진검색키워드: 식당이름 홍콩]
💡 김반장 꿀팁: (로컬 꿀팁)
📍 지도: https://www.google.com/maps/search/?api=1&query=식당이름+홍콩

[SECTION: 가볼만한곳]
### [TOP N] 장소명
📸 [사진검색키워드: 장소이름 홍콩]
💡 설명: (장소 설명 및 팁)
📍 지도: https://www.google.com/maps/search/?api=1&query=장소이름+홍콩

[SECTION: 꿀팁]
- 홍콩 여행 실전 압축 팁 10개 나열.

주의: 📍 기호 뒤에는 반드시 'https://'로 시작하는 구글 맵 검색 URL을 한 줄로 적으세요. 다른 텍스트와 섞이지 않게 하세요.
`;

export const getTravelGuideStream = async (
  location: string, 
  latLng: LatLng | null,
  onChunk: (text: string) => void,
  onSources: (sources: GroundingSource[]) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // 지도 그라운딩을 위해 Gemini 2.5 Flash 모델 사용
  const modelName = "gemini-2.5-flash";
  
  const prompt = latLng 
    ? `나의 현재 GPS 좌표(${latLng.latitude}, ${latLng.longitude}) 주변 1.5km 이내에서 한국인들이 가장 좋아하는 맛집 10곳과 명소를 추천해줘. 반드시 지도 링크를 포함해라.`
    : `${location} 지역에서 한국인 여행객들이 최고로 뽑는 맛집 10곳과 꼭 가봐야 할 명소 10곳을 알려줘.`;

  try {
    // 도구 설정: 좌표가 있으면 googleMaps, 없으면 googleSearch 중심
    const tools: any[] = latLng 
      ? [{ googleMaps: {} }, { googleSearch: {} }] 
      : [{ googleSearch: {} }];

    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts: [{ text: prompt }] }, // 단순화된 요청 구조
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        thinkingConfig: { thinkingBudget: 0 }, // 지연 시간 단축
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
    console.error("Gemini API Error Detail:", error);
    // 더 구체적인 에러 메시지 전달
    const errorMsg = error.message || "";
    if (errorMsg.includes("403")) throw new Error("API 권한이 없습니다. 관리자에게 문의하세요.");
    if (errorMsg.includes("429")) throw new Error("사용자가 너무 많아 김반장이 바쁘네요. 1분 뒤 다시 시도해 주세요!");
    throw new Error("김반장 레이더에 일시적인 장애가 생겼습니다. '다시 시도하기'를 눌러주세요.");
  }
};
