import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './reimpressao.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function ReimprirEtiqueta() {
  const [numEtq, setNumEtq] = useState('');
  const navigate = useNavigate();

  const handleReimprimirEtiqueta = async () => {
    if (numEtq === '') {
        toast.error('Falta preencher.', {
        position: "bottom-center",
        autoClose: 2500,
        className: 'custom-toast-error'
        });
        return;
    }

    try {
        // pega ZPL do backend
        const { data: zpl } = await axios.post(
        'http://192.168.0.250:9002/printEtiquetasGeral',
        { wb_numEtq: numEtq },
        { responseType: 'text' }
        );

        // manda para Browser Print
        window.BrowserPrint.getDefaultDevice("printer", (device) => {
        device.send(zpl, () => {
            toast.success(`Etiqueta ${numEtq} enviada para a impressora!`, {
                    position: "bottom-center",
                    autoClose: 2000,
                    className: 'custom-toast-sucess'
            });
        }, (err) => {
            toast.error("Erro ao imprimir: " + err);
        });
        });

    } catch (err) {
        console.error(err);
        toast.error('Erro ao buscar etiqueta.', {
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

  const handleVoltar = () => {
    navigate('/');
  };

  return (
    <div className="componentes-container">
      <h2>Reimprimir Etiqueta</h2>
      <div className="form-group">
        <label>Etiqueta:</label>
        <input
          type="text"
          value={numEtq}
          onChange={(e) => setNumEtq(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="button-container">
        <button className="button" onClick={handleReimprimirEtiqueta}>
          Reimprimir
        </button>
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
        <ToastContainer />
      </div>
    </div>
  );
}

export default ReimprirEtiqueta;
