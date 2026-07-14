const soap = require('soap');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const logger = require('./logger');
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


const sapiensWsdlUrl =
    'http://192.168.0.1:8080/g5-senior-services/sapiens_Synccom.senior.g5.co.int.mpr.Madesp?wsdl';


const metodoApontamento = "ApontamentoBioenergy";



const postApontamentoBioenergyForSapiens = async (dados) => {



    let connection;

    try {

        const client = await soap.createClientAsync(sapiensWsdlUrl);


        const paramsApontamento = {
            user: "apontamentoweb",
            password: "apontamentoweb",
            encryption: 0,

            parameters: {

                CodEmp: dados.codEmp,
                CodOri: dados.codOri,
                NumOrp: dados.numOrp,
                QtdEtq: Number(dados.qtdEtq),
                TurTrb: dados.turno

            }
        };

        console.log("########## PARAMS ##########");
        console.log(paramsApontamento);

        const [result] = await client[`${metodoApontamento}Async`](
            paramsApontamento,
            {
                timeout:40000
            }
        );

        console.log('Retorno SOAP: ', JSON.stringify(result, null, 2));
        const retorno =
            result?.result?.ApontamentoBioenergyReturn ||
            result?.result ||
            [];


        const item = Array.isArray(retorno)
            ? retorno[0]
            : retorno;



        if(!item){

            throw new Error("SOAP não retornou dados");

        }



        if(item.tipRet !== "1"){


            logger.error(
                `[BIOENERGY] ERRO OP ${dados.numOrp} - ${item.MsgRet || item.erroExecucao || "Erro desconhecido"} `
            );


            return {

                sucesso:false,

                mensagem:item.erroExecucao || item.MsgRet || "Erro desconhecido"

            };

        }

        console.log("Item: ", item);
        console.log("Dados: ", dados);

        connection = await db.getConnection();



        await connection.execute(

        `
        INSERT INTO WB_APONTAMENTOBIOENERGY
        (
            WB_NUMEMP,
            WB_NUMPROD,
            WB_CODDER,
            WB_NUMORP,
            WB_NUMORI,
            WB_NUMREC,
            WB_NUMETQ,
            WB_QTDETQ,
            WB_DATAPONT,
            WB_TURNO,
            WB_NUMPED,
            WB_ITEMPED,
            WB_CODCLI,
            WB_NOMCLI,
            WB_CODLOT,
            WB_PROCESS
        )

        VALUES
        (
            ?,?,?,?,?,?,
            ?,?,?,?,?,?,
            ?,?,?,?
        )
        `,

        [

            dados.codEmp,
            dados.numProd,
            dados.codDer,
            dados.numOrp,
            dados.codOri,
            dados.numRec,

            item.numEtq.replace(/^0+/, ''),

            dados.qtdEtq,

            moment().format('YYYY-MM-DD HH:mm:ss'),

            dados.turno,

            item.numPed,
            item.seqIpd,
            item.codCli,
            item.nomCli,
            item.codLot,
            'S'

        ]);



        logger.info(
            `[BIOENERGY] Sucesso OP ${dados.numOrp} - Etiqueta ${item.numEtq}`
        );



        return {

            sucesso:true,
            //etiqueta:item.numEtq.replace(/^0+/, ''),

            wb_numOrp: dados.numOrp,
            wb_numProd: dados.numProd,
            wb_qtdProd: dados.qtdEtq,
            wb_codDer: dados.codDer,
            wb_codLot: item.codLot,
            wb_codCli: item.codCli,
            wb_nomCli: item.nomCli,
            wb_numEtq: item.numEtq.replace(/^0+/, ''),
            wb_numPed: item.numPed

        };



    } catch(err){


        const timeout =

            err.code === 'ETIMEDOUT' ||
            err.code === 'ESOCKETTIMEDOUT' ||
            err.message?.includes('timeout');



        if(timeout){

            logger.error(
                `[BIOENERGY] TIMEOUT OP ${dados.numOrp} (15s)`
            );


            return {

                sucesso:false,

                erro:"TIMEOUT",

                mensagem:"Sapiens não respondeu"

            };

        }



        logger.error(
            `[BIOENERGY] Erro OP ${dados.numOrp}: ${err.stack || err.message}`
        );


        return {

            sucesso:false,

            erro:"ERRO",

            mensagem:err.message

        };



    } finally {


        if(connection){

            connection.release();

        }

    }

};



module.exports = {
    postApontamentoBioenergyForSapiens
};


