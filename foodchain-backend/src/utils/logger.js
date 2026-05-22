const c = {
  r:  '\x1b[0m',
  g:  '\x1b[32m',
  y:  '\x1b[33m',
  re: '\x1b[31m',
  cy: '\x1b[36m',
  gr: '\x1b[90m'
};
const ts = () => new Date().toISOString().slice(11, 23);

const logger = {
  info:  m => console.log(c.gr + '[' + ts() + ']' + c.r + ' ' + c.g  + 'INFO ' + c.r + ' ' + m),
  warn:  m => console.log(c.gr + '[' + ts() + ']' + c.r + ' ' + c.y  + 'WARN ' + c.r + ' ' + m),
  error: m => console.log(c.gr + '[' + ts() + ']' + c.r + ' ' + c.re + 'ERROR' + c.r + ' ' + m),
};

module.exports = logger;