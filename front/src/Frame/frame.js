import './frame.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Frame = () => {
    const dataApont = moment().format('DD-MM-YYYY HH:mm:ss');
    const navigate = useNavigate();
    const [recurso, setRecurso] = useState('');
    const [espessura, setEspessura] = useState('');
    const [largura, setLargura] = useState('');
    const [comprimento, setComprimento] = useState('');
    const [qtdProd, setQtdProd] = useState('');


  const handleVoltar = () => {
    navigate('/'); 
  };




  const handleClear = () => {
        setRecurso('');
        setEspessura('');
        setLargura('');
        setComprimento('');
        setQtdProd('');
  };

  function calculaMetCub() {
    var funLar = largura / 1000;
    var funEsp = espessura / 1000;
    var funCom = parseFloat(comprimento.replace(',', '.'));
    var funQtdProd = qtdProd
    var result;
        result = (funLar * funEsp * funCom) * funQtdProd ;
    return result;
  };


  const handleApontar = async () => {
    
        if (recurso !== "" && largura !== "" && espessura !== "" && comprimento !== "" && qtdProd !== "") {
          try {
            await axios.post('http://192.168.0.250:9002/frame', {
                recurso,
                espessura,
                largura,
                comprimento,
                qtdProd,
                metrosCubicos: calculaMetCub().toFixed(2),
                dataApont
            });
            setRecurso('');
            setEspessura('');
            setLargura('');
            setComprimento('');
            setQtdProd('');
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
            //alert('Erro ao realizar o apontamento.');
        }} else{
        toast.error('Preencher todos os valores!', {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error'
      });
    
  
    }};


return (
    <div className="apontamentoFrame-container">
      <h2>Realizar Apontamento</h2>
      <div className="formFrame-group">
        <label>Recurso:</label>
        <select className = "selectRecurso" id="recurso" value={recurso} onChange={(e) => setRecurso(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="Finger 01">Finger 01</option>
            <option value="Finger 02">Finger 02</option>
          </select>
      </div>
      <div className="formFrame-group">
        <label>Espessura:</label>
        <select className = "selectEspessura" id="espessura" value={espessura} onChange={(e) => setEspessura(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="33">33</option>
            <option value="39">39</option>
            <option value="42">42</option>
          </select>
      </div>
      <div className="formFrame-group">
        <label>Largura:</label>
        <select className = "selectLargura" id="largura" value={largura} onChange={(e) => setLargura(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="75">75</option>
            <option value="84">84</option>
            <option value="90">90</option>
            <option value="94">94</option>
            <option value="99">99</option>
            <option value="110">110</option>
            <option value="112">112</option>
            <option value="114">114</option>
            <option value="121">121</option>
            <option value="124">124</option>
            <option value="128">128</option>
            <option value="138">138</option>
            <option value="144">144</option>
          </select>
      </div>
      <div className="formFrame-group">
        <label>Comprimento:</label>
        <select className = "selectComprimento" id="comprimento" value={comprimento} onChange={(e) => setComprimento(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="2.06">2.06</option>
            <option value="2.32">2.32</option>
          </select>
      </div>
      
      <div className="formFrame-group">
        <label>Quantidade Produzida:</label>
        <input 
          type="number" 
          value={qtdProd} onChange={(e) => setQtdProd(e.target.value)}
          className="formFrame-input"
        />
      </div>
      <div className="button-container">
        <button className="button" onClick={handleApontar}>
          Apontar
        </button>
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
        <button className="button-apagar" onClick={handleClear}>
          Limpar
        </button>
        <ToastContainer />
      </div>
      
    </div>
  );
};

export default Frame;