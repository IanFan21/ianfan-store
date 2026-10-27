/* Latar animasi bertema game: lantai grid perspektif, partikel, dan chevron "rank up" yang naik pelan.
   Juga: cahaya yang mengikuti kursor dan bilah progres gulir. Mati otomatis bila pengguna meminta gerak dikurangi. */
(function () {
  var c = document.getElementById("latar");
  var kurang = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = c && c.getContext ? c.getContext("2d") : null;
  var W = 0, H = 0, hor = 0, t = 0, parts = [], raf = 0, terakhir = 0;
  var hemat = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.connection && navigator.connection.saveData);
  var aura = document.createElement("div"); aura.className = "aura"; aura.setAttribute("aria-hidden", "true"); document.body.prepend(aura);

  function terang() { return document.documentElement.getAttribute("data-tema") !== "gelap"; }
  function acak(a, b) { return a + Math.random() * (b - a); }

  function ukur() {
    var dpr = hemat ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight; hor = H * 0.6;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(hemat ? 24 : 56, (W * H) / (hemat ? 40000 : 24000)));
    parts = [];
    for (var i = 0; i < n; i++) {
      parts.push({ x: acak(0, W), y: acak(0, H), r: acak(0.6, 1.8), v: acak(0.12, 0.5), chev: Math.random() < 0.22, h: Math.random() < 0.55 ? 188 : 262, a: acak(0.25, 0.8), s: acak(6, 13), f: acak(0, 6.28) });
    }
  }

  function chevron(x, y, s, warna) {
    ctx.strokeStyle = warna; ctx.lineWidth = 1.6; ctx.beginPath();
    ctx.moveTo(x - s, y + s * 0.5); ctx.lineTo(x, y - s * 0.5); ctx.lineTo(x + s, y + s * 0.5);
    ctx.moveTo(x - s, y + s * 1.4); ctx.lineTo(x, y + s * 0.4); ctx.lineTo(x + s, y + s * 1.4);
    ctx.stroke();
  }

  function gambar() {
    ctx.clearRect(0, 0, W, H);
    var i, p, tinggi = H - hor, T = terang();

    /* lantai grid */
    var garis = hemat ? 10 : 14;
    ctx.lineWidth = 1;
    for (i = 0; i < garis; i++) {
      var z = (i + (t % 1)) / garis;
      var y = hor + tinggi * Math.pow(z, 2.3);
      ctx.strokeStyle = T ? "rgba(63,51,214," + (0.02 + 0.13 * z).toFixed(3) + ")" : "rgba(56,240,255," + (0.03 + 0.2 * z).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    var tiang = hemat ? 12 : 20, lebar = Math.max(W, 900) * 0.2;
    var g = ctx.createLinearGradient(0, hor, 0, H);
    g.addColorStop(0, T ? "rgba(124,58,237,0)" : "rgba(143,107,255,0)"); g.addColorStop(1, T ? "rgba(124,58,237,.16)" : "rgba(143,107,255,.28)");
    ctx.strokeStyle = g;
    for (i = -tiang / 2; i <= tiang / 2; i++) {
      ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.012, hor); ctx.lineTo(W / 2 + i * lebar * 0.55, H); ctx.stroke();
    }

    /* partikel dan chevron */
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      var kerlip = 0.6 + 0.4 * Math.sin(t * 2 + p.f);
      var warna = T ? "hsla(" + (p.h === 188 ? 232 : 262) + ",70%,50%," + (p.a * kerlip * 0.45).toFixed(3) + ")" : "hsla(" + p.h + ",100%,70%," + (p.a * kerlip).toFixed(3) + ")";
      if (p.chev) chevron(p.x, p.y, p.s, warna);
      else { ctx.fillStyle = warna; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
      if (!kurang) {
        p.y -= p.v * (p.chev ? 1.2 : 1);
        if (p.y < -20) { p.y = H + 20; p.x = acak(0, W); }
      }
    }
  }

  function putar(now) {
    raf = requestAnimationFrame(putar);
    if (now - terakhir < 33) return; /* maksimal ~30 gambar per detik */
    terakhir = now;
    t += 0.0075;
    gambar();
  }
  function jalan() { if (!raf && !kurang) raf = requestAnimationFrame(putar); }
  function henti() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  if (ctx) {
    ukur(); gambar();
    var tunda = 0;
    window.addEventListener("resize", function () { clearTimeout(tunda); tunda = setTimeout(function () { ukur(); gambar(); }, 150); });
    document.addEventListener("visibilitychange", function () { document.hidden ? henti() : jalan(); });
    jalan();
    window.addEventListener("ianfan-tema", function () { gambar(); });
  }

  /* bilah progres gulir */
  var bar = document.getElementById("progres");
  if (bar) {
    var tunggu = false;
    var perbarui = function () {
      tunggu = false;
      var tot = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (tot > 0 ? Math.min(1, window.scrollY / tot) : 0).toFixed(4) + ")";
    };
    window.addEventListener("scroll", function () { if (!tunggu) { tunggu = true; requestAnimationFrame(perbarui); } }, { passive: true });
    perbarui();
  }
})();
