
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
  format: string; 
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
  eixosEscola: { all: string[]; highlighted: string[] }; // Feminisme, Sostenibilitat, Territori, ODS
  ods: { all: string[]; highlighted: string[] };
  competenciesABP: { all: string[]; highlighted: string[] };
  bloom: { all: string[]; highlighted: string[] };
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
  { name: 'Qüestionaris / KPSI', desc: 'Autoregulació i motivació. Per reflexionar sobre què sap i què cal saber.' },
  { name: 'Imatges, fotos i vídeos', desc: 'Recollida de pensaments-clau a partir de suport visual.' },
  { name: 'Bases d’orientació', desc: 'Organitzadors gràfics per anticipar i planificar les accions amb èxit.' },
  { name: 'Mapes conceptuals / Mentals', desc: 'Representació visual de relacions entre conceptes o Visual Thinking.' },
  { name: 'Línies de temps', desc: 'Ordenació de fets visualitzant la seva relació temporal.' },
  { name: 'Diagrama UVE de Gowin', desc: 'Interrelació d’idees teòriques amb els procediments emprats.' },
  { name: 'Dianes d’avaluació', desc: 'Visualització de nivells d’assoliment en diferents dimensions.' },
  { name: 'Rúbriques', desc: 'Expectatives clares per guiar l’autoreflexió i la coavaluació.' },
  { name: 'Entrevistes / Diàlegs', desc: 'Feedback efectiu durant el procés sobre preferències i motivacions.' },
  { name: 'Observació d’aula', desc: 'Graelles de control d’actuacions o comportaments observables.' },
  { name: 'Proves de coneixements', desc: 'Valoració competencial dels sabers del currículum.' }
];

export const BLOOM_LEVELS = [
  'Recordar', 'Comprendre', 'Aplicar', 'Analitzar', 'Avaluar', 'Crear'
];
