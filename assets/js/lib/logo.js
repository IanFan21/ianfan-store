/* Pencari logo game. Murni di browser (situs statis):
   - iTunes Search API  -> ikon aplikasi game (mayoritas game populer ada di App Store)
   - Wikipedia          -> gambar utama artikel game
   Hasil dikecilkan jadi gambar 128px (data URL) agar situs tetap ringan dan tidak bergantung pada situs lain. */
(function () {
  var IFS = (window.IFS = window.IFS || {});
  var MAKS = 60000; /* karakter data URL */

  function ambilJson(url) {
    var kontrol = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (kontrol) kontrol.abort(); }, 8000);
    return fetch(url, kontrol ? { signal: kontrol.signal } : {}).then(function (r) {
      clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function dariItunes(nama) {
    var url = "https://itunes.apple.com/search?media=software&entity=software&limit=8&country=id&term=" + encodeURIComponent(nama);
    return ambilJson(url).then(function (d) {
      return (d.results || []).filter(function (r) { return r.artworkUrl512 || r.artworkUrl100; }).map(function (r) {
        var a = r.artworkUrl512 || r.artworkUrl100;
        return { url: a.replace(/\/\d+x\d+(bb|sr)?\.(jpg|png|webp)$/i, "/256x256bb.$2"), judul: r.trackName, sumber: "App Store" };
      });
    });
  }
  function dariWikipedia(nama) {
    var url = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrlimit=5&gsrsearch=" +
      encodeURIComponent(nama + " video game") + "&prop=pageimages&piprop=thumbnail&pithumbsize=300";
    return ambilJson(url).then(function (d) {
      var hal = d.query && d.query.pages ? Object.keys(d.query.pages).map(function (k) { return d.query.pages[k]; }) : [];
      hal.sort(function (a, b) { return (a.index || 0) - (b.index || 0); });
      return hal.filter(function (p) { return p.thumbnail && p.thumbnail.source; }).map(function (p) {
        return { url: p.thumbnail.source, judul: p.title, sumber: "Wikipedia" };
      });
    });
  }

  function cari(nama) {
    var cocok = function (x) { return String(x.judul || "").toLowerCase().replace(/[^a-z0-9]/g, "").indexOf(String(nama).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6)) >= 0; };
    var aman = function (p) { return p.catch(function () { return []; }); };
    return Promise.all([aman(dariItunes(nama)), aman(dariWikipedia(nama))]).then(function (r) {
      var semua = r[0].concat(r[1]);
      var pasti = semua.filter(cocok), sisa = semua.filter(function (x) { return !cocok(x); });
      return pasti.concat(sisa).slice(0, 10);
    });
  }

  /* gambar (Image/Bitmap) -> data URL 128px, dipotong persegi */
  function kecilkan(sumber, lebar, tinggi) {
    var ukuran = 128, c = document.createElement("canvas");
    c.width = c.height = ukuran;
    var x = c.getContext("2d");
    var s = Math.min(lebar, tinggi), sx = (lebar - s) / 2, sy = (tinggi - s) / 2;
    x.drawImage(sumber, sx, sy, s, s, 0, 0, ukuran, ukuran);
    var out = c.toDataURL("image/webp", 0.82);
    if (out.indexOf("data:image/webp") !== 0) out = c.toDataURL("image/jpeg", 0.8);
    if (out.length > MAKS) out = c.toDataURL("image/jpeg", 0.6);
    if (out.length > MAKS) throw new Error("Gambar terlalu rumit untuk dikecilkan.");
    return out;
  }
  function muatGambar(src, silang) {
    return new Promise(function (ok, gagal) {
      var im = new Image();
      if (silang) im.crossOrigin = "anonymous";
      im.onload = function () { ok(im); };
      im.onerror = function () { gagal(new Error("Gambar tidak bisa dimuat.")); };
      im.src = src;
    });
  }

  /* URL -> data URL kecil bila server mengizinkan (CORS); kalau tidak, pakai URL-nya langsung. */
  function siapkan(url) {
    if (/^data:image\//i.test(url)) return Promise.resolve(url);
    if (!/^https:\/\//i.test(url)) return Promise.reject(new Error("Link harus diawali https://"));
    return muatGambar(url, true).then(function (im) { return kecilkan(im, im.naturalWidth, im.naturalHeight); }, function () {
      return muatGambar(url, false).then(function () { return url; }); /* tidak boleh diolah, tapi bisa ditampilkan */
    });
  }
  function dariFile(f) {
    if (!/^image\//.test(f.type)) return Promise.reject(new Error("File harus berupa gambar."));
    if (f.size > 8 * 1024 * 1024) return Promise.reject(new Error("Gambar terlalu besar (maks 8 MB)."));
    var u = URL.createObjectURL(f);
    return muatGambar(u, false).then(function (im) { URL.revokeObjectURL(u); return kecilkan(im, im.naturalWidth, im.naturalHeight); });
  }

  IFS.logo = { cari: cari, siapkan: siapkan, dariFile: dariFile };
})();
