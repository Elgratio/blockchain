const { fail } = require('../utils/response');
const logger = require('../utils/logger');
const { ZodError } = require('zod');
const multer = require('multer');

function errorHandler(err, req, res, _next) {
    // Log error lengkap
    logger.error(err.stack || err.message || err);

    // Multer file size error
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json(fail('Ukuran file terlalu besar. Maksimal 10 MB.'));
        }
        return res.status(400).json(fail(err.message));
    }

    // Zod validation error
    if (err instanceof ZodError) {
        return res.status(400).json(fail('Validasi gagal', err.errors));
    }

    // Jika error memiliki status code
    const statusCode = err.statusCode || 500;
    const message = err.expose ? err.message : 'Internal server error';

    return res.status(statusCode).json(fail(message));
}

module.exports = errorHandler;