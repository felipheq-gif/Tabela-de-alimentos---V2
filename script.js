// Banco de Alimentos Customizado (Com a Bebida Láctea)
const alimentosIniciais = [
  { id: 'pao', nome: 'Pão Francês', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'tapioca', nome: 'Tapioca', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'macarrao', nome: 'Macarrão', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'arroz', nome: 'Arroz Branco', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'feijao', nome: 'Feijão Carioca', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'batata_doce', nome: 'Batata Doce', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'aveia', nome: 'Aveia em Flocos', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'banana', nome: 'Banana', cat: 'carbo', emEstoque: true, historico: [] },
  { id: 'farinha_lactea', nome: 'Farinha Láctea', cat: 'carbo', limiteSemanal: 2, emEstoque: true, historico: [] },
  { id: 'mucilon', nome: 'Mucilon', cat: 'carbo', limiteSemanal: 2, emEstoque: true, historico: [] },
  { id: 'bebida_lactea', nome: 'Bebida Láctea Morango', cat: 'carbo', emEstoque: true, historico: [] },
  
  { id: 'frango', nome: 'Peito de Frango', cat: 'proteina', emEstoque: true, historico: [] },
  { id: 'carne_moida', nome: 'Carne Moída', cat: 'proteina', emEstoque: true, historico: [] },
  { id: 'ovos', nome: 'Ovo Inteiro', cat: 'proteina', emEstoque: true, historico: [] },
  { id: 'leite', nome: 'Leite Integral', cat: 'proteina', emEstoque: true, historico: [] },
  { id: 'iogurte', nome: 'Iogurte Natural', cat: 'proteina', emEstoque: true, historico: [] },
  { id: 'creatina', nome: 'Creatina', cat: 'proteina', emEstoque: true, historico: [] },
  
  { id: 'leite_po', nome: 'Leite em Pó', cat: 'gordura', emEstoque: true, historico: [] },
  { id: 'chia', nome: 'Semente de Chia', cat: 'gordura', emEstoque: true, historico: [] }
];

let alimentos = JSON.parse(localStorage.getItem('meuEstoqueOficial')) || alimentosIniciais;
let cardapioDoDia = JSON.parse(localStorage.getItem('cardapioDoDia')) || null;

function pegarDataDeHoje() { return new Date().toLocaleDateString('pt-BR'); }
function salvarEstoque() { localStorage.setItem('meuEstoqueOficial', JSON.stringify(alimentos)); }
function salvarCardapio() { localStorage.setItem('cardapioDoDia', JSON.stringify(cardapioDoDia)); }

// ===== Calorias por alimento =====
// Cada alimento guarda a unidade ('g', 'ml' ou 'un'), as calorias (porcaoKcal) e a quantidade
// necessária para atingir essas calorias (porcaoQtd). Ex.: 200 kcal = 200 g  ->  1 kcal por g.
const UND_PADRAO = { pao: 'un', ovos: 'un', leite: 'ml', bebida_lactea: 'ml' };
const KCAL_PADRAO = { // kcal por 1 g, 1 ml ou 1 un (alimentos que já vinham no app)
  pao: 145, tapioca: 2.4, macarrao: 1.5, arroz: 1.3, feijao: 0.76, batata_doce: 0.86,
  aveia: 3.8, banana: 0.89, farinha_lactea: 3.8, mucilon: 3.8, bebida_lactea: 0.555,
  frango: 1.65, carne_moida: 2.5, ovos: 72, leite: 0.6, iogurte: 0.58, creatina: 0,
  leite_po: 5.0, chia: 4.66
};
function undDe(a) { return (a && a.unidade) || UND_PADRAO[a && a.id] || 'g'; }
function undTexto(a) { return undDe(a) === 'un' ? ' un.' : undDe(a); }
function kcalPorUn(a) { return (a && a.porcaoQtd > 0) ? (a.porcaoKcal || 0) / a.porcaoQtd : 0; }
function kcalDe(a, qtd) { return kcalPorUn(a) * qtd; }
function rotuloPorcao(a) {
  const n = v => Number((v || 0).toFixed(1));
  return `${n(a.porcaoKcal)} kcal = ${n(a.porcaoQtd)}${undTexto(a)}`;
}

// Converte alimentos salvos no formato antigo (kcal e macros "por 100 g") para o novo.
function migrarAlimentos() {
  let mudou = false;
  alimentos.forEach(a => {
    if (a.porcaoQtd > 0) return;
    const un = undDe(a) === 'un';
    a.unidade = undDe(a);
    a.porcaoQtd = un ? 1 : 100;
    a.porcaoKcal = a.kcal100g ? (un ? a.kcal100g / 2 : a.kcal100g) : (KCAL_PADRAO[a.id] || 0) * a.porcaoQtd; // 1 un ~ 50 g
    [['prot', 'porcaoProt'], ['carbo', 'porcaoCarbo'], ['gord', 'porcaoGord']].forEach(([velho, novo]) => {
      const v = a[velho + '100g'];
      a[novo] = (v != null) ? (un ? v / 2 : v) : null;
      delete a[velho + '100g'];
    });
    delete a.kcal100g;
    mudou = true;
  });
  if (mudou) salvarEstoque();
}
migrarAlimentos();

function podeConsumirHoje(item) {
  if (!item.limiteSemanal) return true; 
  const hoje = pegarDataDeHoje();
  if (item.historico && item.historico.includes(hoje)) return true; 
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const consumosRecentes = (item.historico || []).filter(d => {
    const p = d.split('/');
    if(p.length === 3) return new Date(p[2], p[1] - 1, p[0]) >= seteDiasAtras;
    return false;
  });
  return consumosRecentes.length < item.limiteSemanal;
}

function carregarEstoque() {
  const container = document.getElementById('lista-estoque');
  const selectAvulso = document.getElementById('select-avulso');
  
  if(container) container.innerHTML = '';
  if(selectAvulso) selectAvulso.innerHTML = '<option value="" disabled selected>Escolha o alimento...</option>';

  alimentos.forEach(item => {
    if(container) {
      const label = document.createElement('label');
      label.className = 'item-checkbox';
      const limit = item.limiteSemanal ? `<small style="color: #fca5a5;"> (Máx ${item.limiteSemanal}x/sem)</small>` : '';
      label.innerHTML = `<input type="checkbox" id="${item.id}" ${item.emEstoque ? 'checked' : ''} onchange="alternarEstoque('${item.id}')"> <span>${item.nome} ${limit}<small style="display:block;color:#94a3b8;">${rotuloPorcao(item)}</small></span>`;
      container.appendChild(label);
    }
    if(selectAvulso) {
      selectAvulso.innerHTML += `<option value="${item.id}">${item.nome} (${undDe(item)})</option>`;
    }
  });
}

window.alternarEstoque = function(id) {
  const item = alimentos.find(a => a.id === id);
  if (item) { item.emEstoque = !item.emEstoque; salvarEstoque(); }
};

const formAlimento = document.getElementById('form-alimento');
if(formAlimento) {
  formAlimento.addEventListener('submit', function(e) {
    e.preventDefault();
    const limiteInput = document.getElementById('limite-alimento').value;
    const kcal = parseFloat(document.getElementById('kcal-porcao').value);
    const qtd = parseFloat(document.getElementById('qtd-porcao').value);
    if (isNaN(kcal) || kcal < 0 || isNaN(qtd) || qtd <= 0) {
      return alert('Informe as calorias e a quantidade necessária para atingi-las (maior que zero).');
    }
    const num = id => { const v = parseFloat(document.getElementById(id).value); return isNaN(v) ? null : v; };

    alimentos.push({
      id: 'custom_' + Date.now(),
      nome: document.getElementById('nome-alimento').value,
      cat: document.getElementById('cat-alimento').value,
      unidade: document.getElementById('und-alimento').value || 'g',
      porcaoKcal: kcal,
      porcaoQtd: qtd,
      porcaoProt: num('prot-porcao'),
      porcaoCarbo: num('carbo-porcao'),
      porcaoGord: num('gord-porcao'),
      limiteSemanal: limiteInput ? parseInt(limiteInput) : null,
      emEstoque: true,
      historico: []
    });
    salvarEstoque();
    carregarEstoque();
    this.reset();
  });
}

function atualizarDinamicaCardapio() {
  if (!cardapioDoDia) return;

  let deficitGerado = 0;
  let deficitAbsorvido = 0;
  let pendentesFlexiveis = 0;

  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.status === 'pulado') deficitGerado += item.baseKcal;
      if (item.status === 'consumido' && item.finalKcal !== null) deficitAbsorvido += (item.finalKcal - item.baseKcal);
      if (item.status === 'pendente' && (item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia' && !item.isAvulso) {
        pendentesFlexiveis++;
      }
    });
  });

  let deficitRestante = deficitGerado - deficitAbsorvido;
  let extraPorPendente = pendentesFlexiveis > 0 ? (deficitRestante / pendentesFlexiveis) : 0;

  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.status === 'pulado') {
        item.currentKcal = 0;
        item.currentQtd = 0;
      } else if (item.status === 'consumido') {
        item.currentKcal = item.finalKcal;
        item.currentQtd = item.finalQtd;
      } else { 
        if (item.idObj.startsWith('avulso_') || item.isAvulso) {
          item.currentKcal = item.avulsoKcal || 0;
          item.currentQtd = item.avulsoQtd || 0;
        } else if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia') {
          item.currentKcal = Math.max(0, item.baseKcal + extraPorPendente);
          item.currentQtd = item.baseKcal > 0 ? item.baseQtd * (item.currentKcal / item.baseKcal) : 0;
        } else {
          item.currentKcal = item.baseKcal;
          item.currentQtd = item.baseQtd;
        }
      }
    });
  });
}

function gerarMenuDinamico() {
  try {
    const disponiveis = alimentos.filter(a => a.emEstoque && podeConsumirHoje(a));
    const pegar = (id) => disponiveis.find(a => a.id === id);
    const pegarSub = (cat, ignorar) => disponiveis.find(a => a.cat === cat && a.id !== ignorar);

    const carboManha = pegar('pao') || pegar('tapioca') || pegar('aveia') || pegar('batata_doce') || pegar('banana') || pegarSub('carbo');
    const protManha = pegar('ovos') || pegar('leite') || pegar('iogurte') || pegar('frango') || pegarSub('proteina');
    
    const carboPrinc = pegar('arroz') || pegar('macarrao') || pegar('batata_doce') || pegarSub('carbo');
    const protPrinc = pegar('frango') || pegar('carne_moida') || pegar('ovos') || pegarSub('proteina');
    const leguminosa = pegar('feijao');
    
    const liqVit = pegar('leite') || pegar('iogurte') || null;
    const fruVit = pegar('banana') || pegar('aveia');
    const extVit = pegar('farinha_lactea') || pegar('mucilon') || null;
    const temAveia = pegar('aveia');
    const temLeitePo = pegar('leite_po');
    const temChia = pegar('chia');
    const temCrea = pegar('creatina');
    
    // Variáveis da Ceia Restauradas!
    const bebidaLactea = pegar('bebida_lactea');
    const leiteCeia = pegar('leite');
    const iogurteCeia = pegar('iogurte');
    const batataCeia = pegar('batata_doce');
    const aveiaCeia = pegar('aveia');
    const bananaCeia = pegar('banana');

    if (!carboPrinc || !protPrinc || !carboManha || !protManha) {
      document.getElementById('conteudo-menu').innerHTML = '<p style="color:#ef4444; text-align:center;">⚠️ Falta proteína ou carboidrato marcado no estoque para gerar o cardápio!</p>';
      return;
    }

    const criarItem = (idA, nome, qtdBase, und, kcalBase) => {
      return { 
        idObj: Math.random().toString(36).substr(2, 9), 
        idAlimento: idA, 
        nome: nome, 
        baseQtd: qtdBase, 
        und: und, 
        baseKcal: kcalBase, 
        currentQtd: qtdBase,
        currentKcal: kcalBase,
        finalKcal: null,
        finalQtd: null,
        status: 'pendente'
      };
    };

    // As calorias de cada item vêm do próprio alimento (kcal ÷ quantidade cadastrada).
    // "q" é a quantidade usual no cardápio; se a unidade do alimento foi alterada, usa a quantidade cadastrada.
    const novoItem = (a, q, nome) => {
      const qtd = (q != null && undDe(a) === (UND_PADRAO[a.id] || 'g')) ? q : a.porcaoQtd;
      return criarItem(a.id, nome || a.nome, qtd, undTexto(a), kcalDe(a, qtd));
    };
    // Para alimentos sem quantidade fixa no cardápio: calcula a quantidade que entrega cerca de "kcal" calorias.
    const itemPorKcal = (a, kcal) => {
      const kpu = kcalPorUn(a);
      if (!(kpu > 0)) return novoItem(a);
      const q = kcal / kpu;
      const qtd = undDe(a) === 'un' ? Math.max(0.5, Math.round(q * 2) / 2) : Math.max(5, Math.round(q / 5) * 5);
      return criarItem(a.id, a.nome, qtd, undTexto(a), kcalDe(a, qtd));
    };
    const achar = (id) => alimentos.find(a => a.id === id);

    const QTD_CAFE_CARBO = { pao: 2, tapioca: 100, aveia: 60, batata_doce: 200, banana: 150 };
    const QTD_CAFE_PROT = { ovos: 3, iogurte: 200, frango: 100, leite: 300 };

    let itensCafeArray = [];
    if (carboManha) itensCafeArray.push(novoItem(carboManha, QTD_CAFE_CARBO[carboManha.id]));
    if (protManha) itensCafeArray.push(novoItem(protManha, QTD_CAFE_PROT[protManha.id]));

    let itensCeiaArray = [];
    const compCeia = aveiaCeia ? novoItem(aveiaCeia, 40) : (bananaCeia ? novoItem(bananaCeia, 100) : null);
    if (bebidaLactea) {
      itensCeiaArray.push(novoItem(bebidaLactea, 200));
      const c = compCeia || (batataCeia ? novoItem(batataCeia, 100) : null);
      if (c) itensCeiaArray.push(c);
    } else if (leiteCeia) {
      itensCeiaArray.push(novoItem(leiteCeia, 200));
      if (compCeia) itensCeiaArray.push(compCeia);
    } else if (iogurteCeia) {
      itensCeiaArray.push(novoItem(iogurteCeia, 170));
      if (compCeia) itensCeiaArray.push(compCeia);
    } else {
      const ov = achar('ovos'), bd = achar('batata_doce');
      if (ov) itensCeiaArray.push(novoItem(ov, 2));
      if (bd) itensCeiaArray.push(novoItem(bd, 150));
    }

    // Colação: lanche leve entre o café da manhã e o almoço (evita repetir o que já está no café)
    const usadosCafe = [carboManha && carboManha.id, protManha && protManha.id];
    const itensColacao = [];
    for (const [id, q] of [['banana', 150], ['iogurte', 170], ['leite', 200]]) {
      const a = pegar(id);
      if (a && itensColacao.length < 2 && !usadosCafe.includes(id)) itensColacao.push(novoItem(a, q));
    }

    // Almoço e jantar: arroz/macarrão e frango/ovos têm quantidade fixa; os demais entram pela caloria (~390 e ~297 kcal)
    const refeicaoPrincipal = () => [
      ['arroz', 'macarrao'].includes(carboPrinc.id) ? novoItem(carboPrinc, carboPrinc.id === 'macarrao' ? 250 : 300) : itemPorKcal(carboPrinc, 390),
      ...(leguminosa ? [novoItem(leguminosa, 150)] : []),
      ['frango', 'ovos'].includes(protPrinc.id) ? novoItem(protPrinc, protPrinc.id === 'ovos' ? 4 : 180) : itemPorKcal(protPrinc, 297)
    ];

    const tempCardapio = {
      data: pegarDataDeHoje(),
      refeicoes: [
        {
          nome: "Café da Manhã",
          itens: itensCafeArray
        },
        ...(itensColacao.length ? [{
          nome: "Colação",
          itens: itensColacao
        }] : []),
        {
          nome: "Almoço",
          itens: refeicaoPrincipal()
        },
        {
          nome: "Café da Tarde (Vitamina)",
          itens: [
            ...(liqVit ? [novoItem(liqVit, 300)] : []),
            ...(fruVit ? [novoItem(fruVit, fruVit.id === 'banana' ? 100 : 30)] : []),
            ...(temAveia ? [novoItem(temAveia, 40)] : []),
            ...(extVit ? [novoItem(extVit, 40)] : []),
            ...(temLeitePo ? [novoItem(temLeitePo, 20)] : []),
            ...(temChia ? [novoItem(temChia, 20)] : []),
            ...(temCrea ? [novoItem(temCrea, 3)] : [])
          ]
        },
        {
          nome: "Jantar",
          itens: refeicaoPrincipal()
        },
        ...(itensCeiaArray.length ? [{
          nome: "Ceia",
          itens: itensCeiaArray
        }] : [])
      ]
    };

    let totalOvos = 0;
    tempCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => { if (item.idAlimento === 'ovos' && item.und === ' un.') totalOvos += item.baseQtd; });
    });

    if (totalOvos > 4) {
      let excessoOvos = totalOvos - 4;
      let kcalPerdidaOvos = 0;
      
      tempCardapio.refeicoes.forEach(ref => {
        ref.itens.forEach(item => {
          if (item.idAlimento === 'ovos' && item.und === ' un.' && excessoOvos > 0) {
            const kcalPorOvo = item.baseQtd > 0 ? item.baseKcal / item.baseQtd : 0;
            let reducao = Math.min(item.baseQtd, excessoOvos);
            item.baseQtd -= reducao;
            item.baseKcal -= reducao * kcalPorOvo;
            kcalPerdidaOvos += reducao * kcalPorOvo;
            item.currentQtd = item.baseQtd;
            item.currentKcal = item.baseKcal;
            excessoOvos -= reducao;
          }
        });
      });

      let itensFlex = [];
      tempCardapio.refeicoes.forEach(ref => {
        ref.itens.forEach(item => {
          if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia') itensFlex.push(item);
        });
      });

      if (itensFlex.length > 0) {
        let extra = kcalPerdidaOvos / itensFlex.length;
        itensFlex.forEach(item => {
          item.baseKcal += extra;
          item.baseQtd = item.baseQtd * (item.baseKcal / (item.baseKcal - extra));
        });
      }
    }

    let somaBase = 0;
    let qtdFlex = 0;
    tempCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => {
        somaBase += item.baseKcal;
        if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia') qtdFlex++;
      });
    });

    const META_DIARIA = (typeof pegarMeta === 'function') ? pegarMeta() : 3300;
    if (somaBase !== META_DIARIA && qtdFlex > 0) {
      let deficit = META_DIARIA - somaBase;
      let extraPorFlex = deficit / qtdFlex;
      tempCardapio.refeicoes.forEach(ref => {
        ref.itens.forEach(item => {
          if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia') {
            item.baseKcal += extraPorFlex;
            item.baseQtd = item.baseQtd * (item.baseKcal / (item.baseKcal - extraPorFlex));
          }
        });
      });
    }

    tempCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => {
        item.finalKcal = item.baseKcal;
        item.finalQtd = item.baseQtd;
      });
    });

    cardapioDoDia = tempCardapio;
    atualizarDinamicaCardapio();
    salvarCardapio();
    renderizarCardapio();
    
  } catch (erro) {
    console.error("Falha no motor do Cardápio:", erro);
    alert("Houve um erro no motor do cardápio! Confira o console.");
  }
}

function renderizarCardapio() {
  if (!cardapioDoDia || cardapioDoDia.data !== pegarDataDeHoje()) return;
  const container = document.getElementById('conteudo-menu');
  if(!container) return;
  
  let deficitGerado = 0;
  let deficitAbsorvido = 0;
  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.status === 'pulado') deficitGerado += item.baseKcal;
      if (item.status === 'consumido' && item.finalKcal !== null) deficitAbsorvido += (item.finalKcal - item.baseKcal);
    });
  });
  let extraRestanteVisual = deficitGerado - deficitAbsorvido;

  let totalKcalDia = 0;
  let kcalConsumidas = 0;
  let html = '';

  cardapioDoDia.refeicoes.forEach((ref, index) => {
    let kcalRefeicao = 0;
    let itensHtml = '';

    ref.itens.forEach(item => {
      if (item.status !== 'pulado') {
        kcalRefeicao += item.currentKcal;
        totalKcalDia += item.currentKcal;
      }
      if (item.status === 'consumido') {
        kcalConsumidas += item.currentKcal;
      }

      const qtdFormatada = (item.und === 'g' || item.und === 'ml') ? Math.round(item.currentQtd) : Number(item.currentQtd.toFixed(1));
      const isCons = item.status === 'consumido';
      const isPula = item.status === 'pulado';

      const mostraSetaCima = item.status === 'pendente' && extraRestanteVisual > 0.5 && (item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia' && !item.isAvulso;
      const mostraSetaBaixo = item.status === 'pendente' && extraRestanteVisual < -0.5 && (item.und === 'g' || item.und === 'ml') && item.baseKcal > 0 && item.idAlimento !== 'chia' && !item.isAvulso;
      const icone = mostraSetaCima ? '📈' : (mostraSetaBaixo ? '📉' : '');

      itensHtml += `
        <li class="refeicao-item ${isCons ? 'consumido' : ''} ${isPula ? 'pulado' : ''}">
          <span style="flex:1;">• ${qtdFormatada}${item.und} de ${item.nome} ${icone}</span>
          <div class="acoes-item">
            <button class="btn-acao ${isCons ? 'ativo-sim' : ''}" onclick="mudarStatusItem('${item.idObj}', 'consumido')" title="Comi">✅</button>
            <button class="btn-acao ${isPula ? 'ativo-nao' : ''}" onclick="mudarStatusItem('${item.idObj}', 'pulado')" title="Vou Pular">❌</button>
          </div>
        </li>
      `;
    });

    html += `
      <div class="refeicao-card">
        <h3>Refeição ${index + 1}: ${ref.nome} (~${Math.round(kcalRefeicao)} kcal)</h3>
        <ul>${itensHtml}</ul>
      </div>
    `;
  });

  const projecaoEl = document.getElementById('projecao-texto');
  if(projecaoEl) projecaoEl.innerHTML = `Consumidas: <strong>~${Math.round(kcalConsumidas)} kcal</strong> | Total Projetado: <strong>~${Math.round(totalKcalDia)} kcal</strong>`;
  
  const alertaEl = document.getElementById('alertas-sistema');
  if (alertaEl) {
    if (extraRestanteVisual > 0.5) {
      alertaEl.innerHTML = `<p style="font-size: 12px; color: #fbbf24; margin-top: 6px;">⚠️ Recalculando... Itens pendentes 📈 absorveram o alimento pulado!</p>`;
    } else if (extraRestanteVisual < -0.5) {
      alertaEl.innerHTML = `<p style="font-size: 12px; color: #38bdf8; margin-top: 6px;">ℹ️ Consumo extra adicionado. Itens pendentes 📉 foram reduzidos para manter a meta.</p>`;
    } else {
      alertaEl.innerHTML = '';
    }
  }

  container.innerHTML = html;
}

window.mudarStatusItem = function(idObj, novoStatus) {
  let targetItem = null;
  cardapioDoDia.refeicoes.forEach(ref => ref.itens.forEach(item => { if (item.idObj === idObj) targetItem = item; }));
  if (!targetItem) return;

  if (targetItem.status === novoStatus) {
    targetItem.status = 'pendente';
    targetItem.finalKcal = null;
    targetItem.finalQtd = null;
  } else {
    if (targetItem.status === 'pulado' && novoStatus === 'consumido') {
      targetItem.status = 'pendente';
      atualizarDinamicaCardapio(); 
    }

    if (novoStatus === 'consumido') {
      targetItem.finalKcal = targetItem.currentKcal;
      targetItem.finalQtd = targetItem.currentQtd;
      
      const alimentoOriginal = alimentos.find(a => a.id === targetItem.idAlimento);
      if (alimentoOriginal && !alimentoOriginal.historico.includes(pegarDataDeHoje())) {
        alimentoOriginal.historico.push(pegarDataDeHoje());
        salvarEstoque();
      }
    } else {
      targetItem.finalKcal = null;
      targetItem.finalQtd = null;
    }
    targetItem.status = novoStatus;
  }

  atualizarDinamicaCardapio();
  salvarCardapio();
  renderizarCardapio(); 
};

const btnAvulso = document.getElementById('btn-add-avulso');
if (btnAvulso) {
  btnAvulso.addEventListener('click', function() {
    if (!cardapioDoDia) return alert("Gere o menu do dia primeiro!");

    const selectEl = document.getElementById('select-avulso');
    const qtdEl = document.getElementById('qtd-avulso');
    
    if(!selectEl || !qtdEl) return;

    const id = selectEl.value;
    const qtd = parseFloat(qtdEl.value);
    
    if (!id || isNaN(qtd) || qtd <= 0) return alert("Preencha o alimento e a quantidade corretamente.");

    const alimento = alimentos.find(a => a.id === id);
    const kcalReal = kcalDe(alimento, qtd);
    const und = undTexto(alimento);

    let refAvulsa = cardapioDoDia.refeicoes.find(r => r.nome === "Refeições Extras (Avulsos)");
    if (!refAvulsa) {
      refAvulsa = { nome: "Refeições Extras (Avulsos)", itens: [] };
      cardapioDoDia.refeicoes.push(refAvulsa);
    }

    refAvulsa.itens.push({
      idObj: 'avulso_' + Date.now(),
      idAlimento: id,
      nome: alimento.nome,
      baseQtd: 0,
      und: und,
      baseKcal: 0,
      avulsoQtd: qtd,       
      avulsoKcal: kcalReal, 
      currentQtd: qtd,
      currentKcal: kcalReal,
      finalQtd: qtd,
      finalKcal: kcalReal,
      status: 'consumido',
      isAvulso: true
    });

    qtdEl.value = '';
    atualizarDinamicaCardapio();
    salvarCardapio();
    renderizarCardapio();
  });
}

const btnGerar = document.getElementById('btn-gerar');
if (btnGerar) {
  btnGerar.addEventListener('click', gerarMenuDinamico);
}

window.onload = function() {
  carregarEstoque();
  if (cardapioDoDia && cardapioDoDia.data === pegarDataDeHoje()) {
    atualizarDinamicaCardapio();
    renderizarCardapio();
  }
};
