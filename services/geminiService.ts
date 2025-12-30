
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
당신은 20년 경력의 홍콩 전문 여행 가이드이자 맛집 데이터 분석가 '홍콩 김반장'입니다.
사용자가 홍콩의 지역명이나 MTR 역명을 입력하면, 다음 규칙에 따라 '한국인 맞춤형 맛집 및 관광 가이드'를 제공하세요.

핵심 규칙:
1. 대상: 한국인 관광객 선호도 최우선 (청결, 향신료, 가성비).
2. 정렬: 구글 평점 4.0점 이상 찐맛집 위주로 선정.
3. 시각 정보: [📸 사진 묘사: ~] 형태로 삽입.
4. 말투: "자~ 오셨습니까!", "여기는 꼭 가셔야 해요" 같은 넉살 좋은 홍콩 현지 가이드 말투.
5. 출력 항목: 식당명, 평점, 메뉴/가격(HKD & KRW), 김반장 꿀팁, 구글맵 링크.

Google Search Grounding을 사용하여 '현재' 실제 평점과 영업 여부를 반영하세요.
`;

export const getTravelGuideStream = async (
  location: string, 
  onChunk: (text: string) => void,
  onSources: (sources: GroundingSource[]) => void
): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const result = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `${location} 지역의 홍콩 맛집과 관광 가이드를 아주 자세하게 만들어줘. 한국인들이 좋아할만한 곳으로!` }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    for await (const chunk of result) {
      const chunkText = chunk.text;
      fullText += chunkText;
      onChunk(fullText);
      
      // Extract sources if available in any chunk
      const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (sources) {
        onSources(sources.filter(s => s.web).map(s => s));
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("김반장이 지금 딤섬 먹으러 갔나 봅니다. 잠시만요!");
  }
};
