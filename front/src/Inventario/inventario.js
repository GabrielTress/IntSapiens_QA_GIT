import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './inventario.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Inventario() {
  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || ''; // Recupera o filtroID

  // Inicializa os estados com os valores da linha selecionada
  const [wb_numRec, setWb_numRec] = useState(linhaSelecionada?.wb_numRec || '');
  const [wb_numOrp, setWb_numOrp] = useState(linhaSelecionada?.wb_numOrp || '');
  const [wb_numEmp, setWb_numEmp] = useState(linhaSelecionada?.wb_numEmp || '');
  const [wb_numOri, setWb_numOri] = useState(linhaSelecionada?.wb_numOri || '');
  const [wb_numSeq, setWb_numSeq] = useState(linhaSelecionada?.wb_numSeq || '');
  const [wb_temFsc, setWb_temFsc] = useState(linhaSelecionada?.wb_temFsc || '');
  const [wb_numProd, setWb_numProd] = useState(linhaSelecionada?.wb_numProd || '');
  const [wb_numEtq, setWb_numEtq] = useState('');
  
  const navigate = useNavigate();


  const [wb_dtApont, setWb_dtApont] = useState('');
  useEffect(() => {
    setWb_dtApont(moment().format('DD-MM-YYYY'));
  }, []);

  const handleVoltar = () => {
    navigate('/', { state: { filtroID } }); // Passa o filtroID ao voltar
  };



  const handleApontar = async () => {
        console.log(wb_dtApont, wb_numEtq);
        try {
            await axios.post('http://192.168.0.250:9002/inventario', {
                wb_dtApont,
                wb_numEtq
            });
            toast.success('Apontamento OK', {
              position: "bottom-center",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              className: 'custom-toast-sucess'
            });
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

  };

  return (
    <div className="componentes-container">
      <h2>Inventário</h2>
      <div className="form-group">
        <label>Data:</label>
        <input 
          type="data" 
          value={wb_dtApont} 
          onChange={(e) => setWb_dtApont(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Etiqueta:</label>
        <input
            type="number"
            value={wb_numEtq}
            onChange={(e) => {
              const inputValue = e.target.value;
              setWb_numEtq(inputValue.replace(/^0+/, '')); // Remove os zeros à esquerda
            }}
            className="form-input"
          />
      </div>
      <div className="button-container">
        <button className="button" onClick={handleApontar}>
          Apontar
        </button>
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
        <ToastContainer />
      </div>
      
    </div>
  );
}

export default Inventario;