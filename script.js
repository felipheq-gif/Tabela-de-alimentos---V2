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
  container.innerHTML = '';
  alimentos.forEach(item => {
    const label = document.createElement('label');
    label.className = 'item-checkbox';
    const limit = item.limiteSemanal ? `<small style="color: #fca5a5;"> (Máx ${item.limiteSemanal}x/sem)</small>` : '';
    label.innerHTML = `<input type="checkbox" id="${item.id}" ${item.emEstoque ? 'checked' : ''} onchange="alternarEstoque('${item.id}')"> <span>${item.nome} ${limit}</span>`;
    container.appendChild(label);
  });
}

function alternarEstoque(id) {
  const item = alimentos.find(a => a.id === id);
  if (item) { item.emEstoque = !item.emEstoque; salvarEstoque(); }
}

document.getElementById('form-alimento').addEventListener('submit', function(e) {
  e.preventDefault();
  const limiteInput = document.getElementById('limite-alimento').value;
  const kcalInput = document.getElementById('kcal-alimento').value;
  
  alimentos.push({
    id: 'custom_' + Date.now(),
    nome: document.getElementById('nome-alimento').value,
    cat: document.getElementById('cat-alimento').value,
    kcalPorPorcao: kcalInput ? parseFloat(kcalInput) : 100,
    limiteSemanal: limiteInput ? parseInt(limiteInput) : null,
    emEstoque: true,
    historico: []
  });
  salvarEstoque();
  carregarEstoque();
  this.reset();
});

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
    return { idObj: Math.random().toString(36).substr(2, 9), idAlimento: idA, nome: nome, baseQtd: qtdBase, und: und, baseKcal: kcalBase, status: 'pendente' };
  };

  // Seleção Inteligente para a Ceia
  let itensCeiaArray = [];
  const bebidaLactea = pegar('bebida_lactea');
  const leiteCeia = pegar('leite');
  const iogurteCeia = pegar('iogurte');
  const batataCeia = pegar('batata_doce');
  const aveiaCeia = pegar('aveia');
  const bananaCeia = pegar('banana');

  if (bebidaLactea) {
    const kcalBebida = bebidaLactea.kcalPorPorcao || 111;
    itensCeiaArray.push(criarItem('bebida_lactea', bebidaLactea.nome, 200, 'ml', kcalBebida));
    if (aveiaCeia) itensCeiaArray.push(criarItem('aveia', 'Aveia em Flocos', 40, 'g', 152));
    else if (bananaCeia) itensCeiaArray.push(criarItem('banana', 'Banana', 1, ' un.', 80));
    else if (batataCeia) itensCeiaArray.push(criarItem('batata_doce', 'Batata Doce', 100, 'g', 86));
  } else if (leiteCeia) {
    itensCeiaArray.push(criarItem('leite', 'Leite Integral', 200, 'ml', 120));
    if (aveiaCeia) itensCeiaArray.push(criarItem('aveia', 'Aveia em Flocos', 40, 'g', 152));
    else if (bananaCeia) itensCeiaArray.push(criarItem('banana', 'Banana', 1, ' un.', 80));
  } else if (iogurteCeia) {
    itensCeiaArray.push(criarItem('iogurte', 'Iogurte Natural', 170, 'g', 100));
    if (aveiaCeia) itensCeiaArray.push(criarItem('aveia', 'Aveia em Flocos', 40, 'g', 152));
    else if (bananaCeia) itensCeiaArray.push(criarItem('banana', 'Banana', 1, ' un.', 80));
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
          criarItem(fruVit.id, fruVit.nome, 1, ' un.', 80),
          ...(temAveia ? [criarItem(temAveia.id, "Aveia", 40, 'g', 152)] : []),
          ...(extVit ? [criarItem(extVit.id, extVit.nome, 40, 'g', 152)] : []),
          ...(temLeitePo ? [criarItem(temLeitePo.id, temLeitePo.nome, 20, 'g', 100)] : []),
          ...(temChia ? [criarItem(temChia.id, temChia.nome, 15, 'g', 70)] : []),
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

  // RECURSO DE SEGURANÇA: Limite de no máximo 4 ovos por dia
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
          excessoOvos -= reducao;
        }
      });
    });

    let itensFlex = [];
    tempCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => {
        if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0) itensFlex.push(item);
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

  // CALIBRAGEM AUTOMÁTICA PARA CRAVAR 3.300 KCAL NO MÍNIMO
  let somaBase = 0;
  let qtdFlex = 0;
  tempCardapio.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      somaBase += item.baseKcal;
      if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0) qtdFlex++;
    });
  });

  const META_DIARIA = 3300;
  if (somaBase < META_DIARIA && qtdFlex > 0) {
    let deficit = META_DIARIA - somaBase;
    let extraPorFlex = deficit / qtdFlex;
    tempCardapio.refeicoes.forEach(ref => {
      ref.itens.forEach(item => {
        if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0) {
          item.baseKcal += extraPorFlex;
          item.baseQtd = item.baseQtd * (item.baseKcal / (item.baseKcal - extraPorFlex));
        }
      });
    });
  }

  cardapioDoDia = tempCardapio;
  salvarCardapio();
  renderizarCardapio();
}

function renderizarCardapio() {
  if (!cardapioDoDia || cardapioDoDia.data !== pegarDataDeHoje()) return;
  const container = document.getElementById('conteudo-menu');
  
  let deficitCaloricoPulados = 0;
  let itensParaAbsorver = 0;

  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.status === 'pulado') {
        deficitCaloricoPulados += item.baseKcal;
      } else if ((item.und === 'g' || item.und === 'ml') && item.baseKcal > 0) {
        itensParaAbsorver++;
      }
    });
  });

  const extraKcalPorItem = itensParaAbsorver > 0 ? (deficitCaloricoPulados / itensParaAbsorver) : 0;
  let totalKcalDia = 0;
  let kcalConsumidas = 0;
  let html = '';

  cardapioDoDia.refeicoes.forEach((ref, index) => {
    let kcalRefeicao = 0;
    let itensHtml = '';

    ref.itens.forEach(item => {
      let novaKcal = item.baseKcal;
      let novaQtd = item.baseQtd;

      if (item.status !== 'pulado' && (item.und === 'g' || item.und === 'ml') && item.baseKcal > 0) {
        novaKcal = item.baseKcal + extraKcalPorItem;
        novaQtd = item.baseQtd * (novaKcal / item.baseKcal);
      }

      if (item.status !== 'pulado') {
        kcalRefeicao += novaKcal;
        totalKcalDia += novaKcal;
      }

      if (item.status === 'consumido') {
        kcalConsumidas += novaKcal;
      }

      const qtdFormatada = (item.und === 'g' || item.und === 'ml') ? Math.round(novaQtd) : Number(novaQtd.toFixed(1));
      const isCons = item.status === 'consumido';
      const isPula = item.status === 'pulado';

      itensHtml += `
        <li class="refeicao-item ${isCons ? 'consumido' : ''} ${isPula ? 'pulado' : ''}">
          <span style="flex:1;">• ${qtdFormatada}${item.und} de ${item.nome} ${extraKcalPorItem > 0 && item.status !== 'pulado' ? '📈' : ''}</span>
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
  if (deficitCaloricoPulados > 0) {
    alertaEl.innerHTML = `<p style="font-size: 12px; color: #fbbf24; margin-top: 6px;">⚠️ Recalculando... Os itens com 📈 absorveram o alimento pulado!</p>`;
  } else {
    alertaEl.innerHTML = '';
  }

  container.innerHTML = html;
}

window.mudarStatusItem = function(idObj, novoStatus) {
  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.idObj === idObj) {
        if (item.status === novoStatus) {
          item.status = 'pendente';
        } else {
          item.status = novoStatus;
          if (novoStatus === 'consumido') {
            const alimentoOriginal = alimentos.find(a => a.id === item.idAlimento);
            if (alimentoOriginal && !alimentoOriginal.historico.includes(pegarDataDeHoje())) {
              alimentoOriginal.historico.push(pegarDataDeHoje());
              salvarEstoque();
            }
          }
        }
      }
    });
  });
  salvarCardapio();
  renderizarCardapio(); 
};

document.getElementById('btn-gerar').addEventListener('click', gerarMenuDinamico);
window.onload = function() {
  carregarEstoque();
  if (cardapioDoDia && cardapioDoDia.data === pegarDataDeHoje()) {
    renderizarCardapio();
  }
};
