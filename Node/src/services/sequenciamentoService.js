const soap = require('soap');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const moment = require('moment');

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

const metodoSequenciamento = 'Sequenciamento';

/*
======================================================
WB_STSGT

L = Liberado / aguardando produção
A = Andamento / produção iniciada
F = Finalizado / cancelado

REGRAS:

L -> atualiza tudo
A -> atualiza SOMENTE:
     WB_DATINI
     WB_SEQORDER
F -> não altera nada
Novo -> INSERT L
L que sumiu integração -> F
======================================================
*/

function toInt(valor) {
    if (valor === null || valor === undefined || valor === '') return 0;
    return parseInt(valor, 10) || 0;
}

function formatarData(data) {
    if (!data) return null;

    const formatos = [
        'DD/MM/YYYY',
        'YYYY-MM-DD',
        'MM-DD-YYYY',
        'DD-MM-YYYY'
    ];

    const dt = moment(data, formatos, true);

    if (!dt.isValid()) return null;

    return dt.format('YYYY-MM-DD');
}

async function getSequenciamentoFromSapiens() {
    let connection;

    try {
        console.log('Iniciando sincronização Sequenciamento...');

        const client = await soap.createClientAsync(sapiensWsdlUrl);

        const params = {
            user: 'apontamentoweb',
            password: 'apontamentoweb',
            encryption: 0,
            parameters: { codEmp: 1 }
        };

        const [result] =
            await client[`${metodoSequenciamento}Async`](params);

        const dadosRecebidos = result?.result?.seqOpr;

        connection = await db.getConnection();
        await connection.beginTransaction();

        const chavesRecebidas = [];

        const processarRegistro = async (item) => {

            const registro = {
                numEmp: toInt(item.codEmp),
                numRec: item.codCre,
                numPed: toInt(item.numPed),
                itemPed: toInt(item.seqIpd),
                numOri: item.codOri,
                numSeq: toInt(item.seqRot),
                numOrp: toInt(item.numOrp),
                numProd: item.codPro,
                desProd: item.desPro,
                datIni: formatarData(item.datPrv),
                qtdPrev: toInt(item.qtdPrv),
                qtdProd: toInt(item.qtdRea),
                qtdSaldo: toInt(item.qtdSld),
                pcHora: toInt(item.pecHor),
                stsSap: item.sitOrp,
                seqOrder: toInt(item.seqPrg),
                temFsc: item.exiFSC
            };

            const chave = [
                registro.numEmp,
                registro.numOrp,
                registro.numOri,
                registro.numRec,
                registro.numSeq
            ].join('|');

            chavesRecebidas.push(chave);

            const [rows] = await connection.execute(`
                SELECT WB_STSGT
                FROM WB_SEQLIST
                WHERE WB_NUMEMP = ?
                  AND WB_NUMORP = ?
                  AND WB_NUMORI = ?
                  AND WB_NUMREC = ?
                  AND WB_NUMSEQ = ?
                LIMIT 1
            `, [
                registro.numEmp,
                registro.numOrp,
                registro.numOri,
                registro.numRec,
                registro.numSeq
            ]);

            /*
            ====================================
            REGISTRO EXISTE
            ====================================
            */
            if (rows.length > 0) {

                const statusAtual = rows[0].WB_STSGT;

                /*
                ===============================
                STATUS F = NÃO ALTERA NADA
                ===============================
                */
                if (statusAtual === 'F') {
                    return;
                }

                /*
                ===============================
                STATUS A = SOMENTE DATA / ORDEM
                ===============================
                */
                if (statusAtual === 'A') {

                    await connection.execute(`
                        UPDATE WB_SEQLIST
                        SET
                            WB_DATINI   = ?,
                            WB_SEQORDER = ?
                        WHERE
                            WB_NUMEMP = ?
                            AND WB_NUMORP = ?
                            AND WB_NUMORI = ?
                            AND WB_NUMREC = ?
                            AND WB_NUMSEQ = ?
                            AND WB_STSGT = 'A'
                    `, [
                        registro.datIni,
                        registro.seqOrder,

                        registro.numEmp,
                        registro.numOrp,
                        registro.numOri,
                        registro.numRec,
                        registro.numSeq
                    ]);

                    return;
                }

                /*
                ===============================
                STATUS L = ALTERA TUDO
                ===============================
                */
                await connection.execute(`
                    UPDATE WB_SEQLIST
                    SET
                        WB_NUMPED   = ?,
                        WB_ITEMPED  = ?,
                        WB_NUMPROD  = ?,
                        WB_DESPRO   = ?,
                        WB_DATINI   = ?,
                        WB_QTDPREV  = ?,
                        WB_QTDPROD  = ?,
                        WB_QTDSALDO = ?,
                        WB_PCHORA   = ?,
                        WB_STSSAP   = ?,
                        WB_SEQORDER = ?,
                        WB_TEMFSC   = ?
                    WHERE
                        WB_NUMEMP = ?
                        AND WB_NUMORP = ?
                        AND WB_NUMORI = ?
                        AND WB_NUMREC = ?
                        AND WB_NUMSEQ = ?
                        AND WB_STSGT = 'L'
                `, [
                    registro.numPed,
                    registro.itemPed,
                    registro.numProd,
                    registro.desProd,
                    registro.datIni,
                    registro.qtdPrev,
                    registro.qtdProd,
                    registro.qtdSaldo,
                    registro.pcHora,
                    registro.stsSap,
                    registro.seqOrder,
                    registro.temFsc,

                    registro.numEmp,
                    registro.numOrp,
                    registro.numOri,
                    registro.numRec,
                    registro.numSeq
                ]);

                return;
            }

            /*
            ====================================
            NOVO REGISTRO
            ====================================
            */
            await connection.execute(`
                INSERT INTO WB_SEQLIST (
                    WB_NUMEMP,
                    WB_NUMREC,
                    WB_NUMPED,
                    WB_ITEMPED,
                    WB_NUMORI,
                    WB_NUMSEQ,
                    WB_NUMORP,
                    WB_NUMPROD,
                    WB_DESPRO,
                    WB_DATINI,
                    WB_QTDPREV,
                    WB_QTDPROD,
                    WB_QTDSALDO,
                    WB_PCHORA,
                    WB_STSSAP,
                    WB_SEQORDER,
                    WB_TEMFSC,
                    WB_STSGT,
                    WB_FERRAMENTA
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                registro.numEmp,
                registro.numRec,
                registro.numPed,
                registro.itemPed,
                registro.numOri,
                registro.numSeq,
                registro.numOrp,
                registro.numProd,
                registro.desProd,
                registro.datIni,
                registro.qtdPrev,
                registro.qtdProd,
                registro.qtdSaldo,
                registro.pcHora,
                registro.stsSap,
                registro.seqOrder,
                registro.temFsc,
                'L',
                'N'
            ]);
        };

        /*
        PROCESSA ERP
        */
        if (Array.isArray(dadosRecebidos)) {
            for (const item of dadosRecebidos) {
                await processarRegistro(item);
            }
        } else if (dadosRecebidos) {
            await processarRegistro(dadosRecebidos);
        }

        /*
        ====================================
        L QUE NÃO VEIO = F
        ====================================
        */
        const [registrosL] = await connection.execute(`
            SELECT
                WB_NUMEMP,
                WB_NUMORP,
                WB_NUMORI,
                WB_NUMREC,
                WB_NUMSEQ
            FROM WB_SEQLIST
            WHERE WB_STSGT = 'L'
        `);

        for (const row of registrosL) {

            const chaveBanco = [
                row.WB_NUMEMP,
                row.WB_NUMORP,
                row.WB_NUMORI,
                row.WB_NUMREC,
                row.WB_NUMSEQ
            ].join('|');

            if (!chavesRecebidas.includes(chaveBanco)) {

                await connection.execute(`
                    UPDATE WB_SEQLIST
                    SET WB_STSGT = 'F'
                    WHERE
                        WB_NUMEMP = ?
                        AND WB_NUMORP = ?
                        AND WB_NUMORI = ?
                        AND WB_NUMREC = ?
                        AND WB_NUMSEQ = ?
                        AND WB_STSGT = 'L'
                `, [
                    row.WB_NUMEMP,
                    row.WB_NUMORP,
                    row.WB_NUMORI,
                    row.WB_NUMREC,
                    row.WB_NUMSEQ
                ]);
            }
        }

        await connection.commit();

        console.log('Sincronização concluída com sucesso.');

        return result;

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        console.error('Erro na sincronização:', error);
        throw error;

    } finally {

        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    getSequenciamentoFromSapiens
};

app.listen(9004, () => {
    console.log('Servidor rodando na porta 9004');
});