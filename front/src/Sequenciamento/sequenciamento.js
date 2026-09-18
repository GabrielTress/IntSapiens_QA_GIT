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
  const [showConversorModal, setShowConversorModal] = useState(false);
  const [tipoConversao, setTipoConversao] = useState('mmParaPol');
  const [valorConversao, setValorConversao] = useState('');
  const [resultadoConversao, setResultadoConversao] = useState('');

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
  if (linhaSelecionada === null) {
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
    return;
  }

  const linha = dadosFiltrados[linhaSelecionada];
  const numRec = linha.wb_numRec;

  if (numRec === '04') {
    navigate('/apontamentoFinger', { state: { linha, filtroID: inputId } });
  } 
  else if (numRec === '07') {
    navigate('/apontamentoColadeira', { state: { linha, filtroID: inputId } });
  } 
  else if (numRec === '80') {
    navigate('/apontamentoBioenergy', { state: { linha, filtroID: inputId } });
  } 
  else {
    navigate('/apontamento', { state: { linha, filtroID: inputId } });
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

  
  const handleAbrirPnc = () => {
    if (linhaSelecionada !== null) {
      navigate('/Pnc', { state: { linha: dadosFiltrados[linhaSelecionada], filtroID: inputId } });
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
      if(dadosFiltrados[linhaSelecionada].wb_numEmp == '3'){
          let numProdBioEnergy = dadosFiltrados[linhaSelecionada].wb_numProd;
          numProdBioEnergy = numProdBioEnergy.slice(0, 6);
          const pdfUrl = `http://192.168.0.250:9002/desenhoProdutoBioEnergy/${numProdBioEnergy}.pdf`;
          window.open(pdfUrl, '_blank');

      } else if (dadosFiltrados[linhaSelecionada].wb_numEmp == '1') {

          let numProd = dadosFiltrados[linhaSelecionada].wb_numProd;
          // Pegar apenas os 14 primeiros caracteres
          numProd = numProd.slice(0, 14);
          const pdfUrl = `http://192.168.0.250:9002/desenhoProduto/${numProd}.pdf`;
          window.open(pdfUrl, '_blank');
      }
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
        if(dadosFiltrados[linhaSelecionada].wb_numEmp == '3'){
            let numPedBioEnergy = dadosFiltrados[linhaSelecionada].wb_numPed;
            const pdfUrl = `http://192.168.0.250:9002/pedidoBioEnergy/${numPedBioEnergy}.pdf`;
            window.open(pdfUrl, '_blank');

        }

        else if (dadosFiltrados[linhaSelecionada].wb_numEmp == '1') {
            let numPed = dadosFiltrados[linhaSelecionada].wb_numPed;
            const pdfUrl = `http://192.168.0.250:9002/pedido/${numPed}.pdf`;
            window.open(pdfUrl, '_blank');

        }

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

    ////ABRIR DOCUMENTO IT//////////
    
    const handleAbrirIT = () => {
      if (linhaSelecionada !== null) {
            let numRec = dadosFiltrados[linhaSelecionada].wb_numRec;
            const pdfUrl = `http://192.168.0.250:9002/documentoIT/${numRec}.pdf`;
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

    const handleAbrirRepasse = () => {
      if (linhaSelecionada !== null) {
        navigate('/repasse', { state: { linha: dadosFiltrados[linhaSelecionada], filtroID: inputId } });
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

  const handleFerramenta = async (item) => {

  const senha = prompt('Digite a senha para confirmar a ferramenta:');

  if (!senha) return;

  try {

    const response = await axios.post(
      'http://192.168.0.250:9002/ferramenta',
      {
        numemp: item.wb_numEmp,
        numorp: item.wb_numOrp,
        numori: item.wb_numOri,
        numrec: item.wb_numRec,
        numseq: item.wb_numSeq,
        senha
      }
    );

    toast.success(response.data.message);

    setDadosFiltrados(prev =>
      prev.map(linha =>
        linha.wb_numOrp === item.wb_numOrp &&
        linha.wb_numSeq === item.wb_numSeq
          ? {
              ...linha,
              wb_ferramenta:
                linha.wb_ferramenta === 'S'
                  ? 'N'
                  : 'S'
            }
          : linha
      )
    );

  } catch (error) {

    toast.error(
      error.response?.data?.message ||
      'Erro ao atualizar ferramenta'
    );
  }
};

const handleEmbalagem = async (item) => {

  const senha = prompt('Digite a senha para confirmar a embalagem:');

  if (!senha) return;

  try {

    const response = await axios.post(
      'http://192.168.0.250:9002/embalagem',
      {
        numemp: item.wb_numEmp,
        numorp: item.wb_numOrp,
        numori: item.wb_numOri,
        numrec: item.wb_numRec,
        numseq: item.wb_numSeq,
        senha
      }
    );

    toast.success(response.data.message);

    setDadosFiltrados(prev =>
      prev.map(linha =>
        linha.wb_numOrp === item.wb_numOrp &&
        linha.wb_numSeq === item.wb_numSeq
          ? {
              ...linha,
              wb_embalagem:
                linha.wb_embalagem === 'S'
                  ? 'N'
                  : 'S'
            }
          : linha
      )
    );

  } catch (error) {

    toast.error(
      error.response?.data?.message ||
      'Erro ao atualizar embalagem'
    );
  }
};


  const converterPolegadasParaMilimetros = (texto) => {
  if (!texto) return '';

  // Remove aspas e normaliza o X
  let textoNormalizado = texto
    .replace(/[”″"]/g, '')
    .replace(/[xX×]/g, 'x')
    .trim();

  // Separa as dimensões
  const dimensoes = textoNormalizado
    .split('x')
    .map(item => item.trim())
    .filter(Boolean);

  const resultados = dimensoes.map(dim => {

    let valor = 0;

    // Exemplo: 1-1/16
    if (dim.includes('-')) {

      const partes = dim.split('-');

      const inteiro = parseFloat(partes[0]) || 0;
      const fracao = partes[1];

      if (fracao && fracao.includes('/')) {
        const [numerador, denominador] = fracao.split('/');

        valor =
          inteiro +
          (parseFloat(numerador) / parseFloat(denominador));
      } else {
        valor = parseFloat(dim);
      }

    }

    // Exemplo: 1 1/16
    else if (dim.includes(' ') && dim.includes('/')) {

      const partes = dim.split(/\s+/);

      const inteiro = parseFloat(partes[0]) || 0;
      const fracao = partes[1];

      const [numerador, denominador] = fracao.split('/');

      valor =
        inteiro +
        (parseFloat(numerador) / parseFloat(denominador));

    }

    // Exemplo: 1/16
    else if (dim.includes('/')) {

      const [numerador, denominador] = dim.split('/');

      valor =
        parseFloat(numerador) /
        parseFloat(denominador);

    }

    // Exemplo: 25.4
    else {

      valor = parseFloat(dim);

    }

    if (isNaN(valor)) {
      return null;
    }

    return valor * 25.4;
  });

  if (resultados.some(valor => valor === null)) {
    return '';
  }

  return resultados
    .map(valor => `${valor.toFixed(2)} mm`)
    .join(' × ');
};

const handleValorConversao = (e) => {

  const valor = e.target.value;

  setValorConversao(valor);

  if (!valor.trim()) {
    setResultadoConversao('');
    return;
  }

  if (tipoConversao === 'mmParaPol') {

    const numero = parseFloat(valor);

    if (isNaN(numero)) {
      setResultadoConversao('');
      return;
    }

    setResultadoConversao(
      `${(numero / 25.4).toFixed(4)} pol`
    );

  } else {

    const resultado = converterPolegadasParaMilimetros(valor);

    setResultadoConversao(resultado);
  }
};

const handleTipoConversao = (e) => {
  const tipo = e.target.value;

  setTipoConversao(tipo);

  const valor = valorConversao.trim();

  if (!valor) {
    setResultadoConversao('');
    return;
  }

  if (tipo === 'mmParaPol') {
    const numero = parseFloat(valor);

    if (isNaN(numero)) {
      setResultadoConversao('');
      return;
    }

    setResultadoConversao(
      `${(numero / 25.4).toFixed(4)} pol`
    );

  } else {
    const resultado = converterPolegadasParaMilimetros(valor);

    setResultadoConversao(resultado);
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
          onClick={handleAbrirIT}>
          IT
        </button>
        <button 
          className="button"
          onClick={handleAbrirRepasse}>
          Repasse
        </button>
        <button 
          className="button"
         onClick={handleAbrirPnc}>
          PNC
        </button>
        <button
          className="button"
          onClick={() => {
            setValorConversao('');
            setResultadoConversao('');
            setTipoConversao('mmParaPol');
            setShowConversorModal(true);
          }}
        >
          Conversor
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
                <th>Ori</th>
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
                <th>Ferram</th>
                <th>Emb</th>
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
                  <td>{item.wb_numOri}</td>
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
                  <td>
                  <button
                    className={
                      item.wb_ferramenta === 'S'
                        ? 'btn-ferramenta-verde'
                        : 'btn-ferramenta'
                    }
                    onClick={() => handleFerramenta(item)}
                  >
                    OK
                  </button>
                  </td>
                  <td>
                    <button
                      className={
                        item.wb_embalagem === 'S'
                          ? 'btn-ferramenta-verde'
                          : 'btn-ferramenta'
                      }
                      onClick={() => handleEmbalagem(item)}
                    >
                      OK
                    </button>
                  </td>
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
      {showConversorModal && (
        <div className="modal-overlay">
          <div className="conversor-modal">

            <div className="conversor-header">
              <div>
                <h3>Conversor de Medidas</h3>
                <span>Milímetros ↔ Polegadas</span>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowConversorModal(false)}
              >
                ×
              </button>
            </div>

            <div className="conversor-body">

              <div className="conversor-field">
                <label>Tipo de conversão</label>

              <select
                value={tipoConversao}
                onChange={handleTipoConversao}
              >
                <option value="mmParaPol">
                  Milímetros → Polegadas
                </option>

                <option value="polParaMm">
                  Polegadas → Milímetros
                </option>
              </select>
              </div>

              <div className="conversor-field">
                <label>
                  {tipoConversao === 'mmParaPol'
                    ? 'Valor em milímetros'
                    : 'Valor em polegadas'}
                </label>

                <div className="input-medida">
                  <input
                    type="text"
                    value={valorConversao}
                    onChange={handleValorConversao}
                    placeholder={
                      tipoConversao === 'mmParaPol'
                        ? 'Ex.: 25,4'
                        : 'Ex.: 1-1/16" X 5-1/4" X 81-11/16"'
                    }
                    autoFocus
                  />

                  <span>
                    {tipoConversao === 'mmParaPol' ? 'mm' : 'pol'}
                  </span>
                </div>
              </div>

              {resultadoConversao && (
                <div className="resultado-conversao">
                  <span className="resultado-label">
                    Resultado
                  </span>

                  <strong>
                    {resultadoConversao}
                  </strong>
                </div>
              )}

            </div>

            <div className="conversor-footer">
              <button
                className="btn-modal-cancelar"
                onClick={() => setShowConversorModal(false)}
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}
      <ToastContainer />

      
    </div>
  );
}

export default Sequenciamento;
