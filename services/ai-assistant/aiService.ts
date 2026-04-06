import { GoogleGenAI } from "@google/genai";

// AI Assistant Service Logic
export class AIAssistantService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getProductRecommendation(query: string, context: any) {
    const model = "gemini-3-flash-preview";
    const prompt = `
      You are a helpful shopping assistant for Quantum Vector E-Commerce.
      User Query: ${query}
      User Context (Cart/History): ${JSON.stringify(context)}
      
      Provide a personalized recommendation and answer any questions about our products.
    `;

    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  }
}
