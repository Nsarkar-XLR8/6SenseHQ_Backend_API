import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*containerized.test.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
        ],
        hookTimeout: 300_000, // Increase hook timeout for pulling docker images
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
