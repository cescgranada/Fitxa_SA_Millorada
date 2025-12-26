
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * SYSTEM INSTRUCTIONS PER A L'ASSISTENT PEDAGÒGIC NOU PATUFET
 * Aquestes instruccions defineixen el marc ètic, pedagògic i funcional de la IA.
 */
const SYSTEM_PROMPT = `
Ets un Expert en Pedagogia i Disseny Curricular (LOMLOE Catalunya), especialitzat en l'ESO i el projecte educatiu de l'Escola Nou Patufet. 

LES TEVES INSTRUCCIONS DE SISTEMA SÓN:

1. ROL I EXPERTISA: Actua com un consultor sènior per a docents. El teu objectiu és elevar la qualitat de les fitxes de Situacions d'Aprenentatge (SA).
2. FIDELITAT A LA PROPOSTA: Respecta sempre la idea original del docent. No canvies el tema. Si el docent proposa un experiment de física sobre la "Caiguda Lliure", no ho derivis cap a un tema social genèric. Enriqueix-lo científicament.
3. COHERÈNCIA DE PRODUCTES: Les propostes de lliurables han de tenir sentit disciplinar. 
   - Ciències: Informes de laboratori, vídeos experimentals, infografies de dades.
   - Socials: Podcasts històrics, mapes interactius.
   - NO proposis "enquestes" o "debats" per a temes de càlcul o tècnics on no aporten valor pedagògic real.
4. EIXOS DE L'ESCOLA (RESTRICCIÓ): Només existeixen 4 eixos al centre: Feminisme, Sostenibilitat, Territori i ODS. Prohibit incloure'n d'altres.
5. FITXA DE L'ALUMNE (ESTIL I TO):
   - Adreça't directament a l'alumne/a (segona persona: "Has de fer...", "Investigaràs...").
   - El llenguatge ha de ser de lectura fàcil, operatiu i operacional. 
   - Cada pas ha de ser una instrucció clara que no generi dubtes sobre l'acció a realitzar.
6. ESTRUCTURA DE LA FITXA: Ha de ser completa i incloure: EL CONTEXT (situació), INTRODUCCIÓ (relat o ciència), OBJECTIU (què s'aprèn), DESENVOLUPAMENT (instruccions pas a pas segons agrupament) i LLIURABLE (què s'ha d'entregar).
7. MARCS DE REFERÈNCIA:
   - Aplica la Taxonomia de Bloom per activar processos cognitius alts.
   - Utilitza les Competències ABPxODS com a eix transversal.
   - Aplica pautes DUA (Disseny Universal per a l'Aprenentatge).
8. INSTRUMENTS D'AVALUACIÓ: Fes servir la llista oficial del centre (Rúbriques, Bases d'orientació, KPSI, etc.) i integra'ls orgànicament en la fitxa de l'alumne perquè sàpiga com serà avaluat.
`;

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
  const prompt = `Analitza aquesta proposta: "${content}". 
  Fase SA: ${SAPhaseLabels[phase]}.
  Suggereix millores pedagògiques mantenint la coherència amb el tema original.
  
  Torna un JSON:
  {
    "improvementSuggestion": "Explicació per al docent de les millores aplicades.",
    "improved": {
      "titol": "Títol definitiu",
      "context": "Context de la proposta",
      "objectius": ["Llista d'objectius per a l'alumne"],
      "desenvolupament": [{"nom": "Pas", "descripcio": "Acció"}]
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
  const prompt = `Proposa 3 productes finals coherents amb la matèria del contingut: ${JSON.stringify(improvedContent)}.
  Instrument d'avaluació: "${instrumentName}".
  Sigues molt específic: si el tema és científic, el producte ha de ser tècnic. NO proposis enquestes si no tenen sentit amb la matèria.

  Torna un JSON:
  {
    "proposals": [
      { "id": "1", "titol": "Producte 1", "descripcio": "Detall operacional", "format": "Tipus de fitxer/suport" },
      { "id": "2", "titol": "Producte 2", "descripcio": "Detall operacional", "format": "Tipus de fitxer/suport" },
      { "id": "3", "titol": "Producte 3", "descripcio": "Detall operacional", "format": "Tipus de fitxer/suport" }
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
  const prompt = `ESCRIU LA FITXA DEFINITIVA PER A L'ALUMNE (Lectura fàcil i instruccions completes).
  Logística: ${groupingType} ${groupingType === GroupingType.GRUP ? `en grups de ${memberCount}` : ''}.
  Producte: ${selectedProduct.titol} (${selectedProduct.format}).
  Instrument d'avaluació: ${instrumentName}.
  Comentaris del docent a integrar: ${userComments}.

  Recorda: Adreça't a l'alumne directament. Instruccions pas a pas. Estructura amb: EL CONTEXT, INTRODUCCIÓ, OBJECTIU, DESENVOLUPAMENT PAS A PAS, i QUÈ HAS DE LLIURAR.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la fitxa.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Fes el resum curricular de la fitxa: ${content}.
  IMPORTANT: Recorda que els Eixos de l'Escola només poden ser: Feminisme, Sostenibilitat, Territori, ODS.
  
  Torna un JSON:
  {
    "competencies": [{"code": "Codi", "definition": "Definició LOMLOE"}],
    "sabers": ["Llista de sabers"],
    "eixosEscola": {
      "all": ["Feminisme", "Sostenibilitat", "Territori", "ODS"],
      "highlighted": ["Màxim 2 eixos clau de la fitxa"]
    },
    "ods": {
      "all": ["Llista ODS"],
      "highlighted": ["Màxim 2 ODS"]
    },
    "competenciesABP": {
      "all": ["Pensament sistèmic", "Anticipació", "Valors i creences", "Estratègica", "Col·laboració", "Pensament crític", "Consciència d’un mateix", "Resolució de problemes integrada"],
      "highlighted": ["LA competència ABPxODS que més destaca en aquesta activitat"]
    },
    "bloom": {
      "all": ["Recordar", "Comprendre", "Aplicar", "Analitzar", "Avaluar", "Crear"],
      "highlighted": ["Nivells cognitius clau"]
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
  const prompt = `Crea l'instrument "${instrumentName}" detallat basat en la fitxa d'alumne: ${content}. Ha de ser una guia clara d'autoavaluació per a l'estudiant.`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}
