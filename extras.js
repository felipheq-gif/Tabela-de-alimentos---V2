// Recursos extras: macros, editar/excluir, meta, histórico, gráficos, peso,
// lembretes, backup, desfazer, trocar alimento e sincronização Firebase.
(function () {
  const $ = id => document.getElementById(id);
  const LS = { get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
  const CHAVES = ['meuEstoqueOficial', 'cardapioDoDia', 'historicoDias', 'registroPeso', 'configApp', 'tipoDia'];
  const cfg = Object.assign({ meta: 3300, prot: 180, carbo: 450, gord: 90, lembretes: '07:00,10:00,13:00,16:00,19:00,22:00' }, LS.get('configApp', {}));
  window.pegarMeta = () => metaHoje();

  // [kcal, proteína, carbo, gordura] por 100g/ml (valores aproximados)
  const T = {};
  Object.entries(window.TABELA_NUTRI || {}).forEach(([k, f]) => T[k] = [f.k, f.p, f.c, f.g]);
  // Devolve calorias e macros por 1 g, 1 ml ou 1 un (conforme a unidade do alimento).
  function info(id) {
    const a = alimentos.find(x => x.id === id) || {}, t = T[id] || [0, 0, 0, 0];
    const f = undDe(a) === 'un' ? 0.5 : 0.01;          // tabela é por 100 g; 1 un ~ 50 g
    const porUn = (v, i) => (v != null && a.porcaoQtd > 0) ? v / a.porcaoQtd : t[i] * f;
    return { k: kcalPorUn(a), p: porUn(a.porcaoProt, 1), c: porUn(a.porcaoCarbo, 2), g: porUn(a.porcaoGord, 3) };
  }
  const hoje = () => pegarDataDeHoje();
  const diaAtivo = () => cardapioDoDia && cardapioDoDia.data === hoje();

  function macrosDia() {
    const m = { k: 0, p: 0, c: 0, g: 0 };
    if (!diaAtivo()) return m;
    cardapioDoDia.refeicoes.forEach(r => r.itens.forEach(i => {
      if (i.status !== 'consumido') return;
      const f = info(i.idAlimento), q = i.currentQtd;
      m.k += i.currentKcal; m.p += f.p * q; m.c += f.c * q; m.g += f.g * q;
    }));
    return m;
  }
  function salvarDia() {
    if (!diaAtivo()) return;
    const m = macrosDia(), h = LS.get('historicoDias', {});
    h[hoje()] = { k: Math.round(m.k), p: Math.round(m.p), c: Math.round(m.c), g: Math.round(m.g), meta: metaHoje() };
    LS.set('historicoDias', h);
  }

  // ---------- Desfazer ----------
  const pilha = [];
  function snap() { if (cardapioDoDia) { pilha.push(JSON.stringify(cardapioDoDia)); if (pilha.length > 30) pilha.shift(); } }
  const _mst = window.mudarStatusItem;
  window.mudarStatusItem = function (a, b) { snap(); _mst(a, b); };
  $('btn-add-avulso').addEventListener('click', snap, true);
  function desfazer() {
    if (!pilha.length) return alert('Nada para desfazer.');
    cardapioDoDia = JSON.parse(pilha.pop());
    atualizarDinamicaCardapio(); salvarCardapio(); renderizarCardapio();
  }

  // ---------- Trocar alimento ----------
  window.trocarItem = function (idObj) {
    let alvo; cardapioDoDia.refeicoes.forEach(r => r.itens.forEach(i => { if (i.idObj === idObj) alvo = i; }));
    if (!alvo || alvo.baseKcal <= 0) return;
    const cat = (alimentos.find(x => x.id === alvo.idAlimento) || {}).cat;
    const opc = alimentos.filter(a => a.emEstoque && a.id !== alvo.idAlimento && a.cat === cat && info(a.id).k > 0);
    if (!opc.length) return alert('Não há outro alimento dessa categoria no estoque.');
    const n = prompt('Trocar ' + alvo.nome + ' por (digite o número):\n' + opc.map((a, i) => (i + 1) + ' - ' + a.nome).join('\n'));
    const esc = opc[parseInt(n) - 1]; if (!esc) return;
    snap();
    const un = undDe(esc) === 'un', kcalUn = info(esc.id).k;
    let qtd = alvo.baseKcal / kcalUn; if (un) qtd = Math.max(1, Math.round(qtd * 2) / 2);
    Object.assign(alvo, { idAlimento: esc.id, nome: esc.nome, und: undTexto(esc), baseQtd: qtd, baseKcal: qtd * kcalUn });
    alvo.finalQtd = alvo.baseQtd; alvo.finalKcal = alvo.baseKcal;
    atualizarDinamicaCardapio(); salvarCardapio(); renderizarCardapio();
  };

  // ---------- Editar / excluir alimentos ----------
  window.editarAlimento = function (id) {
    const a = alimentos.find(x => x.id === id); if (!a) return;
    const f = info(id), ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;justify-content:center;padding:16px;overflow:auto;z-index:1000';
    const rot = t => `<label style="font-size:12px;color:#94a3b8;display:block;margin-top:8px">${t}</label>`;
    const campo = (t, i, extra) => rot(t) + `<input id="${i}" ${extra || ''}>`;
    const num = 'type="number" step="0.1" inputmode="decimal"';
    ov.innerHTML = '<div class="section-card" style="width:100%;max-width:420px;margin:auto"><h3>✏️ Editar alimento</h3>'
      + campo('Nome', 'ed-nome', 'type="text"')
      + rot('Categoria') + '<select id="ed-cat"><option value="carbo">Carboidrato</option><option value="proteina">Proteína</option><option value="gordura">Gordura</option></select>'
      + rot('Unidade da quantidade') + '<select id="ed-und"><option value="g">Gramas (g)</option><option value="ml">Mililitros (ml)</option><option value="un">Unidades (un)</option></select>'
      + campo('Calorias (kcal)', 'ed-k', num) + campo('Quantidade necessária para atingir essas calorias', 'ed-q', num)
      + '<p style="font-size:12px;color:#94a3b8;margin-top:10px">Macros dessa mesma quantidade:</p>'
      + campo('Proteína (g)', 'ed-p', num) + campo('Carboidrato (g)', 'ed-c', num) + campo('Gordura (g)', 'ed-g', num)
      + campo('Máx. dias por semana (vazio = sem limite)', 'ed-l', 'type="number" inputmode="numeric"')
      + '<div class="form-row" style="margin-top:14px"><button id="ed-salvar" class="btn-primario">Salvar</button><button id="ed-cancelar" class="btn-primario" style="background:#475569">Cancelar</button></div></div>';
    document.body.appendChild(ov);
    const r1 = v => String(Number(v.toFixed(1))), q = a.porcaoQtd || 1;
    $('ed-nome').value = a.nome; $('ed-cat').value = a.cat; $('ed-und').value = undDe(a);
    $('ed-k').value = r1(a.porcaoKcal || 0); $('ed-q').value = r1(q);
    $('ed-p').value = r1(f.p * q); $('ed-c').value = r1(f.c * q); $('ed-g').value = r1(f.g * q); $('ed-l').value = a.limiteSemanal || '';
    const fechar = () => ov.remove(), n = i => { const x = parseFloat(String($(i).value).replace(',', '.')); return isNaN(x) ? null : x; };
    $('ed-cancelar').onclick = fechar;
    ov.addEventListener('click', e => { if (e.target === ov) fechar(); });
    $('ed-salvar').onclick = () => {
      const kcal = n('ed-k'), qtd = n('ed-q');
      if (kcal === null || kcal < 0 || qtd === null || qtd <= 0) return alert('Informe as calorias e a quantidade necessária (maior que zero).');
      a.nome = $('ed-nome').value.trim() || a.nome; a.cat = $('ed-cat').value; a.unidade = $('ed-und').value;
      a.porcaoKcal = kcal; a.porcaoQtd = qtd; a.porcaoProt = n('ed-p'); a.porcaoCarbo = n('ed-c'); a.porcaoGord = n('ed-g');
      const lim = n('ed-l'); a.limiteSemanal = lim ? Math.round(lim) : null;
      salvarEstoque(); carregarEstoque(); fechar();
      if (diaAtivo()) alert('Salvo! O cardápio de hoje já gerado continua como está. Toque em "Gerar Menu" para usar os novos valores.');
    };
  };
    window.excluirAlimento = function (id) {
    const a = alimentos.find(x => x.id === id);
    if (a && confirm('Excluir "' + a.nome + '" do estoque?')) { alimentos = alimentos.filter(x => x.id !== id); salvarEstoque(); carregarEstoque(); }
  };

  // ---------- Hooks nas funções do script.js ----------
  const mkBtn = (txt, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-acao'; b.textContent = txt; b.style.padding = '2px 6px'; b.onclick = e => { e.preventDefault(); e.stopPropagation(); fn(); }; return b; };
  const _ce = carregarEstoque;
  carregarEstoque = function () {
    _ce();
    document.querySelectorAll('#lista-estoque label.item-checkbox').forEach(l => {
      const id = l.querySelector('input').id, w = document.createElement('span');
      w.style.cssText = 'margin-left:auto;display:flex;gap:4px';
      w.append(mkBtn('✏️', () => editarAlimento(id)), mkBtn('🗑️', () => excluirAlimento(id)));
      l.appendChild(w);
    });
  };
  const _rc = renderizarCardapio;
  renderizarCardapio = function () {
    _rc();
    document.querySelectorAll('#conteudo-menu .refeicao-item').forEach(li => {
      const ac = li.querySelector('.acoes-item'), m = /'([^']+)'/.exec(ac.firstElementChild.getAttribute('onclick') || '');
      if (!m || m[1].startsWith('avulso_') || li.classList.contains('consumido') || li.classList.contains('pulado')) return;
      ac.prepend(mkBtn('🔁', () => trocarItem(m[1])));
    });
    atualizarExtras();
  };
  const _sc = salvarCardapio; salvarCardapio = function () { _sc(); salvarDia(); agendarEnvio(); };
  const _se = salvarEstoque; salvarEstoque = function () { _se(); agendarEnvio(); };

  // ---------- Interface ----------
  const secao = (t, h, cor) => `<div class="section-card"${cor ? ` style="border-color:${cor}"` : ''}><h3>${t}</h3>${h}</div>`;
  const mc = document.createElement('div');
  mc.className = 'section-card';
  mc.innerHTML = '<div id="macros-barras"></div><button id="btn-desfazer" class="btn-primario" style="margin-top:12px;background:#475569">↩️ Desfazer última ação</button>';
  $('conteudo-menu').before(mc);
  $('btn-desfazer').onclick = desfazer;

  const box = document.createElement('div');
  box.innerHTML =
    secao('📊 Histórico e Evolução', '<canvas id="g-kcal" style="width:100%;height:160px"></canvas><div id="hist-lista" style="font-size:13px;color:#cbd5e1;margin-top:8px"></div>') +
    secao('⚖️ Registro de Peso', '<div class="form-row"><input type="number" step="0.1" id="peso-in" placeholder="Peso de hoje (kg)"><button id="peso-btn" class="btn-primario">Registrar</button></div><canvas id="g-peso" style="width:100%;height:160px;margin-top:10px"></canvas>') +
    secao('⚙️ Metas', '<div class="form-grid"><div class="form-row"><input type="number" id="cf-meta" placeholder="Kcal dia de treino"><input type="number" id="cf-desc" placeholder="Kcal dia de descanso"></div><div class="form-row"><input type="number" id="cf-prot" placeholder="Proteína (g)"><input type="number" id="cf-carbo" placeholder="Carbo (g)"></div><div class="form-row"><input type="number" id="cf-gord" placeholder="Gordura (g)"><select id="cf-obj"><option value="ganhar">Objetivo: ganhar peso</option><option value="manter">Objetivo: manter peso</option><option value="perder">Objetivo: perder peso</option></select></div><button id="cf-salvar" class="btn-primario">Salvar metas</button><p style="font-size:12px;color:#94a3b8">A nova meta vale a partir do próximo "Gerar Menu". Deixe o descanso vazio para usar a mesma meta.</p><div id="sug-meta" style="margin-top:10px;font-size:13px;color:#cbd5e1"></div></div>') +
    secao('🔔 Lembretes das Refeições', '<input type="text" id="lem-horas" placeholder="Horários separados por vírgula"><button id="lem-btn" class="btn-primario" style="margin-top:10px">Ativar / salvar lembretes</button><p style="font-size:12px;color:#94a3b8;margin-top:8px">Avisa com o app aberto ou em segundo plano. Com o app totalmente fechado, o celular pode não entregar o aviso (limitação dos PWAs, principalmente no iPhone).</p>') +
    secao('💾 Backup', '<div class="form-row"><button id="bk-exp" class="btn-primario">Exportar</button><button id="bk-imp" class="btn-primario" style="background:#475569">Importar</button></div><input type="file" id="bk-file" accept=".json" style="display:none">') +
    secao('☁️ Sincronização (Firebase)', '<input type="text" id="sync-cod" placeholder="Código secreto (igual em todos os aparelhos)"><button id="sync-btn" class="btn-primario" style="margin-top:10px">Ativar sincronização</button><p id="sync-status" style="font-size:12px;color:#94a3b8;margin-top:8px"></p>');
  document.querySelector('.container').append(...box.children);

  function grafico(cv, labels, vals, linha, cor, tipo) {
    const c = cv.getContext('2d'), w = cv.width = cv.clientWidth * 2, h = cv.height = 320;
    c.clearRect(0, 0, w, h); c.font = '22px sans-serif';
    if (!vals.length) { c.fillStyle = '#94a3b8'; c.fillText('Sem dados ainda', 10, 50); return; }
    const min = tipo === 'linha' ? Math.min(...vals) * 0.98 : 0, max = (Math.max(...vals, linha || 0) * 1.05) || 1, bw = w / vals.length;
    const y = v => h - 36 - ((v - min) / (max - min || 1)) * (h - 60);
    c.fillStyle = cor; c.strokeStyle = cor; c.lineWidth = 4; c.beginPath();
    vals.forEach((v, i) => {
      const x = i * bw + bw / 2;
      if (tipo === 'linha') { i ? c.lineTo(x, y(v)) : c.moveTo(x, y(v)); } else c.fillRect(i * bw + 6, y(v), bw - 12, h - 36 - y(v));
    });
    if (tipo === 'linha') { c.stroke(); vals.forEach((v, i) => { c.beginPath(); c.arc(i * bw + bw / 2, y(v), 6, 0, 7); c.fill(); }); }
    c.fillStyle = '#94a3b8';
    labels.forEach((l, i) => { if (vals.length < 9 || i % 2 === 0) c.fillText(l, i * bw + 4, h - 8); });
    if (tipo === 'linha') { c.fillText(vals[vals.length - 1] + ' kg', 10, 24); }
    if (linha) { c.strokeStyle = '#fbbf24'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(0, y(linha)); c.lineTo(w, y(linha)); c.stroke(); c.setLineDash([]); }
  }
  const ult = (obj, n) => Object.keys(obj).sort((a, b) => a.split('/').reverse().join('').localeCompare(b.split('/').reverse().join(''))).slice(-n);
  const barra = (n, v, m, cor) => `<div style="font-size:12px;color:#cbd5e1;margin-top:6px">${n}: <strong>${Math.round(v)}</strong> / ${m}</div><div style="background:#334155;border-radius:4px;height:8px"><div style="width:${Math.min(100, v / m * 100)}%;background:${cor};height:8px;border-radius:4px"></div></div>`;

  function atualizarExtras() {
    const m = macrosDia();
    document.querySelector('.section-card h4').textContent = '🎯 Meta do Dia: ' + metaHoje() + ' kcal';
    $('macros-barras').innerHTML = '<h4 style="margin-bottom:4px">📊 Consumido hoje</h4>' + barra('Calorias', m.k, metaHoje() + ' kcal', '#38bdf8') + barra('Proteína', m.p, cfg.prot + 'g', '#f87171').replace(/\/ (\d+g)/, '/ $1') + barra('Carboidrato', m.c, cfg.carbo + 'g', '#fbbf24') + barra('Gordura', m.g, cfg.gord + 'g', '#a78bfa');
    const h = LS.get('historicoDias', {}), dias = ult(h, 14);
    grafico($('g-kcal'), dias.map(d => d.slice(0, 5)), dias.map(d => h[d].k), metaHoje(), '#38bdf8');
    $('hist-lista').innerHTML = ult(h, 7).reverse().map(d => `${d.slice(0, 5)}: <strong>${h[d].k} kcal</strong> · P ${h[d].p}g · C ${h[d].c}g · G ${h[d].g}g`).join('<br>');
    const p = LS.get('registroPeso', {}), pd = ult(p, 30);
    grafico($('g-peso'), pd.map(d => d.slice(0, 5)), pd.map(d => p[d]), 0, '#34d399', 'linha');
  }

  $('peso-btn').onclick = () => {
    const v = parseFloat($('peso-in').value.replace(',', '.')); if (isNaN(v) || v <= 0) return alert('Digite o peso em kg.');
    const p = LS.get('registroPeso', {}); p[hoje()] = v; LS.set('registroPeso', p); $('peso-in').value = ''; atualizarExtras(); agendarEnvio();
  };
  ['meta', 'prot', 'carbo', 'gord'].forEach(k => $('cf-' + k).value = cfg[k]);
  $('cf-salvar').onclick = () => {
    const v = k => parseFloat($('cf-' + k).value);
    if (!(v('meta') >= 1200)) return alert('A meta de kcal precisa ser de pelo menos 1200.');
    Object.assign(cfg, { meta: v('meta'), prot: v('prot') || cfg.prot, carbo: v('carbo') || cfg.carbo, gord: v('gord') || cfg.gord });
    LS.set('configApp', cfg); atualizarExtras(); agendarEnvio(); alert('Metas salvas! Gere o menu de novo para aplicar a nova meta de kcal.');
  };

  // ---------- Lembretes ----------
  $('lem-horas').value = cfg.lembretes;
  $('lem-btn').onclick = async () => {
    if (!('Notification' in window)) return alert('Este navegador não suporta notificações.');
    if (await Notification.requestPermission() !== 'granted') return alert('Permissão de notificação negada.');
    cfg.lembretes = $('lem-horas').value; LS.set('configApp', cfg); localStorage.setItem('lembretesOn', '1'); alert('Lembretes ativados neste aparelho.');
  };
  let ultimo = '';
  setInterval(() => {
    if (localStorage.getItem('lembretesOn') !== '1' || !('Notification' in window) || Notification.permission !== 'granted') return;
    const d = new Date(), hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (hm === ultimo || !cfg.lembretes.split(',').map(x => x.trim()).includes(hm)) return;
    ultimo = hm;
    const op = { body: 'Abra o app e marque o que você comeu.', icon: 'icon-192.png' };
    navigator.serviceWorker.ready.then(r => r.showNotification('Hora da refeição 🍽️', op)).catch(() => new Notification('Hora da refeição 🍽️', op));
  }, 20000);

  // ---------- Backup ----------
  $('bk-exp').onclick = () => {
    const o = {}; CHAVES.forEach(k => o[k] = localStorage.getItem(k));
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' }));
    a.download = 'cardapio-backup-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
  };
  $('bk-imp').onclick = () => $('bk-file').click();
  $('bk-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const o = JSON.parse(rd.result);
        if (!confirm('Isso substitui os dados atuais pelos do backup. Continuar?')) return;
        CHAVES.forEach(k => o[k] != null ? localStorage.setItem(k, o[k]) : localStorage.removeItem(k));
        location.reload();
      } catch (er) { alert('Arquivo de backup inválido.'); }
    };
    rd.readAsText(f);
  };

  // ---------- Sincronização Firebase ----------
  const idDisp = localStorage.getItem('idDisp') || (() => { const i = Math.random().toString(36).slice(2); localStorage.setItem('idDisp', i); return i; })();
  let ref = null, timer = null;
  const status = t => $('sync-status').textContent = t;
  window.agendarEnvio = function () {
    if (!ref) return; clearTimeout(timer);
    timer = setTimeout(() => {
      const o = { ts: Date.now(), origem: idDisp }; CHAVES.forEach(k => o[k] = localStorage.getItem(k));
      localStorage.setItem('syncTs', o.ts); ref.set(o).catch(() => status('Falha ao enviar (sem conexão?)'));
    }, 800);
  };
  const carregar = u => new Promise((ok, er) => { const s = document.createElement('script'); s.src = u; s.onload = ok; s.onerror = er; document.head.appendChild(s); });
  function aplicarRemoto(r) {
    CHAVES.forEach(k => r[k] != null ? localStorage.setItem(k, r[k]) : localStorage.removeItem(k));
    localStorage.setItem('syncTs', r.ts);
    alimentos = LS.get('meuEstoqueOficial', alimentos); migrarAlimentos(); cardapioDoDia = LS.get('cardapioDoDia', null);
    Object.assign(cfg, LS.get('configApp', {})); ['meta', 'prot', 'carbo', 'gord'].forEach(k => $('cf-' + k).value = cfg[k]);
    carregarEstoque(); if (diaAtivo()) atualizarDinamicaCardapio(); renderizarCardapio(); atualizarExtras();
  }
  const codigo = localStorage.getItem('codigoSync') || '', C = window.FIREBASE_CONFIG;
  $('sync-cod').value = codigo;
  $('sync-btn').onclick = () => { const c = $('sync-cod').value.trim(); if (c.length < 6) return alert('Use um código com pelo menos 6 caracteres.'); localStorage.setItem('codigoSync', c); location.reload(); };
  if (!C || !C.databaseURL) status('Preencha o arquivo firebase-config.js para ativar.');
  else if (!codigo) status('Defina um código para ativar.');
  else {
    carregar('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js').then(() => carregar('https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js')).then(() => {
      if (!firebase.apps.length) firebase.initializeApp(C);
      ref = firebase.database().ref('usuarios/' + codigo);
      ref.on('value', s => {
        const r = s.val();
        if (!r) return agendarEnvio();
        if (r.origem !== idDisp && r.ts > Number(localStorage.getItem('syncTs') || 0)) aplicarRemoto(r);
      });
      status('Sincronização ativa ✅');
    }).catch(() => status('Não foi possível carregar o Firebase (sem internet?).'));
  }

  // ---------- Cadastro: unidade e preenchimento automático ----------
  const rotuloUnd = () => { const u = $('und-alimento').value; $('qtd-porcao').placeholder = 'Quantidade (' + u + ')'; };
  $('und-alimento').addEventListener('change', rotuloUnd);
  $('form-alimento').addEventListener('reset', () => setTimeout(rotuloUnd, 0));
  // Valores da tabela e do código de barras são "por 100 g/ml": preenche calorias = k, quantidade = 100.
  function preencherCadastro(cat, nome, k, p, c, g) {
    $('cat-alimento').value = cat;
    $('und-alimento').value = /^(leite integral|leite desnatado|bebida|azeite|suco)/i.test(nome || '') ? 'ml' : 'g';
    $('kcal-porcao').value = k; $('qtd-porcao').value = 100; $('prot-porcao').value = p ?? ''; $('carbo-porcao').value = c ?? ''; $('gord-porcao').value = g ?? '';
    rotuloUnd();
  }

  // ---------- Banco de alimentos no cadastro ----------
  const lista = Object.values(window.TABELA_NUTRI || {}), dl = document.createElement('datalist');
  dl.id = 'dl-tabela'; dl.innerHTML = lista.map(f => `<option value="${f.nome}">`).join(''); document.body.appendChild(dl);
  const inNome = $('nome-alimento'); inNome.setAttribute('list', 'dl-tabela'); inNome.placeholder = 'Nome (digite para buscar na tabela)';
  inNome.addEventListener('change', () => {
    const f = lista.find(x => x.nome.toLowerCase() === inNome.value.trim().toLowerCase()); if (!f) return;
    preencherCadastro(f.cat, f.nome, f.k, f.p, f.c, f.g);
  });

  // ---------- Meta por tipo de dia ----------
  function metaHoje() { const t = LS.get('tipoDia', {})[hoje()] || 'treino'; return t === 'descanso' && cfg.metaDescanso ? cfg.metaDescanso : cfg.meta; }
  function modal(html, aoFechar) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;justify-content:center;padding:16px;overflow:auto;z-index:1000';
    ov.innerHTML = '<div class="section-card" style="width:100%;max-width:420px;margin:auto">' + html + '</div>';
    const fechar = () => { if (aoFechar) aoFechar(); ov.remove(); };
    ov.addEventListener('click', e => { if (e.target === ov) fechar(); });
    document.body.appendChild(ov); return { ov, fechar };
  }
  mc.insertAdjacentHTML('afterbegin', '<select id="tipo-dia" style="margin-bottom:10px"><option value="treino">🏋️ Hoje é dia de treino</option><option value="descanso">😴 Hoje é dia de descanso</option></select>');
  $('tipo-dia').value = LS.get('tipoDia', {})[hoje()] || 'treino';
  $('tipo-dia').onchange = () => {
    const t = LS.get('tipoDia', {}); t[hoje()] = $('tipo-dia').value; LS.set('tipoDia', t); atualizarExtras(); agendarEnvio();
    alert('Meta de hoje: ' + metaHoje() + ' kcal. Toque em "Gerar Menu" para recalcular o cardápio.');
  };
  $('cf-desc').value = cfg.metaDescanso || ''; $('cf-obj').value = cfg.objetivo || 'ganhar';
  $('cf-salvar').onclick = () => {
    const v = k => parseFloat($('cf-' + k).value), d = v('desc');
    if (!(v('meta') >= 1200)) return alert('A meta de kcal de treino precisa ser de pelo menos 1200.');
    if (d && d < 1200) return alert('A meta de descanso precisa ser de pelo menos 1200.');
    Object.assign(cfg, { meta: v('meta'), metaDescanso: d || null, prot: v('prot') || cfg.prot, carbo: v('carbo') || cfg.carbo, gord: v('gord') || cfg.gord, objetivo: $('cf-obj').value });
    LS.set('configApp', cfg); atualizarExtras(); agendarEnvio(); alert('Metas salvas! Gere o menu de novo para aplicar.');
  };

  // ---------- Ajuste sugerido da meta pelo peso ----------
  function sugerirMeta() {
    const p = LS.get('registroPeso', {}), box = $('sug-meta'), agora = Date.now() / 864e5;
    const pts = ult(p, 30).map(d => { const [dd, mm, yy] = d.split('/'); return [new Date(+yy, mm - 1, +dd).getTime() / 864e5, p[d]]; }).filter(x => x[0] > agora - 28);
    if (Date.now() - (cfg.ajusteEm || 0) < 14 * 864e5) { box.textContent = '💡 Meta ajustada há pouco. Aguarde cerca de 2 semanas para reavaliar.'; return; }
    if (pts.length < 3 || pts[pts.length - 1][0] - pts[0][0] < 10) { box.textContent = '💡 Registre o peso por pelo menos 10 dias (3 registros ou mais) para receber sugestões de ajuste.'; return; }
    const n = pts.length, mx = pts.reduce((a, x) => a + x[0], 0) / n, my = pts.reduce((a, x) => a + x[1], 0) / n;
    const sl = pts.reduce((a, x) => a + (x[0] - mx) * (x[1] - my), 0) / pts.reduce((a, x) => a + (x[0] - mx) ** 2, 0) * 7;
    const obj = cfg.objetivo || 'ganhar', [lo, hi] = obj === 'ganhar' ? [0.1, 0.5] : obj === 'perder' ? [-0.8, -0.2] : [-0.15, 0.15];
    const delta = sl < lo ? 150 : sl > hi ? -150 : 0, t = `💡 Tendência: <strong>${sl >= 0 ? '+' : ''}${sl.toFixed(2)} kg/semana</strong>. `;
    if (!delta) { box.innerHTML = t + 'Dentro do esperado para o seu objetivo. Mantenha a meta.'; return; }
    box.innerHTML = t + `Sugestão: ${delta > 0 ? 'subir' : 'reduzir'} a meta em ${Math.abs(delta)} kcal. <button id="sug-aplicar" class="btn-primario" style="margin-top:8px">Aplicar ${delta > 0 ? '+' : ''}${delta} kcal</button>`;
    $('sug-aplicar').onclick = () => {
      cfg.meta += delta; if (cfg.metaDescanso) cfg.metaDescanso += delta; cfg.ajusteEm = Date.now(); LS.set('configApp', cfg);
      $('cf-meta').value = cfg.meta; $('cf-desc').value = cfg.metaDescanso || ''; atualizarExtras(); agendarEnvio(); alert('Meta ajustada. Gere o menu de novo para aplicar.');
    };
  }

  // ---------- O que comer para fechar o dia ----------
  $('btn-desfazer').insertAdjacentHTML('beforebegin', '<button id="btn-fechar" class="btn-primario" style="margin-top:12px;background:#059669">🍽️ O que comer para fechar o dia</button>');
  $('btn-fechar').onclick = () => {
    if (!diaAtivo()) return alert('Gere o menu de hoje primeiro.');
    const m = macrosDia(), faltaK = metaHoje() - m.k, faltaP = Math.max(0, cfg.prot - m.p);
    if (faltaK < 80) return alert('Você já está na meta de calorias de hoje 🎉');
    const est = alimentos.filter(a => a.emEstoque && info(a.id).k > 0);
    const melhor = (cat, c) => est.filter(a => a.cat === cat && info(a.id)[c] > 0).sort((a, b) => info(b.id)[c] / info(b.id).k - info(a.id)[c] / info(a.id).k)[0];
    let k = faltaK; const plano = [];
    const add = (a, kcal) => {
      if (!a || kcal < 40) return;
      const f = info(a.id), un = undDe(a) === 'un', bruta = kcal / f.k;
      const q = un ? Math.max(0.5, Math.round(bruta * 2) / 2) : Math.max(5, Math.round(bruta / 5) * 5), real = q * f.k;
      plano.push({ a, q, real, und: undTexto(a) }); k -= real;
    };
    const pr = melhor('proteina', 'p'); if (pr && faltaP > 5) add(pr, Math.min(faltaP / info(pr.id).p * info(pr.id).k, k * 0.5));
    const ca = melhor('carbo', 'c'); if (ca) add(ca, k > 300 ? k * 0.75 : k);
    const go = melhor('gordura', 'g'); if (go && k > 90) add(go, Math.min(k, 150));
    if (!plano.length) return alert('Não encontrei alimentos suficientes no estoque.');
    const { ov, fechar } = modal(`<h3>🍽️ Para fechar o dia</h3><p style="font-size:13px;color:#cbd5e1;margin-bottom:10px">Faltam cerca de <strong>${Math.round(faltaK)} kcal</strong> e <strong>${Math.round(faltaP)}g</strong> de proteína. Sugestão com o seu estoque:</p>`
      + plano.map((x, i) => `<div class="refeicao-item"><span>${x.a.nome}: <strong>${x.q}${x.und}</strong> (~${Math.round(x.real)} kcal)</span><button class="btn-acao" data-i="${i}">➕</button></div>`).join('')
      + '<button id="fd-x" class="btn-primario" style="margin-top:10px;background:#475569">Fechar</button>');
    $('fd-x').onclick = fechar;
    ov.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => {
      const x = plano[b.dataset.i]; $('select-avulso').value = x.a.id; $('qtd-avulso').value = x.q; $('btn-add-avulso').click(); b.disabled = true; b.textContent = '✅';
    });
  };

  // ---------- Relatório semanal ----------
  document.querySelector('.container').insertAdjacentHTML('beforeend', secao('📅 Relatório Semanal', '<div id="rel-semana" style="white-space:pre-line;font-size:14px;color:#cbd5e1"></div><button id="rel-btn" class="btn-primario" style="margin-top:10px">Compartilhar / copiar</button>'));
  function relatorio() {
    const h = LS.get('historicoDias', {}), p = LS.get('registroPeso', {}), dias = ult(h, 7);
    if (!dias.length) return 'Ainda sem dados. O resumo aparece conforme você usa o app.';
    const med = k => Math.round(dias.reduce((a, d) => a + h[d][k], 0) / dias.length);
    const bateu = dias.filter(d => h[d].k >= h[d].meta * 0.95 && h[d].k <= h[d].meta * 1.05).length, pd = ult(p, 7);
    let t = `📅 Resumo (${dias[0].slice(0, 5)} a ${dias[dias.length - 1].slice(0, 5)})\nMédia: ${med('k')} kcal/dia · P ${med('p')}g · C ${med('c')}g · G ${med('g')}g\nMeta batida (±5%) em ${bateu} de ${dias.length} dias`;
    if (pd.length >= 2) { const d = p[pd[pd.length - 1]] - p[pd[0]]; t += `\nPeso: ${p[pd[0]]} → ${p[pd[pd.length - 1]]} kg (${d >= 0 ? '+' : ''}${d.toFixed(1)})`; }
    return t;
  }
  $('rel-btn').onclick = () => { const t = relatorio(); if (navigator.share) navigator.share({ text: t }).catch(() => {}); else navigator.clipboard.writeText(t).then(() => alert('Relatório copiado!')); };

  // ---------- Código de barras (Open Food Facts) ----------
  $('form-alimento').insertAdjacentHTML('afterbegin', '<button type="button" id="btn-scan" class="btn-primario" style="margin-bottom:10px;background:#0ea5e9">📷 Escanear código de barras</button>');
  $('btn-scan').onclick = () => {
    let stream, tm, aberto = true;
    const parar = () => { aberto = false; clearTimeout(tm); clearInterval(tm); if (stream) stream.getTracks().forEach(t => t.stop()); };
    const { fechar } = modal('<h3>📷 Código de barras</h3><video id="scan-v" playsinline muted style="width:100%;border-radius:8px;background:#000;display:none"></video><p id="scan-msg" style="font-size:13px;color:#94a3b8;margin:8px 0"></p><input id="scan-cod" type="text" inputmode="numeric" placeholder="Ou digite o código (EAN)"><div class="form-row" style="margin-top:10px"><button id="scan-ok" class="btn-primario">Buscar</button><button id="scan-x" class="btn-primario" style="background:#475569">Fechar</button></div>', parar);
    const msg = t => { const e = $('scan-msg'); if (e) e.textContent = t; };
    $('scan-x').onclick = fechar;
    const buscar = async cod => {
      msg('Buscando ' + cod + '...');
      try {
        const j = await (await fetch('https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(cod) + '.json?fields=product_name,brands,nutriments')).json();
        if (j.status !== 1) { msg('Produto não encontrado. Cadastre manualmente.'); return false; }
        const n = j.product.nutriments || {}, kc = n['energy-kcal_100g'] ?? (n.energy_100g ? n.energy_100g / 4.184 : 0);
        $('nome-alimento').value = [j.product.product_name, (j.product.brands || '').split(',')[0]].filter(Boolean).join(' - ');
        const catBarras = [['proteina', (n.proteins_100g || 0) * 4], ['carbo', (n.carbohydrates_100g || 0) * 4], ['gordura', (n.fat_100g || 0) * 9]].sort((a, b) => b[1] - a[1])[0][0];
        preencherCadastro(catBarras, '', Math.round(kc), n.proteins_100g, n.carbohydrates_100g, n.fat_100g);
        fechar(); alert('Dados preenchidos! Confira e toque em Cadastrar Alimento.'); return true;
      } catch (e) { msg('Sem conexão ou erro na busca.'); return false; }
    };
    $('scan-ok').onclick = () => { const c = $('scan-cod').value.trim(); if (c) buscar(c); };
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices) return msg('Este navegador não lê código de barras pela câmera. Digite o código abaixo.');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
      if (!aberto) return s.getTracks().forEach(t => t.stop());
      stream = s; const v = $('scan-v'); v.srcObject = s; v.style.display = 'block'; v.play(); msg('Aponte a câmera para o código de barras.');
      const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }); let busy = false;
      const iniciar = () => { tm = setInterval(async () => {
        if (busy) return; busy = true;
        try { const c = await det.detect(v); if (c.length) { clearInterval(tm); if (!(await buscar(c[0].rawValue)) && aberto) tm = setTimeout(iniciar, 3000); } } catch (e) {}
        busy = false;
      }, 500); };
      iniciar();
    }).catch(() => msg('Não consegui abrir a câmera. Digite o código abaixo.'));
  };

  const _ae = atualizarExtras;
  atualizarExtras = function () { _ae(); sugerirMeta(); const r = $('rel-semana'); if (r) r.textContent = relatorio(); };

  carregarEstoque(); atualizarExtras();
})();
