
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
  format: string; // Ex: Informe escrit, Vídeo, Pòdcast, Infografia...
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
  { name: 'Qüestionaris', desc: 'Són instruments d’autoregulació i motivació que serveixen perquè l’estudiant reflexioni sobre què sap i què cal saber.' },
  { name: 'Imatges, fotografies, vídeos', desc: 'Permet concentrar idees i recollir pensaments-clau. Es pot realitzar de manera individual o grupal.' },
  { name: 'Organitzadors gràfics', desc: 'Bases d’orientació o Diagrames de fluix per anticipar i planificar les accions de la tasca.' },
  { name: 'Mapes i esquemes', desc: 'Mapes conceptuals, de pensament o mentals per representar visualment la relació entre conceptes.' },
  { name: 'Línies de temps', desc: 'Eina per ordenar una seqüència de fets visualitzant la seva relació temporal.' },
  { name: 'Diagrames (V de Gowin)', desc: 'Eina per establir relacions entre aspectes conceptuals i metodològics.' },
  { name: 'Dianes d’avaluació', desc: 'Instrument visual per determinar el nivell d’assoliment en diferents dimensions.' },
  { name: 'KPSI', desc: 'Knowledge and Prior Study Inventory: qüestionari per recollir el punt de partida i l’evolució.' },
  { name: 'Rúbriques', desc: 'Eina per mostrar clarament les expectatives i guiar l’autoavaluació.' },
  { name: 'Entrevistes / Converses', desc: 'Tècnica per conèixer les preferències i motivacions i fer un feedback efectiu durant el procés.' },
  { name: 'Observació d’aula', desc: 'Graelles sistemàtiques de control d’actuacions o comportaments observables.' },
  { name: 'Proves de coneixements', desc: 'Proves competencials per conèixer el nivell d’assoliment dels sabers bàsics.' }
];

export const BLOOM_LEVELS = [
  'Recordar', 'Comprendre', 'Aplicar', 'Analitzar', 'Avaluar', 'Crear'
];
