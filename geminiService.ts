
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya), especialitzat en el projecte educatiu de l'Escola Nou Patufet.

EIXOS NOU PATUFET: Territori, Feminisme, Món sostenible (ODS), Llengua catalana, Amor/Benestar, Transformació.
COMPETÈNCIES ABPxODS: Pensament sistèmic, Anticipació, Valors i creences, Estratègica, Col·laboració, Pensament crític, Consciència d’un mateix, Resolució de problemes integrada.
TAXONOMIA DE BLOOM: Recordar, Comprendre, Aplicar, Analitzar, Avaluar, Crear.
PAUTES DUA: Aplica sempre el Disseny Universal per a l'Aprenentatge per garantir la inclusió i l'accessibilitat.

IMPORTANT: 
- L'instrument d'avaluació ha de ser coherent amb el producte que demanem a l'alumnat.
- La fase de l'aprenentatge determina el tipus d'activitat.
- L'agrupament és fonamental per a la logística de la fitxa.
- El producte final (Vídeo, Podcast, Infografia, etc.) ha de ser avaluat per l'instrument triat.`;

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
  const prompt = `Analitza aquesta proposta educativa i presenta una "Proposta de Millora" basada en criteris pedagògics rigorosos i l'enfocament de l'Escola Nou Patufet.
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

export async function proposeProducts(improvedContent: any, instrumentName: string, grouping: string, phase: string, modelName: string) {
  const prompt = `Basant-te en la proposta millorada, l'instrument d'avaluació "${instrumentName}", l'agrupament "${grouping}" i la fase "${phase}", proposa 3 opcions de lliurament que els alumnes hagin de crear.
  Cada opció ha de ser un producte tangible (Ex: Informe escrit, Vídeo, Pòdcast, Infografia, Maqueta digital, etc.).
  
  Torna un JSON amb:
  {
    "proposals": [
      { "id": "1", "titol": "Nom del repte", "descripcio": "Breu descripció", "format": "Ex: Vídeo" },
      { "id": "2", "titol": "Nom del repte", "descripcio": "Breu descripció", "format": "Ex: Pòdcast" },
      { "id": "3", "titol": "Nom del repte", "descripcio": "Breu descripció", "format": "Ex: Infografia" }
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
  const prompt = `CREA LA FITXA PER A L'ALUMNAT (Guia de Treball en format text).
  
  Configuració:
  - Contingut Base: ${JSON.stringify(improvedContent)}
  - Producte a realitzar: ${selectedProduct.titol} (Format: ${selectedProduct.format})
  - Organització: ${groupingType} ${groupingType === GroupingType.GRUP ? `(Equips de ${memberCount})` : ''}
  - Instrument d'Avaluació: ${instrumentName}
  - Observacions: ${userComments}

  Estructura OBLIGATÒRIA de la fitxa (escrita directament per a l'alumne):
  1. El Context: Situació o escenari real o previsible.
  2. Introducció històrica: Si s’escau, afegeix context històric motivador.
  3. L'Objectiu de la fitxa: Què s'espera aconseguir?
  4. Desenvolupament pas a pas: Instruccions precises de què ha de fer l'alumnat, especificant clarament la dinàmica (${groupingType}).
  5. Material a lliurar: Descripció detallada del format ${selectedProduct.format} que hauran de presentar i com serà avaluat amb ${instrumentName}.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la guia.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Analitza el vincle curricular de la següent fitxa d'alumne: ${content}.
  
  Torna un JSON amb aquesta estructura:
  {
    "competencies": [{"code": "Codi LOMLOE", "definition": "Definició"}],
    "sabers": ["..."],
    "eixosEscola": {
      "all": ["Territori", "Feminisme", "Món sostenible", "ODS", "Llengua catalana", "Amor/Benestar", "Transformació"],
      "highlighted": ["Màxim 2 principals"]
    },
    "ods": {
      "all": ["Llista dels 17 ODS"],
      "highlighted": ["Màxim 2 principals"]
    },
    "competenciesABP": {
      "all": ["Pensament sistèmic", "Anticipació", "Valors i creences", "Estratègica", "Col·laboració", "Pensament crític", "Consciència d’un mateix", "Resolució de problemes integrada"],
      "highlighted": ["Màxim 2 principals"]
    },
    "bloom": {
      "all": ["Recordar", "Comprendre", "Aplicar", "Analitzar", "Avaluar", "Crear"],
      "highlighted": ["Llista els nivells que s'activen en aquesta fitxa"]
    }
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
  const prompt = `Genera l'instrument d'avaluació "${instrumentName}" basat en la següent fitxa: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}
