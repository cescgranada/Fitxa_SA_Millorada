
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya). La teva funció és analitzar propostes educatives i transformar-les en material d'alta qualitat per a l'alumnat.

REGLA DE RENDERITZAT:
- Utilitza Unicode per a fórmules i símbols.
- Llenguatge adaptat a l'estudiant (claredat, motivació i autonomia).
- Estructura neta i professional.

Objectiu Final: Crear una "Guia de Treball" operativa perquè l'alumne sàpiga quines accions ha de realitzar per assolir l'output desitjat pel docent.`;

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
  const prompt = `Analitza aquesta proposta educativa i presenta una "Proposta de Millora" basada en criteris pedagògics rigorosos.
  Fase SA: ${SAPhaseLabels[phase]}
  Contingut: ${content}

  Torna un JSON amb:
  {
    "improvementSuggestion": "Anàlisi detallada i justificació pedagògica de la millora amb rigor acadèmic.",
    "improved": {
      "titol": "Títol sugerit",
      "context": "Context educatiu millorat",
      "objectius": ["Llista d'objectius d'aprenentatge clars"],
      "desenvolupament": [{"nom": "Fase", "descripcio": "Detall tècnic"}]
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
  
  Ets el pont entre el docent i l'alumne. Tradueix l'output triat en una missió clara per a l'estudiant.
  
  Dades del Docent:
  - Contingut Base Millorat: ${JSON.stringify(improvedContent)}
  - Missió de l'alumne (Output): ${selectedOutput}
  - Organització: ${groupingType} ${groupingType === GroupingType.GRUP ? `(Equips de ${memberCount} persones)` : ''}
  - Matisos del docent: ${userComments}

  Estructura de la Guia de Treball:
  1. Títol engrescador i repte inicial.
  2. Instruccions Pas a Pas: Com realitzar l'output (${selectedOutput}) de manera operativa.
  3. Logística: Com ens organitzem segons el format ${groupingType}.
  4. Guia de Realització i Consells: Recomanacions pràctiques per tenir èxit en aquest format concret.

  El to ha de ser encoratjador, clar i molt estructurat. Evita introduccions per a mestres, parla directament a l'alumne.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la guia.";
}

export async function generateEvaluation(content: string, instrumentName: string, modelName: string) {
  const prompt = `Crea l'instrument d'avaluació "${instrumentName}" basat en la Guia de Treball següent: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Analitza el vincle curricular (LOMLOE) de la següent fitxa: ${content}. Torna JSON.`;
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
