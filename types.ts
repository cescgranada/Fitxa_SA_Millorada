
export enum SAPhase {
  INICIAL = 'a',
  DESENVOLUPAMENT = 'b',
  SINTESI = 'c',
  APLICACIO = 'd'
}

export const SAPhaseLabels: Record<SAPhase, string> = {
  [SAPhase.INICIAL]: 'Inicials (Què en sé?)',
  [SAPhase.DESENVOLUPAMENT]: 'Desenvolupament (Què estic aprenent?)',
  [SAPhase.SINTESI]: 'Síntesi (Què he après?)',
  [SAPhase.APLICACIO]: 'Aplicació (Com ho transfereixo?)'
};

export enum GroupingType {
  INDIVIDUAL = 'Individual',
  GRUP = 'Treball en Grup'
}

export const OUTPUT_FORMATS = [
  { id: 'mapa', label: 'Mapa conceptual', icon: '🌿' },
  { id: 'resum', label: 'Resum executiu', icon: '📄' },
  { id: 'preguntes', label: 'Guia de preguntes', icon: '❓' },
  { id: 'infografia', label: 'Infografia de text', icon: '📊' },
  { id: 'cas', label: 'Estudi de cas', icon: '🔎' },
  { id: 'exercicis', label: 'Exercicis pràctics', icon: '✏️' }
];

export interface ActivityPhase {
  nom: string;
  descripcio: string;
}

export interface ImprovedContent {
  titol: string;
  context: string;
  objectius: string[];
  desenvolupament: ActivityPhase[];
  outputs: string[];
}

export interface PedagogicalAnalysis {
  originalContent: string;
  improved: ImprovedContent;
  selectedOutput?: string;
  improvementSuggestion: string;
  studentGuide: string;
  groupingType?: GroupingType;
  memberCount?: number;
  userComments?: string;
  evaluationInstrument?: string;
  selectedInstrumentName?: string;
  summaryTable?: {
    competencies: string[];
    sabers: string[];
    ods: string[];
    eixosEscola: string[];
    competenciesABP: string[];
  };
}

export enum AppStep {
  UPLOAD = 1,
  ANALYSIS = 2,
  STUDENT_GUIDE = 3,
  EVALUATION_SELECT = 4,
  SUMMARY = 5
}

export const EVALUATION_INSTRUMENTS = [
  { name: 'Bases d’orientació', desc: 'Guies estructurades que presenten els passos o aspectes clau per realitzar una tasca.' },
  { name: 'Coavaluació', desc: 'Procés on els estudiants avaluen el treball dels seus companys.' },
  { name: 'KPSI', desc: 'Qüestionaris inicials per identificar coneixements previs.' },
  { name: 'Rúbriques', desc: 'Taules que descriuen nivells de qualitat en l’assoliment de competències.' },
  { name: 'Autoavaluació', desc: 'Eina perquè l’alumnat reflexioni sobre el seu propi procés.' },
  { name: 'Contracte d’avaluació', desc: 'Acord entre docent i alumne sobre objectius i compromisos.' },
  { name: 'Diari d’equip', desc: 'Registre col·laboratiu on els membres d’un grup documenten el progrés.' },
  { name: 'Mapa conceptual', desc: 'Representació gràfica que mostra la relació entre conceptes.' },
  { name: 'Diana d’avaluació', desc: 'Eina visual que representa el grau d’assoliment en forma de gràfic circular.' },
  { name: 'Organitzadors gràfics', desc: 'Estructures visuals que ajuden a organitzar informació.' },
  { name: 'Tickets d’entrada, mig i sortida', desc: 'Preguntes breus per recollir informació ràpida.' },
  { name: 'Escala de metacognició', desc: 'Instrument per valorar la capacitat de planificar i avaluar el propi aprenentatge.' },
  { name: 'Observació d’aula', desc: 'Recollida sistemàtica de dades sobre comportaments i interaccions.' },
  { name: 'Feedback entre iguals', desc: 'Retroalimentació constructiva entre companys.' },
  { name: 'Diaris d’aprenentatge', desc: 'Registres personals de reflexió sobre el procés.' },
  { name: 'Portafolis digitals', desc: 'Recull organitzat d’evidències del treball de l’alumnat.' }
];
