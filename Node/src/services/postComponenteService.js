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
const metodoComponente = "ApontamentoComponente";

const postApontamentoComponentesForSapiens = async () => {
    let connection;

    try {
        //console.log('Creating SOAP client...');
        const client = await soap.createClientAsync(sapiensWsdlUrl);
        //console.log('SOAP client created successfully');

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Selecionar registros com WB_PROCESS = 'N'
        const [rows] = await connection.execute(
            'SELECT WB_NUMEMP, WB_NUMORI, WB_NUMORP, WB_DTAPONT, WB_NUMETQ FROM WB_COMPONENTES WHERE WB_PROCESS = ?',
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
                    DatBxa: moment(row.WB_DTAPONT, 'DD-MM-YYYY HH:mm:ss').format('DD/MM/YYYY'),
                    //DatBxa: row.WB_DTAPONT,
                    NumEtq: row.WB_NUMETQ,

                }
            };

            //console.log(`Enviando Componentes para ordem ${row.WB_NUMORP}...`);

            //console.log('Parâmetros enviados:', JSON.stringify(params, null, 2));

            try {
                const [result] = await client[`${metodoComponente}Async`](params);
                //console.log('Resultado completo da resposta SOAP:', JSON.stringify(result, null, 2));

                // Verificar o retorno do SOAP para confirmar envio
                if (result?.result?.tipRet === '1') {
                    console.log(`Componentes para ordem ${row.WB_NUMORP} enviado com sucesso.`);
                
                    // Atualizar registro para WB_PROCESS = 'S'
                    await connection.execute(
                        'UPDATE WB_COMPONENTES SET WB_PROCESS = ? WHERE WB_NUMEMP = ? AND WB_NUMORI = ? AND WB_NUMORP = ? AND WB_NUMETQ = ?',
                        ['S', row.WB_NUMEMP, row.WB_NUMORI, row.WB_NUMORP, row.WB_NUMETQ]
                    );
                } else {
                    console.warn(`Falha ao enviar Componentes para ordem ${row.WB_NUMORP}:`, result?.result?.msgRet || 'Erro desconhecido.');
                }
            } catch (error) {
                console.error(`Erro ao enviar Componentes para ordem ${row.WB_NUMORP}:`, error);
            }
        }

        await connection.commit();
        console.log('Transação Componentes concluída com sucesso.');
    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('Transação Componentes revertida devido a um erro.');
        }
        console.error('Erro ao processar apontamentos:', error);
    } finally {
        if (connection) connection.release();
    }
};

// Rota para executar o getDataFromSapiens
app.post('/importar-sapiens', async (req, res) => {
    try {
        await postApontamentoComponentesForSapiens();
        res.status(200).send('Dados atualizados com sucesso');
    } catch (error) {
        res.status(500).send('Erro ao atualizar dados');
    }
});

module.exports = { postApontamentoComponentesForSapiens };


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9009, () => {
    console.log('Server running on port 9009');
});
