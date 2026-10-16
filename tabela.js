// Tabela nutricional (por 100g ou 100ml, alimentos cozidos/prontos quando aplicável).
// Valores aproximados, baseados na TACO (UNICAMP) e em tabelas comuns. Formato: [nome, categoria, kcal, prot, carbo, gord]
(function () {
  const D = {
    pao: ['Pão francês', 'carbo', 300, 8, 58.6, 3.1], tapioca: ['Tapioca (goma hidratada)', 'carbo', 240, 0, 60, 0],
    macarrao: ['Macarrão cozido', 'carbo', 155, 5.5, 31, 0.9], arroz: ['Arroz branco cozido', 'carbo', 128, 2.5, 28.1, 0.2],
    feijao: ['Feijão carioca cozido', 'carbo', 76, 4.8, 13.6, 0.5], batata_doce: ['Batata doce cozida', 'carbo', 77, 0.6, 18.4, 0.1],
    aveia: ['Aveia em flocos', 'carbo', 394, 13.9, 66.6, 8.5], banana: ['Banana prata', 'carbo', 98, 1.3, 26, 0.1],
    farinha_lactea: ['Farinha láctea', 'carbo', 380, 8, 80, 3], mucilon: ['Mucilon', 'carbo', 380, 8, 82, 1.5],
    bebida_lactea: ['Bebida láctea morango', 'carbo', 55.5, 2.5, 9, 1.2], frango: ['Peito de frango grelhado', 'proteina', 159, 32, 0, 2.5],
    carne_moida: ['Carne moída cozida', 'proteina', 212, 26.7, 0, 10.9], ovos: ['Ovo cozido', 'proteina', 146, 13.3, 0.6, 9.5],
    leite: ['Leite integral', 'proteina', 61, 3.2, 4.6, 3.3], iogurte: ['Iogurte natural', 'proteina', 51, 4.1, 1.9, 3],
    creatina: ['Creatina', 'proteina', 0, 0, 0, 0], leite_po: ['Leite em pó integral', 'gordura', 497, 25.4, 39.2, 26.9],
    chia: ['Semente de chia', 'gordura', 486, 16.5, 42.1, 30.7]
  };
  const E = [
    ['Batata inglesa cozida', 'carbo', 52, 1.2, 11.9, 0], ['Mandioca cozida', 'carbo', 125, 0.6, 30.1, 0.3], ['Inhame cozido', 'carbo', 97, 2.1, 23.2, 0.2],
    ['Cuscuz de milho cozido', 'carbo', 113, 2.2, 25.3, 0.7], ['Pão de forma', 'carbo', 253, 8.5, 49.4, 3.7], ['Pão de queijo', 'carbo', 363, 5.1, 34.2, 24.6],
    ['Arroz integral cozido', 'carbo', 124, 2.6, 25.8, 1], ['Lentilha cozida', 'carbo', 93, 6.3, 16.3, 0.5], ['Grão-de-bico cozido', 'carbo', 164, 8.9, 27.4, 2.6],
    ['Maçã', 'carbo', 56, 0.3, 15.2, 0], ['Laranja', 'carbo', 37, 1, 8.9, 0.1], ['Mamão papaia', 'carbo', 40, 0.5, 10.4, 0.1], ['Manga', 'carbo', 64, 0.4, 16.7, 0.3],
    ['Abacaxi', 'carbo', 48, 0.9, 12.3, 0.1], ['Uva', 'carbo', 53, 0.7, 13.6, 0.2], ['Morango', 'carbo', 30, 0.9, 6.8, 0.3], ['Melancia', 'carbo', 33, 0.9, 8.1, 0],
    ['Mel', 'carbo', 309, 0.4, 84, 0], ['Patinho grelhado', 'proteina', 219, 35.9, 0, 7.3], ['Alcatra grelhada', 'proteina', 241, 31.9, 0, 11.6],
    ['Coxa de frango sem pele cozida', 'proteina', 167, 26.9, 0, 5.8], ['Tilápia grelhada', 'proteina', 128, 26, 0, 2.7], ['Atum em conserva (natural)', 'proteina', 118, 26.2, 0, 0.9],
    ['Clara de ovo cozida', 'proteina', 52, 10.9, 0.7, 0.2], ['Queijo muçarela', 'proteina', 330, 22.6, 3, 25.2], ['Queijo minas frescal', 'proteina', 264, 17.4, 3.2, 20.2],
    ['Requeijão cremoso', 'proteina', 257, 9.6, 2.4, 23.4], ['Iogurte grego natural', 'proteina', 97, 9, 4, 5], ['Leite desnatado', 'proteina', 35, 3.4, 4.9, 0.1],
    ['Whey protein (confira o rótulo)', 'proteina', 400, 80, 8, 6], ['Azeite de oliva', 'gordura', 884, 0, 0, 100], ['Castanha-do-pará', 'gordura', 643, 14.5, 15.1, 63.5],
    ['Amendoim torrado', 'gordura', 606, 22.5, 18.7, 54], ['Amêndoa', 'gordura', 581, 18.6, 29.5, 50.6], ['Nozes', 'gordura', 620, 14, 18.4, 59.4],
    ['Manteiga', 'gordura', 726, 0.4, 0.1, 82.4], ['Semente de linhaça', 'gordura', 495, 14.1, 43.3, 32.3], ['Pasta de amendoim', 'gordura', 588, 25, 20, 50], ['Abacate', 'gordura', 96, 1.2, 6, 8.4]
  ];
  const t = {}, mk = (id, r) => t[id] = { nome: r[0], cat: r[1], k: r[2], p: r[3], c: r[4], g: r[5] };
  Object.entries(D).forEach(([id, r]) => mk(id, r));
  E.forEach(r => mk('tb_' + r[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_'), r));
  window.TABELA_NUTRI = t;
})();
