const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://market-engine-monorepo.vercel.app',
    'https://panel-market-engine-monorepo.vercel.app',
];

export function getAllowedOrigins(
    configured = process.env.ALLOW_ORIGINS,
): string[] {
    if (!configured?.trim()) {
        return DEFAULT_ALLOWED_ORIGINS;
    }

    let parsedOrigins: unknown;
    try {
        parsedOrigins = JSON.parse(configured);
    } catch {
        parsedOrigins = configured
            .replace(/^\s*\[|\]\s*$/g, '')
            .split(',')
            .map((origin) => origin.trim().replace(/^['"]|['"]$/g, ''));
    }

    const origins =
        typeof parsedOrigins === 'string' ? [parsedOrigins] : parsedOrigins;
    if (!Array.isArray(origins) || origins.length === 0) {
        throw new Error(
            'ALLOW_ORIGINS must be a non-empty JSON array or comma-separated list',
        );
    }

    return origins.map((origin: unknown) => {
        if (typeof origin !== 'string' || !origin.trim()) {
            throw new Error(
                'ALLOW_ORIGINS entries must be non-empty origin strings',
            );
        }

        let url: URL;
        try {
            url = new URL(origin.trim());
        } catch {
            throw new Error(`Invalid origin in ALLOW_ORIGINS: ${origin}`);
        }

        if (
            !['http:', 'https:'].includes(url.protocol) ||
            url.pathname !== '/' ||
            url.search ||
            url.hash ||
            url.username ||
            url.password
        ) {
            throw new Error(`Invalid origin in ALLOW_ORIGINS: ${origin}`);
        }

        return url.origin;
    });
}
