import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './apontamentoBioenergy.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPrint } from 'react-icons/fa';


function ApontamentoBioenergy() {
  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || '';
  const [wb_numRec, setWb_numRec] = useState(linhaSelecionada?.wb_numRec || '');
  const [wb_numOrp, setWb_numOrp] = useState(linhaSelecionada?.wb_numOrp || '');
  const [wb_numEmp, setWb_numEmp] = useState(linhaSelecionada?.wb_numEmp || '');
  const [wb_numOri, setWb_numOri] = useState(linhaSelecionada?.wb_numOri || '');
  const [wb_numSeq, setWb_numSeq] = useState(linhaSelecionada?.wb_numSeq || '');
  const [wb_numProd, setWb_numProd] = useState(linhaSelecionada?.wb_numProd || '');
  const [wb_qtdPrev, setWb_qtdPrev] = useState(linhaSelecionada?.wb_qtdPrev || 0);
  const [wb_qtdSaldo, setWb_qtdSaldo] = useState(linhaSelecionada?.wb_qtdSaldo || '');
  const [quantidadeTotalProduzida, setQuantidadeTotalProduzida] = useState(0);
  const [wb_temFsc, setWb_temFsc] = useState(linhaSelecionada?.wb_temFsc || 0);
  const [wb_qtdProd, setWb_qtdProd] = useState('');
  const [wb_qtdRef, setWb_qtdRef] = useState('');
  const wb_process = 'N';
  const wb_dtApont = moment().format('DD-MM-YYYY HH:mm:ss');
  const navigate = useNavigate();
  //const [recurso, setRecurso] = useState('');
  const [operador, setOperador] = useState('');
  const [infoTecnicas, setInfoTecnicas] = useState(null);
  const [quantidadeOutro, setQuantidadeOutro] = useState(null);

  const handleVoltar = () => {
    navigate('/sequenciamento', { state: { filtroID } });
  };

  const validaOp = async () => {
    try {
      const response = await axios.get('http://192.168.0.250:9002/sequenciamento', {
        params: { wb_numEmp, wb_numRec, wb_numOrp, wb_numOri, wb_numSeq }
      });
      return response.data.some(item =>
        item.wb_numEmp === wb_numEmp &&
        item.wb_numRec === wb_numRec &&
        item.wb_numOrp === wb_numOrp &&
        item.wb_numOri === wb_numOri &&
        item.wb_numSeq === wb_numSeq
      );
    } catch (error) {
      console.error('Erro ao validar ID e OP:', error);
      return false;
    }
  };

    const handleConsumirComponentes = () => {
        navigate('/componentes', { state: { linha: linhaSelecionada, filtroID: wb_numRec } });

    };

      const [saldosOp, setSaldosOp] = useState({
        qtdPrev: 0,
        qtdProd: 0,
        saldo: 0
      });
    
    const carregarSaldos = async () => {
      try {
        const response = await axios.get('http://192.168.0.250:9002/saldosOp', {
          params: { wb_numEmp, wb_numRec, wb_numOrp, wb_numOri, wb_numSeq }
        });
    
        const data = response.data[0];
    
        setSaldosOp({
          qtdPrev: data.WB_QTDPREV,
          qtdProd: data.WB_QTDPROD,
          saldo: data.WB_QTDSALDO
        });
    
      } catch (error) {
        console.error("Erro ao carregar saldos:", error);
      }
    };
    
    useEffect(() => {
      carregarSaldos();
    }, []);

  useEffect(() => {
    if (!linhaSelecionada) return;
    const wb_numProdSelecionado = linhaSelecionada.wb_numProd;
    axios.get(`http://192.168.0.250:9002/infoProdutos/${wb_numProdSelecionado}`)
      .then(response => {
        setInfoTecnicas(response.data);
        setWb_temFsc(linhaSelecionada.wb_temFsc === 'S' ? 'FSC' : '');
      })
      .catch(error => console.error("Erro ao buscar informações técnicas:", error));
  }, [linhaSelecionada]);

  const [obterEtiqueta, setObterEtiqueta] = useState([]);

  useEffect(() => {
    if (!linhaSelecionada) return;
    const handleObterEtiquetas = async () => {
      try {
        const response = await axios.get(`http://192.168.0.250:9002/obterEtiquetaFinger/${linhaSelecionada.wb_numOrp}`);
        const etiquetas = response.data.map(item => ({
          op: linhaSelecionada.wb_numOrp,
          descricao: linhaSelecionada.wb_desPro,
          etiqueta: item.WB_NUMETQ,
          quantidade: item.WB_QTDETQ,
          processado: item.WB_PROCESS,
          sequenciaEtq: item.WB_SEQETQ
        }));
        setObterEtiqueta(etiquetas);
      } catch (error) {
        console.error("Erro ao carregar etiquetas:", error);
      }
    };
    handleObterEtiquetas();
  }, [linhaSelecionada]);

  const handleQuantidadeChange = (index, novaQuantidade) => {
    const quantidadePrev = linhaSelecionada.wb_qtdPrev;
    const novaQtd = [...obterEtiqueta];
    if (novaQuantidade <= (quantidadePrev * 1.3)) {
      novaQtd[index].quantidade = novaQuantidade;
      setObterEtiqueta(novaQtd);
    } else {
      toast.error('A quantidade ultrapassa o permitido!', {
        position: "bottom-center",
        autoClose: 2000,
        className: 'custom-toast-error'
      });
    }
  };

    //checklist
    const [showChecklist, setShowChecklist] = useState(false);
    const [itensChecklist, setitensChecklist] = useState(null);
    const [etiquetaParaProcessarIndex, setEtiquetaParaProcessarIndex] = useState(null);
  
  
    const handleChecklistQualidade = () => {
    if (operador) {     
    //if (recurso && operador) { 

      if (linhaSelecionada !== null) {
        const wb_numProdSelecionado = linhaSelecionada.wb_numProd;
        const wb_numRecSelecionado = linhaSelecionada.wb_numRec;
    
        axios.get(`http://192.168.0.250:9002/checklistqualidade/${wb_numProdSelecionado}/${wb_numRecSelecionado}`)
          .then(response => {
            setitensChecklist(response.data); // agora será um array com todas as linhas
            setShowChecklist(true);
          })
          .catch(error => {
            toast.error('Produto sem inspeção cadastrada!', {
              position: "bottom-center",
              autoClose: 2500,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              className: 'custom-toast-error'
            });
            
          });
      }
    }else{
      toast.error('Falta preencher operador ou impressora!', {
        position: "bottom-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });
    }
    };
  
  const [respostas, setRespostas] = useState({});
  
  const handleResposta = (index, valor) => {
    setRespostas(prev => ({ ...prev, [index]: valor }));
  };

  const verificarImpressora = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:9100/default?type=printer');
      const data = response.data;
  
      const impressoraValida =
        data?.deviceType === 'printer' &&
        data?.connection === 'usb' &&
        data?.manufacturer?.toLowerCase().includes('zebra');
  
      return impressoraValida; // TRUE se OK
  
    } catch (error) {
      console.error("Erro ao verificar impressora:", error);
      return false; // FALSE se erro
    }
  };
  
  
  const handleCancelar = () => {
    setShowChecklist(false);
    setRespostas({});
  };

  

  const calcularTurno = () => {

    const hora = new Date().getHours();

    if (hora < 6) return 1;
    if (hora < 12) return 2;
    if (hora < 18) return 3;

    return 4;

};

const handleProcessarEtiqueta = async () => {

    try {

        const turno = calcularTurno();

        const validacaoOp = await validaOp();

        if (!validacaoOp) {

            toast.error('OP já finalizada ou não encontrada.', {
                position: "bottom-center",
                autoClose: 2000,
                className: 'custom-toast-error'
            });

            return;
        }

        const quantidadeOriginal = Number(wb_qtdPrev);
        const quantidadeProduzida = Number(wb_qtdProd || 0);
        const quantidadeJaProduzida = Number(linhaSelecionada?.wb_qtdProd || 0);

        const quantidadeTotal = quantidadeJaProduzida + quantidadeProduzida;

        if (quantidadeTotal > quantidadeOriginal * 1.1) {

            toast.error('Quantidade produzida ultrapassa 10% do permitido.', {
                position: "bottom-center",
                autoClose: 2500,
                className: 'custom-toast-error'
            });

            return;
        }

        if (!wb_numRec || !wb_numOrp || !operador || quantidadeProduzida <= 0) {

            toast.error('Falta preencher quantidade ou operador.', {
                position: "bottom-center",
                autoClose: 2500,
                className: 'custom-toast-error'
            });

            return;
        }

        const retorno = await gerarEtiquetaSOAP(turno);

        console.log("Retorno do SOAP retorno :", retorno);

        if (!retorno.sucesso) {

            toast.error(retorno.mensagem, {
                position: "bottom-center",
                autoClose: 3000,
                className: 'custom-toast-error'
            });

            return;
        }

        await imprimirEtiqueta(retorno);

    } catch (err) {

        console.error(err);

        toast.error('Erro ao processar etiqueta.', {
            position: "bottom-center",
            autoClose: 2500,
            className: 'custom-toast-error'
        });

    }

};

const gerarEtiquetaSOAP = async (turno) => {

    const response = await axios.post(
        "http://192.168.0.250:9002/bioenergyApontamento",
        {
            codEmp: wb_numEmp,
            codOri: wb_numOri,
            numOrp: wb_numOrp,
            numRec: wb_numRec,
            qtdEtq: wb_qtdProd,
            turno,
            numProd: linhaSelecionada.wb_numProd,
            codDer: infoTecnicas.WB_CODDER
        }
    );

    return response.data;

    console.log("Resposta do SOAP response.data :", response.data);

};

const imprimirEtiqueta = async (retorno) => {

  console.log("Retorno do apontamento:", retorno);
    const { data: zpl } = await axios.post(

        "http://192.168.0.250:9002/printBioenergy",

        {
            wb_numOrp,
            wb_numProd,
            wb_qtdProd,
            wb_codDer: retorno.wb_codDer,
            wb_codLot: retorno.wb_codLot,
            wb_codCli: retorno.wb_codCli,
            wb_nomCli: retorno.wb_nomCli,
            wb_desPro: infoTecnicas.WB_DESPRO,
            wb_numEtq: retorno.wb_numEtq,
            wb_numPed: retorno.wb_numPed
  
        },

        {
            responseType: "text"
        }

    );

    if (!window.BrowserPrint) {

        toast.error("Zebra Browser Print não está disponível.");

        return;

    }

    window.BrowserPrint.getDefaultDevice(

        "printer",

        function (printer) {

            if (!printer) {

                toast.error("Nenhuma impressora Zebra encontrada.");

                return;

            }

            printer.send(

                zpl,

                function () {

                    toast.success(`Etiqueta ${retorno.etiqueta} enviada para impressão.`, {
                        position: "bottom-center",
                        autoClose: 2000,
                        className: "custom-toast-sucess"
                    });

                },

                function (erro) {

                    toast.error("Erro ao imprimir: " + erro);

                }

            );

        }

    );

};

  return (
    <div className="container-apontamentoFinger">
      <h2>Apontamento Bioenergy</h2>
      <div className="selectRecurso">

              <h3>Operador:</h3>    
          <select className = "selectOperadorFinger" id="operador" value={operador} onChange={(e) => setOperador(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="1">1 - CLAUDINEI</option>
                <option value="2">2 - JOZIEL</option>
                <option value="3">3 - BRUNO</option>
                <option value="5">5 - IGOR</option>
          </select>
              <button className="button" onClick={handleConsumirComponentes}>
                  Ler material usado
             </button>
              <button className="button" onClick={handleVoltar}>
                  Voltar
             </button>
             Qtd OP: {saldosOp.qtdPrev} | Produzido: {saldosOp.qtdProd} | Saldo: {saldosOp.saldo}
       </div>
      
        <div className="apontamento-container">
              <div className="form-group">
                <label>Recurso:</label>
                <input 
                  type="text" 
                  value={wb_numRec} 
                  onChange={(e) => setWb_numRec(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>OP:</label>
                <input 
                  type="text" 
                  value={wb_numOrp} 
                  onChange={(e) => setWb_numOrp(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Quantidade Produzida:</label>
                  <select
                    className="form-input-select"
                    id="quantidade"
                    value={quantidadeOutro ? "outro" : wb_qtdProd}
                    onChange={(e) => {
                      if (e.target.value === "outro") {
                        setQuantidadeOutro(true);
                        setWb_qtdProd("");
                      } else {
                        setQuantidadeOutro(false);
                        setWb_qtdProd(e.target.value);
                      }
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="1050">1050</option>
                    <option value="1260">1260</option>
                    <option value="outro">Outro</option>
                  </select>

                  {quantidadeOutro && (
                    <input
                      className="form-input"
                      type="number"
                      id="quantidadeOutro"
                      placeholder="Digite a quantidade"
                      value={wb_qtdProd}
                      onChange={(e) => setWb_qtdProd(e.target.value)}
                    />
                  )}
              </div>
                    <div className="button-container">
                      <button className="button" onClick={handleProcessarEtiqueta}>
                        Apontar
                      </button>
                      <button className="button" onClick={handleVoltar}>
                        Voltar
                      </button>
                      <ToastContainer />
                    </div>

                    
        </div>
      
<ToastContainer />
    </div>
    
  );
}

export default ApontamentoBioenergy;
