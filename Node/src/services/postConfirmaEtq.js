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

const sapiensWsdlUrl = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Synccom.senior.g5.co.int.mpr.Madesp?wsdl';
const sapiensWsdlUrlEtq = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Syncintegracao_vedois?wsdl';
const metodoApontamentoFinger = "ApontamentoFinger";
const metodoConfirmaEtq = "ConfirmaEtq";

const postConfirmaEtiquetaForSapiens = async () => {
    let connection;

    try {
        const client = await soap.createClientAsync(sapiensWsdlUrl);
        const clientEtq = await soap.createClientAsync(sapiensWsdlUrlEtq);

        connection = await db.getConnection();

        // Selecionar registros com WB_PROCESS = 'N'
        const [rows] = await connection.execute(
            `SELECT WB_NUMEMP, WB_NUMORI, WB_NUMORP, WB_NUMREC, WB_NUMETQ, 
                    WB_QTDETQ, WB_DATAPONT, WB_OPERADOR 
             FROM WB_APONTAMENTOETIQUETA 
             WHERE WB_PROCESS = ?`,
            ['N']
        );

        if (rows.length === 0) {
            console.log('Nenhum registro de etiqueta a ser processado.');
            return;
        }

        for (const row of rows) {
            try {
                await connection.beginTransaction();

                // --- Monta parâmetros para o 1º WS ---
                const paramsApontamentoFinger = {
                    user: 'apontamentoweb',
                    password: 'apontamentoweb',
                    encryption: 0,
                    parameters: {
                        CodEmp: row.WB_NUMEMP,
                        CodOri: row.WB_NUMORI,
                        NumOrp: row.WB_NUMORP,
                        NumEtq: row.WB_NUMETQ,
                        QtdRe1: row.WB_QTDETQ,
                        DatApt: moment(row.WB_DATAPONT, 'DD-MM-YYYY HH:mm:ss').format('DD/MM/YYYY HH:mm:ss'),
                        NumCad: row.WB_OPERADOR,
                        CreFng: row.WB_NUMREC
                    }
                };

                // --- Monta parâmetros para o 2º WS ---
                const paramsEtq = {
                    user: 'apontamentoweb',
                    password: 'apontamentoweb',
                    encryption: 0,
                    parameters: {
                        NumEtq: row.WB_NUMETQ,
                        QtdEtq: row.WB_QTDETQ,
                        HorEtq: moment(row.WB_DATAPONT, 'HH:mm:ss').format('HH:mm:ss'),
                        DatEtq: moment(row.WB_DATAPONT, 'DD/MM/YYYY').format('DD/MM/YYYY')
                    }
                };

                //console.log('📤 Enviando parâmetros:', params);

                const [result] = await client[`${metodoApontamentoFinger}Async`](paramsApontamentoFinger);

                if (result?.result?.tipRet === '1') {
                    //console.log(`Apontamento OP ${row.WB_NUMORP} enviado com sucesso.`);
                    //console.log(`Sequência SEQEOQ: `, result?.result?.seqEoq);
                    const seqEoq = result?.result?.seqEoq;
                    try {
                        const [resultEtq] = await clientEtq[`${metodoConfirmaEtq}Async`](paramsEtq);

                        if (resultEtq?.result?.tipRet === '1') {

                            // 1° UPDATE
                            await connection.execute(
                                `UPDATE WB_APONTAMENTOETIQUETA 
                                SET WB_PROCESS = 'S', WB_SEQEOQ = ? 
                                WHERE WB_NUMETQ = ? AND WB_NUMORP = ?`,
                                [seqEoq, row.WB_NUMETQ, row.WB_NUMORP]
                            );

                            // 2° UPDATE
                            await connection.execute(
                                `UPDATE WB_REGISTROCHECKLIST
                                SET WB_SEQEOQ = ? 
                                WHERE WB_NUMSEP = ? AND WB_NUMORP = ?`,
                                [seqEoq, row.WB_NUMETQ, row.WB_NUMORP]
                            );

                            //console.log(`✔ Confirmação da etiqueta ${row.WB_NUMETQ} salva.`);
                        } else {
                            //console.warn(`⚠ Falha na confirmação da etiqueta ${row.WB_NUMETQ}:`, resultEtq?.result?.msgRet);
                        }

                    } catch (error) {
                        console.error(`Erro no WS ConfirmaEtq para etiqueta ${row.WB_NUMETQ}:`, error.message);
                    }
                } else {
                    console.warn(`⚠ Falha no WS ApontamentoFinger para OP ${row.WB_NUMORP}:`, result?.result?.msgRet);
                }

                await connection.commit();
                console.error(`✔ Transação Confirma Etiqueta concluida com sucesso.`);
            } catch (error) {
                await connection.rollback();
                //console.error(`❌ Erro ao processar etiqueta ${row.WB_NUMETQ}:`, error.message);
            }
        }

    } catch (error) {
        console.error('Erro geral no processamento:', error.message);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { postConfirmaEtiquetaForSapiens };

app.listen(9009, () => {
    console.log('Server running on port 9009');
});
