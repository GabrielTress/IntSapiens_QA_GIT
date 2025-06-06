const cron = require('node-cron');
const postApontamento = require('./services/postApontamentoService');
const sequenciamentoService = require('./services/sequenciamentoService');
const recursoService = require('./services/recursoService');
const dadosProduto = require('./services/dadosProdutoService');
const etiqueta = require('./services/etiquetaService');
const postComponente = require('./services/postComponenteService');
const obterEtiquetaFinger = require('./services/obterEtiquetaFingerService');
const postConfirmaEtiquetaFinger = require('./services/postConfirmaEtq');

// Função para obter a data e hora atual formatada
const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

// Variável para garantir a execução da sequência
let postApontamentoCompleted = false;

// Função principal de integração
const integracaoSoap = async () => {
    try {
        await postApontamento.postApontamentoForSapiens();
        postApontamentoCompleted = true;
        console.log('Post Apontamento completed at', getCurrentDateTime());

        // Agenda o sequenciamento para 5 minutos após o postApontamento
        setTimeout(async () => {
            try {
                await sequenciamentoService.getSequenciamentoFromSapiens();
                console.log('Sequenciamento completed 5 minutes after Post Apontamento at', getCurrentDateTime());
            } catch (error) {
                console.error('Error in sequenciamentoService:', error.message || error);
            }
        }, 5 * 60 * 1000); // 5 minutos em milissegundos
    } catch (error) {
        console.error('Error in postApontamento:', error.message || error);
    }
};

// Agendamento do postApontamento a cada 27 minutos
cron.schedule('*/27 * * * *', async () => {
    await integracaoSoap();
});

// Agendamento do recursoService e dadosProduto a cada domingo às 17h
cron.schedule('0 17 * * 0', async () => {
    try {
        await recursoService.getRecursoFromSapiens();
        await dadosProduto.getDadosProdutoFromSapiens();
        console.log('Recurso and DadosProduto completed on Sunday at', getCurrentDateTime());
    } catch (error) {
        console.error('Error in recursoService or dadosProduto:', error.message || error);
    }
});

// Agendamento do etiqueta a cada 35 minutos
cron.schedule('*/35 * * * *', async () => {
    try {
        await etiqueta.getEtiquetaFromSapiens();
        console.log('Etiqueta completed at', getCurrentDateTime());
    } catch (error) {
        console.error('Error in etiquetaService:', error.message || error);
    }
});

// Agendamento do postComponente a cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
    try {
        await postComponente.postApontamentoComponentesForSapiens();
        console.log('Post Componente completed at', getCurrentDateTime());
    } catch (error) {
        console.error('Error in postComponenteService:', error.message || error);
    }
});
