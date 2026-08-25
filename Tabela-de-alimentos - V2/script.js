// Dados dos Alimentos
const alimentos = [
  { id: 'frango', nome: 'Peito de Frango Grelhado', proteina: 31, carbo: 0, gordura: 3.6, kcal: 165, emEstoque: true },
  { id: 'ovos', nome: 'Ovo Copolas/Inteiro (unidade)', proteina: 6.3, carbo: 0.4, gordura: 4.8, kcal: 72, emEstoque: true },
  { id: 'arroz', nome: 'Arroz Branco Cozido', proteina: 2.7, carbo: 28, gordura: 0.3, kcal: 130, emEstoque: true },
  { id: 'banana', nome: 'Banana Prata', proteina: 0.9, carbo: 18, gordura: 0.1, kcal: 70, emEstoque: true },
  { id: 'aveia', nome: 'Aveia em Flocos', proteina: 14, carbo: 60, gordura: 7, kcal: 360, emEstoque: true },
  { id: 'pasta_amendoim', nome: 'Pasta de Amendoim', proteina: 25, carbo: 20, gordura: 50, kcal: 600, emEstoque: true },
  { id: 'leite', nome: 'Leite Integral (ml)', proteina: 3, carbo: 4.5, gordura: 3, kcal: 60, emEstoque: true }
];

// Carrega os checkboxes na tela
function carregarEstoque() {
  const container = document.getElementById('lista-estoque');
  container.innerHTML = '';

  alimentos.forEach(item => {
    const label = document.createElement('label');
    label.className = 'item-checkbox';
    label.innerHTML = `
      <input type="checkbox" id="${item.id}" ${item.emEstoque ? 'checked' : ''} onchange="atualizarStatus('${item.id}')">
      ${item.nome}
    `;
    container.appendChild(label);
  });
}

function atualizarStatus(id) {
  const item = alimentos.find(a => a.id === id);
  if (item) {
    item.emEstoque = !item.emEstoque;
  }
}

// Gera o menu distribuído em 5 refeições
function gerarMenu() {
  const disponiveis = alimentos.filter(a => a.emEstoque);
  const containerMenu = document.getElementById('conteudo-menu');

  if (disponiveis.length === 0) {
    containerMenu.innerHTML = '<p class="placeholder" style="color: #ef4444;">Marque pelo menos um alimento no seu estoque!</p>';
    return;
  }

  // Distribuição simples das 3.300 kcal em 5 refeições
  const menuHTML = `
    <div class="refeicao-card">
      <h3>☕ Refeição 1: Café da Manhã (~700 kcal)</h3>
      <ul>
        <li>• 3 Ovos Inteiros mexidos/cozidos</li>
        <li>• 80g de Aveia em Flocos</li>
        <li>• 2 Bananas Prata</li>
      </ul>
    </div>

    <div class="refeicao-card">
      <h3>🍗 Refeição 2: Almoço (~800 kcal)</h3>
      <ul>
        <li>• 200g de Peito de Frango Grelhado</li>
        <li>• 300g de Arroz Branco Cozido</li>
        <li>• Salada/Vegetais à vontade</li>
      </ul>
    </div>

    <div class="refeicao-card">
      <h3>🍌 Refeição 3: Lanche da Tarde (~500 kcal)</h3>
      <ul>
        <li>• 250ml de Leite Integral</li>
        <li>• 1 Banana Prata</li>
        <li>• 30g de Pasta de Amendoim</li>
      </ul>
    </div>

    <div class="refeicao-card">
      <h3>🥩 Refeição 4: Jantar (~800 kcal)</h3>
      <ul>
        <li>• 200g de Peito de Frango Grelhado</li>
        <li>• 300g de Arroz Branco Cozido</li>
      </ul>
    </div>

    <div class="refeicao-card">
      <h3>🌙 Refeição 5: Ceia / Lanche Noturno (~500 kcal)</h3>
      <ul>
        <li>• 2 Ovos Inteiros</li>
        <li>• 40g de Aveia em Flocos</li>
        <li>• 20g de Pasta de Amendoim</li>
      </ul>
    </div>
  `;

  containerMenu.innerHTML = menuHTML;
}

document.getElementById('btn-gerar').addEventListener('click', gerarMenu);
window.onload = carregarEstoque;