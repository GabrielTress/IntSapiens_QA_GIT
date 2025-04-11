import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './apontamentoFinger.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPrint } from 'react-icons/fa';

// ... (imports mantidos)

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

        if (wb_numRec && wb_numOrp && etiqueta.quantidade && recurso && Number(etiqueta.quantidade) > 0) {
          if (quantidadeTotalProduzida <= quantidadeMaximaPermitida) {
            try {
              await axios.post('http://192.168.0.250:9002/printFinger', {
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
                wb_process
              });

              await axios.put('http://192.168.0.250:9002/updateObterEtiquetaFinger', {
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
                
                toast.success(`Etiqueta ${etiqueta.etiqueta} processada!`, {
                  position: "bottom-center",
                  autoClose: 2000,
                  className: 'custom-toast-sucess'
                });
                // Atualiza o status para 'S' localmente
                const atualizado = [...obterEtiqueta];
                atualizado[index].processado = 'S';
                setObterEtiqueta(atualizado);

            } catch (error) {
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
                <option value="Finger 01">Finger 01</option>
                <option value="Finger 02">Finger 02</option>
              </select>
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
              <td className="tdQuantidade">
                <input
                  className="qtdEtiqueta"
                  type="number"
                  value={item.quantidade}
                  onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                />
              </td>
              <td>{item.processado}</td>
              <td>
                <FaPrint
                  className="print-icon"
                  onClick={() => handleProcessarEtiqueta(index)}
                  style={{ cursor: 'pointer', color: item.processado === 'S' ? '#999' : '#000' }}
                  title={item.processado === 'S' ? "Já processado" : "Imprimir etiqueta"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="button-container">
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
        <ToastContainer />
      </div>
    </div>
  );
}

export default ApontamentoFinger;
