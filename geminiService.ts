
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya). La teva funció és analitzar propostes educatives i transformar-les en material d'alta qualitat per a l'alumnat.

REGLA DE RENDERITZAT:
- Utilitza Unicode per a fórmules i símbols.
- Llenguatge adaptat a l'estudiant (claredat, motivació i autonomia).
- Estructura neta i professional.

Context Nou Patufet: Eixos de Territori, Feminisme, Sostenibilitat i Transformació.`;

function robustJSONParse(text: string | undefined) {
  if (!text) throw new Error("La resposta està buida.");
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No s'ha trobat bloc JSON.");
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("Error en el format de dades de la IA.");
  }
}

export async function analyzeAndImprove(content: string, phase: SAPhase, modelName: string, temperature: number) {
  const prompt = `Analitza aquesta proposta educativa i presenta una "Proposta de Millora" basada en criteris pedagògics rigorosos (Taxonomia de Bloom, claredat d'objectius).
  Fase SA: ${SAPhaseLabels[phase]}
  Contingut: ${content}

  Torna un JSON amb:
  {
    "improvementSuggestion": "Anàlisi detallada i justificació pedagògica de la millora",
    "improved": {
      "titol": "Títol suggerit",
      "context": "Context educatiu",
      "objectius": ["Llista d'objectius d'aprenentatge clars"],
      "desenvolupament": [{"nom": "Fase", "descripcio": "Detall"}],
      "outputs": ["Format 1", "Format 2"]
    }
  }`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature,
      responseMimeType: "application/json"
    }
  });

  return robustJSONParse(response.text);
}

export async function generateStudentGuide(
  improvedContent: any, 
  selectedOutput: string, 
  groupingType: GroupingType, 
  memberCount: number, 
  userComments: string,
  modelName: string
) {
  const prompt = `CREA LA FITXA PER A L'ALUMNAT (Guia de Treball completa).
  
  Dades de configuració:
  - Contingut Millorat: ${JSON.stringify(improvedContent)}
  - Format d'Output: ${selectedOutput}
  - Agrupament: ${groupingType} ${groupingType === GroupingType.GRUP ? `(${memberCount} membres)` : ''}
  - Comentaris personalització usuari: ${userComments}

  La fitxa ha de contenir:
  1. Títol engrescador.
  2. Introducció/Repte.
  3. Què hem de fer? (Instruccions detallades segons el format triat).
  4. Com ens organitzem? (Considerant l'agrupament triat).
  5. Recursos o consells per a l'èxit.
  
  Genera un text Markdown net, sense comentaris interns, llist per ser lliurat als alumnes.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la guia.";
}

export async function generateEvaluation(content: string, instrumentName: string, modelName: string) {
  const prompt = `Crea l'instrument d'avaluació "${instrumentName}" per a la següent fitxa d'alumne: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Genera el resum curricular (LOMLOE) per a: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json"
    }
  });
  return robustJSONParse(response.text);
}
