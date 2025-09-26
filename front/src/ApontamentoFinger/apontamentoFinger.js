import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './apontamentoFinger.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPrint } from 'react-icons/fa';


function ApontamentoFinger() {
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
  const [recurso, setRecurso] = useState('');
  const [operador, setOperador] = useState('');
  const [infoTecnicas, setInfoTecnicas] = useState(null);

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

  const verificaSeEtiquetaJaExiste = async (numEtq) => {
    try {
      const response = await axios.get(`http://192.168.0.250:9002/apontamentoEtiqueta`, {
        params: { wb_numEtq: numEtq }
      });
      return response.data.length > 0; // Se existir, retorna true
    } catch (error) {
      console.error("Erro ao verificar se etiqueta já foi apontada:", error);
      return false;
    }
  };

    //checklist
    const [showChecklist, setShowChecklist] = useState(false);
    const [itensChecklist, setitensChecklist] = useState(null);
    const [etiquetaParaProcessarIndex, setEtiquetaParaProcessarIndex] = useState(null);
  
  
    const handleChecklistQualidade = () => {
    if (recurso && operador) { 

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
      toast.error('Falta preencher recurso, operador ou impressora!', {
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
  
  const handleSubmitRespostas = async () => {

    const preenchido = itensChecklist.every((_, index) => {
      const resposta = respostas[index];
      return resposta !== undefined && resposta !== null && resposta !== '';


    });
    if (!preenchido) {
      toast.error("Preencha todos os campos do checklist!", {
        position: "bottom-center",
        autoClose: 2000,
        className: 'custom-toast-error'
      });
      return;
    }

    const validacaoImpressora = await verificarImpressora();

    if (validacaoImpressora) {
      if (etiquetaParaProcessarIndex !== null) {
    
        handleProcessarEtiqueta(etiquetaParaProcessarIndex);
    
        try {
          const checklistComRespostas = itensChecklist.map((item, index) => ({
            parametro: item.WB_DESVER,
            alvo: item.WB_VLRALV,
            minimo: item.WB_VLRMIN,
            maximo: item.WB_VLRMAX,
            seqRot: item.WB_SEQROT,
            codEst: item.WB_CODEST,
            seqEin: item.WB_SEQPXI,
            seqEiv: item.WB_SEQVER,
            codPin: item.WB_CODINP,
            codRot: item.WB_CODROT,
            sitEin: 1,
            tipInp: 'I',
            sitAva: 'N',
            notEiv: 5,
            valorDigitado: respostas[index]
          }));
    
          await axios.post('http://192.168.0.250:9002/saveChecklistQualidadeFinger', {
            wb_numEmp,
            wb_numProd,
            wb_numRec,
            wb_numOrp,
            wb_numOri,
            wb_numEtq: obterEtiqueta[etiquetaParaProcessarIndex]?.etiqueta,
            checklist: checklistComRespostas,
            wb_data: moment(wb_dtApont, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY'),
            wb_hora: moment(wb_dtApont, 'DD-MM-YYYY HH:mm:ss').format('HH:mm:ss'),
            wb_process,
            wb_nomeRec: recurso,
            wb_operador: operador,
            operacao: 'I',
            dasIns: 'PRD',
            sitEpi: 1,
            qtdRec: obterEtiqueta[etiquetaParaProcessarIndex]?.quantidade,
            codDer: 0,
            
          });
    
        } catch (error) {
          toast.error("Erro ao gravar checklist!", {
            position: "bottom-center",
            autoClose: 2000,
            className: 'custom-toast-error'
          });
        }
      }
    
      setShowChecklist(false);
      setEtiquetaParaProcessarIndex(null);
      setRespostas({});
      
    } else {
      toast.error("Zebra Browzer Print não localizado!", {
        position: "bottom-center",
        autoClose: 2000,
        className: 'custom-toast-error'
      });
    }
  }

  
  const handleCancelar = () => {
    setShowChecklist(false);
    setRespostas({});
  };

  /////////////////////////////////////checklist 

  const handleProcessarEtiqueta = async (index) => {
    const etiqueta = obterEtiqueta[index];

    // Verifica se a etiqueta já foi apontada
    const etiquetaJaExiste = await verificaSeEtiquetaJaExiste(etiqueta.etiqueta);
    if (etiquetaJaExiste) {
      toast.error(`Etiqueta ${etiqueta.etiqueta} já foi apontada anteriormente.`, {
        position: "bottom-center",
        autoClose: 2000,
        className: 'custom-toast-error'
      });
      return;
    }
    if (etiqueta.processado !== 'N') {
      toast.error('Etiqueta já foi processada!', {
        position: "bottom-center",
        autoClose: 2000,
        className: 'custom-toast-error'
      });
      return;
    }

    try {
      const validacaoOp = await validaOp();
      const larguraBlanks = parseFloat(infoTecnicas.WB_LARPRO) * 1000;
      const espessuraBlanks = parseFloat(infoTecnicas.WB_ESPPRO) * 1000;

      if (validacaoOp) {
        const quantidadeOriginal = parseFloat(wb_qtdPrev);
        const quantidadeProduzida = parseFloat(etiqueta.quantidade || 0);
    
        // Calcula a quantidade já produzida a partir do banco de dados
        const quantidadeJaProduzida = linhaSelecionada?.wb_qtdProd || 0;
        const quantidadeTotalProduzida = quantidadeJaProduzida + quantidadeProduzida;
        const quantidadeMaximaPermitida = quantidadeOriginal * 1.3;

        if (wb_numRec && wb_numOrp && etiqueta.quantidade && recurso && operador && Number(etiqueta.quantidade) > 0) {
          if (quantidadeTotalProduzida <= quantidadeMaximaPermitida) {
            try {


              const { data: zpl } = await axios.post('http://192.168.0.250:9002/printFinger', {
                wb_numOrp,
                wb_numProd,
                wb_qtdProd: etiqueta.quantidade,
                wb_dtApont,
                wb_numPed: linhaSelecionada.wb_numPed,
                wb_itemPed: linhaSelecionada.wb_itemPed,
                larguraBlanks,
                espessuraBlanks,
                comprimentoBlanks: infoTecnicas.WB_COMPRO,
                wb_temFsc,
                wb_numEtq: etiqueta.etiqueta,
                wb_nomeRec: recurso
              }, { responseType: 'text' });

              if (!window.BrowserPrint) {
                toast.error("Zebra Browser Print não está disponível.",{
                  position: "bottom-center",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: false,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  className: 'custom-toast-error'
                });
                return;
              }
              window.BrowserPrint.getDefaultDevice("printer", async function(printer) {
                if (!printer) {
                  toast.error("Nenhuma impressora Zebra encontrada.", {
                    position: "bottom-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    className: 'custom-toast-error'
                  });
                  return;
                }
              
          
                printer.send(zpl, async function() {
                  toast.success(`Etiqueta ${etiqueta.etiqueta} enviada à impressora!`, {
                    position: "bottom-center",
                    autoClose: 2000,
                    className: 'custom-toast-sucess'
                  });
          
                  await axios.post('http://192.168.0.250:9002/apontamento', {
                    wb_numEmp,
                    wb_numRec,
                    wb_numOri,
                    wb_numSeq,
                    wb_numOrp,
                    wb_numProd,
                    wb_qtdProd: quantidadeProduzida,
                    wb_qtdRef: 0,
                    wb_dtApont,
                    wb_process: 'N'
                  });
          
                  await axios.put('http://192.168.0.250:9002/updateObterEtiquetaFinger', {
                    wb_numEtq: etiqueta.etiqueta,
                    wb_qtdProd: etiqueta.quantidade,
                    wb_process: 'S'
                  });
          
                  await axios.post('http://192.168.0.250:9002/apontamentoEtiqueta', {
                    wb_numEmp,
                    wb_numRec: recurso,
                    wb_numOri,
                    wb_numOrp,
                    wb_qtdProd: etiqueta.quantidade,
                    wb_dtApont,
                    wb_process: 'N',
                    wb_numEtq: etiqueta.etiqueta,
                    wb_operador: operador
                  });
          
                  const atualizado = [...obterEtiqueta];
                  atualizado[index].processado = 'S';
                  setObterEtiqueta(atualizado);
          
                }, function(error) {
                  toast.error("Erro ao imprimir: " + error , {
                    position: "bottom-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    className: 'custom-toast-error'
                  });
                });
              });
          
            }catch (error) {
              console.error('Erro ao realizar o apontamento:', error);
              toast.error('Erro ao realizar apontamento', {
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
            }else {
                      toast.error('Quantidade produzida ultrapassa 10% do permitido.', {
                        position: "bottom-center",
                        autoClose: 2500,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        className: 'custom-toast-error'
                      });
            }
        }else{
          toast.error('Falta preencher quantidade, recurso ou operador!', {
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

        }else{
          toast.error('OP ja finalizada ou não encontrada', {
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
        }catch (error) {
          toast.error('Erro ao processar etiqueta.', {
            position: "bottom-center",
            autoClose: 2500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            className: 'custom-toast-error'
            });
        }
  }

  return (
    <div className="container-apontamentoFinger">
      <h2>Apontamento Finger</h2>
      <div className="selectRecurso">
          <h3>Recurso:</h3>
          <select className = "selectRecursoEtiquetaFinger" id="recurso" value={recurso} onChange={(e) => setRecurso(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="04">Finger 01</option>
                <option value="05">Finger 02</option>
          </select>
              <h3>Operador:</h3>    
          <select className = "selectOperadorFinger" id="operador" value={operador} onChange={(e) => setOperador(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="1321">1321 - DANIEL MUCKENBERGER</option>
                <option value="1664">1664 - EZEQUIEL MONTEIRO</option>
                <option value="1495">1495 - ISRAEL MONTEIRO</option>
                <option value="1619">1619 - JACSON JAIR HINSCHING</option>
                <option value="1691">1691 - MARCOS LUIZ MICHELMANN</option>
                <option value="2051">2051 - CLEITON KLEMANN</option>
                <option value="1974">1974 - ANTONIO CARLOS CORREA</option>
          </select>
              <button className="button" onClick={handleVoltar}>
                  Voltar
             </button>
       </div>    
      <table className="tableFinger">
        <thead>
          <tr>
            <th>OP</th>
            <th>Descrição</th>
            <th>Etiqueta</th>
            <th>Quantidade</th>
            <th>Processado</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {obterEtiqueta.map((item, index) => (
            <tr key={index}>
              <td>{item.op}</td>
              <td>{item.descricao}</td>
              <td>{item.etiqueta}</td>
              <td className="tdQuantidadeFinger">
                <input
                  className="qtdEtiquetaFinger"
                  type="number"
                  value={item.quantidade}
                  onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                />
              </td>
              <td>{item.processado}</td>
              <td>
                <FaPrint
                  className="print-icon"
                  onClick={() => {
                    if (item.processado === 'N') {
                      setEtiquetaParaProcessarIndex(index);
                      handleChecklistQualidade();
                    } else {
                      toast.error('Etiqueta já processada!', {
                        position: "bottom-center",
                        autoClose: 2000,
                        className: 'custom-toast-error'
                      });
                    }
                  }}
                  style={{ cursor: 'pointer', color: item.processado === 'S' ? '#999' : '#000' }}
                  title={item.processado === 'S' ? "Já processado" : "Imprimir etiqueta"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-container">

      </div>
      {showChecklist && (
  <div className="modal-container-checklist">
    <div className="modal-content-checklist">
      <h3>CheckList Qualidade</h3>

      <table className="tabela-checklist">
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th>Resultado</th>
            <th>Alvo</th>
            <th>Mínimo</th>
            <th>Máximo</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(itensChecklist) && itensChecklist.map((item, index) => (
            <tr key={index}>
              <td>
                {item.WB_DESVER}
              </td>
              <td>
                {item.WB_CODINP2 != 'QUAL-BLANK' ? (
                  <input
                    type="number"
                    value={respostas[index] || ''}
                    onChange={(e) => handleResposta(index, e.target.value)}
                  />
                ) : (
                <div className="ok-nok-buttons">
                  <button
                    type="button"
                    className={respostas[index] === 'A' ? 'selected' : ''}
                    onClick={() => handleResposta(index, 'A')}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    className={respostas[index] === 'R' ? 'selected nok' : 'R'}
                    onClick={() => handleResposta(index, 'R')}
                  >
                    NOK
                  </button>
                </div>
                )}
              </td>
              <td>{item.WB_VLRALV}</td>
              <td>{item.WB_VLRMIN}</td>
              <td>{item.WB_VLRMAX}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="button-container-checklist">
        <button onClick={handleSubmitRespostas}>Salvar</button>
        <button className="cancel-button" onClick={() => handleCancelar()}>Cancelar</button>
      </div>
    </div>
  </div>
)}
<ToastContainer />
    </div>
    
  );
}

export default ApontamentoFinger;
