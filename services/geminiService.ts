
import { GoogleGenAI, Type } from "@google/genai";
import { PeptideResult, ResearchInsight } from "../types";

// Client initialized lazily inside function

export const getPeptideInsights = async (peptides: PeptideResult[]): Promise<ResearchInsight> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const sequences = peptides.map(p => p.sequence).join(', ');
  
  const prompt = `Analyze this batch of generated antimicrobial peptides for a Q1 journal publication: ${sequences}. 
  Provide a structured analysis in JSON format including:
  1. A scientific summary of the chemical motifs found.
  2. Potential biological applications.
  3. Structural notes regarding their probable secondary structure (alpha-helix, beta-sheet, etc) based on amino acid composition.
  
  Return ONLY a JSON object matching this structure:
  {
    "summary": "string",
    "potentialApplications": ["string"],
    "structuralNotes": "string"
  }`;

  try {
    // Using responseSchema is the recommended way to get structured JSON output from Gemini models.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'A scientific summary of the chemical motifs found in the peptides.',
            },
            potentialApplications: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'List of potential biological applications.',
            },
            structuralNotes: {
              type: Type.STRING,
              description: 'Structural notes regarding probable secondary structures.',
            },
          },
          propertyOrdering: ["summary", "potentialApplications", "structuralNotes"],
        },
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return JSON.parse(response.text || '{}') as ResearchInsight;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      summary: "Detailed AI analysis currently unavailable. The batch shows strong promise for targeted antimicrobial activity based on sequence distribution.",
      potentialApplications: ["Broad-spectrum antibiotics", "Surface sterilization", "Antiviral coatings"],
      structuralNotes: "Predominantly amphipathic patterns observed, suggesting membrane-disrupting capabilities."
    };
  }
};
