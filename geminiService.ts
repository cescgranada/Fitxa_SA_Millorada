
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya) per a l'Escola Nou Patufet.

EL TEU ROL:
- Ets fidel a la proposta que l'usuari (docent) penja o escriu. No inventis un tema nou, millora l'existent.
- El core de la feina ja el dona el docent; la teva missió és estructurar-lo pedagògicament per a l'alumne.
- Aplica les pautes DUA (accessibilitat i múltiples maneres de representació).

MARC DE REFERÈNCIA:
- Eixos Nou Patufet: Territori, Feminisme, Món sostenible (ODS), Llengua catalana, Amor/Benestar, Transformació.
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
  const prompt = `Analitza la proposta del docent i suggereix millores pedagògiques sense perdre l'essència de la seva idea original.
  Contingut docent: ${content}
  Fase SA: ${SAPhaseLabels[phase]}

  Torna un JSON amb:
  {
    "improvementSuggestion": "Anàlisi de com millorar la proposta mantenint-se fidel al core del docent.",
    "improved": {
      "titol": "Títol definitiu",
      "context": "Context millorat",
      "objectius": ["Llista d'objectius clars"],
      "desenvolupament": [{"nom": "Fase", "descripcio": "Passos tècnics"}]
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

export async function proposeProducts(improvedContent: any, instrumentName: string, grouping: string, phase: string, modelName: string) {
  const prompt = `Basant-te en la proposta del docent, tria 3 formats de lliurament (productes) que l'alumne pugui crear i que siguin coherents amb l'instrument d'avaluació "${instrumentName}".
  Exemples de formats: Informe escrit, Vídeo, Pòdcast, Infografia, Presentació digital, Maqueta, etc.

  Torna un JSON amb:
  {
    "proposals": [
      { "id": "1", "titol": "Nom de la tasca", "descripcio": "Què faran exactament", "format": "Ex: Vídeo" },
      { "id": "2", "titol": "Nom de la tasca", "descripcio": "Què faran exactament", "format": "Ex: Pòdcast" },
      { "id": "3", "titol": "Nom de la tasca", "descripcio": "Què faran exactament", "format": "Ex: Informe escrit" }
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
  const prompt = `Escriu la FITXA DE L'ALUMNE definitiva en format text. Ha de ser clara, motivadora i operacional.
  
  Dades:
  - Producte: ${selectedProduct.titol} (Format: ${selectedProduct.format})
  - Organització: ${groupingType} ${groupingType === GroupingType.GRUP ? `(Equips de ${memberCount})` : ''}
  - Instrument d'Avaluació: ${instrumentName}

  L'estructura de la fitxa ha de ser exactament aquesta:
  1. El Context: Descriu la situació o escenari.
  2. Introducció històrica: Si escau per al tema, afegeix un relat motivador.
  3. L'Objectiu de la fitxa: Què aprendrà i què aconseguirà l'alumne?
  4. El desenvolupament pas a pas: Instruccions precises per a l'alumne, especificant clarament la dinàmica (${groupingType}) i guiant cada fase de la creació.
  5. El material que has de lliurar: Descripció del lliurable final en format ${selectedProduct.format} i recordatori que s'avaluarà mitjançant "${instrumentName}".`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la fitxa.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Genera el resum curricular final d'aquesta fitxa: ${content}.
  
  Torna un JSON amb:
  {
    "competencies": [{"code": "Codi", "definition": "Definició"}],
    "sabers": ["..."],
    "eixosEscola": {
      "all": ["Territori", "Feminisme", "Món sostenible", "ODS", "Llengua catalana", "Amor/Benestar", "Transformació"],
      "highlighted": ["Els 2 eixos clau de la fitxa"]
    },
    "ods": {
      "all": ["Llista simplificada dels 17 ODS"],
      "highlighted": ["Els 2 ODS principals"]
    },
    "competenciesABP": {
      "all": ["Pensament sistèmic", "Anticipació", "Valors i creences", "Estratègica", "Col·laboració", "Pensament crític", "Consciència d’un mateix", "Resolució de problemes integrada"],
      "highlighted": ["Les 2 principals de la fitxa"]
    },
    "bloom": {
      "all": ["Recordar", "Comprendre", "Aplicar", "Analitzar", "Avaluar", "Crear"],
      "highlighted": ["Llista els nivells de la taxonomia que s'activen"]
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
  const prompt = `Genera un esborrany complet de l'instrument d'avaluació "${instrumentName}" adaptat a la fitxa de l'alumne: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}
