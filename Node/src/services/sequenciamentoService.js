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


const metodoSequenciamento = 'Sequenciamento';

const getSequenciamentoFromSapiens = async () => {
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

        //console.log(`Calling method ${metodoSequenciamento}...`);
        const [result] = await client[`${metodoSequenciamento}Async`](params);
        //console.log('SOAP response:', result.result.seqOpr);

        const dadosRecebidos = result.result.seqOpr;
        //console.log("Dados Recebidos:", dadosRecebidos);

        //const dadoEncontrado = dadosRecebidos.find(dado => dado.numOrp === '9935');

        // Exibir no console, se encontrado
        //if (dadoEncontrado) {
        //console.log('Dado encontrado para numOrp 9935:', dadoEncontrado);
        //} else {
        //console.log('Nenhum dado encontrado para numOrp 9935.');
        //}


        connection = await db.getConnection();
        await connection.beginTransaction();

        // Deletar registros com base na condição especificada
            await connection.execute(
            'DELETE FROM WB_SEQLIST WHERE WB_STSGT = "L"'
            );

            const verificarSeRegistroExiste = async (item) => {
                const { codEmp, numOrp, numPed, seqRot } = item;
                const [rows] = await connection.execute(
                    'SELECT * FROM WB_SEQLIST WHERE WB_NUMEMP = ? AND WB_NUMORP = ? AND WB_NUMPED = ? AND WB_NUMSEQ = ?',
                    [codEmp, numOrp, numPed, seqRot]
                );
                return rows.length > 0; // Retorna true se o registro existe
            };

            const verificarEAtualizarRegistro = async (item) => {
                const codCre = item.codCre;
                //const codCre = parseInt(item.codCre, 10);
                const codEmp = parseInt(item.codEmp, 10);
                const numOrp = parseInt(item.numOrp, 10);
                const numPed = parseInt(item.numPed, 10);
                const pecHor = parseInt(item.pecHor, 10);
                const qtdPrv = parseInt(item.qtdPrv, 10);
                //const qtdRea = 0;
                const qtdRea = parseInt(item.qtdRea, 10);
                const qtdSld = parseInt(item.qtdSld, 10);
                const seqIpd = parseInt(item.seqIpd, 10);
                const seqPrg = parseInt(item.seqPrg, 10);
                const seqRot = parseInt(item.seqRot, 10);
            
                const codOri = item.codOri;
                const codPro = item.codPro;
                const exiFSC = item.exiFSC;
                const wb_stsGt = 'L';

                // CORREÇÃO APOANTAMENTO VINDO DO SAPIENS
            
                // Preparar o valor de data
                const dataFormatada = item.datPrv && moment(item.datPrv, ["DD/MM/YYYY", "YYYY-MM-DD", "MM-DD-YYYY"]).isValid() 
                    ? moment(item.datPrv, ["DD/MM/YYYY", "YYYY-MM-DD", "MM-DD-YYYY"]).format('YYYY-MM-DD')
                    : null; 




                // Verifica se o registro já existe
                const registroExiste = await verificarSeRegistroExiste(item);
                
                if (!registroExiste) {
                    try {
                        await connection.execute(
                            'INSERT INTO WB_SEQLIST (WB_NUMEMP, WB_NUMREC, WB_NUMPED, WB_ITEMPED, WB_NUMORI, WB_NUMSEQ, WB_NUMORP, WB_NUMPROD, WB_DESPRO, WB_DATINI, WB_QTDPREV, WB_QTDPROD, WB_QTDSALDO, WB_PCHORA, WB_STSSAP, WB_SEQORDER, WB_TEMFSC, WB_STSGT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [codEmp, codCre, numPed, seqIpd, codOri, seqRot, numOrp, codPro, item.desPro, dataFormatada, qtdPrv, qtdRea, qtdSld, pecHor, item.sitOrp, seqPrg, exiFSC, wb_stsGt]
                        );
                        //console.log(`Registro ${numOrp} inserido.`);
                    } catch (error) {
                        console.error(`Erro ao inserir registro ${numOrp}:`, error);
                    }
                } else {
                    //console.log(`Registro ${numOrp} em Andamento, não sera inserido novamente.`);
                }
            };
            

        if (Array.isArray(dadosRecebidos)) {
            for (const item of dadosRecebidos) {
                await verificarEAtualizarRegistro(item);
            }
        } else if (dadosRecebidos) {
            await verificarEAtualizarRegistro(dadosRecebidos);
        } else {
            console.log('Nenhum dado Sequenciamento a inserir.');
        }

        await connection.commit();
        console.log('Transação Sequenciamento concluída com sucesso.');
        return result;
    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error('Transação Sequenciamento revertida devido a um erro.');
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
        await getSequenciamentoFromSapiens();
        res.status(200).send('Dados atualizados com sucesso');
    } catch (error) {
        res.status(500).send('Erro ao atualizar dados');
    }
});

module.exports = { getSequenciamentoFromSapiens };


// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9004, () => {
    console.log('Server running on port 9004');
});
