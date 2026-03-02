/**
 * Removes Content-Security-Policy header that blocks scripts and DevTools in local development.
 * The header "default-src 'none'" from serve-static/finalhandler breaks UI5 loading.
 */
module.exports = function () {
  return function (req, res, next) {
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = function (name, ...args) {
      if (name && String(name).toLowerCase() === "content-security-policy") {
        return res;
      }
      return originalSetHeader(name, ...args);
    };
    next();
  };
};
