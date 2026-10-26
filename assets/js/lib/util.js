/* Fungsi bantu bersama. Teks dari pengguna selalu dipasang lewat textContent, tidak pernah innerHTML. */
(function () {
  var IFS = (window.IFS = window.IFS || {});

  /* h("div", {class: "x", text: "..."}, anak1, anak2) */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === false || v === null || v === undefined) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach(function (kid) {
        if (kid === null || kid === undefined || kid === false) return;
        el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
      });
    }
    return el;
  }

  var fmt = new Intl.NumberFormat("id-ID");
  function rupiah(n) { return "Rp " + fmt.format(Math.round(Number(n) || 0)); }

  /* Satu opsi harga -> "Rp 5.000/map", "Rp 20.000 – 30.000/map" */
  function teksHarga(o) {
    var s = o.max && o.max > o.min ? rupiah(o.min) + " – " + fmt.format(o.max) : rupiah(o.min);
    return s + (o.satuan || "");
  }

  function tanggal(iso) {
    try { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)); }
    catch (e) { return String(iso || ""); }
  }

  /* Untuk pencarian: huruf kecil, tanpa tanda baca berlebih. */
  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }

  function id() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var x = Array.prototype.map.call(b, function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
    return x.slice(0, 8) + "-" + x.slice(8, 12) + "-" + x.slice(12, 16) + "-" + x.slice(16, 20) + "-" + x.slice(20);
  }

  function slug(s) {
    return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  }

  function kurangGerak() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function unduh(nama, isi, tipe) {
    var url = URL.createObjectURL(new Blob([isi], { type: tipe || "application/json;charset=utf-8" }));
    var a = h("a", { href: url, download: nama });
    document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  IFS.u = { h: h, rupiah: rupiah, teksHarga: teksHarga, tanggal: tanggal, norm: norm, id: id, slug: slug, kurangGerak: kurangGerak, unduh: unduh };
})();
