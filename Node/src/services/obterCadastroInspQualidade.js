const soap = require('soap');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const moment = require('moment');
const logger = require('./logger');
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
const metodoObterCadastro = "ConsultaInspProducao";

const getObterCadastroInspQualidade = async () => {
    let connection;

    try {
        const client = await soap.createClientAsync(sapiensWsdlUrl);

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute(`
            SELECT DISTINCT WB_NUMEMP, WB_NUMPROD
            FROM WB_SEQLIST 
            WHERE WB_STSGT = 'L'
        `);

        for (const { WB_NUMEMP, WB_NUMPROD } of rows) {
       
            const params = {
                user: 'apontamentoweb',
                password: 'apontamentoweb',
                encryption: 0,
                parameters: {
                    codEmp: WB_NUMEMP,
                    codPro: WB_NUMPROD,
                    
                    
                }
            };

            //console.log(`Chamando método ${metodoObterCadastro} para produto ${WB_NUMPROD}...`);

            try {
                let [result] = await client[`${metodoObterCadastro}Async`](params);
                let dadosRecebidos = result?.result?.seqPrd || result?.result?.tabVer;
            
                if (dadosRecebidos && !Array.isArray(dadosRecebidos)) {
                    dadosRecebidos = [dadosRecebidos];
                }
            
                if (dadosRecebidos) {
                   // console.log(`Dados recebidos para o produto ${WB_NUMPROD}:`);
            
                    const lista = Array.isArray(dadosRecebidos)
                        ? dadosRecebidos
                        : [dadosRecebidos];
                       
            
                        for (const item of lista) {
                            // Passa o objeto inteiro (com os dados pai e o tabVer dentro dele)
                            //await verificarEAtualizarRegistro(item, connection, WB_NUMEMP, WB_NUMPROD);
                            await processarProduto(item, connection, WB_NUMEMP);
                        }


                } else {
                    //console.warn(`Nenhum dado retornado para produto ${WB_NUMPROD}`);
                }
            } catch (error) {
                //console.error("Erro ao obter cadastro:", error);
                logger.error(
                    `[OBTER_CADASTRO_INSP_QUALIDADE] Erro ao obter cadastro.`
                );
            }
            
        }

        await connection.commit();
        //console.log('Transação Cadastro CheckList concluída com sucesso.');
        logger.info(`[INSP_QUALIDADE] Transação concluída com sucesso.`);
    } catch (error) {
        if (connection) {
            await connection.rollback();
            //console.error('Transação Cadastro CheckList revertida devido a erro.');
            logger.error(`[INSP_QUALIDADE] Transação revertida devido a erro: ${error.stack || error.message || error}`);
        }
        //console.error('Erro geral:', error);
        logger.error(`[INSP_QUALIDADE] Erro geral: ${error.stack || error.message || error}`);
    } finally {
        if (connection) connection.release();
    }
};

// 🔑 Função que gera a chave única baseada em todos os campos relevantes


const processarProduto = async (registroPai, connection, numEmp) => {
    try {
        //console.log(`\n🔍 Processando registro PAI: ${registroPai.codPin || 'SEM CODPIN'}`);

        const registrosCompletos = [];

        // Normaliza entrada (tabVer pode ser array ou objeto único)
        const tabVersoes = Array.isArray(registroPai.tabVer) ? registroPai.tabVer : [registroPai.tabVer];
        for (const tab of tabVersoes) {
            if (!tab) continue;

            const item = {
                codCre: registroPai.codCre || null,
                codDoc: registroPai.codDoc || null,
                codEtg: registroPai.codEtg || null,
                codInp: registroPai.codInp || null,
                codOpr: registroPai.codOpr || null,
                codPin: registroPai.codPin || null,
                codRot: registroPai.codRot || null,
                perInp: registroPai.perInp || null,
                pesNot: registroPai.pesNot || null,
                qtdInp: registroPai.qtdInp || null,
                seqPxi: registroPai.seqPxi || null,
                seqRot: registroPai.seqRot || null,
                sfxEtr: registroPai.sfxEtr || null,
                sfxSeq: registroPai.sfxSeq || null,
                codInp2: tab.codInp || null,
                desVer: tab.desVer || null,
                seqVer: tab.seqVer || null,
                tipAva: tab.tipAva || null,
                tipVlr: tab.tipVlr || null,
                uniMed: tab.uniMed || null,
                vlrAlv: tab.vlrAlv || null,
                vlrMax: tab.vlrMax || null,
                vlrMin: tab.vlrMin || null
            };

            registrosCompletos.push(item);
            //console.log(`   → Preparado para inserção/verificação: ${item.codPin} - ${item.desVer}`);
        }

        // Insert / Update
        for (const item of registrosCompletos) {
            //console.log(`   → Verificando existência no banco: ${item.codPin} - ${item.desVer}`);
            const registroExiste = await verificarSeRegistroExiste(item.codPin, item.desVer, item.codCre, connection);

            if (!registroExiste) {
                const query = `
                    INSERT INTO WB_ITENSCHECKLIST (
                        WB_NUMEMP, WB_NUMREC, WB_CODDOC, WB_CODEST, WB_CODINP, WB_CODOPR, WB_CODPIN, WB_CODROT, WB_PERINP,
                        WB_PESNOT, WB_QTDINP, WB_SEQPXI, WB_SEQROT, WB_SFXETR, WB_SFXSEQ, WB_CODINP2, WB_DESVER, WB_SEQVER,
                        WB_TIPAVA, WB_TIPVLR, WB_UNIMED, WB_VLRALV, WB_VLRMAX, WB_VLRMIN
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    numEmp, item.codCre, item.codDoc, item.codEtg, item.codInp, item.codOpr, item.codPin, item.codRot,
                    item.perInp, item.pesNot, item.qtdInp, item.seqPxi, item.seqRot, item.sfxEtr, item.sfxSeq,
                    item.codInp2, item.desVer, item.seqVer, item.tipAva, item.tipVlr, item.uniMed,
                    item.vlrAlv, item.vlrMax, item.vlrMin
                ];
                await connection.execute(query, values);
                //console.log(`      ✅ Inserido: ${item.codPin} - ${item.desVer}`);
            } else {
                // Atualiza somente se houver diferenças
                const camposDiferentes = [
                    ["WB_NUMREC", item.codCre, registroExiste.WB_NUMREC],
                    ["WB_CODDOC", item.codDoc, registroExiste.WB_CODDOC],
                    ["WB_CODEST", item.codEtg, registroExiste.WB_CODEST],
                    ["WB_CODINP", item.codInp, registroExiste.WB_CODINP],
                    ["WB_CODOPR", item.codOpr, registroExiste.WB_CODOPR],
                    ["WB_CODROT", item.codRot, registroExiste.WB_CODROT],
                    ["WB_PERINP", item.perInp, registroExiste.WB_PERINP],
                    ["WB_PESNOT", item.pesNot, registroExiste.WB_PESNOT],
                    ["WB_QTDINP", item.qtdInp, registroExiste.WB_QTDINP],
                    ["WB_SEQPXI", item.seqPxi, registroExiste.WB_SEQPXI],
                    ["WB_SEQROT", item.seqRot, registroExiste.WB_SEQROT],
                    ["WB_SFXETR", item.sfxEtr, registroExiste.WB_SFXETR],
                    ["WB_SFXSEQ", item.sfxSeq, registroExiste.WB_SFXSEQ],
                    ["WB_CODINP2", item.codInp2, registroExiste.WB_CODINP2],
                    ["WB_SEQVER", item.seqVer, registroExiste.WB_SEQVER],
                    ["WB_TIPAVA", item.tipAva, registroExiste.WB_TIPAVA],
                    ["WB_TIPVLR", item.tipVlr, registroExiste.WB_TIPVLR],
                    ["WB_UNIMED", item.uniMed, registroExiste.WB_UNIMED],
                    ["WB_VLRALV", item.vlrAlv, registroExiste.WB_VLRALV],
                    ["WB_VLRMAX", item.vlrMax, registroExiste.WB_VLRMAX],
                    ["WB_VLRMIN", item.vlrMin, registroExiste.WB_VLRMIN],
                ].filter(([campo, novo, atual]) => novo != atual);

                if (camposDiferentes.length > 0) {
                    const queryUpdate = `
                        UPDATE WB_ITENSCHECKLIST
                           SET WB_NUMREC = ?, WB_CODDOC = ?, WB_CODEST = ?, WB_CODINP = ?, WB_CODOPR = ?, WB_CODROT = ?, WB_PERINP = ?,
                               WB_PESNOT = ?, WB_QTDINP = ?, WB_SEQPXI = ?, WB_SEQROT = ?, WB_SFXETR = ?, WB_SFXSEQ = ?,
                               WB_CODINP2 = ?, WB_SEQVER = ?, WB_TIPAVA = ?, WB_TIPVLR = ?, WB_UNIMED = ?, WB_VLRALV = ?, WB_VLRMAX = ?, WB_VLRMIN = ?
                        WHERE WB_CODPIN = ? AND WB_DESVER = ? AND WB_NUMREC = ?
                    `;
                    const valuesUpdate = [
                        item.codCre, item.codDoc, item.codEtg, item.codInp, item.codOpr, item.codRot, item.perInp,
                        item.pesNot, item.qtdInp, item.seqPxi, item.seqRot, item.sfxEtr, item.sfxSeq,
                        item.codInp2, item.seqVer, item.tipAva, item.tipVlr, item.uniMed, item.vlrAlv, item.vlrMax, item.vlrMin,
                        item.codPin, item.desVer, item.codCre
                    ];
                    await connection.execute(queryUpdate, valuesUpdate);
                   // console.log(`      ♻️ Atualizado: ${item.codPin} - ${item.desVer} (${camposDiferentes.map(c => c[0]).join(", ")})`);
                } else {
                    //console.log(`      ⏩ Sem alterações: ${item.codPin} - ${item.desVer}`);
                }
            }
        }


    } catch (error) {
        //console.error("Erro ao processar produto:", error);
        logger.error(
            `[OBTER_CADASTRO_INSP_QUALIDADE] Erro ao processar produto: ${error.stack || error.message || error}`
        );
    }
};
  
  // Função para verificar se o registro já existe
  const verificarSeRegistroExiste = async (codPin, desVer, codCre, connection) => {
    // desVer pode ser 'PAI' ou o valor real do tabVer
    const [rows] = await connection.execute(
      `SELECT * 
         FROM WB_ITENSCHECKLIST 
        WHERE WB_CODPIN = ? 
          AND WB_DESVER = ? 
          AND WB_NUMREC = ?`,
      [codPin, desVer, codCre]
    );
  
    // Retorna o registro se existir, ou null se não existir
    return rows.length > 0 ? rows[0] : null;
  };
  
module.exports = { getObterCadastroInspQualidade };

// RODANDO EM OUTRA PORTA PARA NAO DAR CONFLITO COM A PORTA 3002 DO BANCO
app.listen(9016, () => {
    console.log('Server running on port 9016');
});
