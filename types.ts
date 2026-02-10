
export enum GenerationMethod {
  PREDICTION = 'Better at Prediction',
  STABILITY = 'More Stable'
}

export enum PeptideFunctionality {
  ANTI_GRAM_POSITIVE = 'Anti-Gram Positive',
  ANTI_GRAM_NEGATIVE = 'Anti-Gram Negative',
  ANTIBACTERIAL = 'Antibacterial',
  ANTIVIRAL = 'Antiviral',
  ANTIFUNGAL = 'Antifungal',
  ANTICANCER = 'Anticancer'
}

export interface PeptideResult {
  id: string;
  sequence: string;
  probabilities: Record<string, number>;
  length: number;
  molecularWeight: number;
  isoelectricPoint: number;
  hydrophobicity: number;
  modelSource: GenerationMethod;
}

export interface GenerationParams {
  count: number;
  methods: GenerationMethod[]; // Changed from single method to array
  functionalities: PeptideFunctionality[];
  excludedAminoAcids: string[];
  minLength: number;
  maxLength: number;
  threshold: number;
}

export interface ResearchInsight {
  summary: string;
  potentialApplications: string[];
  structuralNotes: string;
}
