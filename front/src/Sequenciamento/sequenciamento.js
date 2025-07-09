import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './sequenciamento.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Sequenciamento() {
  const [dados, setDados] = useState([]);
  const [inputId, setInputId] = useState('');
  const [inputOrp, setInputOrp] = useState('');
  const [dadosFiltrados, setDadosFiltrados] = useState([]);
  const [linhaSelecionada, setLinhaSelecionada] = useState(null);
  const [recursos, setRecursos] = useState([]);
  const [horasAtraso, setHorasAtraso] = useState(0);
  const [pecasAtraso, setPecasAtraso] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();



  useEffect(() => {
    // Fazendo a requisição para o backend para obter os dados do sequenciamento
    axios.get('http://192.168.0.250:9002/sequenciamento')
      .then(response => {
        const dadosMapeados = response.data.map(row => ({
          ...row,
          wb_datIni: moment(row.wb_datIni).format('DD/MM/YYYY'),
        }));
        setDados(dadosMapeados);

        // Verifica se existe um filtroID passado no state
        const filtroID = location.state?.filtroID || '';

        if (filtroID) {
          setInputId(filtroID);
          const filtrados = dadosMapeados.filter(item =>
            (item.wb_numRec && item.wb_numRec.toString() === filtroID)
          );
          setDadosFiltrados(filtrados);
          calcularAtrasos(filtrados);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar os dados:', error);
      });
      

    // Requisição para obter dados de recursos
    axios.get('http://192.168.0.250:9002/recursos')
      .then(response => {
        setRecursos(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar recursos:', error);
      });
  }, [location.state]); // Atualiza a cada vez que "location.state" muda

  // Força o cálculo das horas e peças de atraso ao voltar para a tela de Sequenciamento
  useEffect(() => {
    if (location.pathname === '/sequenciamento') {
      applyFilter(inputId, inputOrp);
    }
  }, [location.pathname]);

  const handleInputIdChange = (e) => {
    const wb_numRec = e.target.value;
    setInputId(wb_numRec);
    applyFilter(wb_numRec, inputOrp);
  };

  const handleInputOrpChange = (e) => {
    const wb_numOrp = e.target.value;
    setInputOrp(wb_numOrp);
    applyFilter(inputId, wb_numOrp);
  };

  const applyFilter = (wb_numRec, wb_numOrp) => {
    if (wb_numRec !== '' || wb_numOrp !== '') {
      const filtrados = dados.filter(item =>
        (wb_numRec === '' || (item.wb_numRec && item.wb_numRec.toString() === wb_numRec)) &&
        (wb_numOrp === '' || (item.wb_numOrp && item.wb_numOrp.toString() === wb_numOrp))
      );
      setDadosFiltrados(filtrados);
      setLinhaSelecionada(null);
      calcularAtrasos(filtrados);
    } else {
      setDadosFiltrados([]);
      setLinhaSelecionada(null);
      setHorasAtraso(0);
      setPecasAtraso(0);
    }
  };

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTecnicas, setInfoTecnicas] = useState(null); // Armazena os dados do banco


//////checklist//////////////////


  // requisição para obter os dados técnicos do produto  
  const handleInfoTecnicas = () => {
    if (linhaSelecionada !== null) {
      const wb_numProdSelecionado = dadosFiltrados[linhaSelecionada].wb_numProd;
      axios.get(`http://192.168.0.250:9002/infoProdutos/${wb_numProdSelecionado}`)
        .then(response => {
          setInfoTecnicas(response.data);
          setShowInfoModal(true);
        })
        .catch(error => {
          console.error('Erro ao buscar informações técnicas:', error);
        });
    } else {
      toast.error('Selecione uma linha!', {
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
  };

  const closeModal = () => {
    setShowInfoModal(false);
    setInfoTecnicas(null);
  };


  const calcularAtrasos = (filtrados) => {
    let totalHorasAtraso = 0;
    let totalPecasAtraso = 0;
  
    if (filtrados.length > 0) {
      filtrados.forEach(item => {
        const dataInicial = moment(item.wb_datIni, 'DD/MM/YYYY');
        const hoje = moment();
        const isAtrasado = dataInicial.isBefore(hoje, 'day');
  
        // Se wb_temFsc for 'S', aplica a cor azul
        if (item.wb_temFsc === 'S') {
          item.style = { backgroundColor: '#ADD8E6' }; // Azul claro
  
          // Se também estiver atrasado, entra no cálculo de atraso
          if (isAtrasado) {
            const horasAtrasadas = item.wb_qtdSaldo / item.wb_pcHora;
            totalHorasAtraso += horasAtrasadas;
            totalPecasAtraso += item.wb_qtdSaldo;
          }
        } 
        // Se não tiver FSC e estiver atrasado, aplica a cor vermelha
        else if (isAtrasado) {
          item.style = { color: '#dd380f' };
          const horasAtrasadas = item.wb_qtdSaldo / item.wb_pcHora;
          totalHorasAtraso += horasAtrasadas;
          totalPecasAtraso += item.wb_qtdSaldo;
        }
      });
    }
  
    setHorasAtraso(totalHorasAtraso.toFixed(2));
    setPecasAtraso(totalPecasAtraso);
  };

  const handleLinhaClick = (indice) => {
    setLinhaSelecionada(indice);
  };

  const handleRealizarApontamento = () => {
    const numRec = dadosFiltrados[linhaSelecionada].wb_numRec;
    if (numRec === '04'){
      navigate('/apontamentoFinger', { state: { linha: dadosFiltrados[linhaSelecionada], filtroID: inputId } });
      
    }
    else if (linhaSelecionada !== null) {
      navigate('/apontamento', { state: { linha: dadosFiltrados[linhaSelecionada], filtroID: inputId } });
      
    }
   
    else {
      //alert("Selecione uma linha antes de realizar o apontamento.");
      toast.error('Selecione uma linha!', {
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
  };

  const handleConsumirComponentes = () => {
    if (linhaSelecionada !== null) {
      navigate('/componentes', { state: { linha: dadosFiltrados[linhaSelecionada], filtroID: inputId } });
    } else {
      //alert("Selecione uma linha antes de realizar o apontamento.");
      toast.error('Selecione uma linha!', {
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
  };

  //////////DESENHO//////////

  const handleAbrirDesenho = () => {
    if (linhaSelecionada !== null) {
      let numProd = dadosFiltrados[linhaSelecionada].wb_numProd;
  
      // Pegar apenas os 14 primeiros caracteres
      numProd = numProd.slice(0, 14);
  
      const pdfUrl = `http://192.168.0.250:9002/desenhoProduto/${numProd}.pdf`;
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('Selecione uma linha!', {
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
  };

    //////////PEDIDO//////////

    const handleAbrirPedido = () => {
      if (linhaSelecionada !== null) {
        let numPed = dadosFiltrados[linhaSelecionada].wb_numPed;
    
    
        const pdfUrl = `http://192.168.0.250:9002/pedido/${numPed}.pdf`;
        window.open(pdfUrl, '_blank');
      } else {
        toast.error('Selecione uma linha!', {
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
    };



  

  return (
    <div className="container">
      <h2>Sequenciamento de Produção</h2>

      <div className="label-container">
      <div className="label-containerOP"> 
        <label>
          Recurso: 
          <select onChange={handleInputIdChange} value={inputId} className="input-id">
            <option value="">Selecione um recurso</option>
            {recursos.map(recurso => (
              <option 
                key={recurso.WB_IDREC}
                value={recurso.WB_IDREC}
              >
                {`${recurso.WB_IDREC} - ${recurso.WB_DESCREC}`}
              </option>
            ))}
          </select>
        </label>
        
          <label> 
              OP: 
              <input 
                type="text" 
                value={inputOrp} 
                onChange={handleInputOrpChange} 
                className="input-id"
              />
            </label>
            <label className="input-atraso">
              Horas Atraso: {horasAtraso}
            </label>
            <label className="input-atraso">
              Peças Atraso: {pecasAtraso}
          </label>

          </div> 
          <div className="status-container">
              <div className="status-legend">
                  <div className="legend-item">
                      <div className="legend-atraso" style={{ backgroundColor: '#dd380f' }}></div>
                          <span> Atraso</span>
                  </div>
                  <div className="legend-item">
                      <div className="legend-FSC" style={{ backgroundColor: '#ADD8E6' }}></div>
                          <span> FSC</span>
                  </div>
               </div>
          </div>
      </div>
      <div className="button-container">
        <button 
          className="button"
          onClick={handleRealizarApontamento}>
          Realizar Apontamento
        </button>
        <button 
          className="button"
          onClick={handleConsumirComponentes}>
          Consumo Componentes / MP
        </button>
        <button 
          className="button"
          onClick={handleInfoTecnicas}>
          Info. Técnicas
        </button>
        <button 
          className="button"
          onClick={handleAbrirDesenho}>
          Desenho Produto
        </button>
        <button 
          className="button"
          onClick={handleAbrirPedido}>
          Pedido/Word
        </button>
        <button 
          className="button"
          onClick ={() => window.location.reload()}>
          Atualizar
        </button>
        <button 
          className="button"
          onClick={() => navigate('/')}>
          Voltar
        </button>
      </div>

      {dadosFiltrados.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                
                <th>OP</th>
                <th>Seq</th>
                <th>Ped</th>
                <th>It</th>
                <th>Produto</th>
                <th>Descrição</th>
                <th>Data</th>
                <th>Qtd</th>
                <th>Prod</th>
                <th>Saldo</th>
                <th>PÇ/Hora</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item, index) => (
                <tr 
                  key={`${item.wb_numRec}-${index}`}
                  onClick={() => handleLinhaClick(index)}
                  className={linhaSelecionada === index ? 'selected' : ''}
                  style={item.style} // Aplica o estilo diretamente no item
                >
                  
                  <td>{item.wb_numOrp}</td>
                  <td>{item.wb_numSeq}</td>
                  <td>{item.wb_numPed}</td>
                  <td>{item.wb_itemPed}</td>
                  <td>{item.wb_numProd}</td>
                  <td>{item.wb_desPro}</td>
                  <td>{item.wb_datIni}</td>
                  <td>{item.wb_qtdPrev}</td>
                  <td>{item.wb_qtdProd}</td>
                  <td>{item.wb_qtdSaldo}</td>
                  <td>{item.wb_pcHora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inputId !== '' && dadosFiltrados.length === 0 && (
        <p>Nenhum dado encontrado para o ID e OP informados.</p>
        

        
      )}

{showInfoModal && (
  <div className="modal-container">
    <div className="modal-content">
          <h3>Informações Técnicas</h3>
          <p><strong>Produto:</strong> {infoTecnicas.WB_NUMPROD}</p>
          <p><strong>Descrição:</strong> {infoTecnicas.WB_DESPRO}</p>
          <p><strong>Medidas:</strong> {infoTecnicas.WB_DESCPL}</p>
          <p><strong>Tipo:</strong> {infoTecnicas.WB_DESDER}</p>
          <p><strong>Blanks:</strong> {infoTecnicas.WB_PROBLK}</p>
          <p><strong>Descrição:</strong> {infoTecnicas.WB_DESBLK}</p>
          <p><strong>M³:</strong> {((parseFloat(infoTecnicas.WB_COMPRO ?? 0) * parseFloat(infoTecnicas.WB_LARPRO ?? 0) * parseFloat(infoTecnicas.WB_ESPPRO ?? 0)) * (dadosFiltrados[linhaSelecionada].wb_qtdPrev)).toFixed(2)}</p>
      </div>
      <div className="button-containerCancel">
          <button className="cancel-button" onClick={() => setShowInfoModal(false)}>
            Cancelar
         </button>
          </div>
        </div>
      )}
      <ToastContainer />

      
    </div>
  );
}

export default Sequenciamento;
