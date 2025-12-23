
import { GoogleGenAI, Type } from "@google/genai";
import { SAPhase, SAPhaseLabels } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `Ets un expert en pedagogia i disseny curricular (LOMLOE Catalunya), especialitzat en l'ESO i l'Escola Nou Patufet.

REGLA DE RENDERITZAT:
- NO utilitzis markdown brut (** o ###) en les explicacions textuals.
- Per a fórmules matemàtiques o químiques, utilitza caràcters Unicode (ex: x², H₂O, √2, ≠) perquè es llegeixi fluidament.

ESTRUCTURA DE LA FITXA:
Tota fitxa millorada ha de tenir:
1. Títol
2. Context
3. Objectius d'aprenentatge (en llista)
4. Desenvolupament (Fases amb nom i descripcio)
5. Proposta de 3-4 Outputs (productes finals) que l'alumne pot triar.

Context Pedagògic Nou Patufet:
- Eixos: Territori, Feminisme, Món sostenible, Llengua catalana, Amor/Benestar, Transformació.
- Competències ABP: Pensament sistèmic, Anticipació, Normativa, Estratègica, Col·laboració, Pensament crític, Autoconeixement, Resolució de problemes.

Respon SEMPRE en CATALÀ.`;

export async function analyzeAndImprove(content: string, phase: SAPhase, modelName: string, temperature: number) {
  const prompt = `Millora aquesta fitxa d'activitat (Fase: ${SAPhaseLabels[phase]}). 
  Contingut original: ${content}

  Torna la resposta en format JSON seguint aquest esquema:
  {
    "improvementSuggestion": "Explicació breu de per què es puja el nivell de Bloom",
    "improved": {
      "titol": "Nom de l'activitat",
      "context": "Context de l'aprenentatge",
      "objectius": ["objectiu 1", "objectiu 2"],
      "desenvolupament": [
        {"nom": "Fase 1: ...", "descripcio": "..."},
        {"nom": "Fase 2: ...", "descripcio": "..."}
      ],
      "outputs": ["Proposta d'output 1", "Proposta d'output 2", "Proposta d'output 3"]
    }
  }`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: temperature,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          improvementSuggestion: { type: Type.STRING },
          improved: {
            type: Type.OBJECT,
            properties: {
              titol: { type: Type.STRING },
              context: { type: Type.STRING },
              objectius: { type: Type.ARRAY, items: { type: Type.STRING } },
              desenvolupament: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nom: { type: Type.STRING },
                    descripcio: { type: Type.STRING }
                  }
                }
              },
              outputs: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateUDL(content: string, selectedOutput: string, modelName: string, temperature: number) {
  const prompt = `Genera una adaptació DUA per a l'activitat. 
  Output seleccionat per l'alumne: ${selectedOutput}
  Contingut: ${content}
  
  Utilitza lectura fàcil, Unicode per a fórmules i passos fragmentats. No usis markdown visible.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      temperature: temperature
    }
  });

  return response.text;
}

export async function generateEvaluation(content: string, instrumentName: string, modelName: string, temperature: number) {
  const prompt = `Crea l'instrument d'avaluació "${instrumentName}" per a aquesta activitat. 
  Contingut: ${content}
  
  Si l'instrument ho permet, proposa una escala d'avaluació.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { 
      systemInstruction: SYSTEM_PROMPT,
      temperature: temperature
    }
  });

  return response.text;
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Analitza el contingut i vincula'l amb la LOMLOE i el projecte Nou Patufet.
  Torna JSON amb:
  - competencies (LOMLOE)
  - sabers (Bàsics)
  - ods (Objectius de Desenvolupament Sostenible)
  - eixosEscola (Territori, Feminisme, Sostenibilitat)
  - competenciesABP (Competències ABPxODS)`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          competencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          sabers: { type: Type.ARRAY, items: { type: Type.STRING } },
          ods: { type: Type.ARRAY, items: { type: Type.STRING } },
          eixosEscola: { type: Type.ARRAY, items: { type: Type.STRING } },
          competenciesABP: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
