import './repasse.css';
import Axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Repasse = () => {

  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || ''; // Recupera o filtroID

  const [op, setOp] = useState(linhaSelecionada?.wb_numOrp || '');
  const [infoTecnicas, setInfoTecnicas] = useState(null);
  const [perfil, setPerfil] = useState('');
  const [linha, setLinha] = useState('');
  const [espessuraAut, setEspessuraAut] = useState('');
  const [larguraAut, setLarguraAut] = useState('');

    // requisição para obter os dados técnicos do produto  
    const handleInfoTecnicas = () => {
        const wb_numProdSelecionado = linhaSelecionada?.wb_numProd;
        axios.get(`http://192.168.0.250:9002/infoProdutos/${wb_numProdSelecionado}`)
          .then(response => {
            setInfoTecnicas(response.data);
            
          })
          .catch(error => {
            console.error('Erro ao buscar informações técnicas:', error);
          });
    };
    useEffect(() => {
      handleInfoTecnicas();
    }, []);


    useEffect(() => {
      const textMedidas = infoTecnicas?.WB_DESCPL || "";
      const partMedidas = textMedidas.split('X');
      if (partMedidas[0]) {
        const espessura = partMedidas[0].trim().replace(',', '.');
        setEspessuraAut(espessura);
      }
      if (partMedidas[1]) {
        const largura = partMedidas[1].trim().replace(',', '.');
        setLarguraAut(largura);
      }
    }, [infoTecnicas]); // só quando infoTecnicas mudar


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

  const linhaMap = {
    "19": "Pintura 1",
    "18": "Pintura 2"
  };

//console.log('linha:', linhaSelecionada?.wb_numRec);

  useEffect(() => {
    if (linhaSelecionada?.wb_numRec) {
      const cod = linhaSelecionada?.wb_numRec;
      const linhaAuto = linhaMap[cod];
      if (linhaAuto) {
        setLinha(linhaAuto);
      }
    }
  }, [linha]);

  const perfilMap = {
    "600001": "FLAT", // Último valor sempre que há duplicados
    "600002": "SPLIT",
    "111111": "SPLIT MACHO",
    "222222": "SPLIT FEMEA",
    "600003": "CROW",
    "600004": "CASING",
    "600005": "BOARDS",
    "600006": "LINERS",
    "600007": "LAMBRIL",
    "600008": "STOP",
    "600009": "QUARTER ROUND",
    "600010": "PAINEL", // último valor no caso de duplicados
    "600011": "PAINEL",
    "600012": "BASE",
    "600013": "STOOL",
    "600101": "FLAT",
    "600102": "SPLIT",
    "600103": "CROW",
    "600104": "CASING",
    "600105": "BOARDS",
    "600106": "LINERS",
    "600107": "LAMBRIL",
    "600108": "STOP",
    "600109": "QUARTER ROUND",
    "600110": "PAINEL",
    "600112": "BASE",
    "600113": "STOOL",
    "600201": "FLAT MDF",
    "600202": "SPLT MDF",
    "600203": "CROW MDF",
    "600204": "CASING MDF",
    "600205": "BOARDS MDF",
    "600206": "LINERS MDF",
    "600207": "LAMBRIL MDF",
    "600208": "STOP MDF",
    "600209": "QUARTER ROUND MDF",
    "600210": "MOLDURA QUADRO MDF",
    "600211": "PAINEL MDF",
    "600212": "BASE MDF",
    "600213": "STOOL MDF"
  };
  useEffect(() => {
    if (infoTecnicas?.WB_CODFAM) {
      const cod = infoTecnicas.WB_CODFAM;
      const perfilAuto = perfilMap[cod];
      if (perfilAuto) {
        setPerfil(perfilAuto);
      }
    }
  }, [infoTecnicas]);



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
    if (buttonNumber === 1 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt1,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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

    } else if (buttonNumber === 2 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt2,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 3 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt3,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 4 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt4,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 5 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt5,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 6 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt6,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
    else if (buttonNumber === 7 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt7,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 8 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt8,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 9 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt9,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 10 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt10,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 11 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt11,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 12 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt12,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 13 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt13,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 14 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt14,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    }else if (buttonNumber === 15 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt15,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 16 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt16,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 17 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt17,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
      
    } else if (buttonNumber === 18 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && formData.recurso !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt18,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: qtd,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
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
    var Largura = parseFloat(larguraAut.replace(',', '.'));
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
          <input className = "inputRepasse" 
              id="op" type="number" placeholder="OP" 
              value={op} 
              onChange={(e) => setOp(e.target.value)}
          />
        </div>
        <div>
          <label className = "labelRepasse"  htmlFor="perfil">Perfil</label>
          <select className = "selectRepasse" id="perfil" value={perfil} onChange={e => setPerfil(e.target.value)}>
            <option value="">Selecione o perfil</option>
              {Object.values(perfilMap).map((nomePerfil, idx) => (
            <option key={idx} value={nomePerfil}>
              {nomePerfil}
            </option>
            ))}
          </select>
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="recurso">Linha</label>
          <select className = "selectRepasse" id="recurso" value={linha} onChange={e => setLinha(e.target.value)}>
            <option value="">Selecione...</option>
            {Object.values(linhaMap).map((nomeLinha, idx) => (
            <option key={idx} value={nomeLinha}>
              {nomeLinha}
            </option>
            ))}
          </select>
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="espessura">Espessura</label>
          <input className = "inputRepasse" id="espessura" type="number" placeholder="Espessura" value={espessuraAut} onChange={(e) => setEspessuraAut(e.target.value)} />
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="largura">Largura</label>
          <input className = "inputRepasse"  id="largura" type="number" placeholder="Largura" value={larguraAut} onChange={(e => setLarguraAut(e.target.value))} />
        </div>
        <button className="clear-buttonRepasse" onClick={handleClear}>Limpar</button>
        <button className="voltar-buttonRepasse" onClick={() => navigate('/sequenciamento', { state: { filtroID } })}>Voltar</button>
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