// Recursos extras: macros, editar/excluir, meta, histórico, gráficos, peso,
// lembretes, backup, desfazer, trocar alimento e sincronização Firebase.
(function () {
  const $ = id => document.getElementById(id);
  const LS = { get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } }, set: (k, v) => localStorage.setItem(k, JSON.stringify(v)) };
  const CHAVES = ['meuEstoqueOficial', 'cardapioDoDia', 'historicoDias', 'registroPeso', 'configApp'];
  const cfg = Object.assign({ meta: 3300, prot: 180, carbo: 450, gord: 90, lembretes: '07:00,10:00,13:00,16:00,19:00,22:00' }, LS.get('configApp', {}));
  window.pegarMeta = () => cfg.meta;

  // [kcal, proteína, carbo, gordura] por 100g/ml (valores aproximados)
  const T = { pao:[290,8,58,3.1], tapioca:[240,0,60,0], macarrao:[150,5,31,1], arroz:[130,2.5,28,.3], feijao:[76,4.8,13.6,.5], batata_doce:[86,1.6,20,.1], aveia:[380,13.5,66,7], banana:[89,1.1,23,.3], farinha_lactea:[380,8,80,3], mucilon:[380,8,82,1.5], bebida_lactea:[55.5,2.5,9,1.2], frango:[165,31,0,3.6], carne_moida:[250,26,0,16], ovos:[144,12.6,1,9.5], leite:[60,3.2,4.8,3.3], iogurte:[58,4,5,3], creatina:[0,0,0,0], leite_po:[500,26,38,27], chia:[466,16.5,42,31] };
  function info(id) {
    const a = alimentos.find(x => x.id === id) || {}, t = T[id] || [0, 0, 0, 0];
    return { k: a.kcal100g || t[0], p: a.prot100g ?? t[1], c: a.carbo100g ?? t[2], g: a.gord100g ?? t[3] };
  }
  const gramas = i => i.und.trim() === 'un.' ? i.currentQtd * 50 : i.currentQtd;
  const hoje = () => pegarDataDeHoje();
  const diaAtivo = () => cardapioDoDia && cardapioDoDia.data === hoje();

  function macrosDia() {
    const m = { k: 0, p: 0, c: 0, g: 0 };
    if (!diaAtivo()) return m;
    cardapioDoDia.refeicoes.forEach(r => r.itens.forEach(i => {
      if (i.status !== 'consumido') return;
      const f = info(i.idAlimento), q = gramas(i) / 100;
      m.k += i.currentKcal; m.p += f.p * q; m.c += f.c * q; m.g += f.g * q;
    }));
    return m;
  }
  function salvarDia() {
    if (!diaAtivo()) return;
    const m = macrosDia(), h = LS.get('historicoDias', {});
    h[hoje()] = { k: Math.round(m.k), p: Math.round(m.p), c: Math.round(m.c), g: Math.round(m.g), meta: cfg.meta };
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
    const un = esc.id === 'pao' || esc.id === 'ovos', kcalUn = un ? info(esc.id).k / 2 : info(esc.id).k / 100;
    let qtd = alvo.baseKcal / kcalUn; if (un) qtd = Math.max(1, Math.round(qtd * 2) / 2);
    Object.assign(alvo, { idAlimento: esc.id, nome: esc.nome, und: un ? ' un.' : (['leite', 'bebida_lactea'].includes(esc.id) ? 'ml' : 'g'), baseQtd: qtd, baseKcal: qtd * kcalUn });
    alvo.finalQtd = alvo.baseQtd; alvo.finalKcal = alvo.baseKcal;
    atualizarDinamicaCardapio(); salvarCardapio(); renderizarCardapio();
  };

  // ---------- Editar / excluir alimentos ----------
  window.editarAlimento = function (id) {
    const a = alimentos.find(x => x.id === id); if (!a) return;
    const f = info(id), nome = prompt('Nome do alimento:', a.nome); if (nome === null) return;
    a.nome = nome.trim() || a.nome;
    for (const [k, t, v] of [['kcal100g', 'Kcal por 100g', f.k], ['prot100g', 'Proteína por 100g', f.p], ['carbo100g', 'Carbo por 100g', f.c], ['gord100g', 'Gordura por 100g', f.g], ['limiteSemanal', 'Máx. dias/semana (vazio = sem limite)', a.limiteSemanal || '']]) {
      const r = prompt(t + ':', v); if (r === null) break;
      const n = parseFloat(r.replace(',', '.'));
      a[k] = isNaN(n) ? (k === 'limiteSemanal' ? null : a[k]) : n;
    }
    salvarEstoque(); carregarEstoque();
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
    secao('⚙️ Metas', '<div class="form-grid"><div class="form-row"><input type="number" id="cf-meta" placeholder="Kcal/dia"><input type="number" id="cf-prot" placeholder="Proteína (g)"></div><div class="form-row"><input type="number" id="cf-carbo" placeholder="Carbo (g)"><input type="number" id="cf-gord" placeholder="Gordura (g)"></div><button id="cf-salvar" class="btn-primario">Salvar metas</button><p style="font-size:12px;color:#94a3b8">A nova meta de kcal vale a partir do próximo "Gerar Menu".</p></div>') +
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
    document.querySelector('.section-card h4').textContent = '🎯 Meta do Dia: ' + cfg.meta + ' kcal';
    $('macros-barras').innerHTML = '<h4 style="margin-bottom:4px">📊 Consumido hoje</h4>' + barra('Calorias', m.k, cfg.meta + ' kcal', '#38bdf8') + barra('Proteína', m.p, cfg.prot + 'g', '#f87171').replace(/\/ (\d+g)/, '/ $1') + barra('Carboidrato', m.c, cfg.carbo + 'g', '#fbbf24') + barra('Gordura', m.g, cfg.gord + 'g', '#a78bfa');
    const h = LS.get('historicoDias', {}), dias = ult(h, 14);
    grafico($('g-kcal'), dias.map(d => d.slice(0, 5)), dias.map(d => h[d].k), cfg.meta, '#38bdf8');
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
    alimentos = LS.get('meuEstoqueOficial', alimentos); cardapioDoDia = LS.get('cardapioDoDia', null);
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

  carregarEstoque(); atualizarExtras();
})();
