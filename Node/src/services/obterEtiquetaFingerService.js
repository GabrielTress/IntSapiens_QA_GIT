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

const sapiensWsdlUrl = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Syncintegracao_vedois?wsdl';
const metodoObterEtiqueta = "ObtEtqPro";


// 🔹 Função para deletar registros com WB_STSGT = 'F'
/*async function deletarLinhasComStatusF() {
    try {
        const [result] = await db.query(`
            DELETE ETQ
            FROM WB_OBTERETIQUETA AS ETQ
            INNER JOIN WB_SEQLIST AS SEQ
            ON ETQ.WB_NUMORP = SEQ.WB_NUMORP
            WHERE SEQ.WB_STSGT = 'F'
            AND SEQ.WB_NUMREC = ETQ.WB_NUMREC;
        `);
        //console.log(`🗑️ ${result.affectedRows} linhas deletadas (WB_STSGT = 'F')`);
    } catch (error) {
        console.error('❌ Erro ao deletar linhas com WB_STSGT = F:', error);
    }
}*/


const getObterEtiquetaFingerFromSapiens = async () => {
    let connection;

    try {
        const client = await soap.createClientAsync(sapiensWsdlUrl);

        // 🔹 Etapa 1: Remove registros inválidos antes de iniciar a transação
        //await deletarLinhasComStatusF();

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(`
            SELECT DISTINCT WB_NUMORP, WB_NUMREC, WB_NUMORI 
            FROM WB_SEQLIST 
            WHERE (WB_NUMREC = '04' OR WB_NUMREC = '07') 
            AND WB_STSGT = 'L'
        `);

        for (const { WB_NUMORP, WB_NUMREC, WB_NUMORI } of rows) {
            const params = {
                user: 'apontamentoweb',
                password: 'apontamentoweb',
                encryption: 0,
                parameters: {
                    codEmp: 1,
                    codOri: WB_NUMORI,
                    numOrp: WB_NUMORP
                }
            };

            try {
                const [result] = await client[`${metodoObterEtiqueta}Async`](params);
                const dadosRecebidos = result?.result?.lstEtq;

                if (dadosRecebidos) {
                    const lista = Array.isArray(dadosRecebidos)
                        ? dadosRecebidos
                        : [dadosRecebidos];

                    for (const item of lista) {
                        await verificarEAtualizarRegistro(item, connection, WB_NUMORP, WB_NUMREC, WB_NUMORI);
                    }
                }
            } catch (error) {
                console.error(`❌ Erro ao buscar dados da OP ${WB_NUMORP}:`, error);
            }
        }

        await connection.commit();
        console.log('Transação ObterEtiqueta concluída com sucesso.');
    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('⚠️ Transação ObterEtiqueta revertida devido a erro.');
        }
        console.error('❌ Erro geral:', error);
    } finally {
        if (connection) connection.release();
    }
};


const verificarEAtualizarRegistro = async (item, connection, numOrp, numRec, codOri) => {
    const numEtq = item.numEtq.replace(/^0+/, '');
    const seqEtq = item.seqEtq;
    const qtdEtq = item.qtdEtq;

    const registroExiste = await verificarSeRegistroExiste(numEtq, connection);

    if (!registroExiste) {
        try {
            await connection.execute(
                `INSERT INTO WB_OBTERETIQUETA 
                (WB_NUMEMP, WB_NUMORP, WB_NUMORI, WB_NUMREC, WB_NUMETQ, WB_SEQETQ, WB_QTDETQ, WB_PROCESS) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [1, numOrp, codOri, numRec, numEtq, seqEtq, qtdEtq, 'N']
            );
        } catch (error) {
            console.error(`Erro ao inserir registro ${numEtq}:`, error);
        }
    }
};

const verificarSeRegistroExiste = async (numEtq, connection) => {
    const [rows] = await connection.execute(
        'SELECT 1 FROM WB_OBTERETIQUETA WHERE WB_NUMETQ = ?',
        [numEtq]
    );
    return rows.length > 0;
};

module.exports = { getObterEtiquetaFingerFromSapiens };

// 🔹 Porta do servidor
app.listen(9015, () => {
    console.log('Server running on port 9015');
});
