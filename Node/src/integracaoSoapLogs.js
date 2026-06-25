const cron = require('node-cron');
const logger = require('./services/logger');

const postApontamento = require('./services/postApontamentoService');
const sequenciamentoService = require('./services/sequenciamentoService');
const recursoService = require('./services/recursoService');
const dadosProduto = require('./services/dadosProdutoService');
const etiqueta = require('./services/etiquetaService');
const postComponente = require('./services/postComponenteService');
const obterCadastroInspQualidade = require('./services/obterCadastroInspQualidade');
const obterEtiquetaFingerService = require('./services/obterEtiquetaFingerService');
const postConfirmaEtq = require('./services/postConfirmaEtq');




// ======================================================
// DATA/HORA
// ======================================================

const getCurrentDateTime = () => {

    const now = new Date();

    return now.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    });

};


// ======================================================
// FUNÇÃO PRINCIPAL
// ======================================================

const integracaoSoap = async () => {

    try {

        //logger.info(`[POST_APONTAMENTO] Iniciado em ${getCurrentDateTime()}`);

        await postApontamento.postApontamentoForSapiens();

        logger.info(`[POST_APONTAMENTO] Finalizado com sucesso em ${getCurrentDateTime()}`);


        // Executa sequenciamento 5 minutos depois
        setTimeout(async () => {

            try {

                //logger.info(`[SEQUENCIAMENTO] Iniciado em ${getCurrentDateTime()}`);

                await sequenciamentoService.getSequenciamentoFromSapiens();

                logger.info(`[SEQUENCIAMENTO] Finalizado com sucesso em ${getCurrentDateTime()}`);

            } catch (error) {

                logger.error(
                    `[SEQUENCIAMENTO] ${error.stack || error.message || error}`
                );

            }

        }, 5 * 60 * 1000);

    } catch (error) {

        logger.error(
            `[POST_APONTAMENTO] ${error.stack || error.message || error}`
        );

    }

};


// ======================================================
// CRON - POST APONTAMENTO
// ======================================================

cron.schedule('*/27 * * * *', async () => {

    try {

        //logger.info(`[CRON] Executando POST_APONTAMENTO`);

        await integracaoSoap();

    } catch (error) {

        logger.error(
            `[POST_APONTAMENTO] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// CRON - RECURSO + DADOS PRODUTO
// ======================================================

cron.schedule('0 17 * * 0', async () => {

    try {

        //logger.info(`[RECURSO] Iniciado em ${getCurrentDateTime()}`);

        await recursoService.getRecursoFromSapiens();

        logger.info(`[RECURSO] Finalizado com sucesso`);

        //logger.info(`[DADOS_PRODUTO] Iniciado em ${getCurrentDateTime()}`);

        await dadosProduto.getDadosProdutoFromSapiens();

        logger.info(`[DADOS_PRODUTO] Finalizado com sucesso`);

    } catch (error) {

        logger.error(
            `[RECURSO/DADOS_PRODUTO] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// CRON - ETIQUETA
// ======================================================

cron.schedule('*/35 * * * *', async () => {

    try {

        //logger.info(`[ETIQUETA] Iniciado em ${getCurrentDateTime()}`);

        await etiqueta.getEtiquetaFromSapiens();

        logger.info(`[ETIQUETA] Finalizado com sucesso`);

    } catch (error) {

        logger.error(
            `[ETIQUETA] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// CRON - POST COMPONENTE
// ======================================================

cron.schedule('*/15 * * * *', async () => {

    try {

        //logger.info(`[POST_COMPONENTE] Iniciado em ${getCurrentDateTime()}`);

        await postComponente.postApontamentoComponentesForSapiens();

        logger.info(`[POST_COMPONENTE] Finalizado com sucesso`);

    } catch (error) {

        logger.error(
            `[POST_COMPONENTE] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// CRON - INSPEÇÃO QUALIDADE
// ======================================================

cron.schedule('*/60 * * * *', async () => {

    try {

        //logger.info(`[INSP_QUALIDADE] Iniciado em ${getCurrentDateTime()}`);

        await obterCadastroInspQualidade.getObterCadastroInspQualidade();

        logger.info(`[INSP_QUALIDADE] Finalizado com sucesso`);

    } catch (error) {

        logger.error(
            `[INSP_QUALIDADE] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// CRON - GET ETIQUETAS FINGER
// ======================================================

cron.schedule('*/30 * * * *', async () => {

    try {

        //logger.info(`[GET_ETIQUETAS_FINGER] Iniciado em ${getCurrentDateTime()}`);

        await obterEtiquetaFingerService.getObterEtiquetaFingerFromSapiens();

        logger.info(`[GET_ETIQUETAS_FINGER] Finalizado com sucesso`);

    } catch (error) {

        logger.error(
            `[GET_ETIQUETAS_FINGER] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// CRON - POST ETIQUETAS FINGER
// ======================================================

cron.schedule('*/15 * * * *', async () => {

    try {

        //logger.info(`[POST_ETIQUETAS_FINGER] Iniciado em ${getCurrentDateTime()}`);

        await postConfirmaEtq.postConfirmaEtiquetaForSapiens();

        logger.info(`[POST_ETIQUETAS_FINGER] Finalizado com sucesso`);

    } catch (error) {

        logger.error(
            `[POST_ETIQUETAS_FINGER] ${error.stack || error.message || error}`
        );

    }

});


// ======================================================
// INICIALIZAÇÃO
// ======================================================

logger.info('=====================================================');
logger.info('SERVIÇO DE INTEGRAÇÃO INICIADO');
logger.info(`Data/Hora: ${getCurrentDateTime()}`);
logger.info('=====================================================');