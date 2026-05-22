const ok   = (message, data = null) => ({
    success: true, message, data, timestamp: new Date().toISOString()
});
const fail = (message, errors = null) => ({
    success: false, message, errors, timestamp: new Date().toISOString()
});

module.exports = { ok, fail };