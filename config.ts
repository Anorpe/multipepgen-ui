/// <reference types="vite/client" />

/**
 * Configuración centralizada de la aplicación.
 * Define las URLs de los servicios de backend.
 */

interface Config {
    api: {
        generationUrl: string;
        predictionUrl: string;
    };
}

const config: Config = {
    api: {
        // URL del servicio de generación de péptidos
        // Usamos rutas relativas para que el proxy reverso del servidor (Nginx) maneje el redireccionamiento interno
        generationUrl: '/api/generate',
        // URL del servicio de predicción de propiedades y clasificación
        predictionUrl: '/api/predict',
    },
};

export default config;
