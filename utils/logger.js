const chalk = require('chalk');

function timestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

module.exports = {
  info: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.blue('[INFO]')} ${msg}`),
  success: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.green('[OK]')} ${msg}`),
  warn: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.yellow('[WARN]')} ${msg}`),
  error: (msg, err) => {
    console.log(`${chalk.gray(timestamp())} ${chalk.red('[ERROR]')} ${msg}`);
    if (err) console.error(err);
  },
  event: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.magenta('[EVENT]')} ${msg}`),
  command: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.cyan('[CMD]')} ${msg}`)
};
