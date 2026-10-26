/* Pembaca teks daftar harga. Dipakai di halaman admin (impor) dan di tools/ (Node).

   Aturan format:
   - "---------- NAMA KATEGORI ----------"  membuka kategori baru
   - "Nama = Harga"                         item yang dijual
   - "Termasuk: ..." atau "KET: ..."        keterangan, BUKAN item baru
       (sebelum item pertama di kategori -> catatan kategori, sesudahnya -> keterangan item)
   - bagian yang diawali "TIDAK MASUK LIST"  diabaikan sampai akhir
   - baris diawali "#" dan garis "=====" diabaikan
   Harga: 60K, 5K/map, 20K–30K/map, atau beberapa opsi dipisah koma:
          "10K/patch, total 20K"  ->  dua opsi harga (yang kedua berlabel "Total"). */
(function (root) {
  "use strict";

  var SATUAN_UANG = { k: 1000, rb: 1000, ribu: 1000, jt: 1000000, juta: 1000000 };
  var ANGKA = "(\\d+(?:[.,]\\d+)?)\\s*(k|rb|ribu|jt|juta)?";
  var RE_HARGA = new RegExp("^" + ANGKA + "(?:\\s*[\\u2013\\u2014-]\\s*" + ANGKA + ")?\\s*(?:/\\s*([^\\s,]+))?$", "i");
  var RE_LABEL_HARGA = new RegExp("^(.+?)\\s+(" + ANGKA + "(?:\\s*[\\u2013\\u2014-]\\s*" + ANGKA + ")?\\s*(?:/\\s*[^\\s,]+)?)$", "i");

  function kePecahan(angka, satuan) {
    var n = parseFloat(String(angka).replace(",", "."));
    if (!isFinite(n)) return NaN;
    var u = satuan ? SATUAN_UANG[String(satuan).toLowerCase()] : 0;
    if (u) return Math.round(n * u);
    return n < 1000 ? Math.round(n * 1000) : Math.round(n); /* "5" tanpa satuan dibaca 5 ribu */
  }

  /* "60K", "5K/map", "20K-30K/map", "Rp 15.000" -> {min, max, satuan} atau null */
  function bacaHarga(teks) {
    var s = String(teks || "").trim().replace(/^rp\.?\s*/i, "");
    var m = RE_HARGA.exec(s);
    if (!m) return null;
    var min = kePecahan(m[1].replace(/\.(?=\d{3}\b)/g, ""), m[2]);
    var max = m[3] ? kePecahan(m[3].replace(/\.(?=\d{3}\b)/g, ""), m[4] || m[2]) : null;
    if (!isFinite(min) || (max !== null && !isFinite(max))) return null;
    if (max !== null && max < min) { var t = min; min = max; max = t; }
    if (max === min) max = null;
    return { min: min, max: max, satuan: m[5] ? "/" + m[5] : "" };
  }

  function awalBesar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* Satu bagian harga -> opsi {label, min, max, satuan} atau null */
  function bacaOpsi(segmen) {
    var s = segmen.trim();
    if (!s) return null;
    var h = bacaHarga(s);
    if (h) return { label: "", min: h.min, max: h.max, satuan: h.satuan };
    var m = RE_LABEL_HARGA.exec(s);
    if (m) {
      var h2 = bacaHarga(m[2]);
      if (h2) return { label: awalBesar(m[1].trim()), min: h2.min, max: h2.max, satuan: h2.satuan };
    }
    return null;
  }

  function bacaDaftarOpsi(teks) {
    var hasil = [], gagal = [];
    String(teks).split(",").forEach(function (seg) {
      if (!seg.trim()) return;
      var o = bacaOpsi(seg);
      if (o) hasil.push(o); else gagal.push(seg.trim());
    });
    return { opsi: hasil, gagal: gagal };
  }

  /* Teks yang seluruhnya huruf besar dirapikan; kata pendek (<= 3 huruf) tetap kapital. */
  function rapikan(s) {
    var t = String(s || "").replace(/\s+/g, " ").trim();
    if (!t || t !== t.toUpperCase() || t === t.toLowerCase()) return t;
    return t.replace(/[A-Za-z][A-Za-z0-9]*/g, function (w) {
      return w.length <= 3 ? w : w.charAt(0) + w.slice(1).toLowerCase();
    });
  }

  function bersihkanJudulKategori(s) {
    return rapikan(String(s).replace(/\((?:\s*(?:harga\s+)?(?:terbaru|baru|update)\s*)\)/ig, "").replace(/\s+/g, " ").trim());
  }

  /* Teks -> {judul, kategori:[{nama, ket, produk:[{nama, termasuk, harga:[...]}]}], peringatan:[]} */
  function baca(teks) {
    var kategori = [], peringatan = [], judul = "";
    var kat = null, terakhir = null;
    var baris = String(teks || "").replace(/\r/g, "").split("\n");

    for (var i = 0; i < baris.length; i++) {
      var b = baris[i].trim();
      if (!b) continue;
      if (b.charAt(0) === "#") continue;
      if (/tidak\s+masuk\s+list/i.test(b)) break;
      if (/^[=\-_*\s]{4,}$/.test(b)) continue;

      var jdl = /^price\s*list\s+(?:joki\s+)?(.+)$/i.exec(b);
      if (jdl && !kat) { judul = jdl[1].trim(); continue; }

      var h = /^-{2,}\s*(.+?)\s*-{2,}$/.exec(b);
      if (h) {
        kat = { nama: bersihkanJudulKategori(h[1]), ket: "", produk: [] };
        kategori.push(kat); terakhir = null;
        continue;
      }

      var ket = /^(termasuk|ket|keterangan)\s*:\s*(.*)$/i.exec(b);
      if (ket) {
        if (!kat) continue;
        var isi = ket[2].trim();
        if (terakhir) terakhir.termasuk = terakhir.termasuk ? terakhir.termasuk + " " + isi : isi;
        else kat.ket = kat.ket ? kat.ket + " " + isi : isi;
        continue;
      }

      var item = /^([^=]+?)\s*=\s*(.+)$/.exec(b);
      if (item) {
        if (!kat) { kat = { nama: "Lainnya", ket: "", produk: [] }; kategori.push(kat); }
        var nama = rapikan(item[1]);
        var p = bacaDaftarOpsi(item[2]);
        if (!p.opsi.length) { peringatan.push("Harga tidak terbaca, baris dilewati: \"" + b + "\""); continue; }
        if (p.gagal.length) peringatan.push("Sebagian harga \"" + nama + "\" tidak terbaca: " + p.gagal.join("; "));
        terakhir = { nama: nama, termasuk: "", harga: p.opsi };
        kat.produk.push(terakhir);
        continue;
      }
      peringatan.push("Baris tidak dikenali, dilewati: \"" + b + "\"");
    }
    kategori = kategori.filter(function (k) { return k.produk.length || k.ket; });
    return { judul: judul, kategori: kategori, peringatan: peringatan };
  }

  var api = { baca: baca, bacaHarga: bacaHarga, bacaDaftarOpsi: bacaDaftarOpsi, rapikan: rapikan };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.IFS = root.IFS || {}; root.IFS.impor = api; }
})(typeof window !== "undefined" ? window : globalThis);
