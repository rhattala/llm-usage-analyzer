import { GoogleGenAI } from "@google/genai";
import { UsageReport, AnalysisResult } from "../types";

export const getGeminiRecommendation = async (
  usage: UsageReport,
  analysis: AnalysisResult
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment to receive AI recommendations.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert financial analyst for LLM usage. 
    Analyze the following user's LLM usage report and provide a strategic recommendation.

    CONTEXT:
    The user is currently on a "${usage.plan.name}" plan costing $${analysis.currentMonthlyCost}/month.
    If they switched to pay-as-you-go API calls, it would cost approximately $${analysis.apiEquivalentCost}/month.
    
    DATA SUMMARY:
    - Total Input Tokens: ${usage.usage.tokens.input}
    - Total Output Tokens: ${usage.usage.tokens.output}
    - Active Days: ${usage.usage.messages.by_day.filter(d => d.count > 0).length}
    - Total Sessions: ${usage.usage.sessions.count}
    
    TASK:
    Provide a concise, 3-paragraph analysis:
    1. Verdict: Are they overpaying or underpaying? (Be direct)
    2. Usage Patterns: Analyze their ratio of input/output and model preference if apparent. Does this suggest they are using the tool for coding, creative writing, or simple Q&A?
    3. Recommendation: Should they switch to API, downgrade, or stay put? Mention if the convenience of the chat UI justifies any premium.

    Output as plain text. Keep it professional but helpful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Unable to generate analysis at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI analysis service.";
  }
};
