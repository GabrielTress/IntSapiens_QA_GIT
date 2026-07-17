const soap = require('soap');
const mysql = require('mysql2/promise');
const logger = require('./logger');
const moment = require('moment');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projeto_qa'
});

const sapiensWsdlUrl =
    'http://192.168.0.1:8080/g5-senior-services/sapiens_Synccom.senior.g5.co.int.mpr.Madesp?wsdl';

const metodoApontamento = "ApontamentoBioenergy";


/**
 * Gera o apontamento via SOAP no Sapiens (ação IRREVERSÍVEL do lado do ERP:
 * cria lote, número de etiqueta, vincula pedido/cliente) e grava localmente
 * como PENDENTE de impressão (WB_PROCESS = 'N').
 *
 * IMPORTANTE: nunca chamar esta função de novo para a "mesma tentativa" de
 * impressão. Antes de chamar, o caller deve checar se já existe uma
 * etiqueta pendente (buscarApontamentoPendenteBioenergy) para aquela
 * OP/Recurso — se existir, deve reimprimir os dados já gerados em vez de
 * gerar um novo lote.
 */
const postApontamentoBioenergyForSapiens = async (dados) => {

    let connection;

    try {

        const client = await soap.createClientAsync(sapiensWsdlUrl);

        const paramsApontamento = {
            user: "apontamentoweb",
            password: "apontamentoweb",
            encryption: 0,
            parameters: {
                CodEmp: dados.codEmp,
                CodOri: dados.codOri,
                NumOrp: dados.numOrp,
                QtdEtq: Number(dados.qtdEtq),
                TurTrb: dados.turno
            }
        };

        console.log("########## PARAMS ##########");
        console.log(paramsApontamento);

        const [result] = await client[`${metodoApontamento}Async`](
            paramsApontamento,
            { timeout: 40000 }
        );

        console.log('Retorno SOAP: ', JSON.stringify(result, null, 2));

        const retorno =
            result?.result?.ApontamentoBioenergyReturn ||
            result?.result ||
            [];

        const item = Array.isArray(retorno) ? retorno[0] : retorno;

        if (!item) {
            throw new Error("SOAP não retornou dados");
        }

        if (item.tipRet !== "1") {
            logger.error(
                `[BIOENERGY] ERRO OP ${dados.numOrp} - ${item.MsgRet || item.erroExecucao || "Erro desconhecido"} `
            );

            return {
                sucesso: false,
                mensagem: item.erroExecucao || item.MsgRet || "Erro desconhecido"
            };
        }

        console.log("Item: ", item);
        console.log("Dados: ", dados);

        const numEtqLimpo = item.numEtq.replace(/^0+/, '');

        connection = await db.getConnection();

        // WB_PROCESS = 'N' -> pendente de confirmação de impressão.
        // Só vira 'S' quando /bioenergyConfirmaImpressao for chamado,
        // depois que o printer.send confirmar sucesso no front-end.
        await connection.execute(
            `
            INSERT INTO WB_APONTAMENTOBIOENERGY
            (
                WB_NUMEMP,
                WB_NUMPROD,
                WB_CODDER,
                WB_NUMORP,
                WB_NUMORI,
                WB_NUMREC,
                WB_NUMETQ,
                WB_QTDETQ,
                WB_DATAPONT,
                WB_TURNO,
                WB_NUMPED,
                WB_ITEMPED,
                WB_CODCLI,
                WB_NOMCLI,
                WB_CODLOT,
                WB_PROCESS
            )
            VALUES
            (
                ?,?,?,?,?,?,
                ?,?,?,?,?,?,
                ?,?,?,?
            )
            `,
            [
                dados.codEmp,
                dados.numProd,
                dados.codDer,
                dados.numOrp,
                dados.codOri,
                dados.numRec,
                numEtqLimpo,
                dados.qtdEtq,
                moment().format('YYYY-MM-DD HH:mm:ss'),
                dados.turno,
                item.numPed,
                item.seqIpd,
                item.codCli,
                item.nomCli,
                item.codLot,
                'N'
            ]
        );

        logger.info(
            `[BIOENERGY] Gerado (pendente de impressão) OP ${dados.numOrp} - Etiqueta ${item.numEtq}`
        );

        return {
            sucesso: true,
            wb_numOrp: dados.numOrp,
            wb_numProd: dados.numProd,
            wb_qtdProd: dados.qtdEtq,
            wb_codDer: dados.codDer,
            wb_codLot: item.codLot,
            wb_codCli: item.codCli,
            wb_nomCli: item.nomCli,
            wb_numEtq: numEtqLimpo,
            wb_numPed: item.numPed
        };

    } catch (err) {

        const timeout =
            err.code === 'ETIMEDOUT' ||
            err.code === 'ESOCKETTIMEDOUT' ||
            err.message?.includes('timeout');

        if (timeout) {
            logger.error(`[BIOENERGY] TIMEOUT OP ${dados.numOrp} (15s)`);
            return {
                sucesso: false,
                erro: "TIMEOUT",
                mensagem: "Sapiens não respondeu"
            };
        }

        logger.error(
            `[BIOENERGY] Erro OP ${dados.numOrp}: ${err.stack || err.message}`
        );

        return {
            sucesso: false,
            erro: "ERRO",
            mensagem: err.message
        };

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


/**
 * Marca a etiqueta como efetivamente impressa (WB_PROCESS = 'S').
 * Deve ser chamada pelo front-end SOMENTE depois que o printer.send
 * confirmar sucesso.
 */
const confirmarImpressaoBioenergy = async (wb_numEtq) => {

    let connection;

    try {
        connection = await db.getConnection();

        const [result] = await connection.execute(
            `
            UPDATE WB_APONTAMENTOBIOENERGY
               SET WB_PROCESS = 'S'
             WHERE WB_NUMETQ = ?
               AND WB_PROCESS = 'N'
            `,
            [wb_numEtq]
        );

        if (result.affectedRows === 0) {
            logger.error(`[BIOENERGY] Confirmação de impressão falhou - etiqueta ${wb_numEtq} não encontrada como pendente`);
            return { sucesso: false, mensagem: "Etiqueta não encontrada como pendente." };
        }

        logger.info(`[BIOENERGY] Impressão confirmada - Etiqueta ${wb_numEtq}`);
        return { sucesso: true };

    } catch (err) {
        logger.error(`[BIOENERGY] Erro ao confirmar impressão da etiqueta ${wb_numEtq}: ${err.stack || err.message}`);
        return { sucesso: false, mensagem: err.message };
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


/**
 * Busca uma etiqueta já gerada no SOAP para esta OP/Recurso que ainda
 * NÃO foi confirmada como impressa (WB_PROCESS = 'N'). Se existir, o
 * front-end deve reimprimir esses dados em vez de chamar o SOAP de novo
 * (evita gerar um segundo lote para a mesma tentativa).
 */
const buscarApontamentoPendenteBioenergy = async ({ numEmp, numOrp, numRec }) => {

    let connection;

    try {
        connection = await db.getConnection();

        const [rows] = await connection.execute(
            `
            SELECT
                WB_NUMEMP    AS wb_numEmp,
                WB_NUMPROD   AS wb_numProd,
                WB_CODDER    AS wb_codDer,
                WB_NUMORP    AS wb_numOrp,
                WB_NUMORI    AS wb_numOri,
                WB_NUMREC    AS wb_numRec,
                WB_NUMETQ    AS wb_numEtq,
                WB_QTDETQ    AS wb_qtdProd,
                WB_NUMPED    AS wb_numPed,
                WB_ITEMPED   AS wb_itemPed,
                WB_CODCLI    AS wb_codCli,
                WB_NOMCLI    AS wb_nomCli,
                WB_CODLOT    AS wb_codLot
              FROM WB_APONTAMENTOBIOENERGY
             WHERE WB_NUMEMP = ?
               AND WB_NUMORP = ?
               AND WB_NUMREC = ?
               AND WB_PROCESS = 'N'
             ORDER BY WB_DATAPONT DESC
             LIMIT 1
            `,
            [numEmp, numOrp, numRec]
        );

        if (rows.length === 0) {
            return { sucesso: true, pendente: null };
        }

        return { sucesso: true, pendente: rows[0] };

    } catch (err) {
        logger.error(`[BIOENERGY] Erro ao buscar pendência OP ${numOrp}: ${err.stack || err.message}`);
        return { sucesso: false, mensagem: err.message };
    } finally {
        if (connection) {
            connection.release();
        }
    }
};


module.exports = {
    postApontamentoBioenergyForSapiens,
    confirmarImpressaoBioenergy,
    buscarApontamentoPendenteBioenergy
};
