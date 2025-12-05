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


const metodoDadosProduto = 'DadosProduto';


const aCodFam = [300, 301, 302, 303, 310, 311, 312, 313, 320, 330, 340, 350, 351, 352, 353, 359, 400, 410, 420, 430, 440, 450, 460, 470, 600001, 600002,
                600003, 600004, 600005, 600006, 600007, 600008, 600009, 600010, 600011, 600012, 600013, 600101, 600102, 600103, 600104, 600105,
                600106, 600107, 600108, 600109, 600110, 600111, 600112, 600113, 600201, 600202, 600203, 600204, 600205, 600206, 600207, 600208,
                600209, 600210, 600211, 600212, 600213, 650001, 650002, 650003, 650004, 650005, 650006, 650007, 650008, 650009, 650010, 650011,
                650012, 650013, 650101, 650102, 650103, 650104, 650105, 650106, 650107, 650108, 650109, 650110, 650111, 650112, 650113, 650201,
                650202, 650203, 650204, 650205, 650206, 650207, 650208, 650209, 650210, 650211, 650212, 650213];            

                const getDadosProdutoFromSapiens = async () => {
                    let connection;
                
                    try {
                        //console.log('Creating SOAP client...');
                        const client = await soap.createClientAsync(sapiensWsdlUrl);
                        //console.log('SOAP client created successfully');
                
                        connection = await db.getConnection();
                        await connection.beginTransaction();

                        // Deletar registros com base na condição especificada
                        await connection.execute(
                        'DELETE FROM WB_DADOSPRODUTO'
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
                            
                            //console.log(`Calling method ${metodoDadosProduto} for codFam ${codFam}...`);
                
                            try {
                                const [result] = await client[`${metodoDadosProduto}Async`](params);
                                
                                // Verifique se `result` e `result.result` não são nulos e se `lstPro` existe
                                const dadosRecebidos = result?.result?.lstPro;
                                
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
                                    //console.warn(`Nenhum dado DadosProduto retornado para codFam ${codFam}`);
                                }
                            } catch (error) {
                                console.error(`Erro ao buscar dados para codFam ${codFam}:`, error);
                            }
                        }
                
                        await connection.commit();
                        console.log('Transação Dados Produto concluída com sucesso.');
                    } catch (error) {
                        if (connection) {
                            await connection.rollback();
                            console.error('Transação Dados Produto revertida devido a um erro.');
                        }
                        console.error('Erro ao buscar dados do SAPIENS:', error);
                        throw new Error(error);
                    } finally {
                        if (connection) connection.release();
                    }
                };
                
                // Função para verificar e atualizar o registro no banco de dados
                const safeValue = (value, parser = (v) => v) => (value === undefined ? null : parser(value));

                const verificarEAtualizarRegistro = async (item, connection) => {
                    //... parâmetros e verificação do valor seguro (safeValue)
                    const codEmp = safeValue(item.codEmp, (v) => parseInt(v, 10));
                    const codFam = safeValue(item.codFam, (v) => parseInt(v, 10));
                    const comPro = safeValue(item.comPro, (v) => parseFloat(v));
                    const espPro = safeValue(item.espPro, (v) => parseFloat(v));
                    const larPro = safeValue(item.larPro, (v) => parseFloat(v));
                    const comBlk = safeValue(item.comBlk, (v) => parseFloat(v));
                    const espBlk = safeValue(item.espBlk, (v) => parseFloat(v));
                    const larBlk = safeValue(item.larBlk, (v) => parseFloat(v));
                    const codOri = safeValue(item.codOri);
                    const desPro = safeValue(item.desPro);
                    const desCpl = safeValue(item.desCpl);
                    const codDer = safeValue(item.codDer);
                    const desDer = safeValue(item.desDer);
                    const derBlk = safeValue(item.derBlk);
                    const desBlk = safeValue(item.desBlk);
                    const codPro = safeValue(item.codPro);
                    const proBlk = safeValue(item.proBlk);
                
                    const registroExiste = await verificarSeRegistroExiste(item, connection);
                
                    if (!registroExiste) {
                        try {
                            await connection.execute(
                                'INSERT INTO WB_DADOSPRODUTO (WB_CODEMP, WB_CODORI, WB_CODFAM, WB_NUMPROD, WB_DESPRO, WB_DESCPL, WB_CODDER, WB_DESDER, WB_PROBLK, WB_DERBLK, WB_DESBLK, WB_COMPRO, WB_ESPPRO, WB_LARPRO, WB_COMBLK, WB_ESPBLK, WB_LARBLK) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                                [
                                    codEmp, codOri, codFam, codPro, desPro, desCpl, codDer, desDer, 
                                    proBlk, derBlk, desBlk, comPro, espPro, larPro, comBlk, espBlk, larBlk
                                ]
                            );
                            //console.log(`Registro ${codPro} inserido.`);
                        } catch (error) {
                            console.error(`Erro ao inserir registro ${codPro}:`, error);
                        }
                    } else {
                        console.log(`Registro ${codPro} já existe e não será inserido novamente.`);
                    }
                };
                
                const verificarSeRegistroExiste = async (item, connection) => {
                    const { codEmp, codPro } = item;
                    const [rows] = await connection.execute(
                        'SELECT * FROM WB_DADOSPRODUTO WHERE WB_CODEMP = ? AND WB_NUMPROD = ?',
                        [codEmp, codPro]
                    );
                    return rows.length > 0;
                };

// Rota para executar o getDataFromSapiens
app.post('/importar-sapiens', async (req, res) => {
    try {
        await getDadosProdutoFromSapiens();
        res.status(200).send('Dados atualizados com sucesso');
    } catch (error) {
        res.status(500).send('Erro ao atualizar dados');
    }
});

module.exports = { getDadosProdutoFromSapiens };


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9006, () => {
    console.log('Server running on port 9006');
});
