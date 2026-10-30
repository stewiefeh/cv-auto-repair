/* CV Auto Repair — "The Exhaust Note"
   Motion: one signature line (the pulse), one drawn pipe, quiet reveals. */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) document.documentElement.classList.add("js-reveal");
  else document.documentElement.classList.add("no-anim");

  /* ---------- header ---------- */
  const header = document.getElementById("header");
  const onScrollHeader = () => header.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- reveal system ---------- */
  const revealables = document.querySelectorAll("[data-reveal],[data-reveal-img],[data-reveal-line]");
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach((el) => el.setAttribute("data-reveal", "visible"));
    document.querySelectorAll("[data-reveal-img]").forEach((el) => el.setAttribute("data-reveal-img", "visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target;
            const attr = el.hasAttribute("data-reveal-img") ? "data-reveal-img" : "data-reveal";
            el.setAttribute(attr, "visible");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => io.observe(el));
    // backstop: everything becomes visible on a timer even if
    // the observer never fires (slow loads, capture tools, odd viewports)
    setTimeout(() => {
      revealables.forEach((el) => {
        if (el.hasAttribute("data-reveal-img")) el.setAttribute("data-reveal-img", "visible");
        else el.setAttribute("data-reveal", "visible");
      });
    }, 2200);
  }

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = parseInt(el.getAttribute("data-count"), 10);
    const from = parseInt(el.textContent, 10) || 0;
    if (reduced || from === target) return;
    const dur = 1400;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from + (target - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window && !reduced) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => (el.textContent = el.getAttribute("data-count")));
  }

  /* ---------- hero parallax ---------- */
  const heroImg = document.querySelector(".hero-media img");
  if (heroImg && !reduced) {
    let target = 0, current = 0, raf = null;
    const step = () => {
      current += (target - current) * 0.06;
      heroImg.style.transform = "translateY(" + (-current * 10) + "px) scale(1.02)";
      if (Math.abs(target - current) > 0.001) raf = requestAnimationFrame(step);
      else raf = null;
    };
    window.addEventListener("scroll", () => {
      target = Math.min(1, window.scrollY / (window.innerHeight || 1));
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }

  /* ---------- the exhaust pulse (signature) ----------
     A pressure wave that fires on load, settles to an idle,
     and flares again when the page scrolls fast. */
  const pulsePath = document.getElementById("pulsePath");
  if (pulsePath) {
    const W = 1200, MID = 40, N = 160;
    let amp = 0, vel = 0, phase = 0, lastY = window.scrollY, t0 = null;
    const buildPath = () => {
      let d = "M0 " + MID;
      for (let i = 1; i <= N; i++) {
        const x = (i / N) * W;
        const shape = Math.sin((i / N) * Math.PI); // wave lives mid-line
        const y =
          MID +
          Math.sin(i * 0.32 - phase) * amp * shape +
          Math.sin(i * 0.11 + phase * 0.6) * amp * 0.35 * shape;
        d += " L" + x.toFixed(1) + " " + y.toFixed(2);
      }
      pulsePath.setAttribute("d", d);
    };
    const idle = () => { amp += (2.2 - amp) * 0.03; phase += 0.055; };
    const frame = (t) => {
      if (!t0) t0 = t;
      const dt = Math.min(48, t - t0); t0 = t;
      // scroll velocity feeds the exhaust note
      const y = window.scrollY;
      const dv = Math.min(60, Math.abs(y - lastY));
      lastY = y;
      vel = vel * 0.9 + dv * 0.1;
      amp += vel * 0.012;
      idle();
      buildPath();
      requestAnimationFrame(frame);
    };
    if (reduced) { amp = 2.2; buildPath(); }
    else requestAnimationFrame(frame);
  }

  /* ---------- the drawn pipe down the page ---------- */
  const pipe = document.getElementById("pipePath");
  const pipeShadow = document.getElementById("pipeShadow");
  if (pipe && pipeShadow) {
    // a pipe with character: long straights, two hard bends
    const d =
      "M20 0 L20 180 L62 240 L62 470 L20 530 L20 760 L62 820 L62 1000";
    pipe.setAttribute("d", d);
    pipeShadow.setAttribute("d", d);
    const len = pipe.getTotalLength();
    pipe.style.strokeDasharray = len;
    pipe.style.strokeDashoffset = len;
    const setPipe = () => {
      const doc = document.documentElement;
      const p = window.scrollY / (doc.scrollHeight - window.innerHeight || 1);
      pipe.style.strokeDashoffset = len * (1 - Math.min(1, Math.max(0, p)));
    };
    window.addEventListener("scroll", setPipe, { passive: true });
    setPipe();
    if (reduced) pipe.style.strokeDashoffset = 0;
  }

  /* ---------- open / closed badge + today row (America/Chicago) ---------- */
  const badge = document.getElementById("openBadge");
  const openText = document.getElementById("openText");
  const hoursRows = document.querySelectorAll("#hoursTable .hours-row");
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short", hour: "numeric", minute: "2-digit", hour12: true,
    });
    const nowParts = fmt.formatToParts(new Date());
    const get = (type) => nowParts.find((p) => p.type === type)?.value;
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = weekdayMap[get("weekday")];
    const hour = parseInt(get("hour"), 10) % 12 + (get("dayPeriod") === "PM" ? 12 : 0);
    const minute = parseInt(get("minute"), 10);
    const mins = hour * 60 + minute;
    const spans = {
      1: [480, 1080], 2: [480, 1080], 3: [480, 1080],
      4: [480, 1080], 5: [480, 1080], 6: [480, 900], 0: null,
    };
    const span = spans[day];
    const isOpen = span ? mins >= span[0] && mins < span[1] : false;
    // today row highlight
    hoursRows.forEach((row) => {
      const days = row.getAttribute("data-days").split(",").map(Number);
      if (days.includes(day)) {
        row.classList.add("today");
        const tag = row.querySelector(".today-tag");
        if (tag) tag.hidden = false;
      }
    });
    if (badge && openText) {
      badge.classList.toggle("closed", !isOpen);
      if (isOpen) {
        const closeAt = span[1];
        let left = closeAt - mins;
        if (left <= 60) openText.textContent = "Open now, closing in " + left + " min";
        else openText.textContent = "Open now until " + (closeAt === 1080 ? "6:00 PM" : "3:00 PM");
      } else {
        openText.textContent = "Closed right now — the phone still rings";
      }
    }
  } catch (err) {
    if (openText) openText.textContent = "Mon–Fri 8–6 · Sat 8–3";
  }
})();
