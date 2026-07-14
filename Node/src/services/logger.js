const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');

const logDir = path.join(
    'D:',
    'Meus Documentos',
    'Fabrica',
    'PCP',
    'Gabriel',
    'Projetos',
    'IniciarWebService',
    'Logs'
);

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const transport = new winston.transports.DailyRotateFile({

    // Exemplo:
    // logs/2026-05-22.log
    filename: path.join(logDir,'Integração-SOAP-QA-%DATE%.log'),

    datePattern: 'YYYY-MM-DD',

    zippedArchive: false

});

const logger = winston.createLogger({

    level: 'info',

    format: winston.format.combine(

        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),

        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })

    ),

    transports: [

        transport,

        new winston.transports.Console()

    ]

});


// ======================================================
// DATA/HORA
// ======================================================

const getCurrentDateTime = () => {

    const now = new Date();

    return now.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    });

};

module.exports = logger;