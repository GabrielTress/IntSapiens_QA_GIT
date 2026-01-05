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
    database: 'projetopd'
});

app.use(cors());
app.use(express.json());

const sapiensWsdlUrlEtq = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Syncintegracao_vedois?wsdl';
const metodoConfirmaEtq = "ConfirmaEtq";

const postConfirmaEtiquetaForSapiens = async () => {
    let connection;

    try {
        const clientEtq = await soap.createClientAsync(sapiensWsdlUrlEtq);
        connection = await db.getConnection();

        // Buscar etiquetas NÃO processadas
        const [rows] = await connection.execute(
            `SELECT WB_NUMEMP, WB_NUMORI, WB_NUMORP, WB_NUMREC, WB_NUMETQ,
                    WB_QTDETQ, WB_DATAPONT, WB_OPERADOR
             FROM WB_APONTAMENTOETIQUETA
             WHERE WB_NUMETQ = '131597'`
        );

        if (rows.length === 0) {
            console.log('Nenhum registro de etiqueta a ser processado.');
            return;
        }

        for (const row of rows) {
            try {
                await connection.beginTransaction();
            
                const dataApont = moment(row.WB_DATAPONT, 'DD-MM-YYYY HH:mm:ss');
                const paramsEtq = {
                    user: 'apontamentoweb',
                    password: 'apontamentoweb',
                    encryption: 0,
                    parameters: {
                        NumEtq: row.WB_NUMETQ,
                        QtdEtq: row.WB_QTDETQ,
                        HorEtq: dataApont.format('HH:mm:ss'),
                        DatEtq: dataApont.format('DD/MM/YYYY')
                    }
                };

                console.log("📤 Enviando etiqueta:", paramsEtq.parameters);

                const [resultEtq] = await clientEtq[`${metodoConfirmaEtq}Async`](paramsEtq);

                console.log("📥 Resposta do Sapiens para etiqueta:", resultEtq);

                await connection.commit();
                console.log(`💾 Transação concluída para etiqueta ${row.WB_NUMETQ}`);

            } catch (err) {
                await connection.rollback();
                console.error(`❌ Erro ao processar etiqueta ${row.WB_NUMETQ}:`, err.message);
            }
        }

    } catch (error) {
        console.error("Erro geral:", error.message);
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { postConfirmaEtiquetaForSapiens };

app.listen(9009, () => {
    console.log('Server running on port 9009');
});
