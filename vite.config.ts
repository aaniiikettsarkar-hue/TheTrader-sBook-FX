import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig(({ mode }) => {
    // Load environment variables.
    const env = loadEnv(mode, process.cwd(), ''); 

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
            // FIX FOR RENDER DEPLOYMENT
            // Allows the public Render domain to access the Vite server when testing locally.
            allowedHosts: [
                'localhost',
                '127.0.0.1',
                'thetrader-sbook-fx.onrender.com'
            ],
        },
        plugins: [react()],
        define: {
            // CRITICAL FIX: Ensures the client-side code (which expects process.env.GEMINI_API_KEY) 
            // is populated by the VITE_GEMINI_API_KEY variable you set in Render.
            'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
    };
});
