import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './consultaPedido.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ConsultaPedido() {
  const [numPed, setNumPed] = useState('');
  const navigate = useNavigate();

  const handleAbrirPedido = () => {
    if (numPed !== '') {
      const pdfUrl = `http://192.168.0.250:9002/pedido/${numPed}.pdf`;
      window.open(pdfUrl, '_blank');
    } else {
      toast.error('Falta preencher.', {
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
      <h2>Consultar Pedido</h2>
      <div className="form-group">
        <label>Código do Pedido:</label>
        <input
          type="text"
          value={numPed}
          onChange={(e) => setNumPed(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="button-container">
        <button className="button" onClick={handleAbrirPedido}>
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

export default ConsultaPedido;
