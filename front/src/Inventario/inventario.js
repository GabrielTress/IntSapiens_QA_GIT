
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './inventario.css';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Inventario() {
  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || '';
  const navigate = useNavigate();

  const [wb_numRec, setWb_numRec] = useState(linhaSelecionada?.wb_numRec || '');
  const [wb_numOrp, setWb_numOrp] = useState(linhaSelecionada?.wb_numOrp || '');
  const [wb_numEmp, setWb_numEmp] = useState(linhaSelecionada?.wb_numEmp || '');
  const [wb_numOri, setWb_numOri] = useState(linhaSelecionada?.wb_numOri || '');
  const [wb_numSeq, setWb_numSeq] = useState(linhaSelecionada?.wb_numSeq || '');
  const [wb_temFsc, setWb_temFsc] = useState(linhaSelecionada?.wb_temFsc || '');
  const [wb_numProd, setWb_numProd] = useState(linhaSelecionada?.wb_numProd || '');

  // Box atual
  const [wb_dtApont, setWb_dtApont] = useState('001');

  // Etiqueta atual
  const [wb_numEtq, setWb_numEtq] = useState('');

  const inputEtqRef = useRef(null);
  const inputBoxRef = useRef(null);

  useEffect(() => {
    // Ao abrir a tela, mantém o Box inicial como 001
    setWb_dtApont('001');

    // Foco inicial na etiqueta
    inputEtqRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Não roubar o foco enquanto o operador estiver
      // digitando diretamente no campo Box
      if (document.activeElement === inputBoxRef.current) {
        return;
      }

      inputEtqRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleVoltar = () => {
    navigate('/', { state: { filtroID } });
  };

  const handleApontar = async () => {
    // Validação do Box
    if (!wb_dtApont || wb_dtApont.trim() === '') {
      toast.error('Informe o Box!', {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });

      const audio = new Audio('./song_inventario_error.wav');
      audio.play();

      inputBoxRef.current?.focus();
      return;
    }

    // Validação da etiqueta
    const numero = parseInt(wb_numEtq, 10);

    if (isNaN(numero) || numero < 1000 || numero > 999999) {
      toast.error('Etiqueta inválida!', {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });

      setWb_numEtq('');

      const audio = new Audio('./song_inventario_error.wav');
      audio.play();

      inputEtqRef.current?.focus();
      return;
    }

    try {
      await axios.post('http://192.168.0.250:9002/inventario', {
        wb_dtApont,
        wb_numEtq
      });

      toast.success('Apontamento OK', {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-sucess'
      });

      const audio = new Audio('./song_inventario.wav');
      audio.play();

      // Limpa SOMENTE a etiqueta.
      // O Box permanece o mesmo.
      setWb_numEtq('');

      // Volta o foco para a etiqueta
      inputEtqRef.current?.focus();

    } catch (error) {
      console.error('Erro ao realizar o apontamento:', error);

      toast.error('Erro ao realizar apontamento', {
        position: 'bottom-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });

      setWb_numEtq('');

      const audio = new Audio('./song_inventario_error.wav');
      audio.play();

      inputEtqRef.current?.focus();
    }
  };

  const handleEtiquetaKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApontar();
    }
  };

  const handleBoxKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Depois de alterar o Box,
      // volta automaticamente para a etiqueta
      inputEtqRef.current?.focus();
    }
  };

  return (
    <div className="componentes-container">

      <h2>Inventário</h2>

      <div className="form-group">
        <label>Box:</label>

        <input
          type="text"
          value={wb_dtApont}
          ref={inputBoxRef}
          onChange={(e) => setWb_dtApont(e.target.value)}
          onKeyDown={handleBoxKeyDown}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Etiqueta:</label>

        <input
          type="number"
          value={wb_numEtq}
          ref={inputEtqRef}
          onChange={(e) => {
            const inputValue = e.target.value;

            setWb_numEtq(
              inputValue.replace(/^0+/, '')
            );
          }}
          onKeyDown={handleEtiquetaKeyDown}
          className="form-input"
          autoFocus
        />
      </div>

      <div className="button-container">

        <button
          className="button"
          onClick={handleApontar}
        >
          Apontar
        </button>

        <button
          className="button"
          onClick={handleVoltar}
        >
          Voltar
        </button>

        <ToastContainer />

      </div>

    </div>
  );
}

export default Inventario;

