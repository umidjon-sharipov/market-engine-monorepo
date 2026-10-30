let cachedHandler;

export default async function handler(req, res) {
    if (!cachedHandler) {
        const server = await import('../dist/main.js');
        const app = server.default ?? server;
        cachedHandler = app.handler ?? app;
    }

    return cachedHandler(req, res);
}