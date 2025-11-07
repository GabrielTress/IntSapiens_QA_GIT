const soap = require('soap');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const moment = require('moment');

const app = express();

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projeto_qa'
});

app.use(cors());
app.use(express.json());

const sapiensWsdlUrl = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Synccom_senior_g5_co_sgq_execucaoinspecao?wsdl';
const metodoExecucao = "Execucao";
const metodoInspecao = "Verificacao";

const postExecucaoInspecaoForSapiens = async () => {
    let connection;

    try {
        const client = await soap.createClientAsync(sapiensWsdlUrl);

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Selecionar registros com WB_PROCESS = 'N'
        const [rowsExecucao] = await connection.execute(
            `SELECT DISTINCT WB_NUMEMP, WB_OPERACAO, WB_CODPIN, WB_SITEPI, WB_DATEXE, WB_QTDINP, WB_QTDREC, WB_CODPRO, WB_CODDER, WB_CODROT, WB_CODETG,
             WB_SEQROT, WB_CODORI, WB_NUMORP, WB_NUMSEP, WB_FASINS, WB_SEQEIN, WB_SEQEIV
             FROM WB_REGISTROCHECKLIST WHERE WB_PROCESS = 'N' AND WB_CODPRO = WB_CODPIN`
        );

        // Agrupar por WB_NUMSEP
        const gruposExecucao = rowsExecucao.reduce((acc, row) => {
            acc[row.WB_NUMSEP] = acc[row.WB_NUMSEP] || [];
            acc[row.WB_NUMSEP].push(row);
            return acc;
        }, {});

        // Enviar cada registro individualmente
        /*for (const numSep of Object.keys(gruposExecucao)) {
            const registros = gruposExecucao[numSep];

            for (const r of registros) {
                // Aqui o paramsExecucao é definido e usado dentro do mesmo escopo
                const paramsExecucao = {
                    user: "apontamentoweb",
                    password: "apontamentoweb",
                    encryption: 0,
                    parameters: {
                        operacao: r.WB_OPERACAO,
                        codPin: r.WB_CODPRO,
                        datExe: moment(r.WB_DATEXE, 'DD-MM-YYYY HH:mm:ss').format('DD/MM/YYYY'),
                        //horExe: r.WB_HOREXE,
                        qtdInp: r.WB_QTDINP,
                        qtdRec: r.WB_QTDREC,
                        codPro: r.WB_CODPRO,
                        codDer: r.WB_CODDER,
                        codRot: r.WB_CODROT,
                        codEtg: r.WB_CODETG,
                        seqRot: r.WB_SEQROT,
                        codOri: r.WB_CODORI,
                        fasIns: r.WB_FASINS,
                        numOrp: r.WB_NUMORP,
                        seqEoq: r.WB_SEQEIV
                    }
                };

                console.log('Parâmetros enviados:', JSON.stringify(paramsExecucao, null, 2));

                try {
                        const [result] = await client[`${metodoExecucao}Async`](paramsExecucao);

                        const msgRet = result?.result?.msgRet || "";
                        console.log('Retorno SOAP: ', msgRet);

                        // Verifica se a mensagem contém "Execução de inspeção" e extrai o número
                        const match = msgRet.match(/Execução de inspeção\s+(\d+)\s+inserida com sucesso/i);

                        if (match) {
                            const numEpi = match[1]; // número extraído (ex: 15681)

                            console.log(`✔ CheckList ${r.WB_NUMORP} enviado com sucesso. NumEPI: ${numEpi}`);

                            // Atualiza registro processado e grava número de execução
                            await connection.execute(
                                `UPDATE WB_REGISTROCHECKLIST
                                SET WB_PROCESS = 'E', WB_NUMEPI = ?
                                WHERE WB_NUMSEP = ? AND WB_CODPRO = ? AND WB_PROCESS = 'N'`,
                                [numEpi, numSep, r.WB_CODPRO]
                            );
                        } else {
                            console.warn(`⚠️ Falha no registro ${r.WB_NUMSEP}:`, msgRet);
                        }
                    } catch (err) {
                        console.error(`❌ Erro ao enviar registro ${r.WB_NUMSEP}:`, err);
                    }
            }
        }*/

       const [rowsVerificacao] = await connection.execute(
        `SELECT DISTINCT WB_NUMEPI, WB_SEQEIN, WB_SEQEIV, WB_VLRVER, WB_VLRMIN, WB_VLRMAX, WB_SITAVA, WB_OBSVER, WB_CODEQP, WB_NOTEIV, WB_QTDINP
         FROM WB_REGISTROCHECKLIST WHERE WB_PROCESS = 'E'`
        );

        // Agrupar por WB_NUMSEP
        const gruposVerificacao = rowsVerificacao.reduce((acc, row) => {
            acc[row.WB_NUMSEP] = acc[row.WB_NUMSEP] || [];
            acc[row.WB_NUMSEP].push(row);
            return acc;
        }, {});

        for (const numSep of Object.keys(gruposVerificacao)) {
            const registros = gruposVerificacao[numSep];

            for (const r of registros) {
                // Aqui o paramsExecucao é definido e usado dentro do mesmo escopo
                const paramsVerificacao = {
                    user: "apontamentoweb",
                    password: "apontamentoweb",
                    encryption: 0,
                    parameters: {
                        numEpi: r.WB_NUMEPI,
                        seqEin: r.WB_SEQEIN,
                        seqEiv: r.WB_SEQEIV,
                        vlrVer: r.WB_VLRVER,
                        vlrMin: r.WB_VLRMIN,
                        vlrMax: r.WB_VLRMAX,
                        sitAva: r.WB_SITAVA,
                        obsVer: r.WB_OBSVER,
                        codEqp: r.WB_CODEQP,
                        notEiv: r.WB_NOTEIV,
                        qtdInp: r.WB_QTDINP,
                    }
                };

                console.log('Parâmetros enviados:', JSON.stringify(paramsVerificacao, null, 2));

                try {
                        const [result] = await client[`${metodoInspecao}Async`](paramsVerificacao);

                        const msgRet = result?.result?.msgRet;
                        console.log('Retorno SOAP: ', msgRet);


                    } catch (err) {
                        console.error(`❌ Erro ao enviar registro ${r.WB_NUMSEP}:`, err);
                    }
            }
        }

        await connection.commit();
        console.log('Transação CheckList concluída com sucesso.');
    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('Transação CheckList revertida devido a um erro.');
        }
        console.error('Erro ao processar CheckList:', error);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { postExecucaoInspecaoForSapiens };

// Rodando servidor em outra porta
app.listen(9008, () => {
    console.log('Server running on port 9008');
});
