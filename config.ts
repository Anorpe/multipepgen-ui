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
        generationUrl: 'https://multipepgen-api.medellin.unal.edu.co',
        // URL del servicio de predicción de propiedades y clasificación
        predictionUrl: 'http://ampclass-api.medellin.unal.edu.co',
    },
};

export default config;
