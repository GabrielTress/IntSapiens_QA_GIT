import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './cadastroChecklist.css';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BiAddToQueue } from 'react-icons/bi';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { FaCheck } from 'react-icons/fa';
import { MdModeEdit } from "react-icons/md";

function CadastroChecklist() {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate('/');
  };

  const [obterRegistroChecklist, setObterRegistroChecklist] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [linhaEditando, setLinhaEditando] = useState(null);
  const [valoresEditados, setValoresEditados] = useState({});

  useEffect(() => {
    handleObterRegistroChecklist();
  }, []);

  const handleObterRegistroChecklist = async () => {
    try {
      const response = await axios.get(`http://192.168.0.250:9002/checklistqualidade`);
      const registros = response.data.map(item => ({
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
      console.error("Erro ao buscar checklist:", error);
    }
  };

  const todosSelecionados =
    obterRegistroChecklist.length > 0 && selecionados.length === obterRegistroChecklist.length;

  const toggleSelecionado = (index) => {
    if (selecionados.includes(index)) {
      setSelecionados(selecionados.filter((item) => item !== index));
    } else {
      setSelecionados([...selecionados, index]);
    }
  };

  const toggleSelecionarTodos = () => {
    if (todosSelecionados) {
      setSelecionados([]);
    } else {
      setSelecionados(obterRegistroChecklist.map((_, index) => index));
    }
  };

  // Checkbox customizado
  const IconCheckbox = ({ checked, onClick }) => (
    <div className={`checkbox-container ${checked ? 'checked' : ''}`} onClick={onClick}>
      {checked && <FaCheck className="check-icon" />}
    </div>
  );

  // Inicia edição de uma linha
  const handleEditar = (index) => {
    setLinhaEditando(index);
    setValoresEditados({ ...obterRegistroChecklist[index] });
  };

  const handleSalvar = (index) => {
    const novosRegistros = [...obterRegistroChecklist];
    novosRegistros[index] = valoresEditados;
    setObterRegistroChecklist(novosRegistros);
    setLinhaEditando(null);
    setValoresEditados({});
  };

  const handleCancelar = () => {
    setLinhaEditando(null);
    setValoresEditados({});
  };

  const handleDuplicar = (index) => {
    const duplicado = { ...obterRegistroChecklist[index] };
    setObterRegistroChecklist([...obterRegistroChecklist, duplicado]);
  };

  const handleExcluir = (index) => {
    const novosRegistros = obterRegistroChecklist.filter((_, i) => i !== index);
    setObterRegistroChecklist(novosRegistros);
  };

  return (
    <div className="container-apontamentoFinger">
      <h2>Cadastro Inspeções</h2>

      <div className="selectRecurso">
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
      </div>

      <table className="tableFingerCadastro">
        <thead>
          <tr>
            <th>
              <IconCheckbox
                checked={todosSelecionados}
                onClick={toggleSelecionarTodos}
              />
            </th>
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
              <td>
                <IconCheckbox
                  checked={selecionados.includes(index)}
                  onClick={() => toggleSelecionado(index)}
                />
              </td>
              {linhaEditando === index ? (
                <>
                  <td><input className="inputEditCadastro" value={valoresEditados.numRec} onChange={(e) => setValoresEditados({...valoresEditados, numRec: e.target.value})} /></td>
                  <td><input className="inputEditCadastro" value={valoresEditados.numProd} onChange={(e) => setValoresEditados({...valoresEditados, numProd: e.target.value})} /></td>
                  <td><input className="inputEditCadastro" value={valoresEditados.descricao} onChange={(e) => setValoresEditados({...valoresEditados, descricao: e.target.value})} /></td>
                  <td><input className="inputEditCadastro" value={valoresEditados.valorAlvo} onChange={(e) => setValoresEditados({...valoresEditados, valorAlvo: e.target.value})} /></td>
                  <td><input className="inputEditCadastro" value={valoresEditados.valorMin} onChange={(e) => setValoresEditados({...valoresEditados, valorMin: e.target.value})} /></td>
                  <td><input className="inputEditCadastro" value={valoresEditados.valorMax} onChange={(e) => setValoresEditados({...valoresEditados, valorMax: e.target.value})} /></td>
                  <td><input className="inputEditCadastro" value={valoresEditados.frequencia} onChange={(e) => setValoresEditados({...valoresEditados, frequencia: e.target.value})} /></td>
                  <td><select className="inputEditCadastro" value={valoresEditados.tipo} onChange={(e) => setValoresEditados({...valoresEditados, tipo: e.target.value})}>
                          <option value="NUMERICO">NUMERICO</option>
                          <option value="OK/NOK">OK/NOK</option>
                      </select>
                  </td>
                  <td><input className="inputEditCadastro" value={valoresEditados.sequencia} onChange={(e) => setValoresEditados({...valoresEditados, sequencia: e.target.value})} /></td>
                  <td>
                    <button onClick={() => handleSalvar(index)}>Salvar</button>
                    <button onClick={handleCancelar}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
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
                    <MdModeEdit size={20} title="Editar" style={{ cursor: "pointer", marginRight: "3px" }} onClick={() => handleEditar(index)} />
                    <BiAddToQueue size={20} title="Duplicar" style={{ cursor: "pointer", marginRight: "3px" }} onClick={() => handleDuplicar(index)} />
                    <RiDeleteBin6Line size={20} title="Excluir" style={{ cursor: "pointer", color: "red" }} onClick={() => handleExcluir(index)} />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "10px" }}>
        <strong>Linhas Selecionadas:</strong>{" "}
        {selecionados.length > 0
          ? selecionados.map(i => `${obterRegistroChecklist[i].descricao}`).join(", ")
          : "Nenhuma"}
      </div>

      <ToastContainer />
    </div>
  );
}

export default CadastroChecklist;
