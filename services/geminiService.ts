import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; 
// Note: In a real deployment, ensure API_KEY is set. 
// For this demo, we handle the case where it might be missing gracefully in the UI.

let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateSmartSuggestions = async (prompt: string): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key is missing.");
    return "Please configure your API Key to use the Smart Assistant.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No suggestion available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't generate a suggestion right now.";
  }
};

export const generateMealPlan = async (ingredients: string, cuisine: string = 'Balanced'): Promise<string> => {
    const cuisinePrompt = cuisine ? ` focusing on ${cuisine} cuisine style.` : '.';
    const basePrompt = ingredients.trim()
      ? `using these ingredients if possible: "${ingredients}". You can add common pantry items.${cuisinePrompt}`
      : `based on a balanced, nutrient-dense diet${cuisinePrompt}`;

    // Requesting a full week structure keyed by Mon, Tue, etc.
    const prompt = `Generate a 7-day weekly meal plan (Mon, Tue, Wed, Thu, Fri, Sat, Sun) ${basePrompt}
    For each day, provide: breakfast, lunch, dinner, snack.
    Keep descriptions concise (under 6 words).
    IMPORTANT: Return ONLY valid JSON. No markdown formatting. No code blocks.
    The keys must be exactly: "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun".
    Structure:
    {
      "Mon": { "breakfast": "...", "lunch": "...", "dinner": "...", "snack": "..." },
      "Tue": { ... },
      ...
    }`;

    return generateSmartSuggestions(prompt);
};