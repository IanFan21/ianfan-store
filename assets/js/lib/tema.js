/* Tema terang (bawaan) / gelap. Dimuat di <head> tanpa defer agar tidak berkedip saat halaman tampil. */
(function () {
  var KUNCI = "ianfan-tema";
  var akar = document.documentElement;
  function baca() { try { var t = localStorage.getItem(KUNCI); if (t === "gelap" || t === "terang") return t; } catch (e) {} return "terang"; }
  function terapkan(t) {
    akar.setAttribute("data-tema", t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "gelap" ? "#060a18" : "#f3f5fb");
    var c = document.querySelector('meta[name="color-scheme"]'); if (c) c.setAttribute("content", t === "gelap" ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("ianfan-tema", { detail: t }));
  }
  terapkan(baca());

  var IKON = {
    bulan: '<path d="M20.5 14.5A8.500 8.500 0 0 1 9.500 3.500a8.500 8.500 0 1 0 11 11z"/>',
    matahari: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.200M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.600 1.600M17.100 17.100l1.600 1.600M5.300 18.700l1.600-1.600M17.100 6.900l1.600-1.600"/>'
  };
  function svg(n) { return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + IKON[n] + "</svg>"; }

  document.addEventListener("DOMContentLoaded", function () {
    var tb = document.getElementById("tombolTema");
    if (!tb) return;
    tb.innerHTML = '<span class="ik ik-bulan">' + svg("bulan") + '</span><span class="ik ik-matahari">' + svg("matahari") + "</span>";
    function label() { tb.setAttribute("aria-label", akar.getAttribute("data-tema") === "gelap" ? "Ganti ke tema terang" : "Ganti ke tema gelap"); tb.title = tb.getAttribute("aria-label"); }
    label();
    tb.addEventListener("click", function () {
      var t = akar.getAttribute("data-tema") === "gelap" ? "terang" : "gelap";
      try { localStorage.setItem(KUNCI, t); } catch (e) {}
      terapkan(t); label();
    });
  });
})();
