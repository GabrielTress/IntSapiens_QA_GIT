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
const metodoInspecao = "Inspecao";
const metodoVerificacao = "Verificacao";
const metodoDefeito = "Defeito";

const postExecucaoInspecaoForSapiens = async () => {
    let connection;

    try {
        //console.log('Creating SOAP client...');
        const client = await soap.createClientAsync(sapiensWsdlUrl);
        //console.log('SOAP client created successfully');

        connection = await db.getConnection();
        await connection.beginTransaction();

                // Selecionar registros com WB_PROCESS = 'N'
        const [rowsExecucao] = await connection.execute(
        `SELECT WB_NUMEMP, WB_OPERACAO, WB_CODPIN, WB_SITEPI, WB_DATEXE, WB_HOREXE, 
                WB_QTDINP, WB_QTDREC, WB_CODPRO, WB_CODDER, WB_CODROT, WB_CODETG, 
                WB_SEQROT, WB_CODORI, WB_NUMORP, WB_NUMSEP 
        FROM WB_REGISTROCHECKLIST
        WHERE WB_PROCESS = 'N'`
        );

        // 2. Agrupar por WB_NUMSEP
        const grupos = rowsExecucao.reduce((acc, row) => {
        acc[row.WB_NUMSEP] = acc[row.WB_NUMSEP] || [];
        acc[row.WB_NUMSEP].push(row);
        return acc;
        }, {});

        // 3. Enviar cada grupo
        for (const numSep of Object.keys(grupos)) {
        const registros = grupos[numSep];

        // monta o objeto do envio com todas as linhas desse NumSep
        const paramsExecucao = {
            user: "apontamentoweb",
            password: "apontamentoweb",
            encryption: 0,
            parameters: {
            numSep,
            linhas: registros.map(r => ({
                operacao: r.WB_OPERACAO,
                codPin: r.WB_CODPIN,
                datExe: moment(r.WB_DATEXE, 'DD-MM-YYYY HH:mm:ss').format('DD/MM/YYYY'),
                horExe: r.WB_HOREXE,
                qtdInp: r.WB_QTDINP,
                qtdRec: r.WB_QTDREC,
                codPro: r.WB_CODPRO,
                codDer: r.WB_CODDER,
                codRot: r.WB_CODROT,
                codEtg: r.WB_CODETG,
                seqRot: r.WB_SEQROT,
                codOri: r.WB_CODORI,
                numOrp: r.WB_NUMORP
            }))
            }
        };

            //console.log(`Enviando ApontamentoOP para ordem ${row.WB_NUMORP}...`);

            console.log('Parâmetros enviados:', JSON.stringify(paramsExecucao, null, 2));

        try {
            const [result] = await client[`${metodoExecucao}Async`](paramsExecucao);
            console.log('Resposta recebida:', JSON.stringify(result, null, 2));

            if (result?.result?.tipRet === "1") {
            console.log(`✅ Envio do NumSep ${numSep} OK`);

            // 4. Atualizar todas as linhas desse NumSep
            /*await connection.execute(
                `UPDATE WB_REGISTROCHECKLIST
                SET WB_PROCESS = 'E'
                WHERE WB_NUMSEP = ?`,
                [numSep]
            );*/
            } else {
            console.warn(`⚠️ Falha no NumSep ${numSep}:`, result?.result?.msgRet);
            }
        } catch (err) {
            console.error(`❌ Erro no NumSep ${numSep}:`, err);
        }


        /*try{
            await connection.beginTransaction();

                    // Selecionar registros com WB_PROCESS = 'N'
            const [rowsInspecao] = await connection.execute(
            `SELECT WB_NUMEPI, WB_SEQEIN, WB_QTDINP, WB_NOTEIN, WB_SITEIN, 
                    WB_TIPINP FROM WB_REGISTROCHECKLIST
            WHERE WB_NUMEPI = ?`,[result?.result?.numEpi]);
          
        } catch{
            
        }*/
        
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


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9008, () => {
    console.log('Server running on port 9008');
});
