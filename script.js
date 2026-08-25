// Banco de Alimentos Customizado (Com a Bebida Láctea já incluída!)
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

// O navegador busca no cache, se não tiver nada (por ser um link novo), ele usa os alimentosIniciais acima.
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
  alimentos.push({
    id: 'custom_' + Date.now(),
    nome: document.getElementById('nome-alimento').value,
    cat: document.getElementById('cat-alimento').value,
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
  
  const carboCafe = pegar('pao') || pegar('tapioca') || pegar('batata_doce') || pegar('aveia');
  const protCafe = pegar('ovos') || pegar('iogurte') || pegar('frango');
  
  const liqVit = pegar('leite') || pegar('iogurte') || null;
  const fruVit = pegar('banana') || pegar('aveia');
  const extVit = pegar('farinha_lactea') || pegar('mucilon') || null;
  const temAveia = pegar('aveia');
  const temLeitePo = pegar('leite_po');
  const temChia = pegar('chia');
  const temCrea = pegar('creatina');
  
  const protCeia = pegar('iogurte') || pegar('ovos') || pegar('leite');
  // Aqui eu coloquei a Bebida Láctea como opção preferencial para a ceia
  const carboCeia = pegar('bebida_lactea') || pegar('batata_doce') || pegar('aveia') || pegar('banana');

  if (!carboPrinc || !protPrinc) {
    document.getElementById('conteudo-menu').innerHTML = '<p style="color:#ef4444;">Falta proteína ou carboidrato no estoque!</p>';
    return;
  }

  const criarItem = (idA, nome, qtdBase, und, kcalBase) => {
    return { idObj: Math.random().toString(36).substr(2, 9), idAlimento: idA, nome: nome, baseQtd: qtdBase, und: und, baseKcal: kcalBase, status: 'pendente' };
  };

  cardapioDoDia = {
    data: pegarDataDeHoje(),
    refeicoes: [
      {
        nome: "Café da Manhã",
        itens: [
          criarItem(carboCafe.id, carboCafe.nome, carboCafe.id === 'pao' ? 2 : (carboCafe.id === 'tapioca' ? 100 : 150), carboCafe.id === 'pao' ? ' un.' : 'g', carboCafe.id === 'pao' ? 290 : 240),
          criarItem(protCafe.id, protCafe.nome, protCafe.id === 'ovos' ? 3 : 150, protCafe.id === 'ovos' ? ' un.' : 'g', protCafe.id === 'ovos' ? 216 : 247)
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
          ...(temCrea ? [criarItem(temCrea.id, temCrea.nome, 5, 'g', 0)] : [])
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
        itens: [
          criarItem(protCeia.id, protCeia.nome, protCeia.id === 'ovos' ? 2 : 150, protCeia.id === 'ovos' ? ' un.' : 'g', protCeia.id === 'ovos' ? 144 : 100),
          criarItem(carboCeia.id, carboCeia.nome, carboCeia.id === 'bebida_lactea' ? 200 : (carboCeia.id === 'batata_doce' ? 150 : 40), carboCeia.id === 'bebida_lactea' ? 'ml' : 'g', carboCeia.id === 'bebida_lactea' ? 111 : 129)
        ]
      }
    ]
  };

  salvarCardapio();
  renderizarCardapio();
}

function renderizarCardapio() {
  if (!cardapioDoDia || cardapioDoDia.data !== pegarDataDeHoje()) return;
  const container = document.getElementById('conteudo-menu');
  
  let deficitCalorico = 0;
  let itensPendentesParaDistribuir = 0;

  cardapioDoDia.refeicoes.forEach(ref => {
    ref.itens.forEach(item => {
      if (item.status === 'pulado') deficitCalorico += item.baseKcal;
      if (item.status === 'pendente' && item.und === 'g' && item.baseKcal > 0) itensPendentesParaDistribuir++;
    });
  });

  const extraKcalPorItem = itensPendentesParaDistribuir > 0 ? (deficitCalorico / itensPendentesParaDistribuir) : 0;
  let totalKcalDia = 0;
  let html = '';

  cardapioDoDia.refeicoes.forEach((ref, index) => {
    let kcalRefeicao = 0;
    let itensHtml = '';

    ref.itens.forEach(item => {
      let novaKcal = item.baseKcal;
      let novaQtd = item.baseQtd;

      if (item.status === 'pendente' && item.und === 'g' && item.baseKcal > 0) {
        novaKcal = item.baseKcal + extraKcalPorItem;
        novaQtd = item.baseQtd * (novaKcal / item.baseKcal);
      }

      if (item.status !== 'pulado') {
        kcalRefeicao += novaKcal;
        totalKcalDia += novaKcal;
      }

      const qtdFormatada = (item.und === 'g' || item.und === 'ml') ? Math.round(novaQtd) : Number(novaQtd.toFixed(1));
      const isCons = item.status === 'consumido';
      const isPula = item.status === 'pulado';

      itensHtml += `
        <li class="refeicao-item ${isCons ? 'consumido' : ''} ${isPula ? 'pulado' : ''}">
          <span style="flex:1;">• ${qtdFormatada}${item.und} de ${item.nome} ${item.status === 'pendente' && extraKcalPorItem > 0 ? '📈' : ''}</span>
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

  const headerHtml = `
    <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #334155;">
      <h4 style="color: #38bdf8; margin-bottom: 6px;">🎯 Meta do Dia: 3300 kcal</h4>
      <p style="font-size: 14px; color: #cbd5e1;">Projeção Atual: <strong>~${Math.round(totalKcalDia)} kcal</strong></p>
      ${deficitCalorico > 0 ? `<p style="font-size: 12px; color: #fbbf24; margin-top: 6px;">⚠️ Recalculando... Gramaturas pendentes com o ícone 📈 foram aumentadas para compensar o que foi pulado.</p>` : ''}
    </div>
  `;

  container.innerHTML = headerHtml + html;
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
  renderizarCardapio();
};
