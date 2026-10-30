let cachedHandler;

export default async function handler(req, res) {
  if (!cachedHandler) {
    const server = require('../dist/main.js')
    cachedHandler = server.handler ?? server.default;
  }
  return cachedHandler(req, res);
}