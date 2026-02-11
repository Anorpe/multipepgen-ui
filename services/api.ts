
import config from '../config';
import { GenerationParams, PeptideFunctionality } from '../types';

interface RemoteGenerationResponse {
    generated_better_prediction: string[];
    generated_more_stable: string[];
}

interface RemoteGenerationPayload {
    n_gens: number;
    functionalities: string[];
}

export interface PredictionResponse {
    Peptido: string;
    "Regresión Lógistica": number;
    "Red Neuronal": number;
    "Arbol de Decisión": number;
    "Bosque Aleatorio": number;
    "XGboost": number;
    "Clasificación Regresión Lógistica": string;
    "Clasificación Red Neuronal": string;
    "Clasificación Arbol de Decisión": string;
    "Clasificación Bosque Aleatorio": string;
    "Clasificación XGboost": string;
    longitud: number;
    carga: number;
    "momento hidrofobico": number;
    "porcentaje hidrofobico": number;
    "punto isoelectrico": number;
    "indice de boman": number;
    "polar angles": number;
    wimley: number;
    "helices transmembrana": string;
}

export const generatePeptidesRemote = async (params: GenerationParams): Promise<RemoteGenerationResponse> => {
    // Map functionalities to the specific strings expected by the backend
    // Backend expects: "antimicrobiano", "antibacteriano", "antigramneg", "antigrampos", "antifungico", "antiviral", "anticancer"
    // Frontend Enum: ANTI_GRAM_POSITIVE, ANTI_GRAM_NEGATIVE, ANTIBACTERIAL, ANTIVIRAL, ANTIFUNGAL, ANTICANCER

    // Simple mapping based on the enum values in types.ts
    // Types.ts enum values are descriptions like 'Anti-Gram Positive'. We need to map these to the backend keys.
    const functionalityMapping: Record<string, string> = {
        [PeptideFunctionality.ANTI_GRAM_POSITIVE]: 'antigrampos',
        [PeptideFunctionality.ANTI_GRAM_NEGATIVE]: 'antigramneg',
        [PeptideFunctionality.ANTIBACTERIAL]: 'antibacteriano',
        [PeptideFunctionality.ANTIVIRAL]: 'antiviral',
        [PeptideFunctionality.ANTIFUNGAL]: 'antifungico',
        [PeptideFunctionality.ANTICANCER]: 'anticancer',
    };

    const functionalities = params.functionalities.map(f => functionalityMapping[f]).filter(Boolean);

    // If "Antibacterial" is selected, the specific request example used "antibacteriano". 
    // If multiple are selected, we send all of them.

    const payload: RemoteGenerationPayload = {
        n_gens: params.count,
        functionalities: functionalities
    };

    // Use direct URL for production readiness (requires CORS on backend)
    // Using /generate/ endpoint as per previous proxy config
    const url = `${config.api.generationUrl}/generate/`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
};

export const predictPeptidesRemote = async (sequences: string[]): Promise<PredictionResponse[]> => {
    // Use direct URL for production readiness
    // Using /predict endpoint as per previous proxy config
    const url = `${config.api.predictionUrl}/predict`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequences }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prediction API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
};
