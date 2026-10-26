/* Lapisan data. Dua mode dengan antarmuka yang sama:
   - "supabase": data di database. Pengunjung hanya membaca, tulis hanya untuk admin (aturan RLS di database/schema.sql).
   - "lokal": data dari folder data/. Edit admin tersimpan di localStorage browser itu saja.
   Bentuk data di memori: {games:[], kategori:[], produk:[]} (datar), lalu dirakit jadi pohon oleh pohon(). */
(function () {
  var IFS = window.IFS;
  var C = IFS.CONFIG;
  var u = IFS.u;
  var BASIS = document.documentElement.getAttribute("data-basis") || "./";
  var pakaiSupabase = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var TABEL = ["games", "kategori", "produk"];

  var janjiKlien = null;
  /* Pustaka Supabase (200 KB) hanya dimuat jika database dipakai. */
  function klienSiap() {
    if (janjiKlien) return janjiKlien;
    janjiKlien = new Promise(function (ok, gagal) {
      function buat() {
        ok(window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }));
      }
      if (window.supabase && window.supabase.createClient) return buat();
      var s = document.createElement("script");
      s.src = BASIS + "assets/js/vendor/supabase.js?v=1";
      s.onload = buat;
      s.onerror = function () { janjiKlien = null; gagal(new Error("Pustaka Supabase gagal dimuat. Periksa koneksi internet.")); };
      document.head.append(s);
    });
    return janjiKlien;
  }
  function galat(e, pesanDasar) {
    var m = (e && e.message) || "";
    if (/permission|row-level|policy|denied/i.test(m)) return new Error("Tidak punya izin. Pastikan sudah masuk dengan akun admin.");
    if (/duplicate|unique/i.test(m)) return new Error("Data dengan nama atau alamat itu sudah ada.");
    return new Error(m || pesanDasar);
  }

  /* ---------- Pohon <-> datar ---------- */
  function urut(a, b) { return (a.urutan || 0) - (b.urutan || 0) || String(a.nama).localeCompare(String(b.nama), "id"); }

  function pohon(s) {
    return s.games.slice().sort(urut).map(function (g) {
      var kats = s.kategori.filter(function (k) { return k.game_id === g.id; }).sort(urut).map(function (k) {
        var ps = s.produk.filter(function (p) { return p.kategori_id === k.id; }).sort(urut);
        return Object.assign({}, k, { produk: ps });
      });
      var terbaru = g.diubah || "";
      s.produk.forEach(function (p) {
        if (kats.some(function (k) { return k.id === p.kategori_id; }) && p.diubah && p.diubah > terbaru) terbaru = p.diubah;
      });
      return Object.assign({}, g, { kategori: kats, diperbarui: terbaru });
    });
  }

  function daratkan(game) {
    var s = { games: [], kategori: [], produk: [] };
    var gid = u.id();
    var waktu = game.diperbarui ? new Date(game.diperbarui + "T00:00:00Z").toISOString() : new Date().toISOString();
    s.games.push({ id: gid, slug: game.slug, kode: game.kode || "", nama: game.nama, subjudul: game.subjudul || "", aktif: game.aktif !== false, urutan: game.urutan || 0, diubah: waktu });
    (game.kategori || []).forEach(function (k, i) {
      var kid = u.id();
      s.kategori.push({ id: kid, game_id: gid, nama: k.nama, ket: k.ket || "", urutan: i });
      (k.produk || []).forEach(function (p, j) {
        s.produk.push({ id: u.id(), kategori_id: kid, nama: p.nama, termasuk: p.termasuk || "", harga: p.harga || [], tersedia: p.tersedia !== false, urutan: j, diubah: waktu });
      });
    });
    return s;
  }

  function gabung(a, b) { TABEL.forEach(function (t) { a[t] = a[t].concat(b[t]); }); return a; }

  /* ---------- Mode lokal ---------- */
  var memori = null;

  function bacaLokal() {
    try {
      var raw = localStorage.getItem(C.KUNCI_LOKAL);
      if (!raw) return null;
      var d = JSON.parse(raw);
      return d && Array.isArray(d.games) ? d : null;
    } catch (e) { return null; }
  }
  function tulisLokal() {
    try { localStorage.setItem(C.KUNCI_LOKAL, JSON.stringify(memori)); }
    catch (e) { throw new Error("Browser menolak menyimpan data."); }
  }
  function ambilJson(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("Gagal memuat " + url);
      return r.json();
    });
  }
  function muatSeed() {
    return ambilJson(BASIS + "data/games/daftar.json").then(function (d) {
      return Promise.all((d.games || []).map(function (slug) {
        return ambilJson(BASIS + "data/games/" + slug + "/" + slug + ".json");
      }));
    }).then(function (daftar) {
      var s = { games: [], kategori: [], produk: [] };
      daftar.forEach(function (g, i) { g.urutan = i; gabung(s, daratkan(g)); });
      return s;
    });
  }

  /* ---------- Mode Supabase ---------- */
  function semuaBaris(tabel) {
    var hasil = [];
    function halaman(dari) {
      return klienSiap().then(function (c) { return c.from(tabel).select("*").order("id").range(dari, dari + 999); }).then(function (r) {
        if (r.error) throw galat(r.error, "Gagal memuat data.");
        hasil = hasil.concat(r.data);
        return r.data.length === 1000 ? halaman(dari + 1000) : hasil;
      });
    }
    return halaman(0);
  }

  var data = {
    mode: pakaiSupabase ? "supabase" : "lokal",
    pohon: pohon,
    daratkan: daratkan,

    muat: function () {
      if (!pakaiSupabase) {
        if (memori) return Promise.resolve(memori);
        var lokal = bacaLokal();
        if (lokal) { memori = lokal; return Promise.resolve(memori); }
        return muatSeed().then(function (s) { memori = s; return s; });
      }
      return Promise.all(TABEL.map(semuaBaris)).then(function (r) {
        memori = { games: r[0], kategori: r[1], produk: r[2] };
        return memori;
      });
    },

    /* Hanya mode lokal: kembali ke data dari folder data/. */
    setelUlang: function () {
      if (pakaiSupabase) return Promise.resolve();
      try { localStorage.removeItem(C.KUNCI_LOKAL); } catch (e) {}
      memori = null;
      return Promise.resolve();
    },

    /* ---------- Admin ---------- */
    sesi: function () {
      if (!pakaiSupabase) return Promise.resolve({ masuk: true, lokal: true });
      return klienSiap().then(function (c) {
        return c.auth.getSession().then(function (r) {
          var s = r.data && r.data.session;
          if (!s) return { masuk: false };
          return c.rpc("saya_admin").then(function (a) {
            if (a.error || a.data !== true) return c.auth.signOut().then(function () { return { masuk: false, bukanAdmin: true }; });
            return { masuk: true, email: s.user.email };
          });
        });
      });
    },
    masuk: function (email, sandi) {
      if (!pakaiSupabase) return Promise.resolve({ masuk: true, lokal: true });
      return klienSiap().then(function (c) { return c.auth.signInWithPassword({ email: email, password: sandi }); }).then(function (r) {
        if (r.error) throw new Error("Email atau kata sandi salah.");
        return data.sesi();
      });
    },
    keluar: function () {
      if (!pakaiSupabase) return Promise.resolve();
      return klienSiap().then(function (c) { return c.auth.signOut(); }).then(function () {});
    },

    /* simpan satu baris (tambah atau ubah). tabel: "games" | "kategori" | "produk" */
    simpan: function (tabel, baris) {
      var b = Object.assign({}, baris);
      if (tabel === "produk") b.diubah = new Date().toISOString();
      if (tabel === "games") b.diubah = new Date().toISOString();
      return data.simpanBanyak(tabel, [b]).then(function () { return b; });
    },
    simpanBanyak: function (tabel, baris) {
      function terapkan() {
        baris.forEach(function (b) {
          var i = memori[tabel].findIndex(function (x) { return x.id === b.id; });
          if (i >= 0) memori[tabel][i] = Object.assign({}, memori[tabel][i], b); else memori[tabel].push(Object.assign({}, b));
        });
      }
      if (!baris.length) return Promise.resolve();
      if (!pakaiSupabase) { terapkan(); tulisLokal(); return Promise.resolve(); }
      return klienSiap().then(function (c) { return c.from(tabel).upsert(baris); }).then(function (r) {
        if (r.error) throw galat(r.error, "Gagal menyimpan.");
        terapkan();
      });
    },
    hapus: function (tabel, id) {
      function terapkan() {
        memori[tabel] = memori[tabel].filter(function (x) { return x.id !== id; });
        if (tabel === "games") {
          var kid = memori.kategori.filter(function (k) { return k.game_id === id; }).map(function (k) { return k.id; });
          memori.kategori = memori.kategori.filter(function (k) { return k.game_id !== id; });
          memori.produk = memori.produk.filter(function (p) { return kid.indexOf(p.kategori_id) < 0; });
        }
        if (tabel === "kategori") memori.produk = memori.produk.filter(function (p) { return p.kategori_id !== id; });
      }
      if (!pakaiSupabase) { terapkan(); tulisLokal(); return Promise.resolve(); }
      return klienSiap().then(function (c) { return c.from(tabel).delete().eq("id", id); }).then(function (r) {
        if (r.error) throw galat(r.error, "Gagal menghapus.");
        terapkan();
      });
    },
    /* tandai game sebagai baru diubah (tanggal "diperbarui" di halaman pelanggan) */
    sentuhGame: function (gameId) {
      var g = memori.games.find(function (x) { return x.id === gameId; });
      return g ? data.simpan("games", { id: g.id, slug: g.slug, kode: g.kode, nama: g.nama, subjudul: g.subjudul, aktif: g.aktif, urutan: g.urutan }) : Promise.resolve();
    },

    /* Masukkan hasil baca teks (impor.baca) ke sebuah game. */
    imporKe: function (gameId, hasil, kosongkanDulu) {
      var awal = kosongkanDulu
        ? Promise.all(memori.kategori.filter(function (k) { return k.game_id === gameId; }).map(function (k) { return data.hapus("kategori", k.id); }))
        : Promise.resolve();
      return awal.then(function () {
        var ada = memori.kategori.filter(function (k) { return k.game_id === gameId; });
        var mulai = ada.length ? Math.max.apply(null, ada.map(function (k) { return k.urutan || 0; })) + 1 : 0;
        var kats = [], prods = [], waktu = new Date().toISOString();
        hasil.kategori.forEach(function (k, i) {
          var kid = u.id();
          kats.push({ id: kid, game_id: gameId, nama: k.nama, ket: k.ket || "", urutan: mulai + i });
          k.produk.forEach(function (p, j) {
            prods.push({ id: u.id(), kategori_id: kid, nama: p.nama, termasuk: p.termasuk || "", harga: p.harga, tersedia: true, urutan: j, diubah: waktu });
          });
        });
        return data.simpanBanyak("kategori", kats).then(function () { return data.simpanBanyak("produk", prods); })
          .then(function () { return data.sentuhGame(gameId); })
          .then(function () { return { kategori: kats.length, produk: prods.length }; });
      });
    },

    /* Cadangan: pohon lengkap sebagai JSON. */
    ekspor: function () {
      return JSON.stringify({ dibuat: new Date().toISOString(), games: pohon(memori) }, null, 2);
    }
  };

  IFS.data = data;
})();
