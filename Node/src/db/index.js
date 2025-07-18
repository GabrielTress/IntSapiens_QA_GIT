const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
const cors = require('cors');
/*const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
//const printer = require("node-printer");
//console.log(typeof printer.printDirect);*/


const port = 9002;

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'projeto_qa'
});

app.use(cors());
app.use(express.json());



////////BUSCANDO LISTA DE SEQUENCIAMENTO DO BANCO DE DADOS///////////////

app.get('/sequenciamento', async (req, res) => {
  try {
    //const [results] = await db.query('SELECT * FROM WB_SEQLIST WHERE WB_STSGT <> "F" OR WB_QTDPROD < WB_QTDPREV OR WB_STSGT IS NULL ORDER BY WB_DATINI ASC, WB_SEQORDER ASC');
    const [results] = await db.query('SELECT * FROM WB_SEQLIST WHERE WB_STSGT <> "F" OR WB_QTDPROD < WB_QTDPREV ORDER BY WB_DATINI ASC, WB_SEQORDER ASC');
    //console.log('Dados retornados do banco:', results); // Log para verificar os dados

    const mappedResults = results.map(row => ({
      wb_numEmp: row.WB_NUMEMP,
      wb_numRec: row.WB_NUMREC,
      wb_numPed: row.WB_NUMPED,
      wb_itemPed: row.WB_ITEMPED,
      wb_numOri: row.WB_NUMORI,
      wb_numSeq: row.WB_NUMSEQ,
      wb_numOrp: row.WB_NUMORP,
      wb_numProd: row.WB_NUMPROD,
      wb_desPro: row.WB_DESPRO,
      wb_datIni: row.WB_DATINI,
      wb_datFim: row.WB_DATFIM,
      wb_qtdPrev: row.WB_QTDPREV,
      wb_qtdProd: row.WB_QTDPROD,
      wb_qtdSaldo: row.WB_QTDSALDO,
      wb_pcHora: row.WB_PCHORA,
      wb_tempSaldo: row.WB_TEMPSALDO,
      wb_atraso: row.WB_ATRASO,
      wb_stsGt: row.WB_STSGT,
      wb_stsSap: row.WB_STSSAP,
      wb_seqOrder: row.WB_SEQORDER,
      wb_temFsc: row.WB_TEMFSC
    }));

    res.json(mappedResults);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  }
});
/********************************************************/

/////////INSERINDO DADOS DO APONTAMENTO////////////////
app.post('/apontamento', async (req, res) => {
  const {wb_numEmp, wb_numRec, wb_numOri, wb_numSeq, wb_numOrp, wb_numProd, wb_qtdProd, wb_qtdRef, wb_dtApont, wb_process } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    // Inserindo o novo apontamento na tabela WB_APONTAMENTO
    const insertSql = 'INSERT INTO WB_APONTAMENTO (wb_numEmp, wb_numRec, wb_numOri, wb_numSeq, wb_numOrp, wb_numProd, wb_qtdProd, wb_qtdRef, wb_dtApont, wb_process) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await connection.query(insertSql, [wb_numEmp, wb_numRec, wb_numOri, wb_numSeq, wb_numOrp, wb_numProd, wb_qtdProd, wb_qtdRef, wb_dtApont, wb_process]);

    // Obtendo os valores atuais da tabela WB_SEQLIST
    const [result] = await connection.query(
      'SELECT wb_qtdProd, wb_qtdPrev, wb_stsGt FROM WB_SEQLIST WHERE wb_numEmp = ? AND wb_numRec = ? AND wb_numOrp = ? AND wb_numSeq = ? AND wb_numOri = ?', 
      [wb_numEmp, wb_numRec, wb_numOrp, wb_numSeq, wb_numOri]
    );
    
    if (result.length === 0) {
      throw new Error('Nenhum registro encontrado na tabela WB_SEQLIST para os valores fornecidos.');
    }

    const currentQtdProd = result[0].wb_qtdProd || 0;
    const qtdPrev = result[0].wb_qtdPrev || 0;
    let newQtdProd = currentQtdProd + wb_qtdProd;
    let newStsGt = 'L';
    
    // Determinar o novo status wb_stsGt
    if (newQtdProd >= 1 && newQtdProd < qtdPrev) {
      newStsGt = 'A';
    } else if (newQtdProd >= qtdPrev) {
      newStsGt = 'F';
    }

    // Calcular o novo wb_qtdSaldo
    const newQtdSaldo = qtdPrev - newQtdProd;

    // Atualizando a tabela WB_SEQLIST
    const updateSql = 'UPDATE WB_SEQLIST SET wb_qtdProd = ?, wb_stsGt = ?, wb_qtdSaldo = ? WHERE wb_numEmp = ? AND wb_numRec = ? AND wb_numOrp = ? AND wb_numSeq = ? AND wb_numOri =?';
    await connection.query(updateSql, [newQtdProd, newStsGt, newQtdSaldo, wb_numEmp, wb_numRec, wb_numOrp, wb_numSeq, wb_numOri]);

    // Commit a transação
    await connection.commit();
    res.status(200).json({ message: 'Apontamento e atualização realizados com sucesso!' });
  } catch (err) {
    // Rollback em caso de erro
    await connection.rollback();
    console.error('Erro ao realizar o apontamento e atualização:', err);
    res.status(500).send('Erro ao realizar o apontamento e atualização.');
  } finally {
    connection.release();
  }
});
/*****************************************************/

//////////LISTA DE RECURSOS////////////////////////////
app.get('/recursos', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM WB_RECURSO');
    

    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  }
});

//////////////LISTA DADOS DO PRODUTO//////////////////////////////////
app.get('/infoProdutos/:wb_numProd', async (req, res) => {
  try {
    const { wb_numProd } = req.params;

    if (!wb_numProd) {
      return res.status(400).send('Código do produto não fornecido');
    }

    const [results] = await db.query(
      'SELECT WB_NUMPROD, WB_CODFAM, WB_DESPRO, WB_DESCPL, WB_DESDER, WB_PROBLK, WB_DESBLK, WB_COMPRO, WB_ESPPRO, WB_LARPRO FROM WB_DADOSPRODUTO WHERE WB_NUMPROD = ?',
      [wb_numProd]
    );

    if (results.length === 0) {
      return res.status(404).send('Produto não encontrado');
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados do produto');
  }
});

////////CONSULTA PARA VALIDAR SE A ETIQUETA ESTA ATIVA///////////////
app.get('/etiquetas', async (req, res) => {
  const connection = await db.getConnection();
  const { wb_numEtq } = req.query;

  if (!wb_numEtq) {
    return res.status(400).send('Parâmetro wb_numEtq é obrigatório');
  }

  try {
    const [results] = await connection.query(
      'SELECT 1 FROM WB_ETIQUETA WHERE WB_NUMETQ = ? LIMIT 1',
      [wb_numEtq]
    );

    const existe = results.length > 0;
    res.json({ existe });

  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  } finally {
    connection.release();
  }
});

////////CONSULTA PARA VALIDAR SE A ETIQUETA E FSC///////////////
app.get('/etiquetasFSC', async (req, res) => {

  const connection = await db.getConnection();
  try {
    const [results] = await connection.query('SELECT WB_NUMETQ FROM WB_ETIQUETA WHERE WB_TEMFSC = "S"');
    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  } finally {
    connection.release(); // Libera a conexão do pool
  }
  });

  

////////CONSULTA PARA VALIDAR SE A ETIQUETA JA FOI LIDA///////////////
app.get('/componentes', async (req, res) => {
  const { wb_numEmp, wb_numEtq } = req.query;
  const connection = await db.getConnection();

  try {
    const [results] = await connection.query(
      `SELECT WB_NUMETQ FROM WB_COMPONENTES WHERE WB_NUMEMP = ? AND WB_NUMETQ = ?`,
      [wb_numEmp, wb_numEtq]
    );
    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  } finally {
    connection.release();
  }
});


///////////////////////////////////////////////////////

///INSERINDO COMPONENTES / MP NO BANCO
app.post('/componentes', async (req, res) => {
  const {wb_numEmp, wb_numRec, wb_numOri, wb_numSeq, wb_numOrp, wb_numProd, wb_numEtq, wb_dtApont, wb_process } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    // Inserindo o novo apontamento na tabela WB_APONTAMENTO
    const insertSql = 'INSERT INTO WB_COMPONENTES (wb_numEmp, wb_numRec, wb_numOri, wb_numSeq, wb_numOrp, wb_numProd, wb_numEtq, wb_dtApont, wb_process) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await connection.query(insertSql, [wb_numEmp, wb_numRec, wb_numOri, wb_numSeq, wb_numOrp, wb_numProd, wb_numEtq, wb_dtApont, wb_process]);


    // Commit a transação
    await connection.commit();
    res.status(200).json({ message: 'Apontamento realizado com sucesso!' });
  } catch (err) {
    // Rollback em caso de erro
    await connection.rollback();
    console.error('Erro ao realizar a inserção. Etiqueta ', wb_numEtq, ' ja lida anteriormente');
    res.status(500).send('Erro ao realizar a inserção.');
  } finally {
    connection.release();
  }
});

//////////////////////////////////////

/////////////DESENHO/////////////////////////
app.get('/desenhoProduto/:numProd', (req, res) => {
  const path = require('path');
  const pdfDirectory = path.resolve('//192.168.0.250/Meus Documentos/Exportação/MOLDURAS MADESP/DESENHOS PRODUÇÃO');
  const numProd = req.params.numProd.slice(0, 14);
  const fs = require('fs');
  // Listar arquivos no diretório
  fs.readdir(pdfDirectory, (err, files) => {
    if (err) {
      return res.status(500).send('Erro ao acessar diretório');
    }

    // Encontrar o arquivo que começa com numProd
    const fileName = files.find(file => file.startsWith(numProd));
    
    if (fileName) {
      const filePath = path.join(pdfDirectory, fileName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.sendFile(filePath);
    } else {
      res.status(404).send('Arquivo não encontrado');
    }
  });

});


/////////////PEDIDO/////////////////////////
app.get('/pedido/:numPed', (req, res) => {
  const path = require('path');
  const pdfDirectory = path.resolve('//192.168.0.250/Meus Documentos/Exportação/MOLDURAS MADESP/WORD');


  const numPed = req.params.numPed;
  const fs = require('fs');
  // Listar arquivos no diretório
  fs.readdir(pdfDirectory, (err, files) => {
    if (err) {
      return res.status(500).send('Erro ao acessar diretório');
    }

    function extrairNumerosIniciais(nomeArquivo) {
      const match = nomeArquivo.match(/^\d+/);
      return match ? match[0] : null;
  }

    // Encontrar o arquivo que começa com numPed
    const fileName = files.find(file => file.startsWith(extrairNumerosIniciais(numPed)));
    
    if (fileName) {
      const filePath = path.join(pdfDirectory, fileName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + fileName + '"');
      res.sendFile(filePath);
    } else {
      res.status(404).send('Arquivo não encontrado');
    }
  });

});

//////////////////////////////////////////////////////////////

app.post('/Repasse', async (req, res) => {
  const { op, motivo, data, quantidade, perfil, espessura, largura, status_largura, recurso } = req.body;
  const sqlInsert = 'INSERT INTO REPASSE (op, motivo, data, quantidade, perfil, espessura, largura, status_largura, recurso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  const sqlSelectTotal = 'SELECT SUM(quantidade) as quantidadeTotal FROM REPASSE WHERE op = ?';
  const connection = await db.getConnection();

  try {
    await connection.query(sqlInsert, [op, motivo, data, quantidade, perfil, espessura, largura, status_largura, recurso]);

    const [rows] = await connection.query(sqlSelectTotal, [op]);
    const quantidadeTotal = rows[0].quantidadeTotal || 0;

    res.status(200).json({ message: 'Dados adicionados com sucesso', quantidadeTotal });
  } catch (err) {
    console.error('Erro ao adicionar dados:', err);
    res.status(500).send('Erro ao adicionar dados');
  } finally {
    connection.release(); // Libera a conexão do pool
  }
});


/////////////////////////////////////////////////////////////////////

app.post('/frame', async (req, res) => {
  const { recurso, espessura, largura, comprimento, qtdProd, metrosCubicos, dataApont } = req.body;
  const sqlInsert = 'INSERT INTO FRAME (recurso, espessura, largura, comprimento, quantidade, m3, dataApont) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  const connection = await db.getConnection(); // Obtém uma conexão do pool

  try {
    await connection.query(sqlInsert, [recurso, espessura, largura, comprimento, qtdProd, metrosCubicos, dataApont]);
    res.status(200).json({ message: 'Dados adicionados com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao adicionar dados');
  } finally {
    connection.release(); // Libera a conexão de volta para o pool
  }
});

////////////////////////////////////////////////////////////////
//impressão etiquetas finger//
app.post('/printFinger', (req, res) => {
  const {
    wb_numOrp,
    wb_numProd,
    wb_qtdProd,
    wb_dtApont,
    larguraBlanks,
    espessuraBlanks,
    comprimentoBlanks,
    wb_numPed,
    wb_itemPed,
    wb_temFsc,
    wb_numEtq,
    wb_nomeRec
  } = req.body;

  const zpl = `^XA
          ^LS0
          ^FWR
          ^M15  
          ^FO750,350^A0,60,60^FDMADESP      10 - BLANK^FS
          ^FO550,40,^GB200,350,2^FS
          ^FO715,48^A0,30,30^FDEspessura:^FS
          ^FO510,150^A0,200,140^FD${espessuraBlanks}^FS
          ^FO550,388^GB200,350,2^FS
          ^FO715,393^A0,30,30^FDLargura:^FS
          ^FO510,480^A0,200,140^FD${larguraBlanks}^FS
          ^FO550,736^GB200,350,2^FS
          ^FO715,740^A0,30,30^FDComprimento:^FS
          ^FO510,800^A0,200,140^FD${comprimentoBlanks}^FS
          ^FO352,40^GB200,350,2^FS
          ^FO510,43^A0,30,30^FDOP:^FS
          ^FO315,90^A0,180,90^FD${wb_numOrp}^FS
          ^FO352,388^GB200,350,2^FS
          ^FO510,395^A0,30,30^FDPedido-Item:^FS
          ^FO325,410^A0,150,80^FD${wb_numPed}-${wb_itemPed}^FS
          ^FO352,736^GB200,350,2^FS
          ^FO510,739^A0,30,30^FDQtde:^FS
          ^FO315,830^A0,190,120^FD${wb_qtdProd}^FS
           ^FO0264,40^GB90,1046,2^FS
          ^FO290,45^A0,30,30^FDData:^FS
          ^FO290,130^A0,30,30^FD${wb_dtApont}^FS
          ^FO290,480^A0,30,30^FD${wb_nomeRec}^FS
          ^FO255,840^A0,90,90^FD${wb_temFsc}^FS;
          ^FO161,40^GB105,1046,2^FS
          ^FO220,45^A0,30,30^FDProduto:^FS
          ^FO150,170^A0,110,130^FD${wb_numProd}^FS
          ^FO230,1100^BY4^BCI,100,N,N,N^FD${wb_numEtq}^FS
          ^FO60,60^BY6^BC,100,Y,N,N^FD${wb_numEtq}^FS
          ^XZ`;
  res.set("Content-Type", "text/plain");
  res.send(zpl);
});

/*app.use(bodyParser.json());
app.post('/printFinger', (req, res) => {
  const {
      wb_numOrp,
      wb_numProd,
      wb_qtdProd,
      wb_dtApont,
      larguraBlanks,
      espessuraBlanks,
      comprimentoBlanks,
      wb_numPed,
      wb_itemPed,
      wb_temFsc,
      wb_numEtq,
      wb_nomeRec
  } = req.body;

  const timestamp = Date.now();
  const fileName = `etiqueta_${timestamp}.zpl`;
  const filePath = `\\\\192.168.0.250\\Meus Documentos\\Fabrica\\PCP\\Gabriel\\Projetos\\IntSapiens_QA\\IntSapiens_QA_GIT\\EtiquetaFinger\\${fileName}`;
  const processedDir = `\\\\192.168.0.250\\Meus Documentos\\Fabrica\\PCP\\Gabriel\\Projetos\\IntSapiens_QA\\IntSapiens_QA_GIT\\EtiquetaFinger\\Processado`;

  const processedPath = path.join(processedDir, fileName);

  const zpl = 
  `^XA
  ^LS0
  ^FWR
  ^FO750,350^AN,60,60^FDMADESP      10 - BLANK^FS
  ^FO550,40,^GB200,350,2^FS
  ^FO715,48^AN,30,30^FDEspessura:^FS
  ^FO560,130^AN,120,120^FD${espessuraBlanks}^FS
  ^FO550,388^GB200,350,2^FS
  ^FO715,393^AN,30,30^FDLargura:^FS
  ^FO560,450^AN,120,120^FD${larguraBlanks}^FS
  ^FO550,736^GB200,350,2^FS
  ^FO715,740^AN,30,30^FDComprimento:^FS
  ^FO560,780^AN,120,120^FD${comprimentoBlanks}^FS
  ^FO352,40^GB200,350,2^FS
  ^FO510,43^AN,30,30^FDOP:^FS
  ^FO400,90^AN,80,80^FD${wb_numOrp}^FS
  ^FO352,388^GB200,350,2^FS
  ^FO510,395^AN,30,30^FDPedido-Item:^FS
  ^FO400,430^AN,80,80^FD${wb_numPed}-${wb_itemPed}^FS
  ^FO352,736^GB200,350,2^FS
  ^FO510,739^AN,30,30^FDQtde:^FS
  ^FO400,830^AN,100,100^FD${wb_qtdProd}^FS
  ^FO0254,40^GB100,1046,2^FS
  ^FO290,45^AN,30,30^FDData:^FS
  ^FO290,130^AN,30,30^FD${wb_dtApont}^FS
  ^FO290,480^AN,30,30^FD${wb_nomeRec}^FS
  ^FO255,840^A0,80,80^FD${wb_temFsc}^FS;
  ^FO136,40^GB120,1046,2^FS
  ^FO210,45^AN,30,30^FDProduto:^FS
  ^FO140,200^AN,100,100^FD${wb_numProd}^FS
  ^FO77,1120^BY5^BCI,100,N,N,N^FD${wb_numEtq}^FS
  ^FO60,60^BY5^BC,60,Y,N,N^FD${wb_numEtq}^FS
  ^XZ`;

  try {
      fs.writeFileSync(filePath, zpl, 'utf8');
      console.log("Arquivo gerado:", filePath);

      //const printerPath = "\\\\Generic / Text Only";
      const printerPath = '\\\\ZDesigner ZD220-203dpi ZPL';
      exec(`print /D:"${printerPath}" "${filePath}"`, (error, stdout, stderr) => {
          if (error) {
              console.error('Erro ao imprimir:', error);
              return res.status(500).send({ error: "Erro ao enviar para a impressora" });
          }

          console.log('Etiqueta enviada para impressão!');

          try {
              fs.renameSync(filePath, processedPath);
              console.log('Arquivo movido para a pasta processado!');
              return res.send({ message: "Etiqueta impressa e movida com sucesso!" });
          } catch (err) {
              console.error('Erro ao mover o arquivo:', err);
              return res.status(500).send({ error: "Impressão concluída, mas falha ao mover o arquivo" });
          }
      });

  } catch (error) {
      console.error("Erro ao criar o arquivo ZPL:", error);
      res.status(500).send({ error: "Erro ao gerar o arquivo ZPL" });
  }
}); */

////////////////////////////////////////////////////////////////

/////////////OBTENDO NUMERO DAS ETIQUETAS//////////////////////

app.get('/obterEtiquetaFinger/:wb_numOrp', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { wb_numOrp } = req.params;
    const [results] = await connection.query('SELECT * FROM WB_OBTERETIQUETA WHERE WB_NUMORP = ? ORDER BY WB_SEQETQ', [wb_numOrp]);
    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  } finally {
    connection.release();
  }
});

//////////ATUALIZAR ETIQUETAS APOS APONTAMENTO OU ALTERAÇÂO////////////////////////
app.put('/updateObterEtiquetaFinger', async (req, res) => {
  const {wb_numEtq, wb_qtdProd, wb_process } = req.body;
  const connection = await db.getConnection();
  try {

    // Atualizando a tabela WB_SEQLIST
    const updateSql = 'UPDATE WB_OBTERETIQUETA SET WB_QTDETQ = ?, WB_PROCESS = ? WHERE WB_NUMETQ = ?';
    await connection.query(updateSql, [wb_qtdProd, wb_process, wb_numEtq]);

    // Commit a transação
    await connection.commit();
    res.status(200).json({ message: 'Atualização realizada com sucesso!' });
  } catch (err) {
    // Rollback em caso de erro
    await connection.rollback();
    console.error('Erro ao realizar atualização:', err);
    res.status(500).send('Erro ao realizar atualização.');
  } finally {
    connection.release();
  }
});

/////////////APONTAMENTO BASEADO NA ETIQUETA PARA ENVIO PARA O WS///////////////////////////////
app.post('/apontamentoEtiqueta', async (req, res) => {
  const {wb_numEmp, wb_numRec, wb_numOri, wb_qtdProd, wb_numOrp, wb_numEtq, wb_dtApont, wb_process } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    // Inserindo o novo apontamento na tabela WB_APONTAMENTO
    const insertSql = 'INSERT INTO WB_APONTAMENTOETIQUETA (WB_NUMEMP, WB_NUMORP, WB_NUMORI, WB_NUMREC, WB_NUMETQ, WB_QTDETQ, WB_DATAPONT, WB_PROCESS) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await connection.query(insertSql, [wb_numEmp, wb_numOrp, wb_numOri, wb_numRec, wb_numEtq, wb_qtdProd, wb_dtApont, wb_process]);


    // Commit a transação
    await connection.commit();
    res.status(200).json({ message: 'Apontamento realizado com sucesso!' });
  } catch (err) {
    // Rollback em caso de erro
    await connection.rollback();
    console.error('Erro ao realizar a inserção.');
    res.status(500).send('Erro ao realizar a inserção.');
  } finally {
    connection.release();
  }
});

////////CONSULTA PARA VALIDAR SE A ETIQUETA FINGER JA FOI PROCESSADA///////////////
app.get('/apontamentoEtiqueta', async (req, res) => {
  const { wb_numEtq } = req.query;

  if (!wb_numEtq) {
    return res.status(400).send('Parâmetro wb_numEtq é obrigatório');
  }

  const connection = await db.getConnection();
  try {
    const [results] = await connection.query(
      'SELECT WB_NUMETQ FROM WB_APONTAMENTOETIQUETA WHERE WB_NUMETQ = ?',
      [wb_numEtq]
    );

    res.json(results); // Vai retornar um array (vazio ou com dados)
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  } finally {
    connection.release();
  }
});

///INSERINDO INVENTARIO NO BANCO ///////////////////////
app.post('/inventario', async (req, res) => {
  const {wb_dtApont, wb_numEtq } = req.body;

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {

    const insertSql = 'INSERT INTO INVENTARIO (DATA, ETIQUETA) VALUES (?, ?)';
    await connection.query(insertSql, [wb_dtApont, wb_numEtq]);


    // Commit a transação
    await connection.commit();
    res.status(200).json({ message: 'Apontamento realizado com sucesso!' });
  } catch (err) {
    // Rollback em caso de erro
    await connection.rollback();
    console.error('Erro ao realizar a inserção. Etiqueta ', wb_numEtq, ' ja lida anteriormente');
    res.status(500).send('Erro ao realizar a inserção.');
  } finally {
    connection.release();
  }
});

app.get('/inventario', async (req, res) => {
  try {
    const [results] = await db.query('SELECT ETIQUETA FROM INVENTARIO');
    

    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  }
});

//////////////CHECKLIST//////////////////////////////////
app.get('/checklistqualidade/:wb_numProd/:wb_numRec', async (req, res) => {

  const connection = await db.getConnection();
  try {
    const { wb_numProd, wb_numRec } = req.params;

    if (!wb_numProd || !wb_numRec) {
      return res.status(400).send('Código do produto ou recurso não fornecido');
    }

    const [results] = await connection.query(
      'SELECT WB_NUMEMP, WB_NUMREC, WB_NUMPROD, WB_PARAM, WB_VALORALVO, WB_TOLEMIN, WB_TOLEMAX, WB_FREQUENCIA, WB_TIPO, WB_SEQUENCIA FROM WB_ITENSCHECKLIST WHERE WB_NUMPROD = ? AND WB_NUMREC = ? ORDER BY WB_TIPO, WB_SEQUENCIA',
      [wb_numProd, wb_numRec]
    );

    if (results.length === 0) {
      return res.status(404).send('Produto não encontrado');
    }

    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados do produto');
  }finally {
    connection.release();
  }
});

/////INSERINDO CHECKLIST NO BANCO/////////////////////////
app.post('/saveChecklistQualidade', async (req, res) => {
  const {wb_numEmp, checklist, wb_numProd, wb_numRec, wb_numOrp, wb_numOri, wb_numEtq, wb_dtApont, wb_process, wb_nomeRec} = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const item of checklist) {
      const {
        parametro,
        alvo,
        minimo,
        maximo,
        valorDigitado
      } = item;

      const insertSql = `
        INSERT INTO WB_REGISTROCHECKLIST
        (WB_NUMEMP, WB_NUMREC, WB_NUMORP, WB_NUMORI, WB_NUMPRO, WB_NUMETQ, WB_PARAM, WB_VALORALVO, WB_TOLEMIN, WB_TOLEMAX, WB_RESULTADO, WB_NOMEREC, WB_DTAPONT, WB_PROCESS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.query(insertSql, [wb_numEmp, wb_numRec, wb_numOrp, wb_numOri, wb_numProd,wb_numEtq, parametro, alvo, minimo, maximo, valorDigitado, wb_nomeRec, wb_dtApont, wb_process]);
    }
    await connection.commit();
    res.status(200).send("Checklist salvo com sucesso.");
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao salvar checklist:", error);
    res.status(500).send("Erro ao salvar checklist.");
  } finally {
    connection.release();
  }
});


////////CONSULTA PARA VERIFICAR SE EXISTE RECURSO 11 PERFILADEIRA PARA REPASSE///////////////
app.get('/consultaPerfiladeira11', async (req, res) => {
  const { wb_numOrp } = req.query;
  const connection = await db.getConnection();

  try {
    const [results] = await connection.query(
      `SELECT WB_NUMORP FROM WB_SEQLIST WHERE WB_NUMEMP = 1 AND WB_NUMORP = ? AND WB_NUMREC = '11'`,
      [wb_numOrp]
    );
    res.json(results);
  } catch (err) {
    console.error('Erro ao executar a consulta:', err);
    res.status(500).send('Erro ao obter dados');
  } finally {
    connection.release();
  }
});

/////////////////////////////////////////////////////////////
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://192.168.0.250:${port}`);
});

module.exports;
