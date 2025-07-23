import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './cadastroChecklist.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BiAddToQueue } from 'react-icons/bi';
import { RiDeleteBin6Line  } from 'react-icons/ri';


function CadastroChecklist() {
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
  const [infoTecnicas, setInfoTecnicas] = useState(null);

  const handleVoltar = () => {
    navigate('/', { state: { filtroID } });
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

  const [obterRegistroChecklist, setObterRegistroChecklist] = useState([]);

  useEffect(() => {
    const handleObterRegistroChecklist = async () => {
      try {
        const response = await axios.get(`http://192.168.0.250:9002/checklistqualidade`);
        const registros = response.data.map(item => ({
          numEmp: item.WB_NUMEMP,
          numRec: item.WB_NUMREC,  
          numProd: item.WB_NUMPROD,
          descricao: item.WB_PARAM,
          valorAlvo: item.WB_VALORALVO,
          valorMin: item.WB_TOLEMIN,
          valorMax: item.WB_TOLEMAX,
          frequencia: item.WB_FREQUENCIA,
          tipo: item.WB_TIPO,
          sequencia: item.WB_SEQUENCIA
        }));
        setObterRegistroChecklist(registros);
      } catch (error) {
        console.error("Erro ao carregar registros:", error);
      }
    };
    handleObterRegistroChecklist();
  });


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
      };
  
  const [respostas, setRespostas] = useState({});
  
  const handleResposta = (index, valor) => {
    setRespostas(prev => ({ ...prev, [index]: valor }));
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
    //setShowChecklist(false);
    //setRespostas({});
  
    if (etiquetaParaProcessarIndex !== null) {
      
      handleProcessarEtiqueta(etiquetaParaProcessarIndex);
      
      try{
        const checklistComRespostas = itensChecklist.map((item, index) => ({
          parametro: item.WB_PARAM,
          alvo: item.WB_VALORALVO,
          minimo: item.WB_TOLEMIN,
          maximo: item.WB_TOLEMAX,
          valorDigitado: respostas[index]
        }));
            await axios.post('http://192.168.0.250:9002/saveChecklistQualidade', {
                wb_numEmp,
                wb_numProd,
                wb_numRec,
                wb_numOrp,
                wb_numOri,
                wb_numEtq: obterRegistroChecklist[etiquetaParaProcessarIndex]?.etiqueta,
                checklist: checklistComRespostas,
                wb_dtApont,
                wb_process,
                wb_nomeRec: recurso,
            });
      }catch(error){
          toast.error("Erro ao gravar checklist!", {
          position: "bottom-center",
          autoClose: 2000,
          className: 'custom-toast-error'
        });
      }
      
    }
    setShowChecklist(false);
    setEtiquetaParaProcessarIndex(null); // reset
    //console.log('Respostas do utilizador:', respostas);
  };

  
  const handleCancelar = () => {
    setShowChecklist(false);
    setRespostas({});
  };

  /////////////////////////////////////checklist 

  const handleProcessarEtiqueta = async (index) => {
    const etiqueta = obterRegistroChecklist[index];

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
      const larguraBlanks = parseFloat(infoTecnicas.WB_LARPRO) * 1000;
      const espessuraBlanks = parseFloat(infoTecnicas.WB_ESPPRO) * 1000;

   
        const quantidadeOriginal = parseFloat(wb_qtdPrev);
        const quantidadeProduzida = parseFloat(etiqueta.quantidade || 0);
    
        // Calcula a quantidade já produzida a partir do banco de dados
        const quantidadeJaProduzida = linhaSelecionada?.wb_qtdProd || 0;
        const quantidadeTotalProduzida = quantidadeJaProduzida + quantidadeProduzida;
        const quantidadeMaximaPermitida = quantidadeOriginal * 1.3;

        if (wb_numRec && wb_numOrp && etiqueta.quantidade && recurso && Number(etiqueta.quantidade) > 0) {
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
          
                  await axios.put('http://192.168.0.250:9002/updateobterRegistroChecklistFinger', {
                    wb_numEtq: etiqueta.etiqueta,
                    wb_qtdProd: etiqueta.quantidade,
                    wb_process: 'S'
                  });
          
                  await axios.post('http://192.168.0.250:9002/apontamentoEtiqueta', {
                    wb_numEmp,
                    wb_numRec,
                    wb_numOri,
                    wb_numOrp,
                    wb_qtdProd: etiqueta.quantidade,
                    wb_dtApont,
                    wb_process: 'N',
                    wb_numEtq: etiqueta.etiqueta
                  });
          
                  const atualizado = [...obterRegistroChecklist];
                  atualizado[index].processado = 'S';
                  setObterRegistroChecklist(atualizado);
          
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
          toast.error('Falta preencher quantidade ou recurso!', {
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
      <h2>Cadastro Inpeções</h2>
      <div className="selectRecurso">
          <h3>Recurso:</h3>
          <select className = "selectRecursoEtiquetaFinger" id="recurso" value={recurso} onChange={(e) => setRecurso(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Finger 01">Finger 01</option>
                <option value="Finger 02">Finger 02</option>
              </select>
              <button className="button" onClick={handleVoltar}>
                  Voltar
             </button>
       </div>    
      <table className="tableFinger">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Recurso</th>
            <th>Produto</th>
            <th>Descrição</th>
            <th>Alvo</th>
            <th>Mínimo</th>
            <th>Máximo</th>
            <th>Frequência</th>
            <th>Tipo</th>
            <th>Sequência</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {obterRegistroChecklist.map((item, index) => (
            <tr key={index}>
              <td>{item.numEmp}</td>
              <td>{item.numRec}</td>
              <td>{item.numProd}</td>
              <td>{item.descricao}</td>
              <td>{item.valorAlvo}</td>
              <td>{item.valorMin}</td>
              <td>{item.valorMax}</td>
              <td>{item.frequencia}</td>
              <td>{item.tipo}</td>
              <td>{item.sequencia}</td>
              <td>
                <BiAddToQueue size={20} title="Duplicar"
                  
                />
                <RiDeleteBin6Line size={20} title="Excluir"
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
              <td>{item.WB_PARAM}</td>
              <td>
                {item.WB_TIPO === 'NUMERICO' ? (
                  <input
                    type="number"
                    value={respostas[index] || ''}
                    onChange={(e) => handleResposta(index, e.target.value)}
                  />
                ) : (
                <div className="ok-nok-buttons">
                  <button
                    type="button"
                    className={respostas[index] === 'OK' ? 'selected' : ''}
                    onClick={() => handleResposta(index, 'OK')}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    className={respostas[index] === 'NOK' ? 'selected nok' : 'nok'}
                    onClick={() => handleResposta(index, 'NOK')}
                  >
                    NOK
                  </button>
                </div>
                )}
              </td>
              <td>{item.WB_VALORALVO}</td>
              <td>{item.WB_TOLEMIN}</td>
              <td>{item.WB_TOLEMAX}</td>
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

export default CadastroChecklist;
