
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
  { name: 'Qüestionaris', desc: 'Instruments d’autoregulació i motivació per reflexionar sobre el que se sap i el que cal saber.' },
  { name: 'Imatges, fotografies, vídeos', desc: 'Recollida de pensaments-clau a partir de suports visuals o audiovisuals.' },
  { name: 'Organitzadors gràfics', desc: 'Bases d’orientació o Diagrames de fluix per planificar les accions de la tasca.' },
  { name: 'Mapes i esquemes', desc: 'Mapes conceptuals, mentals o de pensament (Visual Thinking) per representar relacions.' },
  { name: 'Línies de temps', desc: 'Ordenació de seqüències de fets per visualitzar la relació temporal.' },
  { name: 'Diagrames (V de Gowin)', desc: 'Eina per interrelacionar idees teòriques amb els procediments emprats.' },
  { name: 'Dianes d’avaluació', desc: 'Instrument visual per determinar el nivell d’assoliment en diverses dimensions.' },
  { name: 'KPSI', desc: 'Qüestionari inicial i final per autoregular l’aprenentatge comparant el progrés.' },
  { name: 'Rúbriques', desc: 'Taules que expliciten les expectatives i guien l’autoreflexió de l’alumne.' },
  { name: 'Entrevistes / Converses', desc: 'Feedback efectiu durant el procés per conèixer preferències i motivacions.' },
  { name: 'Observació d’aula', desc: 'Graelles de control de comportaments observables i criteris d’assoliment.' },
  { name: 'Proves de coneixements', desc: 'Proves competencials per valorar l’assoliment dels sabers del currículum.' }
];

export const BLOOM_LEVELS = [
  'Recordar', 'Comprendre', 'Aplicar', 'Analitzar', 'Avaluar', 'Crear'
];
