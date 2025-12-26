
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels, GroupingType } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en disseny instruccional i pedagogia (LOMLOE Catalunya). La teva funció és analitzar propostes educatives i transformar-les en material d'alta qualitat per a l'alumnat de l'Escola Nou Patufet.

IMPORTANT: 
- L'instrument d'avaluació ha de ser coherent amb el producte que demanem a l'alumnat.
- La fase de l'aprenentatge determina la profunditat i tipus de fitxa.
- L'agrupament influeix directament en la redacció de la logística.`;

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

export async function proposeProducts(improvedContent: any, instrumentName: string, grouping: string, phase: string, modelName: string) {
  const prompt = `Basant-te en la proposta millorada, l'instrument d'avaluació "${instrumentName}", l'agrupament "${grouping}" i la fase "${phase}", proposa 3 opcions de lliurament (productes finals) que els alumnes puguin crear. 
  Cada producte ha de poder-se avaluar correctament amb l'instrument "${instrumentName}".

  Torna un JSON amb:
  {
    "proposals": [
      { "id": "1", "titol": "Títol 1", "descripcio": "Breu descripció del producte" },
      { "id": "2", "titol": "Títol 2", "descripcio": "Breu descripció del producte" },
      { "id": "3", "titol": "Títol 3", "descripcio": "Breu descripció del producte" }
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
  const prompt = `CREA LA FITXA PER A L'ALUMNAT (Guia de Treball).
  
  Dades Clau:
  - Contingut: ${JSON.stringify(improvedContent)}
  - Producte a realitzar: ${selectedProduct.titol} (${selectedProduct.descripcio})
  - Agrupament: ${groupingType} ${groupingType === GroupingType.GRUP ? `(Equips de ${memberCount})` : ''}
  - Instrument d'avaluació: ${instrumentName}
  - Matisos docent: ${userComments}

  L'estructura de la fitxa ha de ser:
  1. El Context: Defineix la situació o escenari.
  2. Introducció / Història: Crea un relat motivador.
  3. L'Objectiu de la fitxa: Què ha d'aconseguir l'alumne?
  4. El desenvolupament que ha de fer l'alumne pas a pas: Instruccions per crear el producte "${selectedProduct.titol}".
  5. El material que ha de lliurar l'alumnat: Descripció del lliurable final adaptat a l'instrument ${instrumentName}.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });

  return response.text || "Error generant la guia.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Genera un resum curricular exhaustiu per a la següent fitxa d'alumne: ${content}.
  
  Torna un JSON amb aquesta estructura:
  {
    "competencies": [{"code": "Codi LOMLOE", "definition": "Definició completa"}],
    "sabers": ["..."],
    "eixosEscola": {
      "all": ["Feminisme", "Territori", "Sostenibilitat", "ODS", "Llengua catalana", "Amor/Benestar", "Transformació"],
      "highlighted": ["Màxim 2"]
    },
    "ods": {
      "all": ["Llista dels 17 ODS simplificats"],
      "highlighted": ["Màxim 2 principals"]
    },
    "competenciesABP": {
      "all": ["Pensament sistèmic", "Anticipació", "Normativa", "Estratègica", "Col·laboració", "Pensament crític", "Autoconeixement", "Resolució de problemes"],
      "highlighted": ["Màxim 2 principals"]
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
  const prompt = `Genera l'instrument d'avaluació complet "${instrumentName}" basat en la següent Guia de Treball: ${content}`;
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT }
  });
  return response.text;
}
