import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './consultaDesenho.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ConsultaDesenho() {
  const [numProd, setNumProd] = useState('');
  const navigate = useNavigate();

  const handleAbrirDesenho = () => {
    if (numProd.trim().length === 14) {
      const pdfUrl = `http://192.168.0.250:9002/desenhoProduto/${numProd}.pdf`;
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('Código incompleto.', {
        position: "bottom-center",
        autoClose: 2500,
        className: 'custom-toast-error'
      });
    }
  };

  const handleVoltar = () => {
    navigate('/');
  };

  return (
    <div className="componentes-container">
      <h2>Consultar Desenho</h2>
      <div className="form-group">
        <label>Código do Produto:</label>
        <input
          type="text"
          value={numProd}
          onChange={(e) => setNumProd(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="button-container">
        <button className="button" onClick={handleAbrirDesenho}>
          Consultar
        </button>
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
        <ToastContainer />
      </div>
    </div>
  );
}

export default ConsultaDesenho;
