/// <reference types="vite/client" />

/**
 * Configuración centralizada de la aplicación.
 * Valida que las variables de entorno requeridas estén presentes.
 */

interface Config {
    api: {
        generationUrl: string;
        predictionUrl: string;
    };
}

const config: Config = {
    api: {
        generationUrl: import.meta.env.VITE_GENERATION_API_URL || '',
        predictionUrl: import.meta.env.VITE_PREDICTION_API_URL || '',
    },
};

// Validación básica en tiempo de ejecución (opcional, para desarrollo)
if (!config.api.generationUrl) {
    console.warn(
        '⚠️ Falta VITE_GENERATION_API_URL en las variables de entorno. Las llamadas a la API de generación fallarán.'
    );
}

if (!config.api.predictionUrl) {
    console.warn(
        '⚠️ Falta VITE_PREDICTION_API_URL en las variables de entorno. Las llamadas a la API de predicción fallarán.'
    );
}

export default config;
