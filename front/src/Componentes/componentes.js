import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './componentes.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Componentes() {
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
  /*const [wb_qtdPrev, setWb_qtdPrev] = useState(linhaSelecionada?.wb_qtdPrev || 0);
  const [wb_qtdSaldo, setWb_qtdSaldo] = useState(linhaSelecionada?.wb_qtdSaldo || '');
  const [quantidadeTotalProduzida, setQuantidadeTotalProduzida] = useState(0);
  const [wb_qtdProd, setWb_qtdProd] = useState('');
  const [wb_qtdRef, setWb_qtdRef] = useState('');*/
  const wb_process = 'N';
  const wb_dtApont = moment().format('DD-MM-YYYY HH:mm:ss');
  const navigate = useNavigate();


  const handleVoltar = () => {
    navigate('/sequenciamento', { state: { filtroID } }); // Passa o filtroID ao voltar
  };

    // VALIDA SE A ETIQUETA JA FOI LIDA ANTERIORMENTE
    const validaEtiquetaComponentes = async () => {
      try {
        const response = await axios.get('http://192.168.0.250:9002/componentes', {
          params: {
            wb_numEmp,
            wb_numEtq
          }
        });
        
        const encontrado = response.data.some(item => item.WB_NUMEMP == wb_numEmp && item.WB_NUMETQ == wb_numEtq);
        return encontrado;
        
      } catch (error) {
        console.error('Erro ao validar etiqueta', error);
        return false;
      }
    };

        // VALIDA SE A ETIQUETA ESTA ATIVA
        const validaEtiqueta = async () => {
          try {
            const response = await axios.get('http://192.168.0.250:9002/etiquetas', {
              params: { wb_numEtq }
            });
        
            return response.data.existe;
        
          } catch (error) {
            console.error('Erro ao validar etiqueta', error);
            return false;
          }
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

      const encontrado = response.data.some(item => item.wb_numEmp === wb_numEmp && item.wb_numRec === wb_numRec && item.wb_numOrp === wb_numOrp && item.wb_numOri === wb_numOri && item.wb_numSeq === wb_numSeq);
      return encontrado;
    } catch (error) {
      console.error('Erro ao validar ID e OP:', error);
      return false;
    }
  };

          // VALIDA SE A ETIQUETA E FSC PARA PEDIDO FSC
          const validaEtiquetaFSC = async () => {
            try {
              const response = await axios.get('http://192.168.0.250:9002/etiquetasFSC', {
                params: {
                  wb_numEtq
                }
              });

              const encontrado = response.data.some(item => item.WB_NUMETQ == wb_numEtq);
              return encontrado;
          
            } catch (error) {
              console.error('Erro ao validar etiqueta', error);
              return false;
            }
          };

  const handleApontar = async () => {
    const validacaoOp = await validaOp();
    const validacaoEtiquetaComponentes = await validaEtiquetaComponentes();
    const validacaoEtiquetaERP = await validaEtiqueta();
    const validacaoEtiquetaFSC = await validaEtiquetaFSC();

    if (wb_numRec === '01' && wb_temFsc === 'S' && validacaoEtiquetaFSC === false) {
      toast.error('Pedido FSC necessita de madeira FSC. Verificar!!!', {
        position: "bottom-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });
      return;
    }

  
  if(!validacaoEtiquetaComponentes != false){
    if(!validacaoEtiquetaERP == false){
        if (validacaoOp) {
          if (wb_numRec && wb_numOrp && wb_numEtq) {
              try {
                await axios.post('http://192.168.0.250:9002/componentes', {
                  wb_numEmp,
                  wb_numRec,
                  wb_numOri,
                  wb_numSeq,
                  wb_numOrp,
                  wb_numProd,
                  wb_numEtq,
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
                setWb_numEtq('');
              } catch (error) {
                console.error('Erro ao realizar o apontamento:', error);
                toast.error('Etiqueta já processada', {
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
        
        }
      } else{
        toast.error('Etiqueta inativa!', {
          position: "bottom-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-error',
        });
        setWb_numEtq('');
      }
      } else {
        toast.error('Etiqueta já processada!', {
          position: "bottom-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-error',
        });
        setWb_numEtq('');
      
      }
  };

  return (
    <div className="componentes-container">
      <h2>Consumir Componentes / MP</h2>
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

export default Componentes;