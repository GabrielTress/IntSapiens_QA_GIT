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
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate('/');
  };


  const [obterRegistroChecklist, setObterRegistroChecklist] = useState([]);

  useEffect(() => {
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
        console.error("Erro ao carregar registros:", error);
      }
    };
    handleObterRegistroChecklist();
  });

  
  
    
  

  return (
    <div className="container-apontamentoFinger">
      <h2>Cadastro Inpeções</h2>
      <div className="selectRecurso">
          
          
              <button className="button" onClick={handleVoltar}>
                  Voltar
             </button>
       </div>    
      <table className="tableFinger">
        <thead>
          <tr>
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
                <BiAddToQueue size={20} title="Duplicar"/>
                <RiDeleteBin6Line size={20} title="Excluir"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

<ToastContainer />
    </div>
    
  );
}

export default CadastroChecklist;
