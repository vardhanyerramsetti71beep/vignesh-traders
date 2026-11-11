/* Vignesh Traders — Car Care & Detailing Studio */
(() => {
  "use strict";
  window.__vtReady = true;

  /* ──────────────────────────────────────────────────────────────
     Shop details. Fill in address / hours / mapsUrl and they appear
     in the booking section and footer automatically. Until then the
     page shows the city only ("Vijayawada, Andhra Pradesh").
     (The phone number and city also sit in index.html — search
     "9666861333" and "Vijayawada".)
     ────────────────────────────────────────────────────────────── */
  const SITE = {
    name: "Vignesh Traders",
    whatsapp: "919666861333",          // country code + number, digits only
    address: "",                       // full address; replaces the city-only line when filled in
    hours: "",                         // e.g. "Mon–Sun · 9:00 am – 8:00 pm"
    mapsUrl: "",                       // Google Maps share link
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  const inr = (n) => Math.round(n).toLocaleString("en-IN");
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function tween({ from, to, duration = 1600, delay = 0, onUpdate }) {
    if (reduceMotion) { onUpdate(to); return; }
    setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        onUpdate(from + (to - from) * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
  }

  /* ───────────── scroll progress + active nav link ───────────── */
  const progress = $(".progress");
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
      ticking = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$(".nav__links a");
  if ("IntersectionObserver" in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove("is-active"));
        byId.get(e.target.id)?.classList.add("is-active");   // sections without a nav link simply clear it
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section").forEach((s) => spy.observe(s));
  }

  /* ───────────── mobile drawer ───────────── */
  const drawer = $("#drawer"), scrim = $(".scrim"), burger = $(".nav__burger");
  const setDrawer = (open) => {
    drawer.classList.toggle("is-open", open);
    drawer.inert = !open;
    burger.setAttribute("aria-expanded", String(open));
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.toggle("is-open", open));
    if (!open) setTimeout(() => { if (!drawer.classList.contains("is-open")) scrim.hidden = true; }, 320);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) $(".drawer__close").focus(); else burger.focus({ preventScroll: true });
  };
  burger.addEventListener("click", () => setDrawer(true));
  $(".drawer__close").addEventListener("click", () => setDrawer(false));
  scrim.addEventListener("click", () => setDrawer(false));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setDrawer(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("is-open")) setDrawer(false); });

  /* ───────────── scroll reveals ───────────── */
  $$("[data-stagger]").forEach((group) => {
    [...group.children].forEach((child, i) => child.style.setProperty("--i", i % 6));
  });
  const revealEls = $$("[data-reveal]");
  const settle = (el) => {
    el.classList.add("is-in");
    // once it has landed, drop the reveal hooks so hover transitions aren't delayed by the stagger
    const wait = 700 + (parseInt(el.style.getPropertyValue("--i"), 10) || 0) * 90 + 60;
    setTimeout(() => { el.removeAttribute("data-reveal"); el.classList.remove("is-in"); }, wait);
  };
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { settle(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.removeAttribute("data-reveal"));
  }

  /* ───────────── count-up stats ───────────── */
  const stats = $(".stats");
  if (stats && "IntersectionObserver" in window) {
    const nums = $$("[data-count]", stats);
    nums.forEach((n) => { if (!reduceMotion) n.textContent = "0"; });
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      nums.forEach((n, i) => tween({
        from: 0, to: Number(n.dataset.count), delay: i * 150,
        onUpdate: (v) => { n.textContent = inr(v); },
      }));
    }, { threshold: 0.4 }).observe(stats);
  }

  /* ───────────── hero spotlight follows the pointer ───────────── */
  const hero = $(".hero"), glow = $(".hero__glow");
  if (hero && glow && matchMedia("(pointer: fine)").matches && !reduceMotion) {
    let raf = 0;
    hero.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        glow.style.setProperty("--mx", `${e.clientX - r.left}px`);
        glow.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ───────────── before / after slider ───────────── */
  $$(".ba").forEach((ba) => {
    const range = $(".ba__range", ba);
    let touched = false;
    const set = (v) => ba.style.setProperty("--pos", `${v}%`);
    range.addEventListener("input", () => { touched = true; set(range.value); });
    ["pointerdown", "keydown"].forEach((ev) => range.addEventListener(ev, () => { touched = true; }));

    if (reduceMotion || !("IntersectionObserver" in window)) return;
    // a quick demo sweep the first time it scrolls into view
    new IntersectionObserver((entries, obs) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const stops = [50, 84, 18, 50], seg = 720;
      const start = performance.now() + 350;
      const step = (now) => {
        if (touched) return;
        const t = Math.max(0, now - start);
        const i = Math.min(Math.floor(t / seg), stops.length - 2);
        const p = Math.min((t - i * seg) / seg, 1);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const v = stops[i] + (stops[i + 1] - stops[i]) * e;
        set(v); range.value = v;
        if (t < seg * (stops.length - 1)) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.55 }).observe(ba);
  });

  /* ───────────── package size toggle (medium / large car) ───────────── */
  $$(".seg").forEach((seg) => {
    const card = seg.closest(".pkg");
    const price = $("[data-price]", card), unit = $("[data-unit]", card), cta = $("a[data-book]", card);
    const buttons = $$("button", seg);
    buttons.forEach((btn) => btn.addEventListener("click", () => {
      if (btn.getAttribute("aria-pressed") === "true") return;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const from = Number(price.dataset.price), to = Number(btn.dataset.amount);
      price.dataset.price = to;
      tween({ from, to, duration: 450, onUpdate: (v) => { price.textContent = inr(v); } });
      unit.textContent = btn.dataset.unit;
      cta.dataset.book = btn.dataset.book;
    }));
  });

  /* ───────────── booking: pre-select a service, then hand off to WhatsApp ───────────── */
  const form = $("#book-form");
  const service = $("#f-service");
  const status = $(".form__status");

  $$("a[data-book]").forEach((a) => a.addEventListener("click", () => {
    const want = a.dataset.book;
    const match = [...service.options].find((o) => o.value === want || o.textContent === want);
    if (match) service.value = match.value;
    setTimeout(() => $("#f-name").focus({ preventScroll: true }), 700);
  }));

  const dateInput = $("#f-date");
  if (dateInput) dateInput.min = new Date().toLocaleDateString("en-CA");   // yyyy-mm-dd, local time

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const required = [service, $("#f-name"), $("#f-car")];
    let firstBad = null;
    required.forEach((el) => {
      const bad = !el.value.trim();
      el.closest(".field").classList.toggle("is-bad", bad);
      el.setAttribute("aria-invalid", String(bad));
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      status.textContent = "Please choose a service and add your name and car model.";
      firstBad.focus();
      return;
    }
    const d = new FormData(form);
    const lines = [
      `Hi ${SITE.name}! I'd like to book a slot.`,
      "",
      `• Service: ${d.get("service")}`,
      `• Car: ${d.get("car").trim()}`,
    ];
    if (d.get("date")) {
      const day = new Date(`${d.get("date")}T00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
      lines.push(`• Preferred day: ${day}`);
    }
    lines.push(`• Name: ${d.get("name").trim()}`);
    if (d.get("note").trim()) lines.push(`• Note: ${d.get("note").trim()}`);
    const url = waLink(lines.join("\n"));
    // Always leave a real link behind: a tap on a link is never blocked, whatever the browser does below.
    const manual = Object.assign(document.createElement("a"), {
      href: url, target: "_blank", rel: "noopener", textContent: "Didn't open? Tap here.",
    });
    status.replaceChildren("Opening WhatsApp with your message… ", manual);
    openWhatsApp(url);
  });

  /* Hand the visitor over to WhatsApp without depending on a pop-up, which browsers can block silently. */
  function openWhatsApp(url) {
    const onPhone = matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!onPhone) {
      // desktop: a new tab keeps the site open, but only if the browser actually allowed it
      const win = window.open(url, "_blank");
      if (win && !win.closed) { try { win.opener = null; } catch (_) { /* cross-origin: nothing to clear */ } return; }
    }
    // phones (where this launches the app directly), or a blocked pop-up: plain navigation always goes through
    window.location.href = url;
  }
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (field?.classList.contains("is-bad") && e.target.value.trim()) {
      field.classList.remove("is-bad");
      e.target.removeAttribute("aria-invalid");
    }
  });

  /* ───────────── address / hours (shown only once filled in above) ───────────── */
  const icon = (id) => `<svg class="i" aria-hidden="true"><use href="#${id}"/></svg>`;
  const find = $("#find-us"), place = $("#find-place");
  if (find && place) {
    if (SITE.address) {                       // the full address replaces the city-only line
      place.textContent = SITE.address;
      $("#foot-address").textContent = SITE.address;
    }
    if (SITE.mapsUrl) {
      place.append(" ", Object.assign(document.createElement("a"), {
        href: SITE.mapsUrl, target: "_blank", rel: "noopener", textContent: "Get directions",
      }));
    }
    if (SITE.hours) {
      const li = document.createElement("li");
      li.innerHTML = icon("i-clock");
      li.append(Object.assign(document.createElement("span"), { textContent: SITE.hours }));
      find.append(li);
      const fh = $("#foot-hours"); fh.textContent = SITE.hours; fh.hidden = false;
    }
  }

  /* ───────────── gallery lightbox ───────────── */
  const lb = $(".lb"), shots = $$(".shot");
  if (lb && shots.length && typeof lb.showModal === "function") {
    const img = $("img", lb), cap = $("figcaption", lb);
    let index = 0;
    const show = (i) => {
      index = (i + shots.length) % shots.length;
      const s = shots[index];
      img.src = s.dataset.full;
      img.alt = $("img", s).alt;
      cap.textContent = `${s.dataset.cap}  ·  ${index + 1} / ${shots.length}`;
    };
    shots.forEach((s, i) => s.addEventListener("click", () => { show(i); lb.showModal(); }));
    $(".lb__close", lb).addEventListener("click", () => lb.close());
    $(".lb__prev", lb).addEventListener("click", () => show(index - 1));
    $(".lb__next", lb).addEventListener("click", () => show(index + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
    let touchX = null;
    lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ───────────── scroll-to-wash scene ─────────────
     Scroll position drives every part of the drawing; nothing here runs on a timer.
     Timeline over the pinned stretch (p = 0 → 1):
       .04–.36 foam washes the outside   .42–.50 doors go see-through, camera moves in
       .50–.78 steam cleans the cabin    .78–.86 camera pulls back   .92–1 the car drives off */
  const wash = $("#wash");
  if (wash && !reduceMotion) {
    const part = (id) => document.getElementById(id);
    const cam = part("w-cam"), drive = part("w-drive");
    const extRect = part("w-ext-rect"), intRect = part("w-int-rect"), hole = part("w-hole");
    const foam = part("w-foam"), wet = part("w-wet"), steam = part("w-steam");
    const shineExt = part("w-shine-ext"), shineInt = part("w-shine-int"), beam = part("w-beam"), spot = part("w-spot");
    const wheels = [part("w-wheel-r"), part("w-wheel-f")];
    const pct = $(".wash__pct b", wash), phase = $(".wash__phase", wash), cta = $(".wash__cta", wash);
    const meters = $$(".meter", wash).map((m) => ({ bar: $("b", m), num: $("em", m) }));
    const PHASES = {
      in: "Rolled in dusty.",
      ext: "Outside: foam wash and rinse",
      turn: "Outside done. Now the inside.",
      int: "Inside: steam, vacuum and wipe",
      done: "Inside and out. Spotless.",
      out: "Drive out dazzling.",
    };
    const CABIN = { x: 411, y: 200 };            // centre of the cabin in drawing units; the camera zooms on it
    const WHEEL_R = 58;

    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const span = (p, from, to) => clamp01((p - from) / (to - from));
    const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const setMeter = (m, v) => { m.bar.style.setProperty("--v", v.toFixed(3)); m.num.textContent = `${Math.round(v * 100)}%`; };

    wash.classList.add("is-live");
    let phaseKey = "", queued = false;

    const draw = () => {
      queued = false;
      const box = wash.getBoundingClientRect(), vh = innerHeight;
      const p = clamp01(-box.top / Math.max(1, box.height - vh));      // progress through the pinned stretch
      const arrive = clamp01(1 - box.top / vh);                        // 0 → 1 while the section scrolls into view

      const ext = span(p, 0.04, 0.36);
      const cut = easeInOut(span(p, 0.42, 0.5)) * (1 - easeInOut(span(p, 0.78, 0.86)));
      const int = span(p, 0.5, 0.78);
      const leave = span(p, 0.92, 1);
      const clean = (ext + int) / 2;

      // drive in as the section arrives, drive off at the very end; wheels turn to match
      const x = -Math.pow(1 - arrive, 2) * 1150 + leave * leave * 1500;
      drive.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
      const spin = ((x / WHEEL_R) * 180) / Math.PI;
      wheels.forEach((w) => w.setAttribute("transform", `rotate(${spin.toFixed(1)})`));

      // outside: everything to the right of the foam is still dusty
      const foamX = -70 + ext * 1140;
      extRect.setAttribute("x", foamX.toFixed(1));
      extRect.setAttribute("width", Math.max(0, 1100 - foamX).toFixed(1));
      foam.setAttribute("transform", `translate(${foamX.toFixed(1)} 0)`);
      wet.setAttribute("x", (foamX - 190).toFixed(1));
      foam.style.opacity = wet.style.opacity = ext > 0 && ext < 1 ? 1 : 0;

      // doors and glass go see-through while the camera moves in on the cabin
      hole.setAttribute("opacity", cut.toFixed(3));
      const base = innerWidth < 760 ? 1.12 : 1;                        // phones: use the full width of the screen
      const zoom = base * (1 + 0.8 * cut);
      const focusX = 500 + cut * (CABIN.x - 500), focusY = 230 + cut * (CABIN.y - 230);   // point the camera looks at
      const tx = 500 - zoom * focusX;
      const ty = 230 + cut * (212 - 230) - zoom * focusY;
      cam.setAttribute("transform", `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${zoom.toFixed(3)})`);

      // inside: everything to the left of the steam is still dirty
      const steamX = 720 - int * 640;
      intRect.setAttribute("width", Math.max(0, steamX).toFixed(1));
      steam.setAttribute("transform", `translate(${steamX.toFixed(1)} 0)`);
      steam.style.opacity = int > 0 && int < 1 ? 1 : 0;

      // finishing touches and the read-out
      shineExt.style.opacity = ext >= 1 && cut < 0.5 ? 1 : 0;
      shineInt.style.opacity = int >= 1 ? 1 : 0;
      beam.setAttribute("opacity", span(p, 0.86, 0.9).toFixed(2));
      spot.setAttribute("opacity", (0.3 + 0.7 * clean).toFixed(2));
      pct.textContent = Math.round(clean * 100);
      setMeter(meters[0], ext);
      setMeter(meters[1], int);
      const key = p < 0.04 ? "in" : ext < 1 ? "ext" : p < 0.5 ? "turn" : int < 1 ? "int" : leave > 0 ? "out" : "done";
      if (key !== phaseKey) { phaseKey = key; phase.textContent = PHASES[key]; }
      cta.classList.toggle("is-on", p > 0.84);
    };
    const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    draw();
  }

  /* ───────────── footer year ───────────── */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
