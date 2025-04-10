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


const metodoRecurso = 'Recurso';


const getRecursoFromSapiens = async () => {
    let connection;
    try {
        //console.log('Creating SOAP client...');
        const client = await soap.createClientAsync(sapiensWsdlUrl);
        //console.log('SOAP client created successfully');

        const params = {
            user: 'apontamentoweb',
            password: 'apontamentoweb',
            encryption: 0,
            parameters: {
                codEmp: 1
            }
        };

        console.log(`Calling method ${metodoRecurso}...`);
        const [result] = await client[`${metodoRecurso}Async`](params);
        //console.log('SOAP response:', result);

        const dadosRecebidos = result.result.lstRec;
        //console.log("Dados Recebidos:", dadosRecebidos);

        connection = await db.getConnection();
        await connection.beginTransaction();

        //console.log(dadosRecebidos);
        //Deletar registros com base na condição especificada
            await connection.execute(
            'DELETE FROM WB_RECURSO'
            );

            const verificarSeRegistroExiste = async (item) => {
                const { codEmp, codCre, desCre, abrCre } = item;
                const [rows] = await connection.execute(
                    'SELECT * FROM WB_RECURSO WHERE WB_CODEMP = ? AND WB_IDREC = ?',
                    [codEmp, codCre]
                );
                return rows.length > 0; // Retorna true se o registro existe
            };

            const verificarEAtualizarRegistro = async (item) => {
                const codEmp = parseInt(item.codEmp, 10);
                //const codCre = parseInt(item.codEmp, 10);

                const codCre = item.codCre;
                const desCre = item.desCre;
                const abrCre = item.abrCre;

            
                // Verifica se o registro já existe
                const registroExiste = await verificarSeRegistroExiste(item);
                
                if (!registroExiste) {
                    try {
                        await connection.execute(
                            'INSERT INTO WB_RECURSO (WB_CODEMP, WB_IDREC, WB_ABREVREC, WB_DESCREC) VALUES (?, ?, ?, ?)',
                            [codEmp, codCre, abrCre, desCre]
                        );
                        //console.log(`Registro ${numOrp} inserido.`);
                    } catch (error) {
                        console.error(`Erro ao inserir registro Recurso ${codCre}:`, error);
                    }
                } else {
                    //console.log(`Registro ${codEmp} já existe e não será inserido novamente.`);
                }
            };
            

        if (Array.isArray(dadosRecebidos)) {
            for (const item of dadosRecebidos) {
                await verificarEAtualizarRegistro(item);
            }
        } else if (dadosRecebidos) {
            await verificarEAtualizarRegistro(dadosRecebidos);
        } else {
            console.log('Nenhum dado Recurso a inserir.');
        }

        await connection.commit();
        console.log('Transação Recurso concluída com sucesso.');
        return result;
    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('Transação Recurso revertida devido a um erro.');
        }
        console.error('Erro ao buscar dados do SAPIENS:', error);
        throw new Error(error);
    } finally {
        if (connection) connection.release();
    }
};


// Rota para executar o getDataFromSapiens
app.post('/importar-sapiens', async (req, res) => {
    try {
        await getRecursoFromSapiens();
        res.status(200).send('Dados atualizados com sucesso');
    } catch (error) {
        res.status(500).send('Erro ao atualizar dados');
    }
});

module.exports = { getRecursoFromSapiens };


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9005, () => {
    console.log('Server running on port 9005');
});
