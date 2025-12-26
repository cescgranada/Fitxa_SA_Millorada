
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya) per a l'Escola Nou Patufet.

EL TEU ROL:
- Fidelitat absoluta a la proposta del docent. Si el docent penja una activitat de "Caiguda Lliure", les propostes han de ser científiques (experiments, informes, vídeos de dades) i no genèriques (no demanis enquestes si no tenen sentit).
- Generes material directament "ready-to-use" per a l'alumnat.
- Apliques el Disseny Universal per a l'Aprenentatge (DUA).

MARCS CURRICULARS:
- Eixos Nou Patufet (ÚNICS 4): Feminisme, Sostenibilitat, Territori, ODS.
- Competències ABPxODS: Pensament sistèmic, Anticipació, Valors i creences, Estratègica, Col·laboració, Pensament crític, Consciència d’un mateix, Resolució de problemes integrada.
- Taxonomia de Bloom: Recordar, Comprendre, Aplicar, Analitzar, Avaluar, Crear.`;

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
  const prompt = `Analitza la proposta docent i millora-la mantenint el seu core temàtic.
  Contingut docent: ${content}
  Fase SA: ${SAPhaseLabels[phase]}

  Torna un JSON amb:
  {
    "improvementSuggestion": "Anàlisi pedagògica respectant la idea original del docent.",
    "improved": {
      "titol": "Títol sugerit",
      "context": "Escenari real vinculat al tema",
      "objectius": ["Objectius d'aprenentatge"],
      "desenvolupament": [{"nom": "Fase", "descripcio": "Logística"}]
    }
  }`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT, temperature, responseMimeType: "application/json" }
  });

  return robustJSONParse(response.text);
}

export async function proposeProducts(improvedContent: any, instrumentName: string, grouping: string, phase: string, modelName: string) {
  const prompt = `Basant-te en el contingut temàtic (Molt important ser coherent: si és ciència, no demanis enquestes genèriques), proposa 3 formats de producte final que l'alumnat hagi de lliurar.
  Format de lliurament possibles: Informe de recerca, Vídeo demostratiu, Pòdcast científic, Infografia tècnica, Maqueta funcional, etc.
  Han de ser coherents amb l'instrument: "${instrumentName}".

  Torna un JSON amb:
  {
    "proposals": [
      { "id": "1", "titol": "Repte creatiu", "descripcio": "Què farà l'alumne?", "format": "Tipus de producte" },
      { "id": "2", "titol": "Repte creatiu", "descripcio": "Què farà l'alumne?", "format": "Tipus de producte" },
      { "id": "3", "titol": "Repte creatiu", "descripcio": "Què farà l'alumne?", "format": "Tipus de producte" }
    ]
  }`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json" }
  });

  return robustJSONParse(response.text);
}

export async function generateStudentGuide(
  improvedContent: any, 
  selectedProduct: any, 
  groupingType: GroupingType, 
  memberCount: number, 
  userComments: string,
  instrumentName: string,
  modelName: string
) {
  const prompt = `ESCRIU LA FITXA DE TREBALL PER A L'ALUMNAT.
  Aquesta fitxa és la que el docent donarà a l'alumne. Ha de ser completa, clara i amb instruccions pas a pas.

  Logística: ${groupingType} ${groupingType === GroupingType.GRUP ? `(Equips de ${memberCount} persones)` : ''}.
  Producte: ${selectedProduct.titol} (Format: ${selectedProduct.format}).

  Estructura de la fitxa (TÍTOLS EN MAJÚSCULES I NEGRETA):
  1. EL CONTEXT: On ens trobem? Quina és la situació?
  2. INTRODUCCIÓ HISTÒRICA: Si és rellevant per al tema, afegeix context.
  3. OBJECTIU DE LA FITXA: Què has d'aconseguir tu com a alumne/a?
  4. PASSES PER DESENVOLUPAR LA FEINA: Guia detallada pas a pas de què cal fer, especificant el tipus d'agrupament (${groupingType}).
  5. QUÈ HAS DE LLIURAR?: Detall del material final (${selectedProduct.format}) i com t'avaluarem amb "${instrumentName}".`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error en la generació.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Analitza curricularment aquesta fitxa d'alumne: ${content}.
  IMPORTANT: Eixos Escola només poden ser 4: Feminisme, Sostenibilitat, Territori, ODS.
  
  Torna un JSON amb:
  {
    "competencies": [{"code": "Codi", "definition": "Definició"}],
    "sabers": ["..."],
    "eixosEscola": {
      "all": ["Feminisme", "Sostenibilitat", "Territori", "ODS"],
      "highlighted": ["Màxim 2 de la llista anterior"]
    },
    "ods": {
      "all": ["Llista dels 17 ODS"],
      "highlighted": ["Màxim 2 principals"]
    },
    "competenciesABP": {
      "all": ["Pensament sistèmic", "Anticipació", "Valors i creences", "Estratègica", "Col·laboració", "Pensament crític", "Consciència d’un mateix", "Resolució de problemes integrada"],
      "highlighted": ["La competència ABPxODS principal de l'activitat"]
    },
    "bloom": {
      "all": ["Recordar", "Comprendre", "Aplicar", "Analitzar", "Avaluar", "Crear"],
      "highlighted": ["Nivells clau activats"]
    }
  }`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json" }
  });

  return robustJSONParse(response.text);
}

export async function generateEvaluationFull(content: string, instrumentName: string, modelName: string) {
  const prompt = `Crea l'instrument d'avaluació "${instrumentName}" detallat basat en aquesta fitxa d'alumne: ${content}. Ha de ser una guia clara per al docent i l'alumne.`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}
