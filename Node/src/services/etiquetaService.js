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


const metodoEtiqueta = 'Etiqueta';


const aCodFam = [200, 250, 290, 300, 301, 302, 303, 310, 311, 312, 313, 320, 330, 350];            

                const getEtiquetaFromSapiens = async () => {
                    let connection;
                
                    try {
                        //console.log('Creating SOAP client...');
                        const client = await soap.createClientAsync(sapiensWsdlUrl);
                        //console.log('SOAP client created successfully');
                
                        connection = await db.getConnection();
                        await connection.beginTransaction();

                        // Deletar registros com base na condição especificada
                        await connection.execute(
                        'DELETE FROM WB_ETIQUETA'
                        );
                
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
                            
                            //console.log(`Calling method ${metodoEtiqueta} for codFam ${codFam}...`);
                
                            try {
                                const [result] = await client[`${metodoEtiqueta}Async`](params);
                                
                                // Verifique se `result` e `result.result` não são nulos e se `lstPro` existe
                                const dadosRecebidos = result?.result?.lstEtq;
                                
                                if (dadosRecebidos) {
                                    //console.log("Dados Recebidos para codFam", codFam, ":", dadosRecebidos);
                            
                                    // Processa os dados se `dadosRecebidos` for um array ou objeto
                                    if (Array.isArray(dadosRecebidos)) {
                                        for (const item of dadosRecebidos) {
                                            await verificarEAtualizarRegistro(item, connection);
                                        }
                                    } else {
                                        await verificarEAtualizarRegistro(dadosRecebidos, connection);
                                    }
                                } else {
                                    //console.warn(`Nenhum dado Etiqueta retornado para codFam ${codFam}`);
                                }
                            } catch (error) {
                                console.error(`Erro ao buscar dados Etiqueta para codFam ${codFam}:`, error);
                            }
                        }
                
                        await connection.commit();
                        console.log('Transação Etiqueta concluída com sucesso.');
                    } catch (error) {
                        if (connection) {
                            await connection.rollback();
                            console.error('Transação Etiqueta revertida devido a um erro.');
                        }
                        console.error('Erro ao buscar dados do SAPIENS:', error);
                        throw new Error(error);
                    } finally {
                        if (connection) connection.release();
                    }
                };
                
                const verificarEAtualizarRegistro = async (item, connection) => {
                    const numEtq = parseInt(item.numEtq, 10)
                    const codPro = item.codPro;
                    const desPro = item.desPro;
                    const qtdEtq = item.qtdEtq;
                    const sitEtq = item.sitEtq;
                    const temFSC = item.temFSC;
                
                    // Verifica se o status da etiqueta é "A" antes de prosseguir com a inserção
                    if (sitEtq === "A") {
                        const registroExiste = await verificarSeRegistroExiste(item, connection);
                
                        if (!registroExiste) {
                            try {
                                await connection.execute(
                                    'INSERT INTO WB_ETIQUETA (WB_NUMETQ, WB_CODPRO, WB_DESPRO, WB_QTDETQ, WB_SITETQ, WB_TEMFSC) VALUES (?, ?, ?, ?, ?, ?)',
                                    [numEtq, codPro, desPro, qtdEtq, sitEtq, temFSC]
                                );
                                //console.log(`Registro ${numEtq} inserido com sucesso.`);
                            } catch (error) {
                                console.error(`Erro ao inserir registro ${numEtq}:`, error);
                            }
                        } else {
                            console.log(`Registro ${numEtq} já existe e não será inserido novamente.`);
                        }
                    } else {
                        //console.log(`Etiqueta ${numEtq} ignorada (sitEtq != "A").`);
                    }
                };
                
                const verificarSeRegistroExiste = async (item, connection) => {
                    const { numEtq } = item;
                    const [rows] = await connection.execute(
                        'SELECT * FROM WB_ETIQUETA WHERE WB_NUMETQ = ?',
                        [numEtq]
                    );
                    return rows.length > 0;
                };

// Rota para executar o getDataFromSapiens
app.post('/importar-sapiens', async (req, res) => {
    try {
        await getEtiquetaFromSapiens();
        res.status(200).send('Dados atualizados com sucesso');
    } catch (error) {
        res.status(500).send('Erro ao atualizar dados');
    }
});

module.exports = { getEtiquetaFromSapiens };


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9007, () => {
    console.log('Server running on port 9007');
});
