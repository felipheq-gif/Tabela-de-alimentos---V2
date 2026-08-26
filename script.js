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
  
  container.innerHTML = '';
  if(selectAvulso) selectAvulso.innerHTML = '<option value="" disabled selected>Escolha o alimento...</option>';

  alimentos.forEach(item => {
    const label = document.createElement('label');
    label.className = 'item-checkbox';
    const limit = item.limiteSemanal ? `<small style="color: #fca5a5;"> (Máx ${item.limiteSemanal}x/sem)</small>` : '';
    label.innerHTML = `<input type="checkbox" id="${item.id}" ${item.emEstoque ? 'checked' : ''} onchange="alternarEstoque('${item.id}')"> <span>${item.nome} ${limit}</span>`;
    container.appendChild(label);

    if(selectAvulso) selectAvulso.innerHTML += `<option value="${item.id}">${item.nome}</option>`;
  });
}

function alternarEstoque(id) {
  const item = alimentos.find(a => a.id === id);
  if (item) { item.emEstoque = !item.emEstoque; salvarEstoque(); }
}

document.getElementById('form-alimento').addEventListener('submit', function(e) {
  e.preventDefault();
  const limiteInput = document.getElementById('limite-alimento').value;
  const kcal100 = document.getElementById('kcal-100g').value;
  const prot100 = document.getElementById('prot-100g').value;
  const carbo100 = document.getElementById('carbo-100g').value;
  const gord100 = document.getElementById('gord-100g').value;

  alimentos.push({
    id: 'custom_' + Date.now(),
    nome: document.getElementById('nome-alimento').value,
    cat: document.getElementById('cat-alimento').value,
    kcal100g: kcal100 ? parseFloat(kcal100) : 0,
    prot100g: prot100 ? parseFloat(prot100) : 0,
    carbo100g: carbo100 ? parseFloat(carbo100) : 0,
    gord100g: gord100 ? parseFloat(gord100) : 0,
    limiteSemanal: limiteInput ? parseInt(limiteInput) : null,
    emEstoque: true,
    historico: []
  });
  salvarEstoque();
  carregarEstoque();
  this.reset();
});

// A MATEMÁTICA PRINCIPAL COM MEMÓRIA PARA AVULSOS
function atualizarDinamicaCardapio() {
  if (!cardapioDoDia) return;

  let deficitGerado = 0;
  let deficitAbsorvido = 0;
  let pendentesFlexiveis = 0;

  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.status === 'pulado') {
        deficitGerado += item.baseKcal;
      }
      if (item.status === 'consumido' && item.finalKcal !== null) {
        deficitAbsorvido += (item.finalKcal - item.baseKcal);
      }
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
  const disponiveis = alimentos.filter(a => a.emEstoque && podeConsumirHoje(a));
  const pegar = (id) => disponiveis.find(a => a.id === id);
  const pegarSub = (cat, ignorar) => disponiveis.find(a => a.cat === cat && a.id !== ignorar);

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
  
  const protCeia = pegar('iogurte') || pegar('ovos') || pegar('leite');
  const carboCeia = pegar('bebida_lactea') || pegar('batata_doce') || pegar('aveia') || pegar('banana');

  if (!carboPrinc || !protPrinc) {
    document.getElementById('conteudo-menu').innerHTML = '<p style="color:#ef4444;">Falta proteína ou carboidrato no estoque!</p>';
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

  let itensCeiaArray = [];
  const bebidaLactea = pegar('bebida_lactea');
  const leiteCeia = pegar('leite');
  const iogurteCeia = pegar('iogurte');
  const batataCeia = pegar('batata_doce');
  const aveiaCeia = pegar('aveia');
  const bananaCeia = pegar('banana');

  if (bebidaLactea) {
    let kcalBebida = 111;
    if (bebidaLactea.kcal100g) kcalBebida = (bebidaLactea.kcal100g * 200) / 100;
    itensCeiaArray.push(criarItem('bebida_lactea', bebidaLactea.nome, 200, 'ml', kcalBebida));
    if (aveiaCeia) itensCeiaArray.push(criarItem('aveia', 'Aveia em Flocos', 40, 'g', 152));
    else if (bananaCeia) itensCeiaArray.push(criarItem('banana', 'Banana', 100, 'g', 89)); // Atualizado para gramas
    else if (batataCeia) itensCeiaArray.push(criarItem('batata_doce', 'Batata Doce', 100, 'g', 86));
  } else if (leiteCeia) {
    itensCeiaArray.push(criarItem('leite', 'Leite Integral', 200, 'ml', 120));
    if (aveiaCeia) itensCeiaArray.push(criarItem('aveia', 'Aveia em Flocos', 40, 'g', 152));
    else if (bananaCeia) itensCeiaArray.push(criarItem('banana', 'Banana', 100, 'g', 89)); // Atualizado para gramas
  } else if (iogurteCeia) {
    itensCeiaArray.push(criarItem('iogurte', 'Iogurte Natural', 170, 'g', 100));
    if (aveiaCeia) itensCeiaArray.push(criarItem('aveia', 'Aveia em Flocos', 40, 'g', 152));
    else if (bananaCeia) itensCeiaArray.push(criarItem('banana', 'Banana', 100, 'g', 89)); // Atualizado para gramas
  } else {
    itensCeiaArray.push(criarItem('ovos', 'Ovo Inteiro', 2, ' un.', 144));
    itensCeiaArray.push(criarItem('batata_doce', 'Batata Doce', 150, 'g', 129));
  }

  const tempCardapio = {
    data: pegarDataDeHoje(),
    refeicoes: [
      {
        nome: "Café da Manhã",
        itens: [
          criarItem('pao', 'Pão Francês', 2, ' un.', 290),
          criarItem('ovos', 'Ovo Inteiro', 3, ' un.', 216)
        ]
      },
      {
        nome: "Almoço",
        itens: [
          criarItem(carboPrinc.id, carboPrinc.nome, carboPrinc.id === 'macarrao' ? 250 : 300, 'g', carboPrinc.id === 'macarrao' ? 375 : 390),
          ...(leguminosa ? [criarItem(leguminosa.id, leguminosa.nome, 150, 'g', 114)] : []),
          criarItem(protPrinc.id, protPrinc.nome, protPrinc.id === 'ovos' ? 4 : 180, protPrinc.id === 'ovos' ? ' un.' : 'g', protPrinc.id === 'ovos' ? 288 : 297)
        ]
      },
      {
        nome: "Café da Tarde (Vitamina)",
        itens: [
          ...(liqVit ? [criarItem(liqVit.id, liqVit.nome, 300, 'ml', liqVit.id === 'leite' ? 180 : 100)] : []),
          // Atualizado para gramas de forma flexível
          ...(fruVit ? [criarItem(fruVit.id, fruVit.nome, fruVit.id === 'banana' ? 100 : 30, 'g', fruVit.id === 'banana' ? 89 : 114)] : []),
          ...(temAveia ? [criarItem(temAveia.id, "Aveia", 40, 'g', 152)] : []),
          ...(extVit ? [criarItem(extVit.id, extVit.nome, 40, 'g', 152)] : []),
          ...(temLeitePo ? [criarItem(temLeitePo.id, temLeitePo.nome, 20, 'g', 100)] : []),
          ...(temChia ? [criarItem(temChia.id, temChia.nome, 20, 'g', 93)] : []),
          ...(temCrea ? [criarItem(temCrea.id, temCrea.nome, 3, 'g', 0)] : [])
        ]
      },
      {
        nome: "Jantar",
        itens: [
          criarItem(carboPrinc.id, carboPrinc.nome, carboPrinc.id === 'macarrao' ? 250 : 300, 'g', carboPrinc.id === 'macarrao' ? 375 : 390),
          ...(leguminosa ? [criarItem(leguminosa.id, leguminosa.nome, 150, 'g', 114)] : []),
          criarItem(protPrinc.id, protPrinc.nome, protPrinc.id === 'ovos' ? 4 : 180, protPrinc.id === 'ovos' ? ' un.' : 'g', protPrinc.id === 'ovos' ? 288 : 297)
        ]
      },
      {
        nome: "Ceia",
        itens: itensCeiaArray
      }
    ]
  };

  let totalOvos = 0;
  tempCardapio.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.idAlimento === 'ovos') totalOvos += item.baseQtd;
    });
  });

  if (totalOvos > 4) {
    let excessoOvos = totalOvos - 4;
    let kcalPerdidaOvos = excessoOvos * 72;
    
    tempCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => {
        if (item.idAlimento === 'ovos' && excessoOvos > 0) {
          let reducao = Math.min(item.baseQtd, excessoOvos);
          item.baseQtd -= reducao;
          item.baseKcal -= reducao * 72;
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

  const META_DIARIA = 3300;
  if (somaBase < META_DIARIA && qtdFlex > 0) {
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
}

function renderizarCardapio() {
  if (!cardapioDoDia || cardapioDoDia.data !== pegarDataDeHoje()) return;
  const container = document.getElementById('conteudo-menu');
  
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

  document.getElementById('projecao-texto').innerHTML = `Consumidas: <strong>~${Math.round(kcalConsumidas)} kcal</strong> | Total Projetado: <strong>~${Math.round(totalKcalDia)} kcal</strong>`;
  
  const alertaEl = document.getElementById('alertas-sistema');
  if (extraRestanteVisual > 0.5) {
    alertaEl.innerHTML = `<p style="font-size: 12px; color: #fbbf24; margin-top: 6px;">⚠️ Recalculando... Itens pendentes 📈 absorveram o alimento pulado!</p>`;
  } else if (extraRestanteVisual < -0.5) {
    alertaEl.innerHTML = `<p style="font-size: 12px; color: #38bdf8; margin-top: 6px;">ℹ️ Consumo extra adicionado. Itens pendentes 📉 foram reduzidos para manter a meta.</p>`;
  } else {
    alertaEl.innerHTML = '';
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

// Adição de Consumo Avulso com o Banco de Memória embutido
document.getElementById('btn-add-avulso').addEventListener('click', function() {
  if (!cardapioDoDia) return alert("Gere o menu do dia primeiro!");

  const id = document.getElementById('select-avulso').value;
  const qtd = parseFloat(document.getElementById('qtd-avulso').value);
  if (!id || isNaN(qtd) || qtd <= 0) return alert("Preencha o alimento e a quantidade corretamente.");

  const alimento = alimentos.find(a => a.id === id);
  
  const mapKcal = {
    pao: 145, tapioca: 2.4, macarrao: 1.5, arroz: 1.3, feijao: 0.76, batata_doce: 0.86,
    aveia: 3.8, banana: 0.89, farinha_lactea: 3.8, mucilon: 3.8, bebida_lactea: 0.555, // Banana atualizada para gramas
    frango: 1.65, carne_moida: 2.5, ovos: 72, leite: 0.6, iogurte: 0.58, creatina: 0,
    leite_po: 5.0, chia: 4.66
  };
  
  let kcalUnidade = alimento.kcal100g ? (alimento.kcal100g / 100) : (mapKcal[id] || 0);
  const isUnit = (id === 'pao' || id === 'ovos'); // Banana removida daqui
  const kcalReal = kcalUnidade * qtd; 
  const und = isUnit ? ' un.' : (id === 'leite' || id === 'bebida_lactea' ? 'ml' : 'g');

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

  document.getElementById('qtd-avulso').value = '';
  atualizarDinamicaCardapio();
  salvarCardapio();
  renderizarCardapio();
});

document.getElementById('btn-gerar').addEventListener('click', gerarMenuDinamico);
window.onload = function() {
  carregarEstoque();
  if (cardapioDoDia && cardapioDoDia.data === pegarDataDeHoje()) {
    atualizarDinamicaCardapio();
    renderizarCardapio();
  }
};
