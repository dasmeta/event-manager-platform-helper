const loggerDb = "mongo";

const dbLogger = require(`./${loggerDb}Logger`);

module.exports = exports = {
    ...dbLogger
};
