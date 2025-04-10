import './repasse.css';
import Axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Repasse = () => {
  const [formData, setFormData] = useState({
    op: '',
    perfil: '',
    largura: '',
    espessura: '',
    recurso: ''
  });


  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleClear = () => {
    setFormData({
      op: '',
      perfil: '',
      largura: '',
      espessura: '',
      recurso: ''
    });
    setQuantidadeTotal(0);
  };

  const [quantidadeTotal, setQuantidadeTotal] = useState(0);

  const btt1 = "LINHA DE COLA ABERTA";
  const btt2 = "TRINCA";
  const btt3 = "BURACO";
  const btt4 = "MANCHA DE OLEO";
  const btt5 = "RISCO DE GESSO";
  const btt6 = "PARADA DE GESSO";
  const btt7 = "PARADA TINTA";
  const btt8 = "ESTREITA";
  const btt9 = "FINA";
  const btt10 = "QUEBRADA LATERAL";
  const btt11 = "GESSO ESCAMADO";
  const btt12 = "VEIO";
  const btt13 = "MANCHA SEM TINTA";
  const btt14 = "FINGER ABERTO";
  const btt15 = "ARREPIADO";
  const btt16 = "BATIDA";
  const btt17 = "MORDIDA";
  const btt18 = "OUTROS";

  var date = new Date(Date.now());
  const qtd = 1;

  const navigate = useNavigate();

  const handleButtonClick = (buttonNumber) => {
    if (buttonNumber === 1 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt1,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
       setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });

    } else if (buttonNumber === 2 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt2,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 3 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt3,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 4 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt4,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 5 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt5,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 6 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt6,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }
    else if (buttonNumber === 7 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt7,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 8 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt8,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 9 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt9,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 10 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt10,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 11 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt11,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 12 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt12,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 13 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt13,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 14 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt14,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 15 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt15,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 16 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt16,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 17 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt17,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 18 && formData.op !== "" && formData.perfil !== "" && formData.espessura !== "" && formData.largura !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: formData.op,
        motivo: btt18,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: formData.perfil,
        espessura: formData.espessura,
        largura: formData.largura,
        status_largura: verificaValores(),
        recurso: formData.recurso
      }).then((response) => {
        console.log(response);
        toast.success('Apontamento OK', {
          position: "bottom-right",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else{
        toast.error('Preencher todos os valores!', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    };
  
  };

  function verificaValores() {
    var Largura = parseFloat(formData.largura.replace(',', '.'));
    var LagMax = 125.41;
    var LagMed = 88.9;
    var result;
    if (Largura > LagMax) {
      result = "Largo";
    } else if (Largura < LagMed) {
      result = "Estreito";
    } else if (Largura >= LagMed && Largura <= LagMax) {
      result = "Médio";
    } else {
      result = "Valor lançado está fora dos parâmetros";
    }
    return result;
  };

  return (
    <div className="containerRepasse">
      <div className="input-containerRepasse">
        <div>
          <label className = "labelRepasse" htmlFor="op">OP</label>
          <input className = "inputRepasse" id="op" type="number" placeholder="OP" value={formData.op} onChange={handleInputChange} />
        </div>
        <div>
          <label className = "labelRepasse"  htmlFor="perfil">Perfil</label>
          <select className = "selectRepasse" id="perfil" value={formData.perfil} onChange={handleInputChange}>
            <option value="">Selecione...</option>
            <option value="Flat">Flat</option>
            <option value="Boards">Boards</option>
            <option value="Base">Base</option>
            <option value="Stool">Stool</option>
            <option value="Split Macho">Split Macho</option>
            <option value="Split Fêmea">Split Fêmea</option>
            <option value="Stop">Stop</option>
            <option value="Casing">Casing</option>
            <option value="Crown">Crown</option>
            <option value="Exterior Jambs">Exterior Jambs</option>
            <option value="Hand Rail">Hand Rail</option>
            <option value="Shiplat">Shiplat</option>
            <option value="Lambril">Lambril</option>
            <option value="MDF Boards">MDF Boards</option>
            <option value="MDF Flat">MDF Flat</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="recurso">Linha</label>
          <select className = "selectRepasse" id="recurso" value={formData.recurso} onChange={handleInputChange}>
            <option value="">Selecione...</option>
            <option value="Pintura 1">Pintura 1</option>
            <option value="Pintura 2">Pintura 2</option>
          </select>
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="largura">Largura</label>
          <input className = "inputRepasse"  id="largura" type="number" placeholder="Largura" value={formData.largura} onChange={handleInputChange} />
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="espessura">Espessura</label>
          <input className = "inputRepasse" id="espessura" type="number" placeholder="Espessura" value={formData.espessura} onChange={handleInputChange} />
        </div>
        <button className="clear-buttonRepasse" onClick={handleClear}>Limpar</button>
        <button className="voltar-buttonRepasse" onClick={() => navigate('/')}>Voltar</button>
      </div>
      <div className="button-containerRepasse">
        <button className = "buttonRepasse" onClick={() => handleButtonClick(1)}>{btt1}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(2)}>{btt2}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(3)}>{btt3}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(4)}>{btt4}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(5)}>{btt5}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(6)}>{btt6}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(7)}>{btt7}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(8)}>{btt8}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(9)}>{btt9}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(10)}>{btt10}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(11)}>{btt11}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(12)}>{btt12}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(13)}>{btt13}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(14)}>{btt14}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(15)}>{btt15}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(16)}>{btt16}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(17)}>{btt17}</button>
        <button className = "buttonRepasse" onClick={() => handleButtonClick(18)}>{btt18}</button>
      </div>
      <div className="label-container">
        <label className = "labelRepasse">A OP {formData.op} possui {quantidadeTotal} peças apontadas.</label>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Repasse;