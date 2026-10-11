let cachedHandler;

module.exports = async (req, res) => {
  if (!cachedHandler) {
    const server = await import('../dist/main.js');
    cachedHandler = server.handler ?? server.default;
  }
  return cachedHandler(req, res);
};