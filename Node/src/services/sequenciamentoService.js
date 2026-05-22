
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

L = Liberado
A = Andamento
F = Finalizado

REGRAS:

- Novo -> INSERT L
- L -> atualiza tudo
- A -> atualiza somente data e ordem
- F -> IGNORA COMPLETAMENTE
- L que sumiu do ERP -> F
- SOAP vazio -> CANCELA TUDO

======================================================
*/

function toStr(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 0;
    }

    return String(valor).trim();
}

function toInt(valor) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ''
    ) {
        return 0;
    }

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

    if (!dt.isValid()) {
        return null;
    }

    return dt.format('YYYY-MM-DD');
}

async function getSequenciamentoFromSapiens() {

    let connection;

    try {

        /*console.log('===================================');
        console.log('INICIANDO SINCRONIZAÇÃO');
        console.log('===================================');*/

        const client =
            await soap.createClientAsync(sapiensWsdlUrl);

        const params = {
            user: 'apontamentoweb',
            password: 'apontamentoweb',
            encryption: 0,
            parameters: {
                codEmp: 1
            }
        };

        const [result] =
            await client[`${metodoSequenciamento}Async`](params);

        /*
        ==========================================
        LOG SOAP
        ==========================================
        */

        /*console.log(
            JSON.stringify(result, null, 2)
        );*/

        /*
        ==========================================
        DADOS RECEBIDOS
        ==========================================
        */

        const dadosRecebidos =
            result?.result?.seqOpr ||
            result?.seqOpr ||
            [];

        /*
        ==========================================
        TRAVA SEGURANÇA
        ==========================================
        */

        if (
            !dadosRecebidos ||
            (
                Array.isArray(dadosRecebidos) &&
                dadosRecebidos.length === 0
            )
        ) {

            console.log('===================================');
            console.log('SEQUENCIAMENTO VEIO VAZIO');
            console.log('PROCESSO CANCELADO');
            console.log('NENHUM REGISTRO ALTERADO');
            console.log('===================================');

            return {
                success: false,
                message: 'SOAP vazio'
            };
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        /*
        ==========================================
        CHAVES ERP
        ==========================================
        */

        const chavesRecebidas = [];

        /*
        ==========================================
        PROCESSA REGISTRO
        ==========================================
        */

        const processarRegistro = async (item) => {

            const registro = {

                numEmp: toStr(item.codEmp),

                numRec: toStr(item.codCre),

                numPed: toStr(item.numPed),

                itemPed: toStr(item.seqIpd),

                numOri: toStr(item.codOri),

                numSeq: toStr(item.seqRot),

                numOrp: toStr(item.numOrp),

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

            /*
            ==========================================
            CHAVE PADRONIZADA
            ==========================================
            */

            const chave = [
                registro.numEmp,
                registro.numOrp,
                registro.numOri,
                registro.numRec,
                registro.numSeq
            ].join('|');

            //console.log('PROCESSANDO:', chave);

            /*
            ==========================================
            ADICIONA CHAVE ERP
            ==========================================
            */

            chavesRecebidas.push(chave);

            /*
            ==========================================
            PROCURA REGISTRO
            ==========================================
            */

            const [rows] = await connection.execute(`
                SELECT WB_STSGT
                FROM WB_SEQLIST
                WHERE
                    WB_NUMEMP = ?
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
            ==========================================
            REGISTRO EXISTE
            ==========================================
            */

            if (rows.length > 0) {

                const statusAtual =
                    rows[0].WB_STSGT;

                /*console.log(
                    'REGISTRO EXISTE:',
                    chave,
                    'STATUS:',
                    statusAtual
                );*/

                /*
                ======================================
                STATUS F
                ======================================
                */

                if (statusAtual === 'F') {

                    /*console.log(
                        'IGNORANDO F:',
                        chave
                    );*/

                    return;
                }

                /*
                ======================================
                STATUS A
                ======================================
                */

                if (statusAtual === 'A') {

                    /*console.log(
                        'ATUALIZANDO A:',
                        chave
                    );*/

                    await connection.execute(`
                        UPDATE WB_SEQLIST
                        SET
                            WB_DATINI = ?,
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
                ======================================
                STATUS L
                ======================================
                */

                /*console.log(
                    'ATUALIZANDO L:',
                    chave
                );*/

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
            ==========================================
            NOVO REGISTRO
            ==========================================
            */

            /*console.log(
                'NOVO REGISTRO:',
                chave
            );*/

            const [insertResult] =
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

            /*console.log(
                'INSERT OK:',
                insertResult.insertId
            );*/
        };

        /*
        ==========================================
        PROCESSA ERP
        ==========================================
        */

        if (Array.isArray(dadosRecebidos)) {

            for (const item of dadosRecebidos) {

                await processarRegistro(item);
            }

        } else {

            await processarRegistro(dadosRecebidos);
        }

        /*
        ==========================================
        FINALIZA REGISTROS AUSENTES
        ==========================================
        */

        /*console.log(
            'VERIFICANDO REGISTROS AUSENTES...'
        );*/

        const [registrosL] =
            await connection.execute(`
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
                toStr(row.WB_NUMEMP),
                toStr(row.WB_NUMORP),
                toStr(row.WB_NUMORI),
                toStr(row.WB_NUMREC),
                toStr(row.WB_NUMSEQ)
            ].join('|');

            /*
            ==========================================
            NÃO VEIO DO ERP
            ==========================================
            */

            if (
                !chavesRecebidas.includes(chaveBanco)
            ) {

                /*console.log(
                    'FINALIZANDO:',
                    chaveBanco
                );*/

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

        /*
        ==========================================
        COMMIT
        ==========================================
        */

        await connection.commit();

        //console.log('===================================');
        console.log('Transação Sequenciamento Concluida com Sucesso');
        //console.log('===================================');

        return {
            success: true
        };

    } catch (error) {

        if (connection) {

            await connection.rollback();
        }

        console.error('ERRO:', error);

        if (error.sqlMessage) {

            console.error(
                'SQL MESSAGE:',
                error.sqlMessage
            );
        }

        if (error.sql) {

            console.error(
                'SQL:',
                error.sql
            );
        }

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

app.listen(9005, () => {
    console.log('Server running on port 9005');
});

