import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './pnc.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPrint } from 'react-icons/fa';


function ApontamentoPnc() {
  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || '';
const [op, setOp] = useState(linhaSelecionada?.wb_numOrp || '');
const [numProd, setNumProd] = useState(linhaSelecionada?.wb_numProd || '');
const [wb_numrec, setWb_NumRec] = useState(linhaSelecionada?.wb_numRec || '');
const [perfil, setPerfil] = useState('');
const [linha, setLinha] = useState('');
const [espessuraAut, setEspessuraAut] = useState('');
const [larguraAut, setLarguraAut] = useState('');
const [quantidade, setQuantidade] = useState(1);
const [quantidadeTotal, setQuantidadeTotal] = useState(0);
const [infoTecnicas, setInfoTecnicas] = useState(null);
const [motivos, setMotivos] = useState([]);
const navigate = useNavigate();
const [exibirQuantidade, setExibirQuantidade] = useState(false);
  


useEffect(() => {
  if (!linhaSelecionada) return;

  const handleObterMotivosPnc = async () => {
    try {
      const response = await axios.get(
        `http://192.168.0.250:9002/obterMotivosPnc/${linhaSelecionada.wb_numRec}`
      );

      const motivos = response.data.map(item => ({
        numRec: item.WB_NUMREC,
        motivo: item.WB_MOTIVO,
        tipoApt: item.WB_TPAPT
      }));

      setMotivos(motivos);

      // 🔑 REGRA: tipo de apontamento é único por numRec
      if (motivos.length > 0) {
        setExibirQuantidade(motivos[0].tipoApt !== 'MANUAL');
      }

    } catch (error) {
      console.error("Erro ao carregar motivos:", error);
    }
  };

  handleObterMotivosPnc();
}, [linhaSelecionada]);



useEffect(() => {
  if (!linhaSelecionada?.wb_numProd) return;

  axios
    .get(`http://192.168.0.250:9002/infoProdutos/${linhaSelecionada.wb_numProd}`)
    .then(res => setInfoTecnicas(res.data))
    .catch(err => console.error(err));
}, [linhaSelecionada]);

const extrairPrimeiroNumero = (texto) => {
  const match = texto.match(/(\d+[.,]?\d*)/);
  return match ? match[1].replace(',', '.') : '';
};

useEffect(() => {
  let textoMedidas = null;

  if (infoTecnicas?.WB_DESCPL) {
    textoMedidas = infoTecnicas.WB_DESCPL;
  } else if (
    linhaSelecionada.wb_numRec === '04' &&
    infoTecnicas?.WB_DESPRO
  ) {
    textoMedidas = infoTecnicas.WB_DESPRO;
  }

  if (!textoMedidas || !textoMedidas.includes('X')) return;

  const partes = textoMedidas.split('X');

  const espessura = extrairPrimeiroNumero(partes[0]);
  const largura   = extrairPrimeiroNumero(partes[1]);

  setEspessuraAut(espessura);
  setLarguraAut(largura);

}, [infoTecnicas]);





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
    "470": "Split Fêmea Raw",
    "300": "Blanks - Primed",
    "301": "Blanks - Primed D4 SO",
    "302": "Blanks - Primed SO",
    "303": "Blanks - Primed D4",
    "310": "Blanks - Raw",
    "311": "Blanks - Raw D4 SO",
    "312": "Blanks - Raw SO",
    "313": "Blanks - Raw D4",
    "320": "Blanks - Sólido com Nó",
    "330": "Blanks - Sólido sem Nó",
    "340": "Blanks - B/com Nó",
    "350": "Blanks - Painel",
    "351": "Blanks Painel - CD4",
    "352": "Blanks Painel - SO",
    "353": "Blanks Painel - SO CD4",
    "359": "Blanks Painel - B SO-Com Nó",
    
  };

useEffect(() => {
  if (!infoTecnicas?.WB_CODFAM) return;

  const perfilAuto = perfilMap[infoTecnicas.WB_CODFAM];
  if (perfilAuto) setPerfil(perfilAuto);
}, [infoTecnicas]);


const linhaMap = {
  "04": "Finger",
  "07": "Coladeira",
  "09": "Moldureira Omil",
  '11': "Perfiladeira",
  "14": "Moldureira Leadermac",
  "15": "Repartidora",
  "18": "Pintura 2",
  "19": "Pintura 1"
};

useEffect(() => {
  if (!linhaSelecionada?.wb_numRec) return;

  const linhaAuto = linhaMap[linhaSelecionada.wb_numRec];
  if (linhaAuto) setLinha(linhaAuto);
}, [linhaSelecionada]);



const validaPerfilado = async (op) => {
  try {
    const response = await axios.get(
      'http://192.168.0.250:9002/consultaPerfiladeira11',
      { params: { wb_numOrp: op } }
    );

    return response.data.some(item => item.WB_NUMORP == op);
  } catch {
    return false;
  }
};

useEffect(() => {
  if (!op) return;

  validaPerfilado(op).then(isPerfilada => {
    setQuantidade(isPerfilada ? 2 : 1);
  });
}, [op]);


const handleButtonClick = async (motivo) => {
  if (!op || !perfil || !espessuraAut || !larguraAut || !linha || linha === 'Finger' || !quantidade) {
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
    return;
  }

        function verificaValores() {
                if (!larguraAut) {
                    return 'Indefinido';
                }

                const largura = parseFloat(
                    String(larguraAut).replace(',', '.')
                );

                if (isNaN(largura)) {
                    return 'Indefinido';
                }

                const LagMax = 125.41;
                const LagMed = 88.9;

                if (largura > LagMax) {
                    return 'Largo';
                }

                if (largura < LagMed) {
                    return 'Estreito';
                }

        return 'Médio';
        }

  try {
    const response = await axios.post(
      'http://192.168.0.250:9002/Repasse',
      {
        op: linhaSelecionada?.wb_numOrp,
        motivo: motivo.motivo,
        data: moment().format('DD-MM-YYYY HH:mm:ss'),
        quantidade,
        perfil,
        espessura: espessuraAut,
        largura: larguraAut,
        status_largura: verificaValores(), // ✔ nome certo
        recurso: linha,
        tipo_Apt: 'PNC'
      }

      
    );
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
    setQuantidadeTotal(response.data.quantidadeTotal);
  } catch (error) {
    toast.error('Erro ao salvar PNC!', {
            position: "bottom-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            className: 'custom-toast-error',
          });
  }
  
};

const linhasDisponiveis = [
  'Finger 01',
  'Finger 02',
  'Coladeira',
  'Moldureira Omil',
  'Moldureira Leadermac',
  'Repartidora',
  'Perfiladeira',
  'Pintura 1',
  'Pintura 2'
];




return (
  <div className="containerPnc">
    <div className="input-containerPnc">

      {/* OP */}
      <div>
        <label className="labelPnc">OP</label>
        <input
          className="inputPnc"
          type="number"
          value={op}
          disabled
        />
      </div>

      {/* Perfil */}
      <div>
        <label className="labelPnc">Perfil</label>
        <input
          className="inputPnc"
          type="text"
          value={perfil}
          disabled
        />
      </div>

      {/* Linha */}
    <div>
  <label className="labelPnc">Linha</label>

  <select
    className="selectPnc"
    value={linha}
    onChange={(e) => setLinha(e.target.value)}
  >
    <option value="">Selecione a linha</option>

    {linhasDisponiveis.map((item, idx) => (
      <option key={idx} value={item}>
        {item}
      </option>
    ))}
  </select>
</div>

      {/* Espessura */}
      <div>
        <label className="labelPnc">Espessura</label>
        <input
          className="inputPnc"
          type="number"
          value={espessuraAut}
          onChange={(e => setEspessuraAut(e.target.value))}
          disabled
        />
      </div>

      {/* Largura */}
      <div>
        <label className="labelPnc">Largura</label>
        <input
          className="inputPnc"
          type="number"
          value={larguraAut}
          onChange={(e => setLarguraAut(e.target.value))}
          disabled
        />
      </div>

      {/* Quantidade */}
{exibirQuantidade && (
  <div>
    <label className="labelPnc">Quantidade</label>
    <input
      className="inputPnc"
      type="number"
      min="1"
      value={quantidade}
      onChange={(e) => setQuantidade(e.target.value)}
    />
  </div>
)}


      {/* Botões fixos */}

      <button
        className="voltar-buttonPnc"
        onClick={() => navigate('/sequenciamento', { state: { filtroID } })}
      >
        Voltar
      </button>
    </div>

    {/* ===========================
        BOTÕES DINÂMICOS (DB)
    =========================== */}
    <div className="button-containerPnc">
      {motivos.map((item, index) => (
        <button
          key={index}
          className="buttonPnc"
          onClick={() => handleButtonClick(item)}
        >
          {item.motivo}
        </button>
      ))}
    </div>
         <div className="label-container">
        <label className = "labelRepasse">A OP {op} possui {quantidadeTotal} peças apontadas.</label>
      </div>

    <ToastContainer />
  </div>
);



}

export default ApontamentoPnc;
