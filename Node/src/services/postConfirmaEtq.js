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



const sapiensWsdlUrl = 'http://192.168.0.1:8080/g5-senior-services/sapiens_Syncintegracao.vedois?wsdl';
const metodoConfirmaEtq = "ApontamentoFinger";

const postConfirmaEtiquetaForSapiens = async () => {
    let connection;

    try {
        //console.log('Creating SOAP client...');
        const client = await soap.createClientAsync(sapiensWsdlUrl);
        //console.log('SOAP client created successfully');

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Selecionar registros com WB_PROCESS = 'N'
        const [rows] = await connection.execute(
            'SELECT WB_NUMEMP, WB_NUMORI, WB_NUMORP, WB_NUMREC, WB_NUMETQ, WB_QTDETQ, WB_DATAPONT, WB_OPERADOR FROM WB_APONTAMENTOETIQUETA WHERE WB_PROCESS = ?',
            ['N']
        );

        if (rows.length === 0) {
            console.log('Nenhum registro Componentes a ser processado.');
            return;
        }

        for (const row of rows) {
            const params = {
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
                    //HorEtq: moment(row.WB_DATAPONT, 'HH:mm:ss').format('HH:mm:ss'),
                    

                }
            };

            //console.log(`Enviando Componentes para ordem ${row.WB_NUMORP}...`);

            //console.log('Parâmetros enviados:', JSON.stringify(params, null, 2));

            try {
                const [result] = await client[`${metodoConfirmaEtq}Async`](params);
                //console.log('Resultado completo da resposta SOAP:', JSON.stringify(result, null, 2));

                // Verificar o retorno do SOAP para confirmar envio
                if (result?.result?.tipRet === '1') {
                    console.log(`Confirmação de Etiqueta OP ${row.WB_NUMORP} enviado com sucesso.`);
                
                    // Atualizar registro para WB_PROCESS = 'S'
                    await connection.execute(
                        'UPDATE WB_APONTAMENTOETIQUETA SET WB_PROCESS = ? WHERE WB_NUMETQ = ? AND WB_NUMORP = ?',
                        ['S', row.WB_NUMETQ, row.WB_NUMORP]
                    );
                } else {
                    console.warn(`Falha ao enviar Confirmação de Etiqueta para ordem ${row.WB_NUMORP}:`, result?.result?.msgRet || 'Erro desconhecido.');
                }
            } catch (error) {
                console.error(`Erro ao enviar Confirmação de Etiqueta para ordem ${row.WB_NUMORP}:`, error);
            }
        }

        await connection.commit();
        console.log('Transação Confirmação de Etiqueta concluída com sucesso.');
    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('Transação Confirmação de Etiqueta revertida devido a um erro.');
        }
        console.error('Erro ao processar apontamento de etiquetas:', error);
    } finally {
        if (connection) connection.release();
    }
};


module.exports = { postConfirmaEtiquetaForSapiens };


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9009, () => {
    console.log('Server running on port 9009');
});
