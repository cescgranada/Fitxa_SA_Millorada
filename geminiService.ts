
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

Respon SEMPRE en CATALÀ i EXCLUSIVAMENT en format JSON.`;

/**
 * Extreu i parseja el JSON de manera robusta, buscant el primer '{' i l'últim '}'
 */
function robustJSONParse(text: string | undefined) {
  if (!text) throw new Error("La resposta del model està buida.");
  
  try {
    // Busquem el bloc JSON dins del text (per si hi ha markdown o text extra)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No s'ha trobat cap bloc de dades vàlid en la resposta.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Error detallat de parsing:", e, "Text rebut:", text);
    throw new Error("La IA ha retornat dades en un format que no podem llegir. Reintenta-ho.");
  }
}

export async function analyzeAndImprove(content: string, phase: SAPhase, modelName: string, temperature: number) {
  const prompt = `Analitza i millora aquesta activitat per a la fase: ${SAPhaseLabels[phase]}.
  Contingut: ${content}

  Esquema obligatori:
  {
    "improvementSuggestion": "string",
    "improved": {
      "titol": "string",
      "context": "string",
      "objectius": ["string"],
      "desenvolupament": [{"nom": "string", "descripcio": "string"}],
      "outputs": ["string"]
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
            },
            required: ["titol", "context", "objectius", "desenvolupament", "outputs"]
          }
        },
        required: ["improvementSuggestion", "improved"]
      }
    }
  });

  const data = robustJSONParse(response.text);
  
  // Normalització: Si la IA ha tornat les dades "planes" sense l'embolcall 'improved'
  if (!data.improved && data.titol) {
    return {
      improvementSuggestion: data.improvementSuggestion || "Millora pedagògica aplicada.",
      improved: data
    };
  }
  
  return data;
}

export async function generateUDL(content: string, selectedOutput: string, modelName: string, temperature: number) {
  const prompt = `Genera una adaptació DUA per a l'activitat. 
  Producte final triat: ${selectedOutput}
  Contingut estructurat: ${content}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT, temperature }
  });

  return response.text || "No s'ha pogut generar l'adaptació.";
}

export async function generateEvaluation(content: string, instrumentName: string, modelName: string, temperature: number) {
  const prompt = `Crea l'instrument d'avaluació "${instrumentName}" per a aquesta activitat: ${content}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: { systemInstruction: SYSTEM_PROMPT, temperature }
  });

  return response.text || "No s'ha pogut generar l'instrument.";
}

export async function generateSummary(content: string, modelName: string) {
  const prompt = `Genera el resum curricular LOMLOE/Nou Patufet per a: ${content}`;

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

  return robustJSONParse(response.text);
}
