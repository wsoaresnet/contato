/* ==========================================================================
   CAMADA DE DADOS - Supabase com fallback local (localStorage)
   Expõe window.createDataClient(url, key) com a mesma API usada no app:
   from().select/insert/update/upsert/delete + eq/in/gte/order/limit/single.
   ========================================================================== */
(function () {
  const LS_KEY = "diario_localdb_v1";
  const PROBE_TIMEOUT_MS = 5000;
  // tabela-filha -> { relação: coluna de chave estrangeira }
  const RELATIONS = { doctors: "doctor_id" };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function readStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeStore(db) {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  }

  function pkOf(table) { return table === "users" ? "username" : "id"; }

  // --------------------------------------------------------------- executor local
  function runLocal(q) {
    const db = readStore();
    const rows = db[q.table] = db[q.table] || [];
    const pk = pkOf(q.table);
    const matches = (r) => q.filters.every((f) => {
      if (f.type === "eq") return String(r[f.col]) === String(f.val);
      if (f.type === "in") return f.val.map(String).includes(String(r[f.col]));
      if (f.type === "gte") return r[f.col] >= f.val;
      return true;
    });
    const now = new Date().toISOString();
    let out = [];

    try {
      if (q.op === "insert" || q.op === "upsert") {
        const input = Array.isArray(q.payload) ? q.payload : [q.payload];
        for (const item of input) {
          const row = Object.assign({}, item);
          if (!row[pk] && pk === "id") row.id = uuid();
          const idx = rows.findIndex((r) => r[pk] === row[pk]);
          if (q.op === "insert" && idx >= 0) {
            return { data: null, error: { code: "23505", message: "Registro duplicado (" + pk + ")" } };
          }
          if (idx >= 0) {
            rows[idx] = Object.assign({}, rows[idx], row, { updated_at: now });
            out.push(rows[idx]);
          } else {
            row.created_at = row.created_at || now;
            rows.push(row);
            out.push(row);
          }
        }
      } else if (q.op === "update") {
        rows.forEach((r, i) => {
          if (matches(r)) {
            rows[i] = Object.assign({}, r, q.payload, { updated_at: now });
            out.push(rows[i]);
          }
        });
      } else if (q.op === "delete") {
        const removed = rows.filter(matches);
        db[q.table] = rows.filter((r) => !matches(r));
        // exclusão em cascata (username / doctor_id)
        if (q.table === "users") {
          const names = removed.map((r) => r.username);
          ["crises", "doctors", "appointments", "prescriptions"].forEach((t) => {
            if (db[t]) db[t] = db[t].filter((r) => !names.includes(r.username));
          });
        }
        if (q.table === "doctors") {
          const ids = removed.map((r) => r.id);
          ["appointments", "prescriptions"].forEach((t) => {
            if (db[t]) db[t] = db[t].filter((r) => !ids.includes(r.doctor_id));
          });
        }
        out = removed;
      } else {
        out = rows.filter(matches);
      }
      if (q.op !== "select") writeStore(db);
    } catch (e) {
      return { data: null, error: { message: "Falha ao gravar no navegador: " + e.message } };
    }

    // ordenação
    if (q.order) {
      const { col, ascending } = q.order;
      out = out.slice().sort((a, b) => {
        if (a[col] === b[col]) return 0;
        if (a[col] == null) return 1;
        if (b[col] == null) return -1;
        return (a[col] > b[col] ? 1 : -1) * (ascending ? 1 : -1);
      });
    }
    if (q.limit != null) out = out.slice(0, q.limit);

    // relações embutidas: select('*, doctors(name, specialty)')
    if (q.selectStr) {
      const re = /(\w+)\s*\(([^)]*)\)/g;
      let m;
      while ((m = re.exec(q.selectStr))) {
        const rel = m[1];
        const fk = RELATIONS[rel];
        if (!fk) continue;
        const target = db[rel] || [];
        out = out.map((r) => Object.assign({}, r, { [rel]: target.find((t) => t.id === r[fk]) || null }));
      }
    }

    if (q.op !== "select" && !q.wantRows) return { data: null, error: null };

    out = JSON.parse(JSON.stringify(out));
    if (q.single || q.maybe) {
      if (out.length === 1) return { data: out[0], error: null };
      if (out.length === 0 && q.maybe) return { data: null, error: null };
      return { data: null, error: { code: "PGRST116", message: "Esperava 1 registro, encontrou " + out.length } };
    }
    return { data: out, error: null };
  }

  // --------------------------------------------------------------- query builder
  function Builder(client, table) {
    this.client = client;
    this.q = { table, op: "select", filters: [], selectStr: "*" };
  }
  Builder.prototype.select = function (str) {
    if (this.q.op === "select") this.q.selectStr = str || "*";
    else this.q.wantRows = true;
    return this;
  };
  ["insert", "update", "upsert"].forEach(function (op) {
    Builder.prototype[op] = function (payload) { this.q.op = op; this.q.payload = payload; return this; };
  });
  Builder.prototype.delete = function () { this.q.op = "delete"; return this; };
  Builder.prototype.eq = function (col, val) { this.q.filters.push({ type: "eq", col, val }); return this; };
  Builder.prototype.in = function (col, val) { this.q.filters.push({ type: "in", col, val }); return this; };
  Builder.prototype.gte = function (col, val) { this.q.filters.push({ type: "gte", col, val }); return this; };
  Builder.prototype.order = function (col, opts) {
    this.q.order = { col, ascending: !opts || opts.ascending !== false };
    return this;
  };
  Builder.prototype.limit = function (n) { this.q.limit = n; return this; };
  Builder.prototype.single = function () { this.q.single = true; return this; };
  Builder.prototype.maybeSingle = function () { this.q.maybe = true; return this; };
  Builder.prototype.then = function (resolve, reject) {
    return this.client._exec(this).then(resolve, reject);
  };

  // --------------------------------------------------------------- cliente híbrido
  function DataClient(url, key) {
    this.mode = "local";
    this.cloud = null;
    const self = this;
    this.ready = (async function () {
      if (!url || !key || !window.supabase) return;
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
        const res = await fetch(url + "/rest/v1/", { headers: { apikey: key }, signal: ctrl.signal });
        clearTimeout(timer);
        if (res.status >= 500) throw new Error("HTTP " + res.status);
        self.cloud = window.supabase.createClient(url, key);
        self.mode = "cloud";
      } catch (e) {
        console.warn("Supabase inacessível, usando modo local:", e.message);
      }
    })();
  }
  DataClient.prototype.from = function (table) { return new Builder(this, table); };
  DataClient.prototype._exec = async function (b) {
    await this.ready;
    if (this.mode === "local") return runLocal(b.q);
    const q = b.q;
    let c = this.cloud.from(q.table);
    if (q.op === "select") c = c.select(q.selectStr);
    else if (q.op === "delete") c = c.delete();
    else c = c[q.op](q.payload);
    if (q.op !== "select" && q.op !== "delete" && q.wantRows) c = c.select();
    q.filters.forEach((f) => { c = c[f.type](f.col, f.val); });
    if (q.order) c = c.order(q.order.col, { ascending: q.order.ascending });
    if (q.limit != null) c = c.limit(q.limit);
    if (q.single) c = c.single();
    if (q.maybe) c = c.maybeSingle();
    return c;
  };

  window.createDataClient = function (url, key) { return new DataClient(url, key); };

  // Aviso visual quando está em modo local
  window.showLocalModeBanner = function (client) {
    client.ready.then(function () {
      if (client.mode !== "local") return;
      const el = document.createElement("div");
      el.id = "local-mode-banner";
      el.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2000;background:#7a5200;color:#fff;" +
        "font:600 12px/1.4 sans-serif;padding:6px 12px;text-align:center";
      el.textContent = "Modo local: banco na nuvem indisponível. Os dados estão sendo salvos apenas neste navegador.";
      document.body.appendChild(el);
    });
  };
})();
