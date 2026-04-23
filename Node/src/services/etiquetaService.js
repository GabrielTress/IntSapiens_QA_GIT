const soap = require('soap');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projeto_qa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const sapiensWsdlUrl =
    'http://192.168.0.1:8080/g5-senior-services/sapiens_Synccom.senior.g5.co.int.mpr.Madesp?wsdl';

const metodoEtiqueta = 'Etiqueta';

const aCodFam = [
    200, 250, 290, 300, 301, 302, 303, 310, 311, 312,
    313, 320, 330, 340, 350, 351, 352, 353, 359, 400,
    410, 420, 430, 440, 450, 460, 470
];

function toInt(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    return parseInt(valor, 10) || 0;
}

async function getEtiquetaFromSapiens() {

    let connection;

    try {

        console.log('Iniciando sincronização Etiquetas...');

        const client = await soap.createClientAsync(sapiensWsdlUrl);

        connection = await db.getConnection();
        await connection.beginTransaction();

        /*
        Guarda todas etiquetas válidas vindas do ERP
        */
        const etiquetasRecebidas = [];

        for (const codFam of aCodFam) {

            const params = {
                user: 'apontamentoweb',
                password: 'apontamentoweb',
                encryption: 0,
                parameters: {
                    codEmp: 1,
                    codFam: codFam
                }
            };

            try {

                const [result] =
                    await client[`${metodoEtiqueta}Async`](params);

                const dadosRecebidos = result?.result?.lstEtq;

                if (!dadosRecebidos) {
                    continue;
                }

                if (Array.isArray(dadosRecebidos)) {

                    for (const item of dadosRecebidos) {
                        await processarEtiqueta(
                            item,
                            connection,
                            etiquetasRecebidas
                        );
                    }

                } else {

                    await processarEtiqueta(
                        dadosRecebidos,
                        connection,
                        etiquetasRecebidas
                    );
                }

            } catch (error) {

                console.error(
                    `Erro codFam ${codFam}:`,
                    error.message
                );
            }
        }

        /*
        Remove do banco o que não veio mais do ERP
        */
        const [rowsBanco] = await connection.execute(`
            SELECT WB_NUMETQ
            FROM WB_ETIQUETA
        `);

        for (const row of rowsBanco) {

            const numEtqBanco = Number(row.WB_NUMETQ);

            if (!etiquetasRecebidas.includes(numEtqBanco)) {

                await connection.execute(`
                    DELETE FROM WB_ETIQUETA
                    WHERE WB_NUMETQ = ?
                `, [numEtqBanco]);
            }
        }

        await connection.commit();

        console.log('Sincronização Etiquetas concluída.');

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Erro geral:', error);
        throw error;

    } finally {

        if (connection) {
            connection.release();
        }
    }
}

async function processarEtiqueta(
    item,
    connection,
    etiquetasRecebidas
) {

    const numEtq = toInt(item.numEtq);
    const codPro = item.codPro;
    const desPro = item.desPro;
    const qtdEtq = toInt(item.qtdEtq);
    const sitEtq = item.sitEtq;
    const temFSC = item.temFSC;

    /*
    Só etiquetas ativas
    */
    if (sitEtq !== 'A') {
        return;
    }

    etiquetasRecebidas.push(numEtq);

    const [rows] = await connection.execute(`
        SELECT WB_NUMETQ
        FROM WB_ETIQUETA
        WHERE WB_NUMETQ = ?
        LIMIT 1
    `, [numEtq]);

    /*
    Já existe = atualiza
    */
    if (rows.length > 0) {

        await connection.execute(`
            UPDATE WB_ETIQUETA
            SET
                WB_CODPRO = ?,
                WB_DESPRO = ?,
                WB_QTDETQ = ?,
                WB_SITETQ = ?,
                WB_TEMFSC = ?
            WHERE WB_NUMETQ = ?
        `, [
            codPro,
            desPro,
            qtdEtq,
            sitEtq,
            temFSC,
            numEtq
        ]);

        return;
    }

    /*
    Novo = insere
    */
    await connection.execute(`
        INSERT INTO WB_ETIQUETA
        (
            WB_NUMETQ,
            WB_CODPRO,
            WB_DESPRO,
            WB_QTDETQ,
            WB_SITETQ,
            WB_TEMFSC
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        numEtq,
        codPro,
        desPro,
        qtdEtq,
        sitEtq,
        temFSC
    ]);
}



module.exports = {
    getEtiquetaFromSapiens
};

app.listen(9007, () => {
    console.log('Server running on port 9007');
});