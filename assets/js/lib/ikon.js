/* Ikon garis (24x24) bertema game. Semua path adalah konstanta di file ini, bukan input pengguna. */
(function () {
  var IFS = (window.IFS = window.IFS || {});
  var P = {
    gamepad: '<path d="M7 6h10a4 4 0 0 1 4 4v4a3 3 0 0 1-5.2 2L14 14h-4l-1.8 2A3 3 0 0 1 3 14v-4a4 4 0 0 1 4-4z"/><path d="M7.5 10v4M5.5 12h4"/><circle cx="15.5" cy="10.5" r=".9" fill="currentColor"/><circle cx="17.8" cy="12.8" r=".9" fill="currentColor"/>',
    rank: '<path d="M6 12l6-6 6 6M6 19l6-6 6 6"/>',
    planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.8" transform="rotate(-24 12 12)"/>',
    sword: '<path d="M14.5 17.5L4 7V4h3l10.5 10.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.7-3.1 8-7.5 9.5-4.4-1.5-7.5-4.8-7.5-9.5V6z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
    plus: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5z"/>',
    cpu: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/><rect x="10" y="10" width="4" height="4" rx=".8"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6"/>',
    gem: '<path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4L8 9l4 11 4-11-1.5-5"/>',
    bolt: '<path d="M13 2.5L4.5 13.5H11L10 21.5l8.5-11H12z"/>',
    chat: '<path d="M20.5 12a8.2 8.2 0 0 1-12 7.2L3.5 20.5l1.4-4.7A8.2 8.2 0 1 1 20.5 12z"/><path d="M9 9.5c.3 2.5 2.2 4.4 4.8 5l1.2-1.3-1.7-.9-.8.7c-.9-.4-1.6-1.1-2-2l.7-.8-.9-1.7z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    crosshair: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5A3 3 0 0 1 16 10M12 13v4M8.5 20.5h7M10 17h4"/>',
    facebook: '<path d="M14.2 21v-7.4h2.5l.4-3h-2.9V8.8c0-.9.3-1.4 1.5-1.4h1.5V4.7c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.800v2.200H8.800v3h2.500V21"/>',
    discord: '<path d="M7.200 6.400c1.500-.7 3.100-1.100 4.800-1.100s3.300.4 4.800 1.100c1.700 2.600 2.600 5.300 2.800 8.600-1.200 1-2.600 1.600-4.100 2l-1-1.600c.5-.2 1-.4 1.400-.7-2.600 1.200-5.200 1.200-7.800 0 .4.300.9.500 1.400.7l-1 1.600c-1.500-.4-2.900-1-4.100-2 .2-3.300 1.100-6 2.800-8.600z"/><circle cx="9.400" cy="12.200" r="1.100" fill="currentColor"/><circle cx="14.600" cy="12.200" r="1.100" fill="currentColor"/>',
    salin: '<rect x="8.500" y="8.500" width="11" height="11" rx="2.500"/><path d="M15.500 8.500V6.500A2.500 2.500 0 0 0 13 4H6.500A2.500 2.500 0 0 0 4 6.500V13a2.500 2.500 0 0 0 2.500 2.500h2"/>',
    centang: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
    bawah: '<path d="M6 9l6 6 6-6"/>',
    titik3: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    list: '<path d="M8 7h12M8 12h12M8 17h12"/><circle cx="4" cy="7" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="17" r="1" fill="currentColor"/>'
  };

  function svg(nama, ukuran) {
    var s = ukuran || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[nama] || P.gamepad) + "</svg>";
  }
  function el(nama, ukuran, kelas) {
    var w = document.createElement("span");
    w.className = "ik" + (kelas ? " " + kelas : "");
    w.setAttribute("aria-hidden", "true");
    w.innerHTML = svg(nama, ukuran);
    return w;
  }
  function untukKategori(nama) {
    var t = String(nama || "").toLowerCase();
    if (/rawat|akun/.test(t)) return "shield";
    if (/addon|add-on|tambah/.test(t)) return "plus";
    if (/eksplor|explor/.test(t)) return "compass";
    if (/build|karakter|character/.test(t)) return "cpu";
    if (/story|cerita|quest/.test(t)) return "book";
    if (/conundrum/.test(t)) return "gem";
    if (/simulated|universe|\bsu\b|\bdu\b/.test(t)) return "planet";
    if (/\bcw\b|currency|war|pvp|arena/.test(t)) return "sword";
    if (/rank|push|lv|level/.test(t)) return "rank";
    return "gamepad";
  }
  IFS.ikon = { svg: svg, el: el, untukKategori: untukKategori };
})();
