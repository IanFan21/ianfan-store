/* Halaman admin: masuk, kelola game, kategori, dan produk, impor dari teks, unduh cadangan. */
(function () {
  var IFS = window.IFS;
  var C = IFS.CONFIG;
  var u = IFS.u;
  var h = u.h;
  var data = IFS.data;
  var impor = IFS.impor;
  var $ = function (id) { return document.getElementById(id); };

  var state = null;     /* {games, kategori, produk} datar */
  var gameId = null;    /* game yang sedang dibuka */
  var timerToast = null;

  var SVG = {
    atas: '<path d="M6 15l6-6 6 6"/>',
    bawah: '<path d="M6 9l6 6 6-6"/>'
  };

  /* ---------- Bantu ---------- */
  function urut(a, b) { return (a.urutan || 0) - (b.urutan || 0) || String(a.nama).localeCompare(String(b.nama), "id"); }

  function kabar(teks, galat) {
    var t = $("toast");
    t.textContent = teks;
    t.className = "toast" + (galat ? " toast--galat" : "");
    t.hidden = false;
    clearTimeout(timerToast);
    timerToast = setTimeout(function () { t.hidden = true; }, galat ? 6000 : 3200);
  }

  function jalankan(janji, sukses) {
    return janji.then(function () {
      renderSemua();
      if (sukses) kabar(sukses);
    }).catch(function (e) {
      renderSemua();
      kabar((e && e.message) || "Terjadi kesalahan.", true);
    });
  }

  function ikonBtn(label, jalur, onclick, kelas) {
    var b = h("button", { type: "button", class: "ikon-btn" + (kelas ? " " + kelas : ""), title: label, "aria-label": label, onclick: onclick });
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + jalur + "</svg>"; /* konstanta SVG, bukan input pengguna */
    return b;
  }

  function buka(dlg) { if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", ""); }
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-tutup]");
    if (!t) return;
    var d = t.closest("dialog");
    if (d) d.close("batal");
  });

  function tanya(judul, isi, labelYa) {
    return new Promise(function (ok) {
      var d = $("dlg-konfirm");
      $("dlg-konfirm-h").textContent = judul;
      $("konfirm-isi").textContent = isi;
      $("konfirm-ya").textContent = labelYa || "Hapus";
      d.addEventListener("close", function () { ok(d.returnValue === "ya"); }, { once: true });
      d.returnValue = "batal";
      buka(d);
    });
  }

  function ringkasHarga(p) {
    return (p.harga || []).map(function (o) { return (o.label ? o.label + ": " : "") + u.teksHarga(o); }).join("  ·  ") || "Belum ada harga";
  }

  function pohonSekarang() { return data.pohon(state); }
  function gameSekarang() { return state.games.find(function (g) { return g.id === gameId; }) || null; }

  function sentuh() { return gameId ? data.sentuhGame(gameId) : Promise.resolve(); }

  /* ---------- Tampilan ---------- */
  function tampil(id) {
    $("memuat").hidden = true;
    ["v-masuk", "v-admin"].forEach(function (v) { $(v).hidden = v !== id; });
    $("aksiKepala").hidden = id !== "v-admin";
    var j = $(id).querySelector("h1");
    if (j) { j.setAttribute("tabindex", "-1"); j.focus({ preventScroll: true }); }
  }

  function renderSemua() { renderPilih(); renderGame(); }

  function renderPilih() {
    var wadah = $("game-pilih");
    wadah.replaceChildren();
    var daftar = state.games.slice().sort(urut);
    if (!daftar.length) wadah.append(h("p", { class: "kosong-kecil", text: "Belum ada game." }));
    daftar.forEach(function (g) {
      wadah.append(h("button", {
        type: "button", class: "chip", "aria-pressed": g.id === gameId ? "true" : "false",
        onclick: function () { gameId = g.id; renderSemua(); }
      }, g.kode || g.nama, g.aktif === false ? h("span", { class: "tanda-sembunyi", text: " (disembunyikan)" }) : null));
    });
  }

  function renderGame() {
    var area = $("area-game");
    var g = gameSekarang();
    if (!g) {
      area.replaceChildren(h("div", { class: "panel-admin kosong-admin" },
        h("h2", { text: "Belum ada game" }),
        h("p", { text: "Tambahkan game pertama, lalu isi kategori dan produknya. Atau impor langsung dari teks daftar harga." }),
        h("button", { type: "button", class: "btn btn--amber", onclick: function () { bukaGame(null); } }, "Tambah game")
      ));
      return;
    }
    var pg = pohonSekarang().find(function (x) { return x.id === g.id; });
    var jmlProduk = pg.kategori.reduce(function (a, k) { return a + k.produk.length; }, 0);

    var kepala = h("div", { class: "game-kepala" },
      h("span", { class: "kode kode--kecil", "aria-hidden": "true", text: g.kode || g.nama.slice(0, 3).toUpperCase() }),
      h("div", { class: "game-judul" },
        h("h2", { text: g.nama }),
        h("p", { class: "meta-admin" },
          g.aktif === false ? h("span", { class: "label-sembunyi", text: "Disembunyikan" }) : h("span", { class: "label-aktif", text: "Tampil di situs" }),
          " · " + pg.kategori.length + " kategori · " + jmlProduk + " produk · alamat #/game/" + g.slug
        )
      ),
      h("div", { class: "game-aksi" },
        h("button", { type: "button", class: "btn btn--garis btn--kecil", onclick: function () { bukaGame(g); } }, "Ubah game"),
        h("a", { class: "btn btn--garis btn--kecil", href: "../#/game/" + g.slug, target: "_blank", rel: "noopener" }, "Lihat di situs"),
        h("button", { type: "button", class: "btn btn--bahaya btn--kecil", onclick: function () { hapusGame(pg, jmlProduk); } }, "Hapus game")
      )
    );

    var cariAdm = h("input", { type: "search", id: "cari-admin", placeholder: "Cari produk di game ini", autocomplete: "off", "aria-label": "Cari produk di game ini" });
    cariAdm.value = kataCari;
    cariAdm.addEventListener("input", function () { kataCari = cariAdm.value; terapkanCari(); });
    var alat = h("div", { class: "alat-admin" },
      h("div", { class: "alat-kiri" },
        h("button", { type: "button", class: "btn btn--ink btn--kecil", onclick: function () { bukaKat(null); } }, "+ Kategori"),
        h("button", { type: "button", class: "btn btn--ink btn--kecil", onclick: function () { bukaImpor(); } }, "Impor dari teks")
      ),
      h("div", { class: "alat-kanan" },
        cariAdm,
        h("button", { type: "button", class: "btn btn--garis btn--kecil", onclick: function () { semuaBuka(true); } }, "Buka semua"),
        h("button", { type: "button", class: "btn btn--garis btn--kecil", onclick: function () { semuaBuka(false); } }, "Tutup semua")
      )
    );

    var isi = h("div", { class: "panel-admin" }, kepala, alat);
    if (!pg.kategori.length) {
      isi.append(h("p", { class: "kosong-kecil", text: "Game ini belum punya kategori. Tambah kategori atau impor dari teks." }));
    }
    if (!(g.id in sudahInit)) { sudahInit[g.id] = true; if (pg.kategori[0]) terbuka[pg.kategori[0].id] = true; }
    pg.kategori.forEach(function (k, i) { isi.append(blokKategori(k, i, pg.kategori)); });
    isi.append(h("p", { class: "kosong-kecil", id: "cari-kosong", hidden: true, text: "Tidak ada produk yang cocok dengan pencarian." }));
    area.replaceChildren(isi);
    terapkanCari();
  }

  /* Kategori dilipat supaya halaman tidak penuh; status buka/tutup diingat saat tampilan digambar ulang. */
  var terbuka = {}, sudahInit = {}, kataCari = "";
  function semuaBuka(buka) {
    Array.prototype.forEach.call(document.querySelectorAll("details.kat-admin"), function (d) { d.open = buka; terbuka[d.dataset.id] = buka; });
  }
  function terapkanCari() {
    var q = u.norm(kataCari);
    Array.prototype.forEach.call(document.querySelectorAll("details.kat-admin"), function (d) {
      var ada = 0;
      Array.prototype.forEach.call(d.querySelectorAll(".baris-admin"), function (r) {
        var cocok = !q || r.dataset.teks.indexOf(q) >= 0;
        r.hidden = !cocok; if (cocok) ada++;
      });
      d.hidden = !!q && !ada;
      if (q) d.open = ada > 0; else d.open = !!terbuka[d.dataset.id];
    });
    var kosong = document.getElementById("cari-kosong");
    var tampak = document.querySelectorAll("details.kat-admin:not([hidden])").length;
    if (kosong) kosong.hidden = !(q && !tampak);
  }
  document.addEventListener("click", function (e) {
    Array.prototype.forEach.call(document.querySelectorAll("details.lain[open]"), function (d) { if (!d.contains(e.target)) d.open = false; });
  });

  function blokKategori(k, i, semua) {
    var daftar = h("ul", { class: "daftar-prod" });
    k.produk.forEach(function (p, j) { daftar.append(barisProduk(p, j, k)); });
    var habis = k.produk.filter(function (p) { return p.tersedia === false; }).length;
    var d = h("details", { class: "kat-admin", "data-id": k.id },
      h("summary", { class: "kat-ringkas" },
        h("span", { class: "kat-panah", "aria-hidden": "true" }),
        h("span", { class: "kat-nama", text: k.nama }),
        h("span", { class: "jml", text: k.produk.length + " produk" }),
        habis ? h("span", { class: "tanda-habis", text: habis + " habis" }) : null
      ),
      h("div", { class: "kat-isi" },
        h("div", { class: "kat-aksi" },
          h("button", { type: "button", class: "btn btn--garis btn--kecil", onclick: function () { bukaKat(k); } }, "Ubah kategori"),
          ikonBtn("Naikkan kategori " + k.nama, SVG.atas, function () { geser("kategori", semua, i, -1); }),
          ikonBtn("Turunkan kategori " + k.nama, SVG.bawah, function () { geser("kategori", semua, i, 1); }),
          h("button", { type: "button", class: "btn btn--bahaya btn--kecil", onclick: function () { hapusKat(k); } }, "Hapus kategori")
        ),
        k.ket ? h("p", { class: "ket-admin", text: k.ket }) : null,
        daftar,
        h("button", { type: "button", class: "btn btn--ink btn--kecil tambah-prod", onclick: function () { bukaProd(null, k); } }, "+ Tambah produk")
      )
    );
    d.open = !!terbuka[k.id];
    d.addEventListener("toggle", function () { if (!d.hidden && !u.norm(kataCari)) terbuka[k.id] = d.open; });
    return d;
  }

  function barisProduk(p, j, k) {
    var tersedia = p.tersedia !== false;
    var teksSaklar = h("span", { class: "saklar-teks", text: tersedia ? "Tersedia" : "Habis" });
    var lain = h("details", { class: "lain" },
      h("summary", { class: "ikon-btn", "aria-label": "Aksi lain untuk " + p.nama, title: "Aksi lain" }),
      h("div", { class: "lain-isi" },
        h("button", { type: "button", class: "lain-btn", onclick: function () { geser("produk", k.produk, j, -1); } }, "Pindah ke atas"),
        h("button", { type: "button", class: "lain-btn", onclick: function () { geser("produk", k.produk, j, 1); } }, "Pindah ke bawah"),
        h("button", { type: "button", class: "lain-btn lain-bahaya", onclick: function () { hapusProd(p); } }, "Hapus produk")
      )
    );
    lain.querySelector("summary").innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
    var li = h("li", { class: "baris-admin" + (tersedia ? "" : " nonaktif"), "data-teks": u.norm(p.nama + " " + (p.termasuk || "")) },
      h("div", { class: "baris-info" },
        h("p", { class: "nama-admin", text: p.nama }),
        h("p", { class: "harga-admin", text: ringkasHarga(p) }),
        p.termasuk ? h("p", { class: "termasuk-admin", text: p.termasuk }) : null
      ),
      h("div", { class: "baris-aksi" },
        h("label", { class: "saklar" },
          h("input", { type: "checkbox", role: "switch", checked: tersedia ? true : false, onchange: function (e) {
            jalankan(data.simpan("produk", Object.assign({}, p, { tersedia: e.target.checked })).then(sentuh), e.target.checked ? "Ditandai tersedia." : "Ditandai habis.");
          } }),
          teksSaklar
        ),
        h("button", { type: "button", class: "btn btn--garis btn--kecil", onclick: function () { bukaProd(p, k); } }, "Ubah", h("span", { class: "sr-only", text: " " + p.nama })),
        lain
      )
    );
    return li;
  }

  /* Tukar urutan dengan tetangga. Selalu kirim baris utuh (database menolak baris parsial untuk baru). */
  function geser(tabel, daftar, i, arah) {
    var j = i + arah;
    if (j < 0 || j >= daftar.length) return;
    var s = daftar.slice();
    var t = s[i]; s[i] = s[j]; s[j] = t;
    var ubah = [];
    s.forEach(function (r, idx) {
      var asli = state[tabel].find(function (x) { return x.id === r.id; });
      if ((asli.urutan || 0) !== idx) ubah.push(Object.assign({}, asli, { urutan: idx }));
    });
    jalankan(data.simpanBanyak(tabel, ubah));
  }

  /* ---------- Game ---------- */
  var slugManual = false;
  function bukaGame(g) {
    var baru = !g;
    $("dlg-game-h").textContent = baru ? "Tambah game" : "Ubah game";
    $("g-nama").value = baru ? "" : g.nama;
    $("g-kode").value = baru ? "" : g.kode || "";
    $("g-slug").value = baru ? "" : g.slug;
    $("g-slug").disabled = !baru;
    $("g-slug-ket").textContent = baru ? "Dipakai di link, misalnya #/game/hsr." : "Alamat tidak bisa diubah supaya link yang sudah dibagikan tetap jalan.";
    $("g-sub").value = baru ? "" : g.subjudul || "";
    $("g-aktif").checked = baru ? true : g.aktif !== false;
    $("g-galat").textContent = "";
    aturLogo(baru ? "" : g.logo || "", baru);
    slugManual = !baru;
    $("form-game").dataset.id = baru ? "" : g.id;
    buka($("dlg-game"));
  }
  function slugOtomatis() {
    if (!slugManual) $("g-slug").value = u.slug($("g-kode").value.trim() || $("g-nama").value);
  }
  /* ----- Logo game: cari otomatis (iTunes + Wikipedia), unggah, tempel link ----- */
  var logoNilai = "", logoManual = false, logoTunda = 0, logoNomor = 0;
  function pratinjau() {
    var w = $("g-logo-pr");
    w.replaceChildren();
    if (logoNilai) {
      var img = h("img", { src: logoNilai, alt: "", width: 56, height: 56, referrerpolicy: "no-referrer" });
      img.addEventListener("error", function () { w.replaceChildren(h("span", { class: "logo-kosong", text: "?" })); $("g-logo-ket").textContent = "Gambar tidak bisa dimuat. Coba pilihan lain."; });
      w.append(img);
    } else w.append(h("span", { class: "logo-kosong", text: "Logo" }));
  }
  function aturLogo(nilai, otomatis) {
    logoNilai = nilai || ""; logoManual = !otomatis && !!nilai;
    $("g-logo-hasil").replaceChildren(); $("g-logo-link").value = "";
    $("g-logo-ket").textContent = otomatis ? "Dicari otomatis dari nama game. Pilih yang paling cocok." : "";
    pratinjau();
  }
  function pilihLogo(url, dariOtomatis) {
    var nomor = ++logoNomor;
    $("g-logo-ket").textContent = "Menyiapkan logo…";
    IFS.logo.siapkan(url).then(function (hasil) {
      if (nomor !== logoNomor) return;
      logoNilai = hasil; logoManual = !dariOtomatis; pratinjau();
      $("g-logo-ket").textContent = dariOtomatis ? "Logo dipilih otomatis. Klik pilihan lain bila kurang cocok." : "Logo dipakai.";
    }).catch(function (e) { $("g-logo-ket").textContent = e.message || "Logo gagal dipakai."; });
  }
  function cariLogo(otomatis) {
    var nama = $("g-nama").value.trim();
    if (nama.length < 2) { $("g-logo-ket").textContent = "Isi nama game dulu."; return; }
    var nomor = ++logoNomor;
    $("g-logo-ket").textContent = "Mencari logo…";
    $("g-logo-hasil").replaceChildren();
    IFS.logo.cari(nama).then(function (daftar) {
      if (nomor !== logoNomor) return;
      if (!daftar.length) { $("g-logo-ket").textContent = "Logo tidak ditemukan. Unggah gambar atau tempel link."; return; }
      var kotak = $("g-logo-hasil");
      daftar.forEach(function (d) {
        var tb = h("button", { type: "button", class: "logo-pilihan", title: d.judul + " (" + d.sumber + ")", "aria-label": "Pakai logo " + d.judul }, h("img", { src: d.url, alt: "", width: 48, height: 48, loading: "lazy", referrerpolicy: "no-referrer" }));
        tb.addEventListener("click", function () { pilihLogo(d.url, false); });
        kotak.append(tb);
      });
      $("g-logo-ket").textContent = daftar.length + " kandidat ditemukan. Klik untuk memilih.";
      if (otomatis && !logoManual && !logoNilai) pilihLogo(daftar[0].url, true);
    }).catch(function () { $("g-logo-ket").textContent = "Pencarian logo gagal (periksa internet). Unggah gambar atau tempel link."; });
  }
  $("g-logo-cari").addEventListener("click", function () { logoManual = false; logoNilai = ""; cariLogo(true); });
  $("g-logo-hapus").addEventListener("click", function () { logoNomor++; aturLogo("", false); logoManual = true; $("g-logo-ket").textContent = "Logo dihapus; kartu memakai ikon bawaan."; });
  $("g-logo-file").addEventListener("change", function () {
    var f = this.files && this.files[0]; this.value = "";
    if (!f) return;
    var nomor = ++logoNomor;
    IFS.logo.dariFile(f).then(function (hasil) { if (nomor !== logoNomor) return; logoNilai = hasil; logoManual = true; pratinjau(); $("g-logo-ket").textContent = "Gambar diunggah dan dikecilkan."; })
      .catch(function (e) { $("g-logo-ket").textContent = e.message || "Gambar gagal dibaca."; });
  });
  $("g-logo-link").addEventListener("change", function () {
    var v = this.value.trim(); if (!v) return;
    if (!/^https:\/\//i.test(v)) { $("g-logo-ket").textContent = "Link harus diawali https://"; return; }
    pilihLogo(v, false);
  });
  $("g-nama").addEventListener("input", function () {
    if ($("form-game").dataset.id || logoManual) return; /* hanya untuk game baru yang logonya belum dipilih manual */
    clearTimeout(logoTunda);
    logoTunda = setTimeout(function () { if (!logoManual) { logoNilai = ""; cariLogo(true); } }, 900);
  });

  $("g-nama").addEventListener("input", slugOtomatis);
  $("g-kode").addEventListener("input", slugOtomatis);
  $("g-slug").addEventListener("input", function () { slugManual = true; });
  $("form-game").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("form-game").dataset.id;
    var nama = $("g-nama").value.trim();
    var slug = $("g-slug").value.trim().toLowerCase();
    var galat = $("g-galat");
    galat.textContent = "";
    if (!nama) { galat.textContent = "Isi nama game."; $("g-nama").focus(); return; }
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) { galat.textContent = "Alamat harus 2 sampai 40 karakter: huruf kecil, angka, atau tanda hubung."; $("g-slug").focus(); return; }
    if (state.games.some(function (x) { return x.slug === slug && x.id !== id; })) { galat.textContent = "Alamat itu sudah dipakai game lain."; $("g-slug").focus(); return; }
    var ada = id ? state.games.find(function (x) { return x.id === id; }) : null;
    var urutanBaru = ada ? ada.urutan : state.games.length ? Math.max.apply(null, state.games.map(function (x) { return x.urutan || 0; })) + 1 : 0;
    var baris = { id: id || u.id(), slug: slug, kode: $("g-kode").value.trim().toUpperCase().slice(0, 12), nama: nama, subjudul: $("g-sub").value.trim(), logo: logoNilai, aktif: $("g-aktif").checked, urutan: urutanBaru };
    $("dlg-game").close("simpan");
    gameId = baris.id;
    jalankan(data.simpan("games", baris), ada ? "Game disimpan." : "Game ditambahkan.");
  });
  function hapusGame(pg, jml) {
    tanya("Hapus game " + pg.nama + "?", "Ini ikut menghapus " + pg.kategori.length + " kategori dan " + jml + " produknya, dan tidak bisa dibatalkan. Unduh data dulu jika perlu cadangan.", "Hapus game").then(function (ya) {
      if (!ya) return;
      var sisa = state.games.filter(function (x) { return x.id !== pg.id; }).sort(urut);
      gameId = sisa.length ? sisa[0].id : null;
      jalankan(data.hapus("games", pg.id), "Game dihapus.");
    });
  }

  /* ---------- Kategori ---------- */
  function bukaKat(k) {
    $("dlg-kat-h").textContent = k ? "Ubah kategori" : "Tambah kategori";
    $("k-nama").value = k ? k.nama : "";
    $("k-ket").value = k ? k.ket || "" : "";
    $("k-galat").textContent = "";
    $("form-kat").dataset.id = k ? k.id : "";
    buka($("dlg-kat"));
  }
  $("form-kat").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("form-kat").dataset.id;
    var nama = $("k-nama").value.trim();
    if (!nama) { $("k-galat").textContent = "Isi nama kategori."; $("k-nama").focus(); return; }
    var ada = id ? state.kategori.find(function (x) { return x.id === id; }) : null;
    var sama = state.kategori.filter(function (x) { return x.game_id === gameId; });
    var baris = {
      id: id || u.id(), game_id: gameId, nama: nama, ket: $("k-ket").value.trim(),
      urutan: ada ? ada.urutan : sama.length ? Math.max.apply(null, sama.map(function (x) { return x.urutan || 0; })) + 1 : 0
    };
    $("dlg-kat").close("simpan");
    jalankan(data.simpan("kategori", baris).then(sentuh), ada ? "Kategori disimpan." : "Kategori ditambahkan.");
  });
  function hapusKat(k) {
    tanya("Hapus kategori " + k.nama + "?", "Ikut menghapus " + k.produk.length + " produk di dalamnya. Tidak bisa dibatalkan.", "Hapus kategori").then(function (ya) {
      if (ya) jalankan(data.hapus("kategori", k.id).then(sentuh), "Kategori dihapus.");
    });
  }

  /* ---------- Produk ---------- */
  function normSatuan(s) {
    var t = String(s || "").trim();
    return t && t.charAt(0) !== "/" ? "/" + t : t;
  }
  function kolom(label, el) { return h("div", { class: "isian" }, label, el); }
  function barisOpsi(o) {
    o = o || {};
    var id = u.id().slice(0, 8);
    function f(kelas, judul, ph, nilai, mode) {
      return h("div", { class: "isian" },
        h("label", { for: kelas + id, text: judul }),
        h("input", { id: kelas + id, class: kelas, type: "text", placeholder: ph, value: nilai === undefined || nilai === null ? "" : String(nilai), inputmode: mode || false, autocomplete: "off" })
      );
    }
    var r = h("div", { class: "opsi-form" },
      f("f-label", "Keterangan harga (opsional)", "mis. Paket semua map", o.label),
      f("f-min", "Harga", "60000 atau 60k", o.min, "text"),
      f("f-max", "Sampai (opsional)", "30k", o.max, "text"),
      f("f-satuan", "Per (opsional)", "/map", o.satuan),
      h("button", { type: "button", class: "btn btn--bahaya btn--kecil hapus-opsi", onclick: function () {
        if ($("p-opsi").children.length > 1) r.remove();
        else { r.querySelectorAll("input").forEach(function (i) { i.value = ""; }); }
      } }, "Hapus pilihan")
    );
    return r;
  }
  function bukaProd(p, k) {
    $("dlg-prod-h").textContent = p ? "Ubah produk" : "Tambah produk di " + k.nama;
    $("p-nama").value = p ? p.nama : "";
    $("p-termasuk").value = p ? p.termasuk || "" : "";
    $("p-tersedia").checked = p ? p.tersedia !== false : true;
    $("p-galat").textContent = "";
    var w = $("p-opsi");
    w.replaceChildren();
    ((p && p.harga && p.harga.length) ? p.harga : [{}]).forEach(function (o) { w.append(barisOpsi(o)); });
    $("form-prod").dataset.id = p ? p.id : "";
    $("form-prod").dataset.kat = k.id;
    buka($("dlg-prod"));
  }
  $("p-tambah-opsi").addEventListener("click", function () {
    var r = barisOpsi({});
    $("p-opsi").append(r);
    r.querySelector(".f-label").focus();
  });
  $("form-prod").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("form-prod").dataset.id;
    var galat = $("p-galat");
    galat.textContent = "";
    var nama = $("p-nama").value.trim();
    if (!nama) { galat.textContent = "Isi nama produk."; $("p-nama").focus(); return; }
    var opsi = [], baris = $("p-opsi").children;
    for (var i = 0; i < baris.length; i++) {
      var r = baris[i];
      var minTeks = r.querySelector(".f-min").value.trim();
      var m = impor.bacaHarga(minTeks);
      if (!m) {
        galat.textContent = (baris.length > 1 ? "Pilihan harga " + (i + 1) + ": " : "") + "harga belum terbaca. Contoh yang benar: 60000, 60k, atau 15.000.";
        r.querySelector(".f-min").focus();
        return;
      }
      var maksTeks = r.querySelector(".f-max").value.trim();
      var mk = maksTeks ? impor.bacaHarga(maksTeks) : null;
      if (maksTeks && !mk) { galat.textContent = "Kolom \"Sampai\" belum terbaca. Kosongkan jika tidak perlu."; r.querySelector(".f-max").focus(); return; }
      var maks = mk && mk.min > m.min ? mk.min : (m.max || null);
      opsi.push({
        label: r.querySelector(".f-label").value.trim(),
        min: m.min, max: maks,
        satuan: normSatuan(r.querySelector(".f-satuan").value) || m.satuan || ""
      });
    }
    var kid = $("form-prod").dataset.kat;
    var ada = id ? state.produk.find(function (x) { return x.id === id; }) : null;
    var sama = state.produk.filter(function (x) { return x.kategori_id === kid; });
    var row = {
      id: id || u.id(), kategori_id: kid, nama: nama, termasuk: $("p-termasuk").value.trim(), harga: opsi,
      tersedia: $("p-tersedia").checked,
      urutan: ada ? ada.urutan : sama.length ? Math.max.apply(null, sama.map(function (x) { return x.urutan || 0; })) + 1 : 0
    };
    $("dlg-prod").close("simpan");
    jalankan(data.simpan("produk", row).then(sentuh), ada ? "Produk disimpan." : "Produk ditambahkan.");
  });
  function hapusProd(p) {
    tanya("Hapus produk " + p.nama + "?", "Produk ini hilang dari daftar harga. Tidak bisa dibatalkan. Kalau hanya sementara tidak tersedia, matikan saklar Tersedia saja.", "Hapus produk").then(function (ya) {
      if (ya) jalankan(data.hapus("produk", p.id).then(sentuh), "Produk dihapus.");
    });
  }

  /* ---------- Impor dari teks ---------- */
  var hasilBaca = null;
  function bukaImpor() {
    $("i-teks").value = "";
    $("i-hasil").replaceChildren();
    $("i-galat").textContent = "";
    $("i-masuk").disabled = true;
    hasilBaca = null;
    var punya = state.kategori.some(function (k) { return k.game_id === gameId; });
    $("i-ganti-wrap").hidden = !punya;
    $("i-ganti").checked = false;
    buka($("dlg-impor"));
  }
  $("i-teks").addEventListener("input", function () { hasilBaca = null; $("i-masuk").disabled = true; });
  $("i-baca").addEventListener("click", function () {
    var teks = $("i-teks").value;
    var w = $("i-hasil");
    w.replaceChildren();
    $("i-galat").textContent = "";
    if (!teks.trim()) { $("i-galat").textContent = "Tempel teks daftar harga dulu."; return; }
    hasilBaca = impor.baca(teks);
    var jml = hasilBaca.kategori.reduce(function (a, k) { return a + k.produk.length; }, 0);
    if (!hasilBaca.kategori.length) { hasilBaca = null; $("i-galat").textContent = "Tidak ada produk yang terbaca. Pastikan ada baris \"Nama = Harga\" di bawah judul kategori."; return; }
    w.append(h("p", { class: "ringkas-impor", text: "Terbaca " + hasilBaca.kategori.length + " kategori dan " + jml + " produk." }));
    var ul = h("ul", { class: "daftar-impor" });
    hasilBaca.kategori.forEach(function (k) {
      ul.append(h("li", {}, h("strong", { text: k.nama }), " · " + k.produk.length + " produk" + (k.ket ? " · ada catatan" : "")));
    });
    w.append(ul);
    if (hasilBaca.peringatan.length) {
      w.append(h("p", { class: "peringatan-impor", text: "Perlu dicek:" }));
      w.append(h("ul", { class: "daftar-impor" }, hasilBaca.peringatan.map(function (t) { return h("li", { text: t }); })));
    }
    $("i-masuk").disabled = false;
  });
  $("form-impor").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!hasilBaca) { $("i-galat").textContent = "Klik \"Periksa teks\" dulu."; return; }
    var ganti = $("i-ganti").checked;
    function lanjut() {
      var hasil = hasilBaca;
      $("dlg-impor").close("simpan");
      data.imporKe(gameId, hasil, ganti).then(function (r) {
        renderSemua();
        kabar(r.kategori + " kategori dan " + r.produk + " produk dimasukkan.");
      }).catch(function (err) { renderSemua(); kabar(err.message || "Gagal mengimpor.", true); });
    }
    if (ganti) {
      tanya("Ganti semua isi game ini?", "Semua kategori dan produk game ini dihapus dulu, lalu diganti isi teks. Tidak bisa dibatalkan.", "Ya, ganti").then(function (ya) { if (ya) lanjut(); });
    } else lanjut();
  });

  /* ---------- Masuk, keluar, cadangan ---------- */
  $("form-masuk").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("email").value.trim(), sandi = $("sandi").value;
    var galat = $("galat-masuk");
    galat.textContent = "";
    if (!email || !sandi) { galat.textContent = "Isi email dan kata sandi."; return; }
    var b = $("btn-masuk");
    b.disabled = true;
    data.masuk(email, sandi, window.turnstile ? window.turnstile.getResponse() : "").then(function (s) {
      $("sandi").value = "";
      if (s.masuk) mulaiAdmin(); else galat.textContent = "Akun ini tidak punya akses admin.";
    }, function (err) { galat.textContent = err.message || "Gagal masuk. Coba lagi."; }).then(function () { b.disabled = false; });
  });
  $("btn-keluar").addEventListener("click", function () {
    data.keluar().then(function () { state = null; tampil("v-masuk"); });
  });
  $("btn-game-baru").addEventListener("click", function () { bukaGame(null); });
  $("btn-ekspor").addEventListener("click", function () {
    u.unduh("ianfan-store-" + new Date().toISOString().slice(0, 10) + ".json", data.ekspor());
    kabar("Data diunduh.");
  });
  $("btn-setel").addEventListener("click", function () {
    tanya("Kembalikan ke data awal?", "Semua perubahan yang tersimpan di browser ini dibuang, dan data kembali ke isi folder data/. Unduh data dulu jika perlu.", "Kembalikan").then(function (ya) {
      if (!ya) return;
      data.setelUlang().then(function () { return data.muat(); }).then(function (s) {
        state = s;
        var g = state.games.slice().sort(urut)[0];
        gameId = g ? g.id : null;
        renderSemua();
        kabar("Data dikembalikan ke isi awal.");
      });
    });
  });

  function mulaiAdmin() {
    tampil("v-admin");
    $("pita-lokal").hidden = data.mode !== "lokal";
    $("btn-setel").hidden = data.mode !== "lokal";
    $("btn-keluar").hidden = data.mode === "lokal";
    data.muat().then(function (s) {
      state = s;
      var g = state.games.slice().sort(urut)[0];
      gameId = g ? g.id : null;
      renderSemua();
    }, function (err) {
      $("area-game").replaceChildren(h("p", { class: "status status--galat", role: "alert", text: "Data gagal dimuat: " + (err.message || "coba muat ulang halaman.") }));
    });
  }

  $("namaTokoAdmin").textContent = C.NAMA_TOKO;
  data.sesi().then(function (s) {
    if (s.masuk) mulaiAdmin();
    else {
      tampil("v-masuk");
      if (s.bukanAdmin) $("galat-masuk").textContent = "Akun yang tadi masuk tidak punya akses admin, jadi sesinya diakhiri.";
    }
  }, function (err) {
    $("memuat").className = "status status--galat";
    $("memuat").textContent = "Gagal terhubung ke database: " + (err.message || "periksa pengaturan di assets/js/config/config.js.");
  });
})();
