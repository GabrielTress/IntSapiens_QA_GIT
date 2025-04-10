const sequenciamentoService = require('./services/sequenciamentoService');
//const recursoService = require('./services/recursoService');
//const dadosProduto = require('./services/dadosProdutoService');
//const etiqueta = require('./services/etiquetaService');
//const postApontamento = require('./services/postApontamentoService');
//const postComponente = require('./services/postComponenteService');
//const obterEtiquetaFinger = require ('./services/obterEtiquetaFingerService');

const integracaoIsolada = async () => {
try {
    console.log('Starting test...');
    const data = await Promise.all([
        //obterEtiquetaFinger.getObterEtiquetaFingerFromSapiens()
        //postApontamento.postApontamentoForSapiens(),
        sequenciamentoService.getSequenciamentoFromSapiens(),
        //recursoService.getRecursoFromSapiens(),
        //dadosProduto.getDadosProdutoFromSapiens(),
        //etiqueta.getEtiquetaFromSapiens(),
        //postComponente.postApontamentoComponentesForSapiens(),
        // outras promessas, se houver
    ]);
    //console.log('Data retrieved from SAPIENS:', data);
} catch (error) {
    console.error('Error retrieving data from SAPIENS:', error.message || error);
}
};

integracaoIsolada();