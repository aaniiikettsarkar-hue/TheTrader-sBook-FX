import { GoogleGenAI } from "@google/genai";
import type { TradeFormData } from "../types";

// FIX: Initialize GoogleGenAI client according to SDK guidelines.
// This assumes the API_KEY is available in the environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

type AISuggestionParams = TradeFormData & { result: 'Win' | 'Loss' };

export const getAISuggestion = async (tradeData: AISuggestionParams): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    Act as an experienced trading psychologist and mentor. A trader has just logged the following trade:
    - Direction: ${tradeData.direction}
    - Currency Pair: ${tradeData.currencyPair}
    - Strategy: ${tradeData.strategy}
    - Result: ${tradeData.result} (${tradeData.pipsCaptured} pips)
    - Risk-Free Trade: ${tradeData.riskFree ? 'Yes' : 'No'}
    - Trader's Reason for Win/Loss: "${tradeData.reason}"
    - Trader's Emotional State: "${tradeData.emotionalState}"

    Based on this information, provide a concise, actionable suggestion for the trader to improve their mindset or execution on the next trade. The tone should be supportive and constructive. Do not be generic. Focus on the connection between their emotional state and the trade outcome. If the trade was risk-free and a win, acknowledge the good trade management. The suggestion should be 1-3 sentences long.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate AI suggestion. The API call may have been blocked or failed.");
  }
};
