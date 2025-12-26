
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya). La teva funció és analitzar propostes educatives i transformar-les en material d'alta qualitat per a l'alumnat.

REGLA DE RENDERITZAT:
- Utilitza Unicode per a fórmules i símbols.
- Llenguatge adaptat a l'estudiant (claredat, motivació i autonomia).
- Estructura neta i professional.

L'objectiu final és crear una Guia de Treball que serveixi perquè l'alumne sàpiga en tot moment què ha de fer i com ho ha de fer.`;

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
  instrumentName: string,
  modelName: string
) {
  const prompt = `CREA LA FITXA PER A L'ALUMNAT (Guia de Treball).
  
  Ets el pont entre el docent i l'alumne. Tradueix l'output triat i l'instrument d'avaluació en instruccions per a l'estudiant.
  
  Configuració:
  - Contingut: ${JSON.stringify(improvedContent)}
  - Output (Missió): ${selectedOutput}
  - Agrupament: ${groupingType} ${groupingType === GroupingType.GRUP ? `(Equips de ${memberCount})` : ''}
  - Comentaris docent: ${userComments}
  - Instrument d'avaluació que s'utilitzarà: ${instrumentName}

  L'estructura de la fitxa ha de ser:
  1. El Context (Situació o escenari).
  2. Introducció/Història (si s'escau per motivar).
  3. L'Objectiu de l'activitat (Què n'esperem?).
  4. Descripció pas a pas del que ha de fer l'alumnat per assolir l'output (${selectedOutput}).
  5. Producte o material final a lliurar (Adaptat a l'instrument d'avaluació: ${instrumentName}).
  6. Guia de realització: Consells pràctics i d'èxit.

  El to ha de ser encoratjador, clar i molt estructurat.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la guia.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Genera un resum curricular de la següent fitxa en format taula (JSON).
  CONTINGUT: ${content}

  RESTRICCIONS IMPORTANTS:
  - Eixos de l'escola: MÀXIM 2 (Feminisme, Territori, Sostenibilitat i ODS).
  - ODS: MÀXIM 2.
  - Competències ABPxODS: MÀXIM 2.
  - Sabers bàsics i Competències específiques segons LOMLOE.

  Torna aquest JSON:
  {
    "competencies": ["..."],
    "sabers": ["..."],
    "eixosEscola": ["..."],
    "ods": ["..."],
    "competenciesABP": ["..."]
  }`;

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

export async function generateEvaluationFull(content: string, instrumentName: string, modelName: string) {
  const prompt = `Genera l'instrument d'avaluació complet "${instrumentName}" basat en aquesta Guia de Treball: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}
