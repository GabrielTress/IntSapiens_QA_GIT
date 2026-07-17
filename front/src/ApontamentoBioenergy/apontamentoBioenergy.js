import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './apontamentoBioenergy.css';
import axios from 'axios';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPrint } from 'react-icons/fa';

function ApontamentoBioenergy() {
  const location = useLocation();
  const linhaSelecionada = location.state?.linha;
  const filtroID = location.state?.filtroID || '';

  const [wb_numRec, setWb_numRec] = useState(linhaSelecionada?.wb_numRec || '');
  const [wb_numOrp, setWb_numOrp] = useState(linhaSelecionada?.wb_numOrp || '');
  const [wb_numEmp, setWb_numEmp] = useState(linhaSelecionada?.wb_numEmp || '');
  const [wb_numOri, setWb_numOri] = useState(linhaSelecionada?.wb_numOri || '');
  const [wb_numSeq, setWb_numSeq] = useState(linhaSelecionada?.wb_numSeq || '');
  const [wb_numProd, setWb_numProd] = useState(linhaSelecionada?.wb_numProd || '');
  const [wb_qtdPrev, setWb_qtdPrev] = useState(linhaSelecionada?.wb_qtdPrev || 0);
  const [wb_qtdSaldo, setWb_qtdSaldo] = useState(linhaSelecionada?.wb_qtdSaldo || '');
  const [wb_temFsc, setWb_temFsc] = useState(linhaSelecionada?.wb_temFsc || 0);
  const [wb_qtdProd, setWb_qtdProd] = useState('');
  const [quantidadeOutro, setQuantidadeOutro] = useState(null);

  const wb_process = 'N';
  const wb_dtApont = moment().format('DD-MM-YYYY HH:mm:ss');

  const navigate = useNavigate();
  const [operador, setOperador] = useState('');
  const [infoTecnicas, setInfoTecnicas] = useState(null);

  // Trava o botão "Apontar" durante o processamento (gerar SOAP + imprimir),
  // evitando cliques duplicados que gerariam mais de um lote/etiqueta no SOAP
  // enquanto a impressão anterior ainda não foi confirmada.
  const [processando, setProcessando] = useState(false);

  const handleVoltar = () => {
    navigate('/sequenciamento', { state: { filtroID } });
  };

  const handleConsumirComponentes = () => {
    navigate('/componentes', { state: { linha: linhaSelecionada, filtroID: wb_numRec } });
  };

  const validaOp = async () => {
    try {
      const response = await axios.get('http://192.168.0.250:9002/sequenciamento', {
        params: { wb_numEmp, wb_numRec, wb_numOrp, wb_numOri, wb_numSeq }
      });
      return response.data.some(item =>
        item.wb_numEmp === wb_numEmp &&
        item.wb_numRec === wb_numRec &&
        item.wb_numOrp === wb_numOrp &&
        item.wb_numOri === wb_numOri &&
        item.wb_numSeq === wb_numSeq
      );
    } catch (error) {
      console.error('Erro ao validar ID e OP:', error);
      return false;
    }
  };

  const [saldosOp, setSaldosOp] = useState({
    qtdPrev: 0,
    qtdProd: 0,
    saldo: 0
  });

  const carregarSaldos = async () => {
    try {
      const response = await axios.get('http://192.168.0.250:9002/saldosOp', {
        params: { wb_numEmp, wb_numRec, wb_numOrp, wb_numOri, wb_numSeq }
      });

      const data = response.data[0];

      setSaldosOp({
        qtdPrev: data.WB_QTDPREV,
        qtdProd: data.WB_QTDPROD,
        saldo: data.WB_QTDSALDO
      });
    } catch (error) {
      console.error('Erro ao carregar saldos:', error);
    }
  };

  useEffect(() => {
    carregarSaldos();
  }, []);

  useEffect(() => {
    if (!linhaSelecionada) return;
    const wb_numProdSelecionado = linhaSelecionada.wb_numProd;
    axios.get(`http://192.168.0.250:9002/infoProdutos/${wb_numProdSelecionado}`)
      .then(response => {
        setInfoTecnicas(response.data);
        setWb_temFsc(linhaSelecionada.wb_temFsc === 'S' ? 'FSC' : '');
      })
      .catch(error => console.error('Erro ao buscar informações técnicas:', error));
  }, [linhaSelecionada]);

  const verificarImpressora = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:9100/default?type=printer');
      const data = response.data;

      const impressoraValida =
        data?.deviceType === 'printer' &&
        data?.connection === 'usb' &&
        data?.manufacturer?.toLowerCase().includes('zebra');

      return impressoraValida; // TRUE se OK
    } catch (error) {
      console.error('Erro ao verificar impressora:', error);
      return false; // FALSE se erro
    }
  };

  const calcularTurno = () => {
    const hora = new Date().getHours();
    if (hora < 6) return 1;
    if (hora < 12) return 2;
    if (hora < 18) return 3;
    return 4;
  };

  /* ============================================================
     CHECKLIST DE QUALIDADE (DESATIVADO POR ENQUANTO)
     ------------------------------------------------------------
     Deixe este bloco pronto e comentado. Quando a integração do
     checklist estiver definida para o Bioenergy, basta:
       1) Descomentar os states e funções abaixo;
       2) Descomentar o bloco JSX do modal no final do componente;
       3) Trocar a chamada do botão "Apontar" de
          onClick={handleProcessarEtiqueta}
          para
          onClick={handleChecklistQualidade}
     O fluxo já foi deixado pronto para só gravar o checklist DEPOIS
     da confirmação real de impressão (mesmo padrão usado no
     ApontamentoFinger / ApontamentoColadeira).
  ============================================================ */

  // const [showChecklist, setShowChecklist] = useState(false);
  // const [itensChecklist, setitensChecklist] = useState(null);
  // const [respostas, setRespostas] = useState({});

  // const handleChecklistQualidade = () => {
  //   if (!operador) {
  //     toast.error('Falta preencher operador!', {
  //       position: "bottom-center",
  //       autoClose: 2000,
  //       className: 'custom-toast-error'
  //     });
  //     return;
  //   }

  //   if (!linhaSelecionada) return;

  //   const wb_numProdSelecionado = linhaSelecionada.wb_numProd;
  //   const wb_numRecSelecionado = linhaSelecionada.wb_numRec;

  //   axios.get(`http://192.168.0.250:9002/checklistqualidade/${wb_numProdSelecionado}/${wb_numRecSelecionado}`)
  //     .then(response => {
  //       setitensChecklist(response.data);
  //       setShowChecklist(true);
  //     })
  //     .catch(() => {
  //       toast.error('Produto sem inspeção cadastrada!', {
  //         position: "bottom-center",
  //         autoClose: 2500,
  //         className: 'custom-toast-error'
  //       });
  //     });
  // };

  // const handleResposta = (index, valor) => {
  //   setRespostas(prev => ({ ...prev, [index]: valor }));
  // };

  // const handleCancelarChecklist = () => {
  //   setShowChecklist(false);
  //   setRespostas({});
  // };

  // // Só é chamado DEPOIS que handleProcessarEtiqueta confirmar impressão (retorna true)
  // const gravarChecklist = async (retorno) => {
  //   const preenchido = itensChecklist.every((_, index) => {
  //     const resposta = respostas[index];
  //     return resposta !== undefined && resposta !== null && resposta !== '';
  //   });

  //   if (!preenchido) {
  //     toast.error("Preencha todos os campos do checklist!", {
  //       position: "bottom-center",
  //       autoClose: 2000,
  //       className: 'custom-toast-error'
  //     });
  //     return false;
  //   }

  //   try {
  //     const checklistComRespostas = itensChecklist.map((item, index) => ({
  //       parametro: item.WB_DESVER,
  //       alvo: item.WB_VLRALV,
  //       minimo: item.WB_VLRMIN,
  //       maximo: item.WB_VLRMAX,
  //       seqRot: item.WB_SEQROT,
  //       codEst: item.WB_CODEST,
  //       seqEin: item.WB_SEQPXI,
  //       seqEiv: item.WB_SEQVER,
  //       codPin: item.WB_CODINP,
  //       codRot: item.WB_CODROT,
  //       sitEin: 1,
  //       tipInp: 'I',
  //       sitAva: 'A',
  //       notEiv: 10,
  //       valorDigitado: respostas[index]
  //     }));

  //     await axios.post('http://192.168.0.250:9002/saveChecklistQualidadeFinger', {
  //       wb_numEmp,
  //       wb_numProd,
  //       wb_numRec,
  //       wb_numOrp,
  //       wb_numOri,
  //       wb_numEtq: retorno?.wb_numEtq,
  //       checklist: checklistComRespostas,
  //       wb_data: moment(wb_dtApont, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY'),
  //       wb_hora: moment(wb_dtApont, 'DD-MM-YYYY HH:mm:ss').format('HH:mm:ss'),
  //       wb_process,
  //       wb_nomeRec: wb_numRec,
  //       wb_operador: operador,
  //       operacao: 'I',
  //       dasIns: 'PRD',
  //       fasIns: 'PRD',
  //       sitEpi: 1,
  //       qtdRec: wb_qtdProd,
  //       codDer: 0,
  //     });

  //     return true;
  //   } catch (error) {
  //     toast.error("Erro ao gravar checklist!", {
  //       position: "bottom-center",
  //       autoClose: 2000,
  //       className: 'custom-toast-error'
  //     });
  //     return false;
  //   }
  // };

  /* ============================================================
     FIM DO BLOCO DE CHECKLIST (comentado)
  ============================================================ */

  /**
   * Verifica se já existe uma etiqueta gerada pelo SOAP para esta
   * OP/Recurso que ainda não foi confirmada como impressa
   * (WB_PROCESS = 'N' no backend). Se existir, ela deve ser reimpressa
   * em vez de gerar um novo lote no Sapiens.
   */
  const buscarPendencia = async () => {
    try {
      const response = await axios.get('http://192.168.0.250:9002/bioenergyPendente', {
        params: { wb_numEmp, wb_numOrp, wb_numRec }
      });
      if (response.data?.sucesso) {
        return response.data.pendente; // objeto com os dados já gerados, ou null
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar pendência de impressão:', error);
      return null;
    }
  };

  /**
   * Atualiza as quantidades da tela de sequenciamento (mesma rota usada
   * no ApontamentoFinger/ApontamentoColadeira). Assim como a confirmação
   * de impressão, só deve ser chamada DEPOIS que o printer.send confirmar
   * sucesso — senão o saldo do sequenciamento seria debitado mesmo que a
   * etiqueta nunca tenha sido impressa.
   */
  const apontarSequenciamento = async (quantidadeProduzida) => {
    try {
      await axios.post('http://192.168.0.250:9002/apontamento', {
        wb_numEmp,
        wb_numRec,
        wb_numOri,
        wb_numSeq,
        wb_numOrp,
        wb_numProd,
        wb_qtdProd: quantidadeProduzida,
        wb_qtdRef: 0,
        wb_dtApont,
        wb_process: 'N'
      });
    } catch (error) {
      // A etiqueta já foi impressa e confirmada nesse ponto — não desfazemos
      // nada, mas o operador/suporte precisa saber que o saldo do
      // sequenciamento pode não ter sido atualizado.
      console.error('Erro ao atualizar quantidades no sequenciamento:', error);
      toast.warn('Etiqueta impressa, mas houve falha ao atualizar o saldo do sequenciamento. Avise o suporte se isso persistir.', {
        position: "bottom-center",
        autoClose: 4000,
        className: 'custom-toast-error'
      });
    }
  };

  /**
   * Confirma no backend que a etiqueta foi realmente impressa
   * (WB_PROCESS = 'S'). Só deve ser chamada depois do printer.send
   * confirmar sucesso.
   */
  const confirmarImpressao = async (wb_numEtq) => {
    try {
      await axios.post('http://192.168.0.250:9002/bioenergyConfirmaImpressao', { wb_numEtq });
    } catch (error) {
      // Não bloqueia o fluxo do usuário, mas precisa ficar registrado:
      // a etiqueta foi impressa, porém a confirmação no banco falhou.
      // Isso deixaria o registro como "pendente" e, na próxima tentativa
      // para essa OP/Recurso, o sistema tentaria reimprimir em vez de
      // gerar uma nova — o que é seguro, só reimprime a mesma etiqueta.
      console.error('Erro ao confirmar impressão no backend:', error);
      toast.warn('Etiqueta impressa, mas houve falha ao confirmar no sistema. Avise o suporte se isso persistir.', {
        position: "bottom-center",
        autoClose: 4000,
        className: 'custom-toast-error'
      });
    }
  };

  /**
   * Gera o apontamento/etiqueta via integração SOAP.
   * ATENÇÃO: este endpoint executa uma transação REAL e IRREVERSÍVEL no
   * Sapiens (gera lote, número de etiqueta, vincula pedido/cliente).
   * Por isso, NUNCA deve ser chamada de novo para uma tentativa de
   * impressão que falhou — sempre checar buscarPendencia() antes.
   * O backend grava o registro local como WB_PROCESS = 'N' (pendente)
   * até que confirmarImpressao() seja chamada com sucesso.
   */
  const gerarEtiquetaSOAP = async (turno) => {
    const response = await axios.post(
      'http://192.168.0.250:9002/bioenergyApontamento',
      {
        codEmp: wb_numEmp,
        codOri: wb_numOri,
        numOrp: wb_numOrp,
        numRec: wb_numRec,
        qtdEtq: wb_qtdProd,
        turno,
        numProd: linhaSelecionada.wb_numProd,
        codDer: infoTecnicas.WB_CODDER
      }
    );

    return response.data;
  };

  /**
   * Envia o ZPL para a Zebra Browser Print e só resolve `true`
   * dentro do callback de sucesso do printer.send — ou seja,
   * só depois da confirmação real de impressão.
   */
  const imprimirEtiqueta = (retorno) => {
    return new Promise(async (resolve) => {
      let zpl;
      try {
        const response = await axios.post(
          'http://192.168.0.250:9002/printBioenergy',
          {
            wb_numOrp,
            wb_numProd,
            wb_qtdProd: retorno.wb_qtdProd,
            wb_codDer: retorno.wb_codDer,
            wb_codLot: retorno.wb_codLot,
            wb_codCli: retorno.wb_codCli,
            wb_nomCli: retorno.wb_nomCli,
            wb_desPro: infoTecnicas.WB_DESPRO,
            wb_numEtq: retorno.wb_numEtq,
            wb_numPed: retorno.wb_numPed
          },
          { responseType: 'text' }
        );
        zpl = response.data;
      } catch (error) {
        console.error('Erro ao gerar ZPL da etiqueta:', error);
        toast.error('Erro ao gerar dados de impressão da etiqueta.', {
          position: "bottom-center",
          autoClose: 2500,
          className: 'custom-toast-error'
        });
        return resolve(false);
      }

      if (!window.BrowserPrint) {
        toast.error('Zebra Browser Print não está disponível.', {
          position: "bottom-center",
          autoClose: 2000,
          className: 'custom-toast-error'
        });
        return resolve(false);
      }

      window.BrowserPrint.getDefaultDevice('printer', function (printer) {
        if (!printer) {
          toast.error('Nenhuma impressora Zebra encontrada.', {
            position: "bottom-center",
            autoClose: 2000,
            className: 'custom-toast-error'
          });
          return resolve(false);
        }

        printer.send(
          zpl,
          function () {
            toast.success(`Etiqueta ${retorno.wb_numEtq} enviada para impressão.`, {
              position: "bottom-center",
              autoClose: 2000,
              className: 'custom-toast-sucess'
            });
            resolve(true);
          },
          function (erro) {
            console.error('Erro ao imprimir:', erro);
            toast.error('Erro ao imprimir: ' + erro, {
              position: "bottom-center",
              autoClose: 2500,
              className: 'custom-toast-error'
            });
            resolve(false);
          }
        );
      });
    });
  };

  const handleProcessarEtiqueta = async () => {
    if (processando) return; // evita duplo clique enquanto já está processando

    try {
      setProcessando(true);

      const turno = calcularTurno();

      const validacaoOp = await validaOp();
      if (!validacaoOp) {
        toast.error('OP já finalizada ou não encontrada.', {
          position: "bottom-center",
          autoClose: 2000,
          className: 'custom-toast-error'
        });
        return;
      }

      const quantidadeOriginal = Number(wb_qtdPrev);
      const quantidadeProduzida = Number(wb_qtdProd || 0);
      const quantidadeJaProduzida = Number(linhaSelecionada?.wb_qtdProd || 0);
      const quantidadeTotal = quantidadeJaProduzida + quantidadeProduzida;

      if (!wb_numRec || !wb_numOrp || !operador || quantidadeProduzida <= 0) {
        toast.error('Falta preencher quantidade ou operador.', {
          position: "bottom-center",
          autoClose: 2500,
          className: 'custom-toast-error'
        });
        return;
      }

      if (quantidadeTotal > quantidadeOriginal * 1.1) {
        toast.error('Quantidade produzida ultrapassa 10% do permitido.', {
          position: "bottom-center",
          autoClose: 2500,
          className: 'custom-toast-error'
        });
        return;
      }

      // Verifica se a impressora está pronta ANTES de gerar o lote no SOAP.
      // Isso não elimina 100% o risco (a impressora pode falhar depois de
      // confirmada aqui), mas evita boa parte dos casos de gerar lote sem
      // impressora nenhuma conectada.
      const impressoraOk = await verificarImpressora();
      if (!impressoraOk) {
        toast.error('Zebra Browser Print não localizado!', {
          position: "bottom-center",
          autoClose: 2000,
          className: 'custom-toast-error'
        });
        return;
      }

      // Antes de gerar uma nova etiqueta no SOAP, verifica se já existe uma
      // etiqueta gerada e ainda não confirmada como impressa para esta
      // OP/Recurso (por exemplo, de uma tentativa anterior em que a
      // impressão falhou). Se existir, reimprime os MESMOS dados, sem
      // chamar o SOAP de novo — evita gerar um segundo lote no Sapiens.
      let retorno = await buscarPendencia();

      if (retorno) {
        toast.info(`Etiqueta ${retorno.wb_numEtq} já gerada e pendente de impressão. Reimprimindo...`, {
          position: "bottom-center",
          autoClose: 2500,
          className: 'custom-toast-error'
        });
      } else {
        retorno = await gerarEtiquetaSOAP(turno);

        if (!retorno?.sucesso) {
          toast.error(retorno?.mensagem || 'Erro ao gerar etiqueta.', {
            position: "bottom-center",
            autoClose: 3000,
            className: 'custom-toast-error'
          });
          return;
        }
      }

      const impressaoOk = await imprimirEtiqueta(retorno);

      if (!impressaoOk) {
        // Não faz nada além do toast de erro já disparado dentro de
        // imprimirEtiqueta(). A etiqueta continua pendente no backend
        // (WB_PROCESS = 'N') e será reimpressa automaticamente na
        // próxima tentativa (buscarPendencia() acima vai encontrá-la).
        return;
      }

      // Só confirma como impressa DEPOIS que o printer.send confirmou sucesso
      await confirmarImpressao(retorno.wb_numEtq);

      // Atualiza o saldo/quantidade na tela de sequenciamento — também só
      // depois da impressão confirmada, usando a quantidade que realmente
      // foi gerada/impressa (retorno.wb_qtdProd), não o campo do formulário
      await apontarSequenciamento(Number(retorno.wb_qtdProd));

      // ------------------------------------------------------------
      // CHECKLIST (desativado por enquanto). Quando integrado, o fluxo
      // ficará assim, chamado só depois de impressaoOk === true e da
      // confirmação de impressão:
      //
      // const checklistOk = await gravarChecklist(retorno);
      // if (!checklistOk) return;
      // ------------------------------------------------------------

      // Limpa o formulário e recarrega os saldos só depois de tudo confirmado
      //setWb_qtdProd('');
      setQuantidadeOutro(null);
      await carregarSaldos();

    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar etiqueta.', {
        position: "bottom-center",
        autoClose: 2500,
        className: 'custom-toast-error'
      });
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="container-apontamentoFinger">
      <h2>Apontamento Bioenergy</h2>
      <div className="selectRecurso">
        <h3>Operador:</h3>
        <select
          className="selectOperadorFinger"
          id="operador"
          value={operador}
          onChange={(e) => setOperador(e.target.value)}
        >
          <option value="">Selecione...</option>
          <option value="1">1 - CLAUDINEI</option>
          <option value="2">2 - JOZIEL</option>
          <option value="3">3 - BRUNO</option>
          <option value="5">5 - IGOR</option>
        </select>
        {/*<button className="button" onClick={handleConsumirComponentes}>
          Ler material usado
        </button>*/}
        <button className="button" onClick={handleVoltar}>
          Voltar
        </button>
        Qtd OP: {saldosOp.qtdPrev} | Produzido: {saldosOp.qtdProd} | Saldo: {saldosOp.saldo}
      </div>

      <div className="apontamento-container">
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
          <select
            className="form-input-select"
            id="quantidade"
            value={quantidadeOutro ? 'outro' : wb_qtdProd}
            onChange={(e) => {
              if (e.target.value === 'outro') {
                setQuantidadeOutro(true);
                setWb_qtdProd('');
              } else {
                setQuantidadeOutro(false);
                setWb_qtdProd(e.target.value);
              }
            }}
          >
            <option value="">Selecione...</option>
            <option value="1050">1050</option>
            <option value="1260">1260</option>
            <option value="outro">Outro</option>
          </select>

          {quantidadeOutro && (
            <input
              className="form-input"
              type="number"
              id="quantidadeOutro"
              placeholder="Digite a quantidade"
              value={wb_qtdProd}
              onChange={(e) => setWb_qtdProd(e.target.value)}
            />
          )}
        </div>

        <div className="button-container">
          <button
            className="button"
            onClick={handleProcessarEtiqueta}
            disabled={processando}
          >
            {processando ? 'Processando...' : 'Apontar'}
          </button>
          <button className="button" onClick={handleVoltar}>
            Voltar
          </button>
        </div>
      </div>

      {/* ============================================================
          MODAL DO CHECKLIST DE QUALIDADE (DESATIVADO POR ENQUANTO)
          ------------------------------------------------------------
          Descomentar junto com os states/funções de checklist acima
          quando a integração estiver pronta.
      ============================================================ */}
      {/*
      {showChecklist && (
        <div className="modal-container-checklist">
          <div className="modal-content-checklist">
            <h3>CheckList Qualidade</h3>

            <table className="tabela-checklist">
              <thead>
                <tr>
                  <th>Parâmetro</th>
                  <th>Resultado</th>
                  <th>Alvo</th>
                  <th>Mínimo</th>
                  <th>Máximo</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(itensChecklist) && itensChecklist.map((item, index) => (
                  <tr key={index}>
                    <td>{item.WB_DESVER}</td>
                    <td>
                      {item.WB_CODINP2 !== 'QUAL-LOTE' ? (
                        <input
                          type="number"
                          value={respostas[index] || ''}
                          onChange={(e) => handleResposta(index, e.target.value)}
                        />
                      ) : (
                        <div className="ok-nok-buttons">
                          <button
                            type="button"
                            className={respostas[index] === '10' ? 'selected' : ''}
                            onClick={() => handleResposta(index, '10')}
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            className={respostas[index] === '0' ? 'selected nok' : ''}
                            onClick={() => handleResposta(index, '0')}
                          >
                            NOK
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{item.WB_VLRALV}</td>
                    <td>{item.WB_VLRMIN}</td>
                    <td>{item.WB_VLRMAX}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="button-container-checklist">
              <button onClick={() => handleProcessarEtiqueta()}>Salvar</button>
              <button className="cancel-button" onClick={handleCancelarChecklist}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      */}

      <ToastContainer />
    </div>
  );
}

export default ApontamentoBioenergy;
