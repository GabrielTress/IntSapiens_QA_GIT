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
  const [quantidade, setQuantidade] = useState('');
  const [linha, setLinha] = useState('');
  const [espessuraAut, setEspessuraAut] = useState('');
  const [larguraAut, setLarguraAut] = useState('');
  const navigate = useNavigate();
  var date = new Date(Date.now());

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

    //executar infotecnicas
    useEffect(() => {
      handleInfoTecnicas();
    }, []);


    useEffect(() => {
      const textMedidas = infoTecnicas?.WB_DESCPL || "";
      const partMedidas = textMedidas.split('X');
      if (partMedidas[0]) {
        const espessura = partMedidas[0].trim().replace("'", '').replace(',', '.');
        setEspessuraAut(espessura);
      }
      if (partMedidas[1]) {
        const largura = partMedidas[1].trim().replace("'", '').replace(',', '.');
        setLarguraAut(largura);
      }
    }, [infoTecnicas]); // só quando infoTecnicas mudar


  const handleClear = () => {
    setOp('');
    setPerfil('');
    setLinha('');
    setEspessuraAut('');
    setLarguraAut('');
    setQuantidadeTotal(0)
  };

  const [quantidadeTotal, setQuantidadeTotal] = useState(0);

  const linhaMap = {
    "19": "Pintura 1",
    "18": "Pintura 2"
  };


  useEffect(() => {
    if (linhaSelecionada?.wb_numRec) {
      const cod = linhaSelecionada?.wb_numRec;
      const linhaAuto = linhaMap[cod];
      if (linhaAuto) {
        setLinha(linhaAuto);
      }
    }
  }, [linhaSelecionada]);

  const perfilMap = {
    "600001": "Flat", // Último valor sempre que há duplicados
    "600002": "Split",
    "111111": "Split Macho",
    "222222": "Split Fêmea",
    "600003": "Crow",
    "600004": "Casing",
    "600005": "Boards",
    "600006": "Liners",
    "600007": "Lambril",
    "600008": "Stop",
    "600009": "Quarter Round",
    "600010": "Moldura Quadro", // último valor no caso de duplicados
    "600011": "Painel",
    "600012": "Base",
    "600013": "Stool",
    "600101": "Flat",
    "600102": "Split",
    "600103": "Crow",
    "600104": "Casing",
    "600105": "Boards",
    "600106": "Liners",
    "600107": "Lambril",
    "600108": "Stop",
    "600109": "Quarter Round",
    "600110": "Moldura Quadro",
    "600111": "Painel",
    "600112": "Base",
    "600113": "Stool",
    "600201": "MDF Flat",
    "600202": "MDF Split ",
    "600203": "MDF Crow",
    "600204": "MDF Casing",
    "600205": "MDF Boards",
    "600206": "MDF Liners",
    "600207": "MDF Lambril",
    "600208": "MDF Stop",
    "600209": "MDF Quarter Round",
    "600210": "MDF Moldura Quadro ",
    "600211": "MDF Painel",
    "600212": "MDF Base",
    "600213": "MDF Stool",
    "400": "Stop Aplicado Primed",
    "410": "Stop Aplicado Raw",
    "420": "Flat p/ Stop Primed",
    "430": "Flat p/ Stop Raw",
    "440": "Split Macho Primed",  
    "450": "Split Macho Raw",
    "460": "Split Fêmea Primed",
    "470": "Split Fêmea Raw"
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

    // VALIDA SE A OP É PERFILADA
    const validaPerfilado = async (op) => {
      try {
        const response = await axios.get('http://192.168.0.250:9002/consultaPerfiladeira11', {
          params: { wb_numOrp: op } // ← importante: nome do parâmetro deve ser wb_numOrp
        });
  
        const encontrado = response.data.some(item => item.WB_NUMORP == op);
        return encontrado;
      } catch (error) {
        console.error('Erro ao buscar:', error);
        return false;
      }
    };
      // Só consulta quando `op` muda
  useEffect(() => {
    const verificar = async () => {
      if (op) {
        const isPerfilada = await validaPerfilado(op);
        setQuantidade(isPerfilada ? 2 : 1);
      }
    };

    verificar();
  }, [op]); // ← escuta mudanças na OP


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
  const btt18 = "RESSALTO EMENDA FINGER";
  const btt19 = "OUTROS";

 


  const handleButtonClick = (buttonNumber) => {

    if (buttonNumber === 1 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt1,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
       setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });

    } else if (buttonNumber === 2 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt2,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 3 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt3,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 4 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt4,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 5 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt5,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 6 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt6,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }
    else if (buttonNumber === 7 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt7,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 8 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt8,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 9 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt9,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 10 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt10,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 11 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt11,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 12 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt12,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 13 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt13,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 14 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt14,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    }else if (buttonNumber === 15 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt15,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 16 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt16,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 17 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt17,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 18 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt18,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
        
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      });
      
    } else if (buttonNumber === 19 && op !== "" && perfil !== "" && espessuraAut !== "" && larguraAut !== "" && linha !== "") {
      Axios.post("http://192.168.0.250:9002/Repasse", {
        op: op,
        motivo: btt18,
        data: moment(date).format('DD-MM-YYYY HH:mm:ss'),
        quantidade: quantidade,
        perfil: perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(),
        recurso: linha,
        tipo_Apt: 'REPASSE'
      }).then((response) => {
        toast.success('Apontamento OK', {
          position: "bottom-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'custom-toast-sucess',
        });
        
      // Atualizar a quantidade total após a inserção
      setQuantidadeTotal(response.data.quantidadeTotal);
      }).catch((err) => {
        console.log(err);
      })
    }
    
    else{
        toast.error('Preencher todos os valores!', {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        className: 'custom-toast-error',
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
              disabled
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
          <input className = "inputRepasse" id="espessura" type="number" placeholder="Espessura" value={espessuraAut} disabled onChange={(e) => setEspessuraAut(e.target.value)} />
        </div>
        <div>
          <label className = "labelRepasse" htmlFor="largura">Largura</label>
          <input className = "inputRepasse"  id="largura" type="number" placeholder="Largura" value={larguraAut} disabled onChange={(e => setLarguraAut(e.target.value))} />
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
        <button className = "buttonRepasse" onClick={() => handleButtonClick(19)}>{btt19}</button>
      </div>
      <div className="label-container">
        <label className = "labelRepasse">A OP {op} possui {quantidadeTotal} peças apontadas.</label>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Repasse;