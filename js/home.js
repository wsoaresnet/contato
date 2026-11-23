/* Home v2 - interações. Sem dependências. */
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const SITE = window.SITE || {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem storage */ } }
  };

  /* ---- tema (mesma chave usada nas páginas internas) ---- */
  const html = document.documentElement;
  const saved = store.get("theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  html.setAttribute("data-theme", saved);
  $("#theme").addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "light" ? "dark" : "light";
    html.setAttribute("data-theme", next);
    store.set("theme", next);
  });

  /* ---- menu mobile ---- */
  const menu = $("#menu"), menuBtn = $("#menu-btn");
  menuBtn.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", menu).forEach((a) => a.addEventListener("click", () => {
    menu.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }));

  /* ---- barra de progresso + link ativo ---- */
  const bar = $("#progress i");
  const sections = $$("main section[id]");
  const links = $$("#menu a[href^='#']");
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    let current = "";
    sections.forEach((s) => { if (s.getBoundingClientRect().top <= 120) current = s.id; });
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- revelar, barras e contadores ---- */
  function countUp(el) {
    const end = parseFloat(el.dataset.to), prefix = el.dataset.prefix || "", suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = prefix + end + suffix; return; }
    const t0 = performance.now(), dur = 1200;
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      $$("[data-to]", el).forEach(countUp);
      if (el.matches("[data-to]")) countUp(el);
      $$(".bar i", el).forEach((b) => { b.style.width = b.dataset.w; });
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  $$(".rv").forEach((el) => io.observe(el));
  // plano B: se o observer não disparar (aba em segundo plano), mostra tudo depois de 2,5 s
  setTimeout(() => $$(".rv:not(.in)").forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight) { el.classList.add("in"); $$(".bar i", el).forEach((b) => { b.style.width = b.dataset.w; }); $$("[data-to]", el).forEach(countUp); }
  }), 2500);

  /* ---- artigos: busca + categoria ---- */
  const posts = $$(".post");
  const search = $("#q"), chips = $$(".chip"), empty = $("#empty");
  let cat = "todos";
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  function filterPosts() {
    const q = norm(search.value.trim());
    let n = 0;
    posts.forEach((p) => {
      const ok = (cat === "todos" || p.dataset.cat === cat) && (!q || norm(p.dataset.text).includes(q));
      p.hidden = !ok;
      if (ok) n++;
    });
    empty.hidden = n !== 0;
    $("#count").textContent = n + (n === 1 ? " artigo" : " artigos");
  }
  chips.forEach((c) => c.addEventListener("click", () => {
    cat = c.dataset.cat;
    chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
    filterPosts();
  }));
  search.addEventListener("input", filterPosts);
  addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
    if (e.key === "Escape" && document.activeElement === search) { search.value = ""; filterPosts(); search.blur(); }
  });
  filterPosts();

  /* ---- depoimentos (só aparecem se houver) ---- */
  const dep = SITE.depoimentos || [];
  if (dep.length) {
    const box = $("#quotes");
    dep.forEach((d) => {
      const f = document.createElement("figure");
      f.className = "quote"; f.style.margin = "0";
      const p = document.createElement("p"); p.textContent = "“" + d.texto + "”";
      const ft = document.createElement("footer");
      const b = document.createElement("b"); b.textContent = d.nome;
      ft.append(b, document.createTextNode(d.cargo || ""));
      f.append(p, ft); box.appendChild(f);
    });
    $("#depoimentos").hidden = false;
    $("#nav-dep").hidden = false;
  }

  /* ---- galeria / lightbox com teclado ---- */
  const lb = $("#lb"), lbImg = $("img", lb);
  const thumbs = $$(".gallery button");
  let idx = 0;
  function show(i) {
    idx = (i + thumbs.length) % thumbs.length;
    const img = $("img", thumbs[idx]);
    lbImg.src = img.dataset.full || img.src; lbImg.alt = img.alt;
  }
  function openLb(i) { show(i); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); $(".lb-close").focus(); }
  function closeLb() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); lbImg.removeAttribute("src"); thumbs[idx].focus(); }
  thumbs.forEach((b, i) => b.addEventListener("click", () => openLb(i)));
  $(".lb-close").addEventListener("click", closeLb);
  $(".lb-prev").addEventListener("click", () => show(idx - 1));
  $(".lb-next").addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });

  /* ---- orçamento: serviço pré-selecionado pelos botões ---- */
  const svcSelect = $("#servico");
  $$("[data-servico]").forEach((a) => a.addEventListener("click", () => { svcSelect.value = a.dataset.servico; }));

  /* ---- formulário: Formspree (fetch) ou WhatsApp ---- */
  const form = $("#form"), msg = $("#form-msg");
  function setMsg(text, kind) { msg.textContent = text; msg.className = "form-msg " + (kind || ""); }
  function waText() {
    const d = new FormData(form);
    return "Olá, Willian! Vim pelo site.\n" +
      "Nome: " + (d.get("name") || "") + "\n" +
      "Serviço: " + (d.get("servico") || "") + "\n" +
      "Mensagem: " + (d.get("message") || "");
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#send");
    btn.disabled = true; setMsg("Enviando...", "");
    try {
      const res = await fetch(SITE.formspree, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset(); setMsg("Mensagem enviada. Respondo em até 1 dia útil.", "ok");
    } catch (err) {
      setMsg("Não consegui enviar agora. Escreva para " + SITE.email + ".", "err");
    } finally { btn.disabled = false; }
  });
  if (SITE.whatsapp) {
    const wa = $("#wa-send"), fl = $("#wa-float");
    const base = "https://wa.me/" + SITE.whatsapp;
    fl.href = base + "?text=" + encodeURIComponent("Olá, Willian! Vim pelo site e gostaria de um orçamento.");
    fl.classList.add("on");
    wa.hidden = false;
    wa.addEventListener("click", () => {
      if (!form.reportValidity()) return;
      window.open(base + "?text=" + encodeURIComponent(waText()), "_blank", "noopener");
    });
  }

  /* ---- copiar e-mail ---- */
  $("#copy-mail").addEventListener("click", async () => {
    const out = $("#copy-state");
    try { await navigator.clipboard.writeText(SITE.email); out.textContent = "copiado"; }
    catch (e) { out.textContent = SITE.email; }
    setTimeout(() => { out.textContent = "copiar"; }, 2000);
  });

  /* ---- ano no rodapé + easter egg ---- */
  $("#year").textContent = new Date().getFullYear();
  const konami = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
  let k = 0;
  addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === konami[k].toLowerCase()) {
      if (++k === konami.length) { document.body.classList.add("easter"); setTimeout(() => document.body.classList.remove("easter"), 5000); k = 0; }
    } else k = 0;
  });
})();
