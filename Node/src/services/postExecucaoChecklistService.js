//INTEGRAÇÃO FEITA VIA https://documentacao.senior.com.br/gestaoempresarialerp/5.10.4/webservices/com_senior_g5_co_sgq_execucaoinspecao.htm#Verificacao
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
const metodoVerificacao = "Verificacao";
const metodoInspecao = "Inspecao";
const metodoExecucaoFinal = "Execucao";

const postExecucaoInspecaoForSapiens = async () => {
    let connection;

    try {
        const client = await soap.createClientAsync(sapiensWsdlUrl);

        connection = await db.getConnection();
        await connection.beginTransaction();
     

        // Selecionar registros com WB_PROCESS = 'N'
        const [rowsExecucao] = await connection.execute(
            `SELECT DISTINCT WB_NUMEMP, WB_OPERACAO, WB_CODPIN, WB_SITEPI, WB_DATEXE, WB_QTDINP, WB_QTDREC, WB_CODPRO, WB_CODDER, WB_CODROT, WB_CODETG,
             WB_SEQROT, WB_CODORI, WB_NUMORP, WB_NUMSEP, WB_FASINS, WB_SEQEIN, WB_SEQEIN, WB_SEQEOQ
             FROM WB_REGISTROCHECKLIST WHERE WB_CODPRO = WB_CODPIN AND WB_PROCESS = 'N' AND WB_SEQEOQ IS NOT NULL`
        );

        // Agrupar por WB_NUMSEP
        const gruposExecucao = rowsExecucao.reduce((acc, row) => {
            acc[row.WB_NUMSEP] = acc[row.WB_NUMSEP] || [];
            acc[row.WB_NUMSEP].push(row);
            return acc;
        }, {});

        // Enviar cada registro individualmente
        for (const numSep of Object.keys(gruposExecucao)) {
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
                        seqEoq: r.WB_SEQEOQ
                    }
                };

                //console.log('Parâmetros enviados:', JSON.stringify(paramsExecucao, null, 2));

                try {
                        const [result] = await client[`${metodoExecucao}Async`](paramsExecucao);

                        const msgRet = result?.result?.msgRet || "";
                        //console.log('Retorno SOAP: ', msgRet);

                        // Verifica se a mensagem contém "Execução de inspeção" e extrai o número
                        const match = msgRet.match(/Execução de inspeção\s+(\d+)\s+inserida com sucesso/i);

                        if (match) {
                            const numEpi = match[1]; // número extraído (ex: 15681)

                            console.log(`✔ CheckList ${r.WB_NUMORP} Param Execução sucesso. NumEPI: ${numEpi}`);

                            // Atualiza registro processado e grava número de execução
                            await connection.execute(
                                `UPDATE WB_REGISTROCHECKLIST
                                SET WB_PROCESS = 'E', WB_NUMEPI = ?
                                WHERE WB_NUMSEP = ? AND WB_CODPRO = ? AND WB_PROCESS = 'N'`,
                                [numEpi, numSep, r.WB_CODPRO]
                                
                            );
                        await connection.commit();    
                        } else {
                            console.warn(`⚠️ Falha no registro Param Execução ${r.WB_NUMSEP}:`, msgRet);
                        }
                    } catch (err) {
                        console.error(`Erro ao enviar registro ${r.WB_NUMSEP}:`, err);
                    }
            }
        }


       const [rowsVerificacao] = await connection.execute(
        `SELECT DISTINCT WB_NUMEPI, WB_SEQEIN, WB_SEQEIV, WB_VLRVER, WB_VLRMIN, WB_VLRMAX, WB_SITAVA, WB_OBSVER, WB_CODEQP, WB_NOTEIV, WB_QTDINP, WB_NUMSEP
         FROM WB_REGISTROCHECKLIST WHERE WB_PROCESS = 'E' AND WB_NUMEPI IS NOT NULL`
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
                        obsVer: r.WB_NUMSEP,
                        codEqp: r.WB_CODEQP,
                        notEiv: r.WB_NOTEIV,
                        qtdInp: r.WB_QTDINP,
                    }
                };

                //console.log('Parâmetros enviados:', JSON.stringify(paramsVerificacao, null, 2));

                try {
                    const [result] = await client[`${metodoVerificacao}Async`](paramsVerificacao);

                    const msgRet = result?.result?.msgRet?.trim();
                    //console.log('Retorno SOAP:', msgRet);

                    if (msgRet === 'Verificação alterada com sucesso.') {
                        console.log(`🔁 CheckList ${r.WB_NUMEPI} Param Verificação sucesso.`);

                        await connection.execute(
                            `UPDATE WB_REGISTROCHECKLIST
                            SET WB_PROCESS = 'V'
                            WHERE WB_NUMEPI = ? AND WB_NUMSEP = ? AND WB_PROCESS = 'E'`,
                            [r.WB_NUMEPI, r.WB_NUMSEP]
                        );
                     await connection.commit();       
                    } else {
                        console.warn(`⚠️ Falha no registro Param Verificação ${r.WB_NUMEPI}:`, msgRet);
                    }

                } catch (error) {
                    console.error('❌ Erro na execução SOAP:', error);
                }
            }
        }



       const [rowsInspecao] = await connection.execute(
        `SELECT DISTINCT WB_NUMEPI, WB_SEQEIN, WB_NOTEIV, WB_QTDINP, WB_TIPINP, WB_NUMSEP
         FROM WB_REGISTROCHECKLIST WHERE WB_PROCESS = 'V' AND WB_NUMEPI IS NOT NULL`
        );

        // Agrupar por WB_NUMSEP
        const gruposInspecao = rowsInspecao.reduce((acc, row) => {
            acc[row.WB_NUMSEP] = acc[row.WB_NUMSEP] || [];
            acc[row.WB_NUMSEP].push(row);
            return acc;
        }, {});

        for (const numSep of Object.keys(gruposInspecao)) {
            const registros = gruposInspecao[numSep];

            for (const r of registros) {
                // Aqui o paramsExecucao é definido e usado dentro do mesmo escopo
                const paramsInspecao = {
                    user: "apontamentoweb",
                    password: "apontamentoweb",
                    encryption: 0,
                    parameters: {
                        numEpi: r.WB_NUMEPI,
                        seqEin: r.WB_SEQEIN,
                        //seqEiv: r.WB_SEQEIV, 
                        qtdInp: r.WB_QTDINP,  
                        notEin: r.WB_NOTEIV, 
                        sitEin: 2,
                        tipInp: r.WB_TIPINP
                    }
                };

                //console.log('Parâmetros enviados:', JSON.stringify(paramsInspecao, null, 2));

                try {
                    const [result] = await client[`${metodoInspecao}Async`](paramsInspecao);

                    const msgRet = result?.result?.msgRet?.trim();
                    //console.log('Retorno SOAP:', msgRet);

                    if (msgRet === 'Inspeção alterada com sucesso.') {
                        console.log(`🔁 CheckList ${r.WB_NUMEPI} Param Inspeção sucesso.`);

                        await connection.execute(
                            `UPDATE WB_REGISTROCHECKLIST
                            SET WB_PROCESS = 'F'
                            WHERE WB_NUMEPI = ? AND WB_NUMSEP = ? AND WB_PROCESS = 'V'`,
                            [r.WB_NUMEPI, r.WB_NUMSEP]
                        );
                     await connection.commit();   
                    } else {
                        console.warn(`Falha no registro Param Inspeção ${r.WB_NUMEPI}:`, msgRet);
                    }

                } catch (error) {
                    console.error('Erro na execução SOAP:', error);
                }
            }
        }

        const [rowsExecucaoFinal] = await connection.execute(
        `SELECT DISTINCT WB_NUMEPI, WB_NUMSEP
         FROM WB_REGISTROCHECKLIST WHERE WB_PROCESS = 'F' AND WB_NUMEPI IS NOT NULL`
        );

        // Agrupar por WB_NUMSEP
        const gruposExecucaoFinal = rowsExecucaoFinal.reduce((acc, row) => {
            acc[row.WB_NUMSEP] = acc[row.WB_NUMSEP] || [];
            acc[row.WB_NUMSEP].push(row);
            return acc;
        }, {});

        for (const numSep of Object.keys(gruposExecucaoFinal)) {
            const registros = gruposExecucaoFinal[numSep];

            for (const r of registros) {
                // Aqui o paramsExecucao é definido e usado dentro do mesmo escopo
                const paramsExecucaoFinal = {
                    user: "apontamentoweb",
                    password: "apontamentoweb",
                    encryption: 0,
                    parameters: {
                        numEpi: r.WB_NUMEPI,
                        operacao: 'A',
                        sitEpi: 2,  
                    }
                };

                //console.log('Parâmetros enviados:', JSON.stringify(paramsExecucaoFinal, null, 2));

                try {
                    const [result] = await client[`${metodoExecucaoFinal}Async`](paramsExecucaoFinal);

                    const msgRet = result?.result?.msgRet?.trim();
                    //console.log('Retorno SOAP:', msgRet);

                    if (msgRet === 'Execução de Inspeção alterada com sucesso.') {
                        console.log(`🔁 CheckList ${r.WB_NUMEPI} Param Execução Final sucesso.`);

                        await connection.execute(
                            `UPDATE WB_REGISTROCHECKLIST
                            SET WB_PROCESS = 'S'
                            WHERE WB_NUMEPI = ? AND WB_NUMSEP = ? AND WB_PROCESS = 'F'`,
                            [r.WB_NUMEPI, r.WB_NUMSEP]
                        );
                    await connection.commit();
                    } else {
                        console.warn(`Falha no registro Param Execução Final ${r.WB_NUMEPI}:`, msgRet);
                    }

                } catch (error) {
                    console.error('Erro na execução SOAP:', error);
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
