
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

export interface ProductProposal {
  id: string;
  titol: string;
  descripcio: string;
}

export interface ActivityPhase {
  nom: string;
  descripcio: string;
}

export interface ImprovedContent {
  titol: string;
  context: string;
  objectius: string[];
  desenvolupament: ActivityPhase[];
}

export interface SummaryData {
  competencies: { code: string; definition: string }[];
  sabers: string[];
  eixosEscola: { all: string[]; highlighted: string[] };
  ods: { all: string[]; highlighted: string[] };
  competenciesABP: { all: string[]; highlighted: string[] };
}

export interface PedagogicalAnalysis {
  originalContent: string;
  improved: ImprovedContent;
  improvementSuggestion: string;
  studentGuide: string;
  groupingType: GroupingType;
  memberCount: number;
  userComments: string;
  evaluationInstrument?: string;
  selectedInstrumentName?: string;
  productProposals?: ProductProposal[];
  selectedProduct?: ProductProposal;
  summaryTable?: SummaryData;
}

export enum AppStep {
  UPLOAD = 1,
  ANALYSIS = 2,
  PRODUCT_SELECTION = 3,
  STUDENT_GUIDE = 4,
  SUMMARY = 5
}

export const EVALUATION_INSTRUMENTS = [
  { name: 'Bases d’orientació', desc: 'Guies estructurades que presenten els passos o aspectes clau per realitzar una tasca.' },
  { name: 'Coavaluació', desc: 'Procés on els estudiants avaluen el treball dels seus companys.' },
  { name: 'KPSI', desc: 'Qüestionaris inicials per identificar coneixements previs.' },
  { name: 'Rúbriques', desc: 'Taules que descriuen nivells de qualitat en l’assoliment de competències.' },
  { name: 'Autoavaluació', desc: 'Eina perquè l’alumnat reflexioni sobre el seu propi procés.' },
  { name: 'Contracte d’avaluació', desc: 'Acord entre docent i alumne sobre objectius i compromisos.' },
  { name: 'Diari d’equip', desc: 'Registre col·laboratiu on els membres d’un grup documenten el progres.' },
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
