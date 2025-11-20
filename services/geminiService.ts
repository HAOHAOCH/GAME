import { GoogleGenAI } from "@google/genai";
import { Player } from '../types';

const API_KEY = process.env.API_KEY || '';

// Initialize safely, but don't crash if key is missing (UI will handle it)
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateMatchCommentary = async (
  winner: Player | null,
  loser: Player | null,
  durationSeconds: number
): Promise<string> => {
  if (!ai) {
    return "Constructing match analysis... (API Key missing, connect Gemini to see AI commentary!)";
  }

  const model = 'gemini-2.5-flash';

  const prompt = `
    You are an enthusiastic, high-energy E-Sports shoutcaster.
    A 1v1 game of "Dungeon Drop" (a game where you fall down avoiding spikes) just finished.
    
    Match Stats:
    - Duration: ${durationSeconds} seconds.
    ${winner ? `- Winner: ${winner.name} (Score: ${Math.floor(winner.score)})` : '- Result: Draw! Both perished.'}
    ${loser ? `- Loser: ${loser.name} (Score: ${Math.floor(loser.score)})` : ''}
    ${loser?.lastDamageSource ? `- Cause of Death: ${loser.lastDamageSource}` : ''}

    Write a short, funny, 2-sentence commentary summarizing the match. 
    Roast the loser slightly if they died quickly. Praise the winner's agility.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "The commentators are speechless!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Technical difficulties with the broadcast feed (AI Error).";
  }
};
