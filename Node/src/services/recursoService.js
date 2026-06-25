const soap = require('soap');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const moment = require('moment');

const logger = require('./logger');

const app = express();


// ======================================================
// MYSQL
// ======================================================

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'projeto_qa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ======================================================
// EXPRESS
// ======================================================

app.use(cors());
app.use(express.json());


// ======================================================
// SOAP
// ======================================================

const sapiensWsdlUrl = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Synccom.senior.g5.co.int.mpr.Madesp?wsdl';
const metodoRecurso = 'Recurso';

const empresas = [1, 3];

const getRecursoFromSapiens = async () => {

    let connection;

    try {

        /*logger.info(
            `[RECURSO] Iniciando sincronização em ${moment().format('DD/MM/YYYY HH:mm:ss')}`
        );*/


        // ======================================================
        // SOAP CLIENT
        // =====================================================
        const client = await soap.createClientAsync(sapiensWsdlUrl);
        // ======================================================
        // CONEXÃO MYSQL
        // ======================================================
        connection = await db.getConnection();
        await connection.beginTransaction();
        // ======================================================
        // ARRAY ACUMULADOR
        // ======================================================
        const todosDados = [];
        // ======================================================
        // LOOP EMPRESAS
        // ======================================================

        for (const codEmp of empresas) {

            try {

                /*logger.info(
                    `[RECURSO] Buscando recursos empresa ${codEmp}`
                );*/
                // ======================================================
                // PARAMS SOAP
                // ======================================================

                const params = {

                    user: 'apontamentoweb',
                    password: 'apontamentoweb',
                    encryption: 0,
                    parameters: {
                        codEmp: [codEmp]
                    }
                };

                // ======================================================
                // SOAP REQUEST
                // ======================================================
                const [result] =
                    await client[`${metodoRecurso}Async`](params);
                // =====================================================
                // DADOS RECEBIDOS
                // ======================================================
                const dadosRecebidos = result?.result?.lstRec;
                // ======================================================
                // VALIDA RETORNO
                // ======================================================

                if (!dadosRecebidos) {

                    /*logger.warn(
                        `[RECURSO] Empresa ${codEmp} retornou vazio`
                    );*/

                    continue;

                }
                // ======================================================
                // ADICIONA AO ARRAY
                // ======================================================
                if (Array.isArray(dadosRecebidos)) {

                    todosDados.push(...dadosRecebidos);

                } else {
                    todosDados.push(dadosRecebidos);
                }
                /*logger.info(
                    `[RECURSO] Empresa ${codEmp} processada com sucesso`
                );*/
            } catch (error) {

                logger.error(
                    `[RECURSO] Erro empresa ${codEmp}: ${error.stack || error.message || error}`
                );
            }
        }
        // ======================================================
        // VALIDA RETORNO TOTAL
        // ======================================================

        if (todosDados.length === 0) {
            /*logger.error(
                `[RECURSO] Nenhum dado retornado do SOAP. DELETE cancelado.`
            );*/
            await connection.rollback();
            return;
        }
        // ======================================================
        // DELETE SOMENTE SE EXISTIR DADOS
        // ======================================================

        await connection.execute(
            'DELETE FROM WB_RECURSO'
        );
       /* logger.info(
            `[RECURSO] Tabela WB_RECURSO limpa com sucesso`
        );*/
        // ======================================================
        // VERIFICA EXISTÊNCIA
        // ======================================================

        const verificarSeRegistroExiste = async (item) => {

            const { codEmp, codCre } = item;

            const [rows] = await connection.execute(

                `SELECT *
                 FROM WB_RECURSO
                 WHERE WB_CODEMP = ?
                 AND WB_IDREC = ?`,

                [
                    codEmp,
                    codCre
                ]

            );
            return rows.length > 0;
        };


        // ======================================================
        // INSERT / UPDATE
        // ======================================================

        const verificarEAtualizarRegistro = async (item) => {
            try {
                const codEmp = parseInt(item.codEmp, 10);
                const codCre = item.codCre;
                const desCre = item.desCre;
                const abrCre = item.abrCre;
                // ======================================================
                // VALIDA CAMPOS
                // ======================================================
                if (!codEmp || !codCre) {

                    /*logger.warn(
                        `[RECURSO] Registro inválido ignorado`
                    );*/
                    return;
                }
                // ======================================================
                // VERIFICA EXISTÊNCIA
                // ======================================================

                const registroExiste =
                    await verificarSeRegistroExiste(item);


                // ======================================================
                // INSERT
                // ======================================================

                if (!registroExiste) {

                    await connection.execute(

                        `INSERT INTO WB_RECURSO
                        (
                            WB_CODEMP,
                            WB_IDREC,
                            WB_ABREVREC,
                            WB_DESCREC
                        )
                        VALUES (?, ?, ?, ?)`,

                        [
                            codEmp,
                            codCre,
                            abrCre,
                            desCre
                        ]

                    );

                }

            } catch (error) {

                logger.error(
                    `[RECURSO] Erro ao inserir registro ${item.codCre}: ${error.stack || error.message || error}`
                );

            }

        };


        // ======================================================
        // INSERT DADOS
        // ======================================================

        for (const item of todosDados) {

            await verificarEAtualizarRegistro(item);

        }


        // ======================================================
        // COMMIT
        // ======================================================

        await connection.commit();

        logger.info(
            `[RECURSO] Transação concluída com sucesso`
        );

    } catch (error) {

        if (connection) {

            await connection.rollback();

        }

        logger.error(
            `[RECURSO] Erro geral: ${error.stack || error.message || error}`
        );

        throw new Error(error);

    } finally {

        if (connection) {

            connection.release();

        }

    }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    getRecursoFromSapiens
};


// ======================================================
// SERVER
// ======================================================

// RODANDO EM OUTRA PORTA PARA NÃO DAR CONFLITO

app.listen(9005, () => {

    logger.info(
        `[SERVER] Recurso Service rodando na porta 9005`
    );

});