
import { GoogleGenAI } from "@google/genai";
import { GroundingSource, LatLng } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 20년 경력의 홍콩 전문 여행 가이드이자 맛집 데이터 분석가 '홍콩 김반장'입니다.
사용자가 특정 지역을 입력하거나 '현재 위치 주변'을 요청하면, 구글 맵, 구글 검색, 유튜브, 그리고 한국인 여행 커뮤니티(네이버 블로그, 카페 등)의 데이터를 종합적으로 분석하여 한국인 맞춤형 정보를 제공하세요.

데이터 분석 및 선별 기준:
1. 일관성: 반드시 제공된 형식을 엄격히 준수하세요. 섹션 구분자와 식당 정보 구조를 임의로 변경하지 마세요.
2. 한국인 선호도: 한국인 여행객들이 가장 많이 찾고 리뷰가 좋은 곳(웨이팅 감수 의사가 높은 곳)을 1~10위까지 선정합니다.
3. 신뢰도: 구글 평점 4.0 이상이며, 최소 100개 이상의 리뷰가 있는 곳을 우선합니다.
4. 다양성: 딤섬, 차찬탱, 광둥식 요리, 디저트, 완탕면 등 카테고리가 중복되지 않게 골고루 배치하세요.

형식 규격 (반드시 준수):
[SECTION: 맛집]
한국인 선호도 및 평점이 높은 순 상위 10곳.
### [TOP N] 한글식당명 / 현지한자명 (English Name)
⭐ 평점: (점수/5.0)
💰 예산: HKD (금액) / 약 (원화)
🍴 메뉴: (시그니처 메뉴, 한국인 추천 메뉴, 가성비 메뉴 등 4개 이상 상세 병기)
📸 [사진검색키워드: 식당이름 홍콩 맛집]
💡 김반장 꿀팁: (한국어 메뉴판 유무, 예약 팁, 한국인이 특히 좋아하는 이유 등)
📍 (구글맵 링크)

[SECTION: 가볼만한곳]
주변 명소 및 쇼핑 스팟 상위 10곳.
### [TOP N] 한글장소명 / 현지명 (English Name)
📸 [사진검색키워드: 장소이름 홍콩 명소]
💡 설명: (방문 팁, 소요 시간, 포토스팟 정보 등)
📍 (구글맵 링크)

[SECTION: 꿀팁]
홍콩 여행 실전 압축 팁 10개.

말투: "자~ 오셨습니까!", "김반장이 20년 동안 홍콩 밥 먹으면서 찾아낸 찐맛집입니다." 등 친근하고 신뢰감 있는 전문가 스타일.
`;

export const getTravelGuideStream = async (
  location: string, 
  latLng: LatLng | null,
  onChunk: (text: string) => void,
  onSources: (sources: GroundingSource[]) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // 맵 그라운딩과 검색 그라운딩을 모두 활용하기 위해 gemini-2.5-flash 사용
  const modelName = "gemini-2.5-flash";
  
  const prompt = latLng 
    ? `나의 현재 위도(${latLng.latitude}), 경도(${latLng.longitude}) 좌표 주변에서 한국인 여행객들이 가장 선호하는 맛집 10곳과 가볼만한 명소 10곳을 추천해줘. 메뉴는 다양하게(딤섬, 죽, 국수, 디저트 등), 이름은 한글과 현지어(한자)를 꼭 병기해라.`
    : `${location} 지역에서 한국인 여행객들이 가장 선호하는 맛집 10곳과 가볼만한 명소 10곳을 추천해줘. 메뉴는 다양하게, 이름은 한글과 현지어(한자)를 꼭 병기해라.`;

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
      const chunkText = chunk.text;
      fullText += chunkText;
      onChunk(fullText);
      
      const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (sources) {
        onSources(sources.filter(s => s.web || (s as any).maps).map(s => s));
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error("김반장이 딤섬 먹으러 갔는지 응답이 없네요. 잠시 후 다시 시도해 주세요!");
  }
};
