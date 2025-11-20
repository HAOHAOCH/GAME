import { GoogleGenAI } from "@google/genai";
import { Player } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMatchCommentary = async (
  winner: Player | null,
  loser: Player | null,
  durationSeconds: number
): Promise<string> => {
  const model = 'gemini-2.5-flash';

  const prompt = `
    你是一位熱血、激動的電競賽評。
    剛結束一場 1v1 的「小朋友下樓梯」(Dungeon Drop) 比賽。
    
    比賽數據:
    - 存活時間: ${durationSeconds} 秒。
    ${winner ? `- 獲勝者: ${winner.name} (分數/深度: ${Math.floor(winner.score)})` : '- 結果: 平手！兩人都陣亡了。'}
    ${loser ? `- 落敗者: ${loser.name} (分數/深度: ${Math.floor(loser.score)})` : ''}
    ${loser?.lastDamageSource ? `- 落敗原因: ${loser.lastDamageSource}` : ''}

    請用**繁體中文 (台灣口語)** 寫出一段約兩句話的賽評。
    風格要幽默、誇張。如果有人死得很快(小於10秒)就稍微嘲諷一下。稱讚獲勝者的操作。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "賽評震驚到說不出話來了！";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "轉播訊號中斷 (AI 連線錯誤)。";
  }
};