/* Halaman pelanggan: pilih game, lihat daftar harga. Rute memakai hash: #/ (daftar game) dan #/game/<slug>. */
(function () {
  var IFS = window.IFS;
  var C = IFS.CONFIG;
  var u = IFS.u;
  var h = u.h;
  var data = IFS.data;

  var tampilan = document.getElementById("tampilan");
  var tautanBalik = document.getElementById("tautanBalik");
  var daftarGame = null;

  var ik = IFS.ikon;
  function ikon(nama, ukuran, kelas) { return ik.el(nama, ukuran, kelas); }

  function logoAman(u2) { return typeof u2 === "string" && (/^https:\/\//i.test(u2) || /^data:image\/(webp|png|jpe?g|gif);base64,/i.test(u2)); }
  /* Logo game bila ada (gambar kecil, dimuat malas); jatuh kembali ke ikon bila gagal dimuat. */
  function wadahLogo(g, ukuran, kelas) {
    var w = h("span", { class: kelas });
    var cadangan = function () { w.replaceChildren(ikon("gamepad", Math.round(ukuran * 0.5))); };
    if (logoAman(g.logo)) {
      var img = h("img", { src: g.logo, alt: "", width: ukuran, height: ukuran, loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" });
      img.addEventListener("error", cadangan);
      w.append(img);
      w.classList.add("ada-logo");
    } else cadangan();
    return w;
  }

  function semuaProduk(g) {
    return g.kategori.reduce(function (a, k) { return a.concat(k.produk); }, []);
  }
  function opsiTermurah(daftar) {
    var m = null;
    daftar.forEach(function (p) {
      if (p.tersedia === false) return;
      (p.harga || []).forEach(function (o) { if (m === null || o.min < m.min) m = o; });
    });
    return m;
  }
  function teksMulai(o) { return o ? u.rupiah(o.min) + (o.satuan ? o.satuan : "") : ""; }
  function ringkasHarga(p) {
    var o = (p.harga || [])[0];
    return o ? u.teksHarga(o) : "";
  }

  /* ---------- Kontak ---------- */
  function daftarKontak() {
    var k = [];
    if (C.WA_NOMOR) k.push({ nama: "WhatsApp", ikon: "chat", ket: "Tanya harga & order", href: "https://wa.me/" + C.WA_NOMOR + "?text=" + encodeURIComponent("Halo " + C.NAMA_TOKO + ", saya mau tanya harga joki.") });
    if (C.FB_URL) k.push({ nama: "Facebook", ikon: "facebook", ket: "Lihat profil", href: C.FB_URL });
    if (C.DISCORD_URL) k.push({ nama: "Discord", ikon: "discord", ket: C.DISCORD || "Kirim pesan", href: C.DISCORD_URL });
    else if (C.DISCORD) k.push({ nama: "Discord", ikon: "discord", ket: C.DISCORD, salin: C.DISCORD });
    return k;
  }
  var tHilang = 0;
  function toast(teks) {
    var t = document.getElementById("toast"); if (!t) return;
    t.textContent = teks; t.hidden = false; t.classList.add("tampak");
    clearTimeout(tHilang); tHilang = setTimeout(function () { t.classList.remove("tampak"); t.hidden = true; }, 2200);
  }
  function salinTeks(teks) {
    var ok = function () { toast("Username Discord \"" + teks + "\" disalin."); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(teks).then(ok, function () { toast("Username Discord: " + teks); });
    else toast("Username Discord: " + teks);
  }
  function tombolKontak(k, kelas) {
    var isi = [ikon(k.ikon, 20), h("span", { class: "kontak-teks" }, h("strong", { text: k.nama }), kelas === "kontak-btn" ? h("small", { text: k.ket }) : null)];
    if (k.salin) {
      var b = h("button", { type: "button", class: kelas, "aria-label": "Salin username Discord " + k.salin }, isi);
      b.addEventListener("click", function () { salinTeks(k.salin); });
      return b;
    }
    return h("a", { class: kelas, href: k.href, target: "_blank", rel: "noopener" }, isi);
  }
  /* Pilihan kanal untuk tombol "Pesan". WhatsApp bisa langsung membawa isi pesan; Facebook/Discord tidak,
     jadi teks pesan disalin ke papan klip dan pelanggan tinggal menempelkannya di chat. */
  function kanalPesan(teks) {
    var d = [];
    if (C.WA_NOMOR) d.push({ id: "wa", nama: "WhatsApp", ikon: "chat", ket: "Pesan langsung terisi", href: "https://wa.me/" + C.WA_NOMOR + "?text=" + encodeURIComponent(teks) });
    var fb = C.FB_CHAT || C.FB_URL;
    if (fb) d.push({ id: "fb", nama: "Facebook Messenger", ikon: "facebook", ket: "Pesan akan disalin, tinggal tempel", href: fb, salinTeks: teks });
    if (C.DISCORD_URL) d.push({ id: "dc", nama: "Discord", ikon: "discord", ket: "Pesan akan disalin, tinggal tempel", href: C.DISCORD_URL, salinTeks: teks });
    return d;
  }
  function teksPesan(g, kat, p, o) {
    var b = ["Halo " + C.NAMA_TOKO + ", saya mau pesan:", "- " + (g.kode || g.nama) + " · " + kat.nama + ": " + p.nama];
    if (o) b.push("  (" + (o.label ? o.label + ", " : "") + u.teksHarga(o) + ")");
    b.push("", "UID:", "Server:", "Catatan:");
    return b.join("\n");
  }
  var dlgPesan = null;
  function bukaPesan(g, kat, p) {
    if (!dlgPesan) {
      dlgPesan = h("dialog", { class: "dlg-pesan", "aria-labelledby": "dlg-pesan-h" });
      dlgPesan.addEventListener("click", function (e) { if (e.target === dlgPesan) dlgPesan.close(); });
      document.body.append(dlgPesan);
    }
    var opsi = p.harga || [];
    var pilih = 0;
    var teks = teksPesan(g, kat, p, opsi[0]);
    var kanal = kanalPesan(teks);
    var tautan = {};
    var pilihan = h("div", { class: "pesan-pilihan" });
    kanal.forEach(function (k) {
      var a = h("a", { class: "pilih-kontak", href: k.href, target: "_blank", rel: "noopener" }, ikon(k.ikon, 22), h("span", {}, h("strong", { text: k.nama }), h("small", { text: k.ket })));
      a.addEventListener("click", function () {
        if (k.salinTeks && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(teks).then(function () { toast("Pesan disalin. Tempel di chat."); }, function () {});
        dlgPesan.close();
      });
      tautan[k.id] = a; pilihan.append(a);
    });
    function segarkan() {
      teks = teksPesan(g, kat, p, opsi[pilih]);
      if (tautan.wa) tautan.wa.href = "https://wa.me/" + C.WA_NOMOR + "?text=" + encodeURIComponent(teks);
    }
    var grupOpsi = null;
    if (opsi.length > 1) {
      grupOpsi = h("fieldset", { class: "pesan-opsi" }, h("legend", { text: "Pilih yang mana?" }));
      opsi.forEach(function (o, i) {
        var r = h("input", { type: "radio", name: "opsi-harga", value: String(i) });
        if (i === 0) r.checked = true;
        r.addEventListener("change", function () { pilih = i; segarkan(); });
        grupOpsi.append(h("label", { class: "opsi-radio" }, r, h("span", { class: "opsi-radio-nama", text: o.label || (o.satuan ? "Per " + String(o.satuan).replace(/^\//, "") : "Harga") }), h("span", { class: "opsi-radio-harga", text: u.teksHarga(o) })));
      });
    }
    var tutup = h("button", { type: "button", class: "pesan-tutup" }, "Batal");
    tutup.addEventListener("click", function () { dlgPesan.close(); });
    dlgPesan.replaceChildren(
      h("h2", { id: "dlg-pesan-h", text: "Pesan lewat mana?" }),
      h("p", { class: "pesan-ringkas" }, "Paket ", h("strong", { text: p.nama }), opsi.length === 1 ? " · " + u.teksHarga(opsi[0]) : ""),
      grupOpsi || document.createDocumentFragment(), pilihan,
      h("p", { class: "pesan-catatan", text: "Isi UID dan server di chat. Harga final, estimasi waktu, dan cara bayar dikonfirmasi admin sebelum pengerjaan." }),
      tutup
    );
    if (dlgPesan.showModal) dlgPesan.showModal(); else dlgPesan.setAttribute("open", "");
  }

  function panelKontak() {
    var d = daftarKontak();
    if (!d.length) return null;
    return h("section", { class: "kontak-panel", "aria-labelledby": "h-kontak" },
      h("div", {}, h("h2", { id: "h-kontak", text: "Ada pertanyaan sebelum order?" }), h("p", { text: "Tanyakan paket, jadwal, atau hal lain langsung ke admin." })),
      h("div", { class: "kontak-baris" }, d.map(function (k) { return tombolKontak(k, "kontak-btn"); }))
    );
  }
  var INFO_BAWAAN = [
    { j: "Cara order", i: "1. Pilih game dan paket, lalu tekan Pesan.\n2. Pilih WhatsApp, Facebook, atau Discord.\n3. Admin mengonfirmasi harga, estimasi waktu, dan cara bayar di chat.\n4. Setelah sepakat, pengerjaan dimulai." },
    { j: "Keamanan akun", i: "Setiap order dikerjakan manual oleh admin sendiri. Kirim data login hanya lewat chat pribadi dengan admin, jangan di tempat umum." },
    { j: "Cara bayar, estimasi, dan garansi", i: "Dibahas langsung di chat sebelum pengerjaan karena tiap akun dan paket berbeda. Tanyakan apa saja yang ingin kamu pastikan." }
  ];
  function blokInfo() {
    var daftar = (C.INFO && C.INFO.length) ? C.INFO : INFO_BAWAAN;
    return h("section", { class: "sebelum-order", "aria-labelledby": "h-info" },
      h("h2", { id: "h-info", text: "Sebelum order" }),
      h("div", { class: "info-daftar" }, daftar.map(function (x) {
        return h("details", { class: "info-item" }, h("summary", {}, h("span", { text: x.j }), ikon("bawah", 18)), h("p", { text: x.i }));
      }))
    );
  }
  function bawahHalaman(wadah) {
    wadah.append(blokInfo());
    var pk = panelKontak(); if (pk) wadah.append(pk);
  }
  function pasangKaki() {
    if (!document.getElementById("keAtas")) {
      var ka = h("button", { id: "keAtas", type: "button", class: "ke-atas", "aria-label": "Kembali ke atas", hidden: true }, ikon("rank", 22));
      ka.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: u.kurangGerak() ? "auto" : "smooth" }); });
      document.body.append(ka);
      var tunggu = false;
      window.addEventListener("scroll", function () {
        if (tunggu) return; tunggu = true;
        requestAnimationFrame(function () { tunggu = false; ka.hidden = window.scrollY < window.innerHeight * 1.5; });
      }, { passive: true });
    }
    var nav = document.getElementById("kakiKontak");
    if (nav) nav.replaceChildren.apply(nav, daftarKontak().map(function (k) { return tombolKontak(k, "kaki-tautan"); }));
    var wa = daftarKontak()[0];
    if (wa && wa.nama === "WhatsApp" && !document.getElementById("fabWa")) {
      var f = h("a", { id: "fabWa", class: "fab-wa", href: wa.href, target: "_blank", rel: "noopener", "aria-label": "Chat admin lewat WhatsApp" }, ikon("chat", 26));
      document.body.append(f);
    }
  }

  /* ---------- Beranda ---------- */
  function renderBeranda() {
    document.title = C.NAMA_TOKO + ": daftar harga joki game";
    tautanBalik.hidden = true;
    var nama = daftarGame.map(function (g) { return g.kode || g.nama; });
    var judulGame = nama.length > 1 ? nama.slice(0, -1).join(", ") + " & " + nama[nama.length - 1] : nama[0];
    var h1 = h("h1", { id: "h-hero" }, judulGame ? "Joki " + judulGame + ", " : "Daftar harga joki game", judulGame ? h("span", { class: "neon", text: "dikerjakan manual." }) : null);
    var isi = h("div", { class: "tampil" },
      h("section", { class: "hero", "aria-labelledby": "h-hero" },
        h("div", { class: "hero-teks" },
          h1,
          h("p", { class: "lead", text: "Pilih game, lihat harga tiap paket, lalu pesan lewat WhatsApp, Facebook, atau Discord. Harga final, estimasi waktu, dan cara bayar dikonfirmasi admin di chat sebelum pengerjaan." })
        ),
        h("div", { class: "hud", "aria-hidden": "true" },
          h("span", { class: "cincin" }), h("span", { class: "cincin" }),
          h("span", { class: "inti" }, ikon("gamepad", 44)),
          h("span", { class: "sat s1" }, ikon("rank", 22)),
          h("span", { class: "sat s2" }, ikon("shield", 22))
        )
      )
    );
    if (!daftarGame.length) {
      isi.append(h("div", { class: "kosong" },
        h("strong", { text: "Belum ada game." }),
        h("p", { text: "Daftar harga akan muncul di sini setelah ditambahkan." })
      ));
    } else {
      var ul = h("ul", { class: "grid-game" });
      daftarGame.forEach(function (g) {
        var n = semuaProduk(g).length;
        var mulai = opsiTermurah(semuaProduk(g));
        ul.append(h("li", {},
          h("a", { class: "kartu-game", href: "#/game/" + g.slug },
            h("div", { class: "kartu-atas" },
              wadahLogo(g, 56, "kartu-ikon"),
              h("span", { class: "kode", text: g.kode || g.nama.slice(0, 3).toUpperCase() })
            ),
            h("h2", { text: g.nama }),
            g.subjudul ? h("p", { class: "kartu-sub", text: g.subjudul }) : null,
            h("div", { class: "kartu-meta" },
              h("span", {}, n + " paket", mulai ? [" · mulai ", h("strong", { text: teksMulai(mulai) })] : null),
              h("span", { class: "kartu-lihat" }, "Lihat harga", ikon("arrow", 16))
            )
          )
        ));
      });
      isi.append(ul);
    }
    bawahHalaman(isi);
    tampilan.replaceChildren(isi);
  }

  /* ---------- Halaman game ---------- */
  var cacahIsi = 0;
  function itemEl(p, g, kat, bukaIsi) {
    var opsi = p.harga || [];
    var habis = p.tersedia === false;
    var li = h("li", { class: "item" + (habis ? " habis" : "") });
    var labelHabis = habis ? h("span", { class: "label-habis", text: "Habis" }) : null;

    if (opsi.length <= 1) {
      li.append(h("div", { class: "baris" },
        h("span", { class: "nama", text: p.nama }), labelHabis,
        h("span", { class: "titik", "aria-hidden": "true" }),
        h("span", { class: "harga", text: opsi.length ? u.teksHarga(opsi[0]) : "Tanya dulu" })
      ));
    } else {
      li.append(h("div", { class: "baris" }, h("span", { class: "nama", text: p.nama }), labelHabis));
      opsi.forEach(function (o) {
        li.append(h("div", { class: "opsi" },
          h("span", { class: "opsi-label", text: o.label || (o.satuan ? "Per " + String(o.satuan).replace(/^\//, "") : "Harga") }),
          h("span", { class: "titik", "aria-hidden": "true" }),
          h("span", { class: "harga", text: u.teksHarga(o) })
        ));
      });
    }
    var aksi = h("div", { class: "item-aksi" });
    var panel = null;
    if (p.termasuk) {
      var idIsi = "isi-" + (++cacahIsi);
      panel = h("p", { class: "termasuk", id: idIsi, text: p.termasuk });
      panel.hidden = !bukaIsi;
      var tb = h("button", { type: "button", class: "isi-btn", "aria-expanded": bukaIsi ? "true" : "false", "aria-controls": idIsi }, h("span", { class: "isi-teks", text: bukaIsi ? "Tutup isi paket" : "Apa saja isinya?" }), ikon("bawah", 16));
      tb.addEventListener("click", function () {
        var buka = tb.getAttribute("aria-expanded") !== "true";
        tb.setAttribute("aria-expanded", buka ? "true" : "false");
        tb.querySelector(".isi-teks").textContent = buka ? "Tutup isi paket" : "Apa saja isinya?";
        panel.hidden = !buka;
      });
      aksi.append(tb);
    }
    if (!habis && kanalPesan("").length) {
      var kanal = kanalPesan(teksPesan(g, kat, p, opsi[0]));
      var lab = "Pesan " + p.nama;
      if (kanal.length === 1 && opsi.length <= 1) {
        aksi.append(h("a", { class: "pesan", href: kanal[0].href, target: "_blank", rel: "noopener", "aria-label": lab }, ikon(kanal[0].ikon, 16), "Pesan"));
      } else {
        var bp = h("button", { type: "button", class: "pesan", "aria-label": lab, "aria-haspopup": "dialog" }, ikon("chat", 16), "Pesan");
        bp.addEventListener("click", function () { bukaPesan(g, kat, p); });
        aksi.append(bp);
      }
    }
    if (aksi.children.length) li.append(aksi);
    if (panel) li.append(panel);
    return li;
  }

  /* Baris kategori: tombol panah, roda mouse, dan seret supaya mudah digeser di laptop/komputer (di HP cukup usap). */
  function bungkusChip(chips) {
    var kiri = h("button", { type: "button", class: "chip-geser", "aria-label": "Geser kategori ke kiri", tabindex: "-1" }, ikon("back", 18));
    var kanan = h("button", { type: "button", class: "chip-geser", "aria-label": "Geser kategori ke kanan", tabindex: "-1" }, ikon("arrow", 18));
    var bungkus = h("div", { class: "chip-bungkus" }, kiri, chips, kanan);
    function perbarui() {
      var maks = chips.scrollWidth - chips.clientWidth;
      bungkus.classList.toggle("bisa-geser", maks > 4);
      kiri.disabled = chips.scrollLeft <= 2;
      kanan.disabled = chips.scrollLeft >= maks - 2;
    }
    function geserBy(arah) { chips.scrollBy({ left: arah * Math.max(160, chips.clientWidth * 0.7), behavior: u.kurangGerak() ? "auto" : "smooth" }); }
    kiri.addEventListener("click", function () { geserBy(-1); });
    kanan.addEventListener("click", function () { geserBy(1); });
    chips.addEventListener("scroll", perbarui, { passive: true });
    window.addEventListener("resize", perbarui);
    new MutationObserver(function () { perbarui(); }).observe(chips, { childList: true });
    chips.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      var maks = chips.scrollWidth - chips.clientWidth;
      if (maks <= 4) return;
      var ujung = (e.deltaY < 0 && chips.scrollLeft <= 0) || (e.deltaY > 0 && chips.scrollLeft >= maks - 1);
      if (ujung) return; /* di ujung baris, biarkan halaman yang menggulir */
      chips.scrollLeft += e.deltaY; e.preventDefault();
    }, { passive: false });
    var awal = null, geserJauh = false;
    chips.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" && e.button === 0) { awal = { x: e.clientX, kiri: chips.scrollLeft }; geserJauh = false; } });
    window.addEventListener("pointermove", function (e) {
      if (!awal) return;
      var dx = e.clientX - awal.x;
      if (Math.abs(dx) > 5) { geserJauh = true; chips.classList.add("diseret"); }
      if (geserJauh) chips.scrollLeft = awal.kiri - dx;
    });
    window.addEventListener("pointerup", function () { awal = null; setTimeout(function () { chips.classList.remove("diseret"); }, 0); });
    chips.addEventListener("click", function (e) { if (geserJauh) { e.stopPropagation(); e.preventDefault(); geserJauh = false; } }, true);
    setTimeout(perbarui, 0);
    return bungkus;
  }

  function renderGame(g) {
    document.title = "Harga joki " + g.nama + " | " + C.NAMA_TOKO;
    tautanBalik.hidden = false;

    var n = semuaProduk(g).length;
    var kataTerbaru = g.diperbarui ? "Diperbarui " + u.tanggal(g.diperbarui) + " · " : "";
    var wadahBlok = h("div", { id: "blok-daftar" });
    var info = h("p", { class: "sr-only", role: "status", id: "info-cari" });
    var chips = h("div", { class: "chip-nav", role: "group", "aria-label": "Pilih kategori" });
    var input = h("input", { type: "search", id: "cari", placeholder: "Cari paket, contoh: Monthly", autocomplete: "off", "aria-label": "Cari paket" });

    var kepala = h("div", { class: "judul-game" },
      logoAman(g.logo) ? wadahLogo(g, 72, "logo-judul") : null,
      h("span", { class: "kode", "aria-hidden": "true", text: g.kode || g.nama.slice(0, 3).toUpperCase() }),
      h("div", {},
        h("h1", { id: "h-game", text: g.nama }),
        h("p", { class: "meta-game", text: kataTerbaru + n + " paket · dikerjakan manual oleh admin" })
      )
    );
    var alat = h("div", { class: "alat" },
      h("div", { class: "wadah alat-isi", style: "padding-inline:clamp(16px,4vw,40px)" },
        h("div", { class: "cari" }, ikon("search", 20), input),
        bungkusChip(chips)
      )
    );

    /* Semua kategori terlihat sebagai baris yang bisa dibuka (gambaran seluruh katalog), tidak langsung penuh. */
    var terbuka = {};
    if (g.kategori.length) terbuka[0] = true;
    if (g.kategori.length <= 2) g.kategori.forEach(function (_, i) { terbuka[i] = true; });
    function isi(kata) {
      var k = u.norm(kata);
      wadahBlok.replaceChildren();
      chips.replaceChildren();
      var total = 0;
      var semuaChip = h("button", { type: "button", class: "chip", onclick: function () {
        var buka = !wadahBlok.querySelector("details.blok:not([open])") ? false : true;
        Array.prototype.forEach.call(wadahBlok.querySelectorAll("details.blok"), function (d) { d.open = buka; });
      } }, ikon("list", 16), "Buka semua");
      if (!k && g.kategori.length > 1) chips.append(semuaChip);
      g.kategori.forEach(function (kat, i) {
        var cocokKat = k && u.norm(kat.nama).indexOf(k) >= 0;
        var daftar = kat.produk.filter(function (p) {
          return !k || cocokKat || u.norm(p.nama).indexOf(k) >= 0 || u.norm(p.termasuk).indexOf(k) >= 0;
        });
        if (!daftar.length) return;
        total += daftar.length;
        var idBlok = "kat-" + i;
        var mulai = opsiTermurah(daftar);
        var d = h("details", { class: "blok", id: idBlok },
          h("summary", { class: "blok-kepala" },
            h("span", { class: "blok-ikon" }, ikon(ik.untukKategori(kat.nama), 24)),
            h("span", { class: "blok-judul" },
              h("h2", { text: kat.nama }),
              h("span", { class: "blok-jumlah", text: daftar.length + " paket" + (mulai ? " · mulai " + teksMulai(mulai) : "") })
            ),
            h("span", { class: "blok-panah", "aria-hidden": "true" }, ikon("bawah", 20))
          ),
          h("div", { class: "blok-isi" },
            kat.ket ? h("p", { class: "catatan", text: kat.ket }) : null,
            h("ul", { class: "menu" }, daftar.map(function (p) {
              var cocokIsi = k && u.norm(p.nama).indexOf(k) < 0 && !cocokKat && u.norm(p.termasuk).indexOf(k) >= 0;
              return itemEl(p, g, kat, cocokIsi);
            }))
          )
        );
        d.open = !!k || !!terbuka[i];
        d.addEventListener("toggle", function () { if (!k) terbuka[i] = d.open; });
        wadahBlok.append(d);
        chips.append(h("button", { type: "button", class: "chip", onclick: function () {
          d.open = true;
          d.scrollIntoView({ behavior: u.kurangGerak() ? "auto" : "smooth", block: "start" });
        } }, ikon(ik.untukKategori(kat.nama), 16), kat.nama, h("span", { class: "chip-n", text: String(kat.produk.length) })));
      });
      if (!total) {
        wadahBlok.append(h("div", { class: "kosong" },
          h("strong", { text: k ? "Tidak ada paket untuk \"" + kata.trim() + "\"." : "Belum ada paket." }),
          h("p", { text: k ? "Coba kata lain, atau hapus pencarian untuk melihat semua paket." : "Daftar harga game ini belum diisi." })
        ));
      }
      info.textContent = k ? total + " paket ditemukan." : "";
    }

    input.addEventListener("input", function () { isi(input.value); });
    isi("");

    var halaman = h("div", { class: "tampil" }, kepala, alat, info, wadahBlok);
    bawahHalaman(halaman);
    tampilan.replaceChildren(halaman);
  }

  /* ---------- Rute ---------- */
  function render(tanpaGulir) {
    var m = /^#\/game\/([a-z0-9-]+)\/?$/.exec(location.hash);
    if (tanpaGulir !== true) window.scrollTo(0, 0);
    document.body.classList.toggle("di-game", !!m);
    if (m) {
      var g = daftarGame.find(function (x) { return x.slug === m[1]; });
      if (g) { renderGame(g); fokusJudul(tanpaGulir); return; }
      document.title = "Game tidak ditemukan | " + C.NAMA_TOKO;
      tautanBalik.hidden = false;
      tampilan.replaceChildren(h("div", { class: "kosong", style: "margin-top:2rem" },
        h("strong", { text: "Game tidak ditemukan." }),
        h("p", {}, "Mungkin alamatnya salah atau game sudah tidak ditampilkan. ", h("a", { href: "#/", text: "Kembali ke daftar game" }), ".")
      ));
      return;
    }
    renderBeranda();
    fokusJudul(tanpaGulir);
  }
  var pertama = true;
  function fokusJudul(tanpaGulir) {
    if (pertama) { pertama = false; return; }
    if (tanpaGulir === true) return;
    var j = tampilan.querySelector("h1");
    if (j) { j.setAttribute("tabindex", "-1"); j.focus({ preventScroll: true }); }
  }

  function mulai() {
    document.getElementById("namaToko").firstChild.textContent = C.NAMA_TOKO;
    pasangKaki();
    document.getElementById("sloganToko").textContent = C.SLOGAN || "";
    tampilan.replaceChildren(h("p", { class: "status", text: "Memuat daftar harga…" }));
    function ambilGame(s) { return data.pohon(s).filter(function (g) { return g.aktif !== false; }); }
    data.muatCepat(function (baru) {
      /* data baru dari server: pakai bila pengunjung belum mengetik di kotak cari */
      daftarGame = ambilGame(baru);
      var cari = document.getElementById("cari");
      if (!cari || !cari.value) render(true);
    }).then(function (s) {
      daftarGame = ambilGame(s);
      render();
      window.addEventListener("hashchange", function () { render(); });
    }).catch(function (e) {
      tampilan.replaceChildren(h("p", { class: "status status--galat", role: "alert", text: "Daftar harga gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman." }));
      if (window.console) console.error(e);
    });
  }
  mulai();
})();
