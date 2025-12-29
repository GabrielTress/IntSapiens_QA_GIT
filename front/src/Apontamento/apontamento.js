import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './apontamento.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Apontamento() {
  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || ''; // Recupera o filtroID

  // Inicializa os estados com os valores da linha selecionada
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
  

  const handleVoltar = () => {
    navigate('/sequenciamento', { state: { filtroID } }); // Passa o filtroID ao voltar
  };

    const handlePnc = () => {
    navigate('/Pnc', { state: { linha: linhaSelecionada, filtroID: wb_numRec } });
  };

  // VALIDA SE A OP E O RECURSO INFORMADOS ESTÃO PRESENTES NO SEQUENCIAMENTO
  const validaOp = async () => {
    try {
      const response = await axios.get('http://192.168.0.250:9002/sequenciamento', {
        params: {
          wb_numEmp,
          wb_numRec,
          wb_numOrp,
          wb_numOri,
          wb_numSeq
        }
      });

      const encontrado = response.data.some(item => item.wb_numEmp = wb_numEmp && item.wb_numRec == wb_numRec && item.wb_numOrp == wb_numOrp && item.wb_numOri == wb_numOri && item.wb_numSeq == wb_numSeq);
      return encontrado;
    } catch (error) {
      console.error('Erro ao validar ID e OP:', error);
      return false;
    }
  };

  const handleApontar = async () => {
    const validacaoOp = await validaOp();
  
    if (validacaoOp) {
      const quantidadeOriginal = parseFloat(wb_qtdPrev);
      const quantidadeProduzida = parseFloat(wb_qtdProd || 0);
      const quantidadeRefugada = parseFloat(wb_qtdRef || 0); // Garante que é um número
  
      // Calcula a quantidade já produzida a partir do banco de dados
      const quantidadeJaProduzida = linhaSelecionada?.wb_qtdProd || 0;
      const quantidadeTotalProduzida = quantidadeJaProduzida + quantidadeProduzida;
      const quantidadeMaximaPermitida = quantidadeOriginal * 1.1;
      

      //atualizar saldo rodapé
      setWb_qtdSaldo(wb_qtdSaldo - wb_qtdProd);

      if (wb_numRec && wb_numOrp && wb_qtdProd) {
        if (quantidadeTotalProduzida <= quantidadeMaximaPermitida) {
          try {
            await axios.post('http://192.168.0.250:9002/apontamento', {
              wb_numEmp,
              wb_numRec,
              wb_numOri,
              wb_numSeq,
              wb_numOrp,
              wb_numProd,
              wb_qtdProd: quantidadeProduzida,
              wb_qtdRef: quantidadeRefugada,
              wb_dtApont,
              wb_process
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
            //alert('Apontamento realizado com sucesso!');
            setWb_qtdProd('');
            setWb_qtdRef('');

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
            //alert('Erro ao realizar o apontamento.');
          }
  
          // Navegação condicional apenas para wb_numRec diferente de 4 e 31
          if (wb_numRec !== '04' && wb_numRec !== '31') {
            setTimeout(() => {
              navigate('/sequenciamento', { state: { filtroID } });
            }, 2500);
          } else {
            // Caso wb_numRec seja 4 ou 31, você pode exibir uma mensagem ou tomar outra ação, se necessário
            //alert("Navegação não permitida para wb_numRec 4 ou 31.");
          }
        } else {
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
          //alert("Quantidade produzida ultrapassa 10% do permitido.");
        }
      } else {
        toast.error('Preencher todos os valores!', {
          position: "bottom-center",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-error'
        });
        //alert("Preencher todos os valores!");
      }
    } else {
      toast.error('OP ou Recurso não encontrados no sequenciamento!', {
        position: "bottom-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });
      //alert("OP ou Recurso não encontrados no sequenciamento!");
    }
    
  };


  return (
    <div className="apontamento-container">
      <h2>Realizar Apontamento</h2>
      <div className="form-group">
        <label>Recurso:</label>
        <input 
          type="text" 
          value={wb_numRec} 
          onChange={(e) => setWb_numRec(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>OP:</label>
        <input 
          type="text" 
          value={wb_numOrp} 
          onChange={(e) => setWb_numOrp(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Quantidade Produzida:</label>
        <input 
          type="number" 
          value={wb_qtdProd} 
          onChange={(e) => setWb_qtdProd(e.target.value)}
          className="form-input"
        />
      </div>
      <div className="form-group">
        <button className="button-pnc"
         onClick={handlePnc}
         style={{
          backgroundColor: '#ff6b6b',
          color: '#fff',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500'
          }}>
          PNC
        </button>
      </div >
      <div className="form-group">
          O PNC deve ser informado antes de apontar a produção.
      </div>
      {/*<div className="form-group">
        <label>Quantidade Refugada:</label>
        <input 
          type="number" 
          value={wb_qtdRef} 
          onChange={(e) => setWb_qtdRef(e.target.value)}
          className="form-input"
        />
      </div>*/}
      <div>
        <p>Previsto: {wb_qtdPrev} | Saldo: {wb_qtdSaldo}</p>
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

export default Apontamento;