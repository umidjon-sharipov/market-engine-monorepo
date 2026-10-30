const esbuild = require('esbuild');

async function build() {
    try {
        await esbuild.build({
            entryPoints: ['src/main.ts'],
            bundle: true,
            platform: 'node',
            target: 'node20',
            outfile: 'dist/main.js',
            sourcemap: true,
            banner: {
                js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
            },
            external: [
                '@prisma/client',
                '.prisma/client',
                '@nestjs/microservices',
                '@nestjs/websockets',
                '@nestjs/websockets/socket-module.js',
                '@nestjs/microservices/microservices-module.js',
                'class-transformer/storage',
                'cache-manager',
            ],
            loader: { '.ts': 'ts' },
            logLevel: 'info',
        });
        console.log('⚡ NestJS successfully bundled with Esbuild!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();