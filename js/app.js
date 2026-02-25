/* ═══════════════════════════════════════════════
   Terminal Home — JavaScript
   CLI-style Chrome New Tab Page
   ═══════════════════════════════════════════════ */

(() => {
  'use strict';

  // ════════════════ DEFAULT CONFIG ════════════════
  const DEFAULTS = {
    username: 'visitor',
    searchEngine: 'google',
    shortcuts: [
      {
        category: 'WORK',
        links: [
          { name: 'Gmail',    url: 'https://gmail.com' },
          { name: 'Calendar', url: 'https://calendar.google.com' },
          { name: 'Drive',    url: 'https://drive.google.com' },
          { name: 'Notion',   url: 'https://notion.so' },
        ],
      },
      {
        category: 'DEV',
        links: [
          { name: 'GitHub',         url: 'https://github.com' },
          { name: 'StackOverflow',  url: 'https://stackoverflow.com' },
          { name: 'MDN',            url: 'https://developer.mozilla.org' },
        ],
      },
      {
        category: 'MEDIA',
        links: [
          { name: 'YouTube', url: 'https://youtube.com' },
          { name: 'Reddit',  url: 'https://reddit.com' },
          { name: 'Twitter', url: 'https://twitter.com' },
        ],
      },
    ],
    market: [
      { id: 'bitcoin',  symbol: 'BTC',  name: 'Bitcoin' },
      { id: 'ethereum', symbol: 'ETH',  name: 'Ethereum' },
      { id: 'pax-gold', symbol: 'GOLD', name: 'Gold' },
    ],
    panelOrder: ['clock', 'ip', 'market', 'shortcuts'],
    clockFormat: 'en',
    theme: 'dark',
  };

  const SEARCH_ENGINES = {
    google:     { name: 'Google',     url: 'https://www.google.com/search?q=' },
    bing:       { name: 'Bing',       url: 'https://www.bing.com/search?q=' },
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    baidu:      { name: 'Baidu',      url: 'https://www.baidu.com/s?wd=' },
  };

  const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
  const COINGECKO_SEARCH = 'https://api.coingecko.com/api/v3/search';

  const DOMESTIC_APIS = [
    { url: 'https://myip.ipip.net/',          type: 'text',  parse: function(text) { var m = text.match(/(\d+\.\d+\.\d+\.\d+)/); var parts = text.replace(/当前 IP：/, '').split(/\s+来自于：/); return m ? { ip: m[1], geo: (parts[1] || '').trim() } : null; } },
    { url: 'https://whois.pconline.com.cn/ipJson.jsp?json=true', type: 'json', parse: function(d) { return d.ip ? { ip: d.ip, geo: [d.pro, d.city, d.addr].filter(Boolean).join(' ') } : null; } },
    { url: 'https://api.ip.sb/geoip',         type: 'json',  parse: function(d) { return d.ip ? { ip: d.ip, geo: [d.country, d.city, d.organization].filter(Boolean).join(' ') } : null; } },
  ];

  const IP_APIS = [
    { url: 'https://api.ip.sb/geoip',          parse: function(d) { return { ip: d.ip, city: d.city, country: d.country, isp: d.organization || '\u2014', tz: d.timezone }; } },
    { url: 'http://ip-api.com/json/?fields=query,city,country,isp,timezone', parse: function(d) { return { ip: d.query, city: d.city, country: d.country, isp: d.isp || '\u2014', tz: d.timezone }; } },
    { url: 'https://freeipapi.com/api/json',   parse: function(d) { return { ip: d.ipAddress, city: d.cityName, country: d.countryName, isp: d.ispName || '\u2014', tz: d.timeZone }; } },
    { url: 'https://api.ipify.org?format=json', parse: function(d) { return { ip: d.ip, city: '\u2014', country: '\u2014', isp: '\u2014', tz: '\u2014' }; } },
  ];

  const MARKET_CACHE_TTL = 5 * 60 * 1000;
  const IP_CACHE_TTL = 30 * 60 * 1000;

  // ════════════════ STORAGE HELPERS ════════════════
  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem('th_' + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch(e) { return fallback; }
    },
    set(key, value) {
      localStorage.setItem('th_' + key, JSON.stringify(value));
    },
  };

  function getConfig() {
    return {
      username:     Store.get('username', DEFAULTS.username),
      searchEngine: Store.get('searchEngine', DEFAULTS.searchEngine),
      shortcuts:    Store.get('shortcuts', DEFAULTS.shortcuts),
      market:       Store.get('market', DEFAULTS.market),
      panelOrder:   Store.get('panelOrder', DEFAULTS.panelOrder),
      clockFormat:  Store.get('clockFormat', DEFAULTS.clockFormat),
      theme:        Store.get('theme', DEFAULTS.theme),
    };
  }

  function saveConfig(cfg) {
    Store.set('username', cfg.username);
    Store.set('searchEngine', cfg.searchEngine);
    Store.set('shortcuts', cfg.shortcuts);
    Store.set('market', cfg.market);
    Store.set('panelOrder', cfg.panelOrder);
    Store.set('clockFormat', cfg.clockFormat);
    Store.set('theme', cfg.theme);
  }

  const $ = function(sel) { return document.querySelector(sel); };
  const $$ = function(sel) { return document.querySelectorAll(sel); };

  // ════════════════ CLOCK ════════════════
  const Clock = {
    init() {
      this.tick();
      setInterval(() => this.tick(), 1000);
    },
    tick() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const time = h + ':' + m + ':' + s;
      $('#top-bar-clock').textContent = time;

      const fmt = getConfig().clockFormat;
      if (fmt === 'zh') {
        const zhDays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
        const dateStr = now.getFullYear() + '年' + (now.getMonth()+1) + '月' + now.getDate() + '日 ' + zhDays[now.getDay()];
        $('#clock-time').textContent = time;
        $('#clock-date').textContent = dateStr;
        const lunarEl = $('#clock-lunar');
        if (lunarEl) lunarEl.textContent = this.getLunarDate(now);
      } else {
        const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        const dateStr = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
        $('#clock-time').textContent = time;
        $('#clock-date').textContent = dateStr;
        const lunarEl = $('#clock-lunar');
        if (lunarEl) lunarEl.textContent = '';
      }
    },

    // ── Lunar calendar calculation ──
    getLunarDate(date) {
      const lunarInfo = [
        0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
        0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
        0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
        0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
        0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
        0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
        0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
        0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
        0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
        0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
        0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
        0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
        0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
        0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
        0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
        0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
        0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
        0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
        0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
        0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
        0x0d520
      ];

      function lYearDays(y) {
        var sum = 348;
        for (var i = 0x8000; i > 0x8; i >>= 1) sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
        return sum + leapDays(y);
      }
      function leapMonth(y) { return lunarInfo[y - 1900] & 0xf; }
      function leapDays(y) {
        if (leapMonth(y)) return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
        return 0;
      }
      function monthDays(y, m) {
        if (m > 12 || m < 1) return -1;
        return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
      }

      var offset = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1900, 0, 31)) / 86400000);
      var year = 1900, temp = 0;
      for (; year < 2101 && offset > 0; year++) {
        temp = lYearDays(year);
        offset -= temp;
      }
      if (offset < 0) { offset += temp; year--; }

      var isLeap = false;
      var lm = leapMonth(year);
      var month = 1;
      for (; month < 13 && offset > 0; month++) {
        if (lm > 0 && month === (lm + 1) && !isLeap) {
          --month; isLeap = true;
          temp = leapDays(year);
        } else {
          temp = monthDays(year, month);
        }
        if (isLeap && month === (lm + 1)) isLeap = false;
        offset -= temp;
      }
      if (offset === 0 && lm > 0 && month === lm + 1) {
        if (isLeap) { isLeap = false; } else { isLeap = true; --month; }
      }
      if (offset < 0) { offset += temp; --month; }
      var day = offset + 1;

      var zhMonths = ['正','二','三','四','五','六','七','八','九','十','十一','腊'];
      var zhDaysPre = ['初','十','廿','卅'];
      var zhNums = ['十','一','二','三','四','五','六','七','八','九'];
      function formatDay(d) {
        if (d === 10) return '初十';
        if (d === 20) return '二十';
        if (d === 30) return '三十';
        return zhDaysPre[Math.floor(d/10)] + zhNums[d%10];
      }

      // Heavenly Stems & Earthly Branches for year
      var tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
      var diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      var shengXiao = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
      var gzYear = tianGan[(year - 4) % 10] + diZhi[(year - 4) % 12];
      var sx = shengXiao[(year - 4) % 12];

      return gzYear + '年(' + sx + ') ' + (isLeap ? '闰' : '') + zhMonths[month-1] + '月' + formatDay(day);
    },
  };

  // ════════════════ SEARCH ════════════════
  const Search = {
    init() {
      const cfg = getConfig();
      this.updateBadge(cfg.searchEngine);
      this.updatePrompt(cfg.username);

      $('#search-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          const q = e.target.value.trim();
          if (!q) return;
          const engine = getConfig().searchEngine;
          const url = SEARCH_ENGINES[engine] ? SEARCH_ENGINES[engine].url : SEARCH_ENGINES.google.url;
          window.location.href = url + encodeURIComponent(q);
        }
      });

      $('#search-engine-badge').addEventListener('click', () => {
        const keys = Object.keys(SEARCH_ENGINES);
        const cfg = getConfig();
        const idx = keys.indexOf(cfg.searchEngine);
        const next = keys[(idx + 1) % keys.length];
        cfg.searchEngine = next;
        saveConfig(cfg);
        this.updateBadge(next);
      });
    },
    updateBadge(engine) {
      $('#search-engine-badge').textContent = SEARCH_ENGINES[engine] ? SEARCH_ENGINES[engine].name : 'Google';
    },
    updatePrompt(username) {
      $('#prompt-user').textContent = username || 'visitor';
    },
  };

  // ════════════════ SHORTCUTS (inline add/edit/delete) ════════════════
  const Shortcuts = {
    addFormVisible: false,

    init() {
      this.render();
      const addBtn = $('#btn-add-shortcut');
      if (addBtn) addBtn.addEventListener('click', () => this.toggleAddForm());
    },

    render() {
      const cfg = getConfig();
      const container = $('#shortcuts-list');
      container.innerHTML = '';

      if (!cfg.shortcuts || cfg.shortcuts.length === 0) {
        container.innerHTML = '<div class="dim" style="font-size:0.78rem;">no shortcuts \u2014 click + to add</div>';
        this._appendAddForm(container);
        return;
      }

      cfg.shortcuts.forEach((cat, ci) => {
        const block = document.createElement('div');
        block.className = 'shortcut-category';

        const catName = document.createElement('div');
        catName.className = 'shortcut-cat-name';
        catName.innerHTML = '<span>// ' + esc(cat.category) + '</span>' +
          '<span class="cat-actions">' +
          '<button class="cat-action-btn del" data-ci="' + ci + '" title="Delete category">\u2715</button>' +
          '</span>';
        block.appendChild(catName);

        cat.links.forEach(function(link, li) {
          const row = document.createElement('div');
          row.className = 'shortcut-row';
          row.innerHTML = '<a class="shortcut-link" href="' + esc(link.url) + '" title="' + esc(link.url) + '">' + link.name.toLowerCase() + '</a>' +
            '<span class="link-action-btns">' +
            '<button class="link-action-btn" data-ci="' + ci + '" data-li="' + li + '" data-act="edit" title="Edit">\u270E</button>' +
            '<button class="link-action-btn del" data-ci="' + ci + '" data-li="' + li + '" data-act="del" title="Delete">\u2715</button>' +
            '</span>';
          block.appendChild(row);
        });

        container.appendChild(block);
      });

      this._appendAddForm(container);
      this._bindEvents(container);
    },

    _appendAddForm(container) {
      const form = document.createElement('div');
      form.className = 'inline-add-form' + (this.addFormVisible ? '' : ' hidden');
      form.id = 'shortcut-add-form';
      form.innerHTML =
        '<input type="text" class="iaf-cat"  placeholder="CAT" id="iaf-cat" spellcheck="false">' +
        '<input type="text" class="iaf-name" placeholder="name" id="iaf-name" spellcheck="false">' +
        '<input type="text" class="iaf-url"  placeholder="https://..." id="iaf-url" spellcheck="false">' +
        '<button id="iaf-submit">add</button>';
      container.appendChild(form);

      const self = this;
      form.querySelector('#iaf-submit').addEventListener('click', function() { self._submitAdd(); });
      form.querySelectorAll('input').forEach(function(inp) {
        inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') self._submitAdd(); });
      });
    },

    _bindEvents(container) {
      const self = this;
      container.addEventListener('click', function(e) {
        const linkBtn = e.target.closest('[data-act]');
        if (linkBtn) {
          const ci = parseInt(linkBtn.dataset.ci);
          const li = parseInt(linkBtn.dataset.li);
          if (linkBtn.dataset.act === 'del') {
            const cfg = getConfig();
            cfg.shortcuts[ci].links.splice(li, 1);
            if (cfg.shortcuts[ci].links.length === 0) cfg.shortcuts.splice(ci, 1);
            saveConfig(cfg);
            self.render();
          } else if (linkBtn.dataset.act === 'edit') {
            self._editLink(ci, li);
          }
          return;
        }
        const catBtn = e.target.closest('.cat-action-btn.del');
        if (catBtn) {
          const ci = parseInt(catBtn.dataset.ci);
          const cfg = getConfig();
          cfg.shortcuts.splice(ci, 1);
          saveConfig(cfg);
          self.render();
        }
      });
    },

    _submitAdd() {
      const cat = ($('#iaf-cat').value.trim() || 'DEFAULT').toUpperCase();
      const name = $('#iaf-name').value.trim();
      let url = $('#iaf-url').value.trim();
      if (!name || !url) return;
      if (!url.startsWith('http')) url = 'https://' + url;
      const cfg = getConfig();
      const existing = cfg.shortcuts.find(function(c) { return c.category.toUpperCase() === cat; });
      if (existing) {
        existing.links.push({ name: name, url: url });
      } else {
        cfg.shortcuts.push({ category: cat, links: [{ name: name, url: url }] });
      }
      saveConfig(cfg);
      this.addFormVisible = false;
      this.render();
    },

    _editLink(ci, li) {
      const cfg = getConfig();
      const link = cfg.shortcuts[ci].links[li];
      const newName = prompt('Name:', link.name);
      if (newName === null) return;
      const newUrl = prompt('URL:', link.url);
      if (newUrl === null) return;
      link.name = newName.trim() || link.name;
      link.url = newUrl.trim() || link.url;
      saveConfig(cfg);
      this.render();
    },

    toggleAddForm() {
      this.addFormVisible = !this.addFormVisible;
      const form = $('#shortcut-add-form');
      if (form) {
        form.classList.toggle('hidden');
        if (this.addFormVisible) {
          const ci = form.querySelector('#iaf-cat');
          if (ci) ci.focus();
        }
      }
    },
  };

  // ════════════════ IP INFO (multi-API + LAN) ════════════════
  function copyIP(text, btnEl) {
    navigator.clipboard.writeText(text).then(function() {
      btnEl.textContent = '✓';
      btnEl.classList.add('copied');
      setTimeout(function() { btnEl.textContent = 'cp'; btnEl.classList.remove('copied'); }, 1200);
    }).catch(function() {});
  }

  function ipRowHTML(label, value, opts) {
    opts = opts || {};
    var dimClass = opts.dim ? ' dim' : '';
    var isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(value);
    var copyBtn = isIP ? '<button class="ip-copy" onclick="this.dispatchEvent(new CustomEvent(\'ipcopy\',{bubbles:true,detail:\'' + value + '\'}))" title="Copy">cp</button>' : '';
    return '<div class="ip-row">' +
      '<span class="ip-label">' + label + '</span>' +
      '<span class="ip-value' + dimClass + '">' + value + '</span>' +
      copyBtn + '</div>';
  }

  const IpInfo = {
    init() {
      this.fetchProxyIP();
      this.fetchDomesticIP();
      // Delegate copy events
      var ipPanel = document.querySelector('.panel-ip');
      if (ipPanel && !ipPanel._copyBound) {
        ipPanel.addEventListener('ipcopy', function(e) { copyIP(e.detail, e.target); });
        ipPanel._copyBound = true;
      }
      const btn = $('#btn-refresh-ip');
      if (btn) {
        const self = this;
        btn.addEventListener('click', function() {
          Store.set('ipCache', null);
          Store.set('domesticCache', null);
          self.fetchProxyIP();
          self.fetchDomesticIP();
        });
      }
    },

    async fetchProxyIP() {
      const cached = Store.get('ipCache', null);
      if (cached && cached.ts && (Date.now() - cached.ts < IP_CACHE_TTL)) {
        this.displayProxy(cached.data);
        return;
      }

      setStatus('fetching ip info...');
      for (let i = 0; i < IP_APIS.length; i++) {
        const api = IP_APIS[i];
        try {
          const controller = new AbortController();
          const tid = setTimeout(function() { controller.abort(); }, 5000);
          const res = await fetch(api.url, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) continue;
          const raw = await res.json();
          const data = api.parse(raw);
          if (data.ip) {
            Store.set('ipCache', { data: data, ts: Date.now() });
            this.displayProxy(data);
            setStatus('READY');
            return;
          }
        } catch(e) { /* try next */ }
      }
      this.displayProxyError();
      setStatus('READY');
    },

    displayProxy(data) {
      const container = $('#ip-proxy-info');
      if (!container) return;
      container.innerHTML =
        ipRowHTML('inet', data.ip || '\u2014') +
        ipRowHTML('geo', [data.city, data.country].filter(Boolean).join(', ') || '\u2014') +
        ipRowHTML('isp', data.isp || '\u2014') +
        ipRowHTML('tz', data.tz || '\u2014');
    },

    displayProxyError() {
      const c = $('#ip-proxy-info');
      if (c) c.innerHTML = ipRowHTML('status', 'all API endpoints failed');
    },

    async fetchDomesticIP() {
      const cached = Store.get('domesticCache', null);
      if (cached && cached.ts && (Date.now() - cached.ts < IP_CACHE_TTL)) {
        this.displayDomestic(cached.data);
        return;
      }
      for (let i = 0; i < DOMESTIC_APIS.length; i++) {
        const api = DOMESTIC_APIS[i];
        try {
          const controller = new AbortController();
          const tid = setTimeout(function() { controller.abort(); }, 5000);
          const res = await fetch(api.url, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) continue;
          var raw;
          if (api.type === 'text') {
            raw = await res.text();
          } else {
            raw = await res.json();
          }
          const data = api.parse(raw);
          if (data && data.ip) {
            Store.set('domesticCache', { data: data, ts: Date.now() });
            this.displayDomestic(data);
            return;
          }
        } catch(e) { /* try next */ }
      }
      this.displayDomesticError();
    },

    displayDomestic(data) {
      const c = $('#ip-domestic-info');
      if (!c) return;
      c.innerHTML =
        ipRowHTML('inet', data.ip || '\u2014') +
        ipRowHTML('geo', data.geo || '\u2014');
    },

    displayDomesticError() {
      const c = $('#ip-domestic-info');
      if (c) c.innerHTML = ipRowHTML('status', 'unavailable', { dim: true });
    },
  };

  // ════════════════ MARKET (search + add/remove) ════════════════
  const Market = {
    searchTimeout: null,

    async init() {
      const cached = Store.get('marketCache', null);
      if (cached && cached.ts && (Date.now() - cached.ts < MARKET_CACHE_TTL)) {
        this.display(cached.data);
        this.fetchSilent();
      } else {
        await this.fetch();
      }

      const self = this;
      const btn = $('#btn-refresh-market');
      if (btn) btn.addEventListener('click', function() { self.fetch(); });
      this._initSearch();
    },

    _initSearch() {
      const input = $('#market-search-input');
      const results = $('#market-search-results');
      if (!input || !results) return;

      const self = this;
      input.addEventListener('input', function() {
        clearTimeout(self.searchTimeout);
        const q = input.value.trim();
        if (q.length < 2) {
          results.classList.add('hidden');
          return;
        }
        self.searchTimeout = setTimeout(function() { self._doSearch(q); }, 400);
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          input.value = '';
          results.classList.add('hidden');
        }
      });

      document.addEventListener('click', function(e) {
        if (!e.target.closest('.market-search-box')) {
          results.classList.add('hidden');
        }
      });
    },

    async _doSearch(query) {
      const results = $('#market-search-results');
      results.innerHTML = '<div class="market-search-no-results">searching...</div>';
      results.classList.remove('hidden');

      const self = this;
      try {
        const res = await fetch(COINGECKO_SEARCH + '?query=' + encodeURIComponent(query));
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const coins = (data.coins || []).slice(0, 8);

        if (coins.length === 0) {
          results.innerHTML = '<div class="market-search-no-results">no results found</div>';
          return;
        }

        const cfg = getConfig();
        results.innerHTML = coins.map(function(c) {
          const exists = cfg.market.some(function(m) { return m.id === c.id; });
          return '<div class="market-search-item' + (exists ? ' dim' : '') + '" ' +
            'data-id="' + c.id + '" data-symbol="' + c.symbol.toUpperCase() + '" data-name="' + esc(c.name) + '">' +
            '<span class="msi-symbol">' + c.symbol.toUpperCase() + '</span>' +
            '<span class="msi-name">' + esc(c.name) + '</span>' +
            '<span class="msi-rank">' + (exists ? 'added' : (c.market_cap_rank ? '#' + c.market_cap_rank : '')) + '</span>' +
            '</div>';
        }).join('');

        results.querySelectorAll('.market-search-item:not(.dim)').forEach(function(item) {
          item.addEventListener('click', function() {
            self._addTicker(item.dataset.id, item.dataset.symbol, item.dataset.name);
            results.classList.add('hidden');
            input.value = '';
          });
        });
      } catch(err) {
        results.innerHTML = '<div class="market-search-no-results" style="color:var(--red)">search error</div>';
      }
    },

    _addTicker(id, symbol, name) {
      const cfg = getConfig();
      if (cfg.market.some(function(m) { return m.id === id; })) return;
      cfg.market.push({ id: id, symbol: symbol, name: name });
      saveConfig(cfg);
      this.fetch();
    },

    _removeTicker(id) {
      const cfg = getConfig();
      cfg.market = cfg.market.filter(function(m) { return m.id !== id; });
      saveConfig(cfg);
      const cached = Store.get('marketCache', null);
      if (cached && cached.data) {
        this.display(cached.data);
      }
    },

    async fetch() {
      try {
        setStatus('fetching market data...');
        const data = await this._fetchData();
        Store.set('marketCache', { data: data, ts: Date.now() });
        this.display(data);
        setStatus('READY');
      } catch(err) {
        const cached = Store.get('marketCache', null);
        if (cached && cached.data) this.display(cached.data);
        else this.displayError(err.message);
        setStatus('READY');
      }
    },

    async fetchSilent() {
      try {
        const data = await this._fetchData();
        Store.set('marketCache', { data: data, ts: Date.now() });
        this.display(data);
      } catch(e) { /* silent */ }
    },

    async _fetchData() {
      const cfg = getConfig();
      if (!cfg.market || cfg.market.length === 0) return {};
      const ids = cfg.market.map(function(m) { return m.id; }).join(',');
      const url = COINGECKO_API + '?ids=' + ids + '&vs_currencies=usd&include_24hr_change=true';
      const res = await fetch(url);
      if (!res.ok) throw new Error('API ' + res.status);
      return res.json();
    },

    display(data) {
      const cfg = getConfig();
      const tbody = $('#market-body');
      if (!tbody) return;

      if (!cfg.market || cfg.market.length === 0) {
        tbody.innerHTML = '<tr class="market-loading"><td colspan="4" class="dim">search above to add assets</td></tr>';
        return;
      }

      const self = this;
      tbody.innerHTML = cfg.market.map(function(item) {
        const d = data[item.id];
        if (!d) {
          return '<tr>' +
            '<td><span class="market-symbol">' + item.symbol + '</span></td>' +
            '<td class="col-price dim">\u2014</td>' +
            '<td class="col-change dim">\u2014</td>' +
            '<td class="col-action"><button class="market-remove-btn" data-id="' + item.id + '" title="Remove">\u2715</button></td>' +
            '</tr>';
        }
        const price = d.usd;
        const change = d.usd_24h_change;
        const changeClass = change > 0 ? 'change-up' : change < 0 ? 'change-down' : 'change-neutral';
        const changeSign = change > 0 ? '\u25B2' : change < 0 ? '\u25BC' : '\u2022';
        const fp = self.formatPrice(price);
        const fc = Math.abs(change).toFixed(2);

        return '<tr>' +
          '<td><span class="market-symbol">' + item.symbol + '</span><span class="market-name">' + item.name + '</span></td>' +
          '<td class="col-price"><span class="market-price">$' + fp + '</span></td>' +
          '<td class="col-change"><span class="' + changeClass + '">' + changeSign + ' ' + fc + '%</span></td>' +
          '<td class="col-action"><button class="market-remove-btn" data-id="' + item.id + '" title="Remove">\u2715</button></td>' +
          '</tr>';
      }).join('');

      tbody.querySelectorAll('.market-remove-btn').forEach(function(btn) {
        btn.addEventListener('click', function() { self._removeTicker(btn.dataset.id); });
      });
    },

    displayError(msg) {
      const tbody = $('#market-body');
      if (tbody) tbody.innerHTML = '<tr class="market-error"><td colspan="4">error: ' + msg + '</td></tr>';
    },

    formatPrice(p) {
      if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (p >= 1) return p.toFixed(2);
      return p.toPrecision(4);
    },
  };

  // ════════════════ DRAG & DROP ════════════════
  const DragDrop = {
    draggedEl: null,

    init() {
      this.restoreOrder();
      const self = this;
      const panels = $$('.drag-panel');
      panels.forEach(function(panel) {
        panel.addEventListener('dragstart', function(e) { self.onDragStart(e, panel); });
        panel.addEventListener('dragend',   function(e) { self.onDragEnd(e, panel); });
        panel.addEventListener('dragover',  function(e) { self.onDragOver(e, panel); });
        panel.addEventListener('dragenter', function(e) { self.onDragEnter(e, panel); });
        panel.addEventListener('dragleave', function(e) { self.onDragLeave(e, panel); });
        panel.addEventListener('drop',      function(e) { self.onDrop(e, panel); });
      });
    },

    onDragStart(e, panel) {
      this.draggedEl = panel;
      panel.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', panel.dataset.panelId);
    },

    onDragEnd(e, panel) {
      panel.classList.remove('dragging');
      $$('.drag-panel').forEach(function(p) { p.classList.remove('drag-over'); });
      this.draggedEl = null;
    },

    onDragOver(e, panel) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },

    onDragEnter(e, panel) {
      e.preventDefault();
      if (panel !== this.draggedEl) {
        panel.classList.add('drag-over');
      }
    },

    onDragLeave(e, panel) {
      panel.classList.remove('drag-over');
    },

    onDrop(e, panel) {
      e.preventDefault();
      panel.classList.remove('drag-over');
      if (!this.draggedEl || panel === this.draggedEl) return;

      const grid = $('#panel-grid');
      const allPanels = Array.from(grid.querySelectorAll('.drag-panel'));
      const fromIdx = allPanels.indexOf(this.draggedEl);
      const toIdx = allPanels.indexOf(panel);

      if (fromIdx < toIdx) {
        panel.after(this.draggedEl);
      } else {
        panel.before(this.draggedEl);
      }
      this.saveOrder();
    },

    saveOrder() {
      const panels = Array.from($$('.drag-panel'));
      const order = panels.map(function(p) { return p.dataset.panelId; });
      const cfg = getConfig();
      cfg.panelOrder = order;
      saveConfig(cfg);
    },

    restoreOrder() {
      const cfg = getConfig();
      const order = cfg.panelOrder;
      if (!order || order.length === 0) return;

      const grid = $('#panel-grid');
      if (!grid) return;
      order.forEach(function(id) {
        const panel = grid.querySelector('[data-panel-id="' + id + '"]');
        if (panel) grid.appendChild(panel);
      });
    },
  };

  // ════════════════ SETTINGS ════════════════
  const Settings = {
    tempConfig: null,

    init() {
      const self = this;
      const btnOpen = $('#btn-settings');
      if (btnOpen) btnOpen.addEventListener('click', function() { self.open(); });
      const btnClose = $('#btn-close-settings');
      if (btnClose) btnClose.addEventListener('click', function() { self.close(); });
      const btnSave = $('#s-save');
      if (btnSave) btnSave.addEventListener('click', function() { self.save(); });
      const btnCancel = $('#s-cancel');
      if (btnCancel) btnCancel.addEventListener('click', function() { self.close(); });
      const btnAddCat = $('#s-add-category');
      if (btnAddCat) btnAddCat.addEventListener('click', function() { self.addCategory(); });
      const btnAddTick = $('#s-add-ticker');
      if (btnAddTick) btnAddTick.addEventListener('click', function() { self.addTickerFromPreset(); });
      const btnCustomTick = $('#s-add-custom-ticker');
      if (btnCustomTick) btnCustomTick.addEventListener('click', function() { self.addCustomTicker(); });

      const overlay = $('#settings-overlay');
      if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === overlay) self.close();
      });
    },

    open() {
      this.tempConfig = JSON.parse(JSON.stringify(getConfig()));
      this.renderAll();
      const o = $('#settings-overlay');
      if (o) o.classList.remove('hidden');
      const u = $('#s-username');
      if (u) u.focus();
    },

    close() {
      const o = $('#settings-overlay');
      if (o) o.classList.add('hidden');
      this.tempConfig = null;
    },

    renderAll() {
      const cfg = this.tempConfig;
      const su = $('#s-username');
      if (su) su.value = cfg.username;
      const se = $('#s-search-engine');
      if (se) se.value = cfg.searchEngine;
      const scf = $('#s-clock-format');
      if (scf) scf.value = cfg.clockFormat || 'en';
      this.renderShortcuts();
      this.renderMarket();
    },

    renderShortcuts() {
      const container = $('#s-shortcuts-editor');
      if (!container) return;
      container.innerHTML = '';
      const self = this;
      const cats = this.tempConfig.shortcuts;

      cats.forEach(function(cat, ci) {
        const block = document.createElement('div');
        block.className = 's-category-block';

        const header = document.createElement('div');
        header.className = 's-cat-header';
        header.innerHTML =
          '<input type="text" value="' + esc(cat.category) + '" placeholder="CATEGORY" data-ci="' + ci + '" class="s-cat-name-input">' +
          '<button class="btn-delete" data-ci="' + ci + '" data-action="del-cat">\u2715</button>';
        block.appendChild(header);

        cat.links.forEach(function(link, li) {
          const row = document.createElement('div');
          row.className = 's-link-row';
          row.innerHTML =
            '<input type="text" value="' + esc(link.name) + '" class="s-link-name" placeholder="name" data-ci="' + ci + '" data-li="' + li + '" data-field="name">' +
            '<input type="text" value="' + esc(link.url) + '" class="s-link-url" placeholder="https://..." data-ci="' + ci + '" data-li="' + li + '" data-field="url">' +
            '<button class="btn-delete" data-ci="' + ci + '" data-li="' + li + '" data-action="del-link">\u2715</button>';
          block.appendChild(row);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-link';
        addBtn.textContent = '+ add link';
        addBtn.dataset.ci = ci;
        addBtn.addEventListener('click', function() { self.addLink(ci); });
        block.appendChild(addBtn);

        container.appendChild(block);
      });

      container.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const ci = parseInt(btn.dataset.ci);
        if (btn.dataset.action === 'del-cat') {
          self.tempConfig.shortcuts.splice(ci, 1);
          self.renderShortcuts();
        } else if (btn.dataset.action === 'del-link') {
          const li = parseInt(btn.dataset.li);
          self.tempConfig.shortcuts[ci].links.splice(li, 1);
          self.renderShortcuts();
        }
      });

      container.addEventListener('input', function(e) {
        const inp = e.target;
        if (inp.classList.contains('s-cat-name-input')) {
          self.tempConfig.shortcuts[parseInt(inp.dataset.ci)].category = inp.value;
        } else if (inp.dataset.field === 'name') {
          self.tempConfig.shortcuts[parseInt(inp.dataset.ci)].links[parseInt(inp.dataset.li)].name = inp.value;
        } else if (inp.dataset.field === 'url') {
          self.tempConfig.shortcuts[parseInt(inp.dataset.ci)].links[parseInt(inp.dataset.li)].url = inp.value;
        }
      });
    },

    renderMarket() {
      const container = $('#s-market-editor');
      if (!container) return;
      container.innerHTML = '';
      const self = this;
      this.tempConfig.market.forEach(function(item, i) {
        const row = document.createElement('div');
        row.className = 's-market-item';
        row.innerHTML =
          '<span class="s-market-symbol">' + item.symbol + '</span>' +
          '<span class="s-market-id">' + item.id + '</span>' +
          '<button class="btn-delete" data-mi="' + i + '">\u2715</button>';
        row.querySelector('.btn-delete').addEventListener('click', function() {
          self.tempConfig.market.splice(i, 1);
          self.renderMarket();
        });
        container.appendChild(row);
      });
    },

    addCategory() {
      this.tempConfig.shortcuts.push({ category: 'NEW', links: [] });
      this.renderShortcuts();
    },

    addLink(ci) {
      this.tempConfig.shortcuts[ci].links.push({ name: '', url: '' });
      this.renderShortcuts();
      const inputs = $$('#s-shortcuts-editor .s-category-block:nth-child(' + (ci + 1) + ') .s-link-name');
      const last = inputs[inputs.length - 1];
      if (last) last.focus();
    },

    addTickerFromPreset() {
      const sel = $('#s-ticker-preset');
      if (!sel || !sel.value) return;
      const parts = sel.value.split('|');
      const id = parts[0], symbol = parts[1], name = parts[2];
      if (this.tempConfig.market.some(function(m) { return m.id === id; })) { sel.value = ''; return; }
      this.tempConfig.market.push({ id: id, symbol: symbol, name: name });
      sel.value = '';
      this.renderMarket();
    },

    addCustomTicker() {
      const idInput = $('#s-custom-id');
      const symInput = $('#s-custom-symbol');
      if (!idInput || !symInput) return;
      const id = idInput.value.trim().toLowerCase();
      const symbol = symInput.value.trim().toUpperCase();
      if (!id || !symbol) return;
      if (this.tempConfig.market.some(function(m) { return m.id === id; })) return;
      this.tempConfig.market.push({ id: id, symbol: symbol, name: symbol });
      idInput.value = '';
      symInput.value = '';
      this.renderMarket();
    },

    save() {
      const su = $('#s-username');
      const se = $('#s-search-engine');
      this.tempConfig.username = su ? su.value.trim() || 'visitor' : 'visitor';
      this.tempConfig.searchEngine = se ? se.value : 'google';
      const scf = $('#s-clock-format');
      this.tempConfig.clockFormat = scf ? scf.value : 'en';
      this.tempConfig.shortcuts = this.tempConfig.shortcuts
        .map(function(cat) {
          return {
            category: cat.category.trim() || 'UNNAMED',
            links: cat.links.filter(function(l) { return l.name.trim() && l.url.trim(); }),
          };
        })
        .filter(function(cat) { return cat.links.length > 0; });

      saveConfig(this.tempConfig);
      this.close();

      // Refresh all modules immediately so changes are visible
      Search.updateBadge(this.tempConfig.searchEngine);
      Search.updatePrompt(this.tempConfig.username);
      Clock.tick();
      Shortcuts.render();
      Market.fetch();
      DragDrop.restoreOrder();
    },
  };

  // ════════════════ UTILS ════════════════
  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function setStatus(text) {
    const txt = $('#status-text');
    if (txt) txt.textContent = text;
  }

  // ════════════════ KEYBOARD ════════════════
  function initKeyboard() {
    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        const si = $('#search-input');
        if (si) si.focus();
      }
      if (e.key === ',' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const ov = $('#settings-overlay');
        if (ov) {
          ov.classList.contains('hidden') ? Settings.open() : Settings.close();
        }
      }
      if (e.key === 'Escape') {
        const ov = $('#settings-overlay');
        if (ov && !ov.classList.contains('hidden')) Settings.close();
      }
    });
  }

  function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  }

  // ════════════════ THEME ════════════════
  const Theme = {
    init() {
      const cfg = getConfig();
      this.apply(cfg.theme);
      const btn = $('#btn-theme');
      if (btn) btn.addEventListener('click', () => this.toggle());
    },
    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const btn = $('#btn-theme');
      if (btn) btn.textContent = theme === 'dark' ? '☀' : '☾';
    },
    toggle() {
      const cfg = getConfig();
      cfg.theme = cfg.theme === 'dark' ? 'light' : 'dark';
      Store.set('theme', cfg.theme);
      this.apply(cfg.theme);
    },
  };

  // ════════════════ INIT ════════════════
  function init() {
    Theme.init();
    DragDrop.init();
    Clock.init();
    Search.init();
    Shortcuts.init();
    IpInfo.init();
    Market.init();
    Settings.init();
    initKeyboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
