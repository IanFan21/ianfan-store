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
  var pengamat = null;

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
  function hargaTermurah(g) {
    var m = null;
    semuaProduk(g).forEach(function (p) {
      if (p.tersedia === false) return;
      (p.harga || []).forEach(function (o) { if (m === null || o.min < m) m = o.min; });
    });
    return m;
  }
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
    if (C.WA_NOMOR) d.push({ nama: "WhatsApp", ikon: "chat", ket: "Pesan langsung terisi", href: "https://wa.me/" + C.WA_NOMOR + "?text=" + encodeURIComponent(teks) });
    var fb = C.FB_CHAT || C.FB_URL;
    if (fb) d.push({ nama: "Facebook Messenger", ikon: "facebook", ket: "Pesan akan disalin, tinggal tempel", href: fb, salinTeks: teks });
    if (C.DISCORD_URL) d.push({ nama: "Discord", ikon: "discord", ket: "Pesan akan disalin, tinggal tempel", href: C.DISCORD_URL, salinTeks: teks });
    return d;
  }
  var dlgPesan = null;
  function bukaPesan(namaPaket, harga, teks) {
    if (!dlgPesan) {
      dlgPesan = h("dialog", { class: "dlg-pesan", "aria-labelledby": "dlg-pesan-h" });
      dlgPesan.addEventListener("click", function (e) { if (e.target === dlgPesan) dlgPesan.close(); });
      document.body.append(dlgPesan);
    }
    var tutup = h("button", { type: "button", class: "pesan-tutup" }, "Batal");
    tutup.addEventListener("click", function () { dlgPesan.close(); });
    var pilihan = h("div", { class: "pesan-pilihan" }, kanalPesan(teks).map(function (k) {
      var a = h("a", { class: "pilih-kontak", href: k.href, target: "_blank", rel: "noopener" }, ikon(k.ikon, 22), h("span", {}, h("strong", { text: k.nama }), h("small", { text: k.ket })));
      a.addEventListener("click", function () {
        if (k.salinTeks && navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(k.salinTeks).then(function () { toast("Pesan disalin. Tempel di chat."); }, function () {});
        dlgPesan.close();
      });
      return a;
    }));
    dlgPesan.replaceChildren(
      h("h2", { id: "dlg-pesan-h", text: "Pesan lewat mana?" }),
      h("p", { class: "pesan-ringkas" }, "Paket ", h("strong", { text: namaPaket }), harga ? " · " + harga : ""),
      pilihan, tutup
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
  function pasangKaki() {
    var nav = document.getElementById("kakiKontak");
    if (nav) nav.replaceChildren.apply(nav, daftarKontak().map(function (k) { return tombolKontak(k, "kaki-tautan"); }));
    var wa = daftarKontak()[0];
    if (wa && wa.nama === "WhatsApp" && !document.getElementById("fabWa")) {
      var f = h("a", { id: "fabWa", class: "fab-wa", href: wa.href, target: "_blank", rel: "noopener", "aria-label": "Chat admin lewat WhatsApp" }, ikon("chat", 26));
      document.body.append(f);
    }
  }

  /* ---------- Beranda ---------- */
  function pitaEl() {
    var kata = ["Joki rank", "Rawat akun", "Eksplorasi", "Story", "Build karakter", "Harga jelas"];
    var baris = h("div", { class: "pita-isi" });
    for (var r = 0; r < 4; r++) kata.forEach(function (k) { baris.append(h("span", { text: k })); });
    return h("div", { class: "pita", "aria-hidden": "true" }, baris);
  }

  function renderBeranda() {
    document.title = C.NAMA_TOKO + ": daftar harga joki game";
    tautanBalik.hidden = true;
    var kataJudul = ["Pilih", "game", "yang", "mau", "dijokikan."];
    var h1 = h("h1", { id: "h-hero", "aria-label": kataJudul.join(" ") });
    kataJudul.forEach(function (k, i) {
      h1.append(h("span", { class: "kata" + (i === kataJudul.length - 1 ? " neon" : ""), style: "--k:" + i, "aria-hidden": "true", text: k }), " ");
    });
    var isi = h("div", { class: "tampil" },
      h("section", { class: "hero", "aria-labelledby": "h-hero" },
        h("div", { class: "hero-teks" },
          h1,
          h("p", { class: "lead", text: "Lihat daftar harga lengkap setiap game. Tiap paket dijelaskan apa saja yang termasuk." })
        ),
        h("div", { class: "hud", "aria-hidden": "true" },
          h("span", { class: "cincin" }), h("span", { class: "cincin" }), h("span", { class: "cincin" }),
          h("span", { class: "inti" }, ikon("gamepad", 44)),
          h("span", { class: "sat s1" }, ikon("rank", 22)),
          h("span", { class: "sat s2" }, ikon("shield", 22)),
          h("span", { class: "sat s3" }, ikon("bolt", 22))
        )
      ),
      pitaEl()
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
        var mulai = hargaTermurah(g);
        ul.append(h("li", {},
          h("a", { class: "kartu-game", href: "#/game/" + g.slug },
            h("div", { class: "kartu-atas" },
              wadahLogo(g, 56, "kartu-ikon"),
              h("span", { class: "kode", text: g.kode || g.nama.slice(0, 3).toUpperCase() })
            ),
            h("h2", { text: g.nama }),
            g.subjudul ? h("p", { class: "kartu-sub", text: g.subjudul }) : null,
            h("div", { class: "kartu-meta" },
              h("span", {}, n + " paket", mulai !== null ? [" · mulai ", h("strong", { text: u.rupiah(mulai) })] : null),
              h("span", { class: "kartu-lihat" }, "Lihat harga", ikon("arrow", 16))
            )
          )
        ));
      });
      isi.append(ul);
      pasangMiring(ul);
    }
    var pk = panelKontak(); if (pk) isi.append(pk);
    tampilan.replaceChildren(isi);
  }

  /* Kartu miring mengikuti kursor + sorot cahaya (hanya kursor halus, tanpa pengurangan gerak) */
  function pasangMiring(ul) {
    if (u.kurangGerak() || !window.matchMedia || !matchMedia("(pointer:fine)").matches) return;
    ul.addEventListener("pointermove", function (e) {
      var k = e.target.closest ? e.target.closest(".kartu-game") : null;
      if (!k) return;
      var r = k.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      k.style.setProperty("--ry", ((x - 0.5) * 8).toFixed(2) + "deg");
      k.style.setProperty("--rx", ((0.5 - y) * 6).toFixed(2) + "deg");
      k.style.setProperty("--px", (x * 100).toFixed(1) + "%");
      k.style.setProperty("--py", (y * 100).toFixed(1) + "%");
    });
    ul.addEventListener("pointerout", function (e) {
      var k = e.target.closest ? e.target.closest(".kartu-game") : null;
      if (k) { k.style.setProperty("--rx", "0deg"); k.style.setProperty("--ry", "0deg"); }
    });
  }

  /* Blok muncul saat digulir. Kelas "tunda" dipasang oleh skrip ini sendiri, jadi tanpa skrip semuanya tetap terlihat. */
  var pengamatMasuk = null;
  function pasangMuncul(daftar) {
    if (pengamatMasuk) pengamatMasuk.disconnect();
    if (u.kurangGerak() || !("IntersectionObserver" in window)) return;
    pengamatMasuk = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("masuk");
        pengamatMasuk.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    daftar.forEach(function (el) { el.classList.add("tunda"); pengamatMasuk.observe(el); });
  }

  /* ---------- Halaman game ---------- */
  var cacahIsi = 0;
  function itemEl(p, g, bukaIsi) {
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
      var teks = "Halo " + C.NAMA_TOKO + ", saya mau pesan joki " + g.nama + ": " + p.nama + (opsi.length === 1 ? " (" + ringkasHarga(p) + ")" : "");
      var kanal = kanalPesan(teks);
      var lab = "Pesan " + p.nama;
      if (kanal.length === 1) {
        aksi.append(h("a", { class: "pesan", href: kanal[0].href, target: "_blank", rel: "noopener", "aria-label": lab }, ikon(kanal[0].ikon, 16), "Pesan"));
      } else {
        var bp = h("button", { type: "button", class: "pesan", "aria-label": lab, "aria-haspopup": "dialog" }, ikon("chat", 16), "Pesan");
        bp.addEventListener("click", function () { bukaPesan(p.nama, opsi.length === 1 ? ringkasHarga(p) : "", teks); });
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
        h("p", { class: "meta-game", text: kataTerbaru + n + " paket" })
      )
    );
    var alat = h("div", { class: "alat" },
      h("div", { class: "wadah alat-isi", style: "padding-inline:clamp(16px,4vw,40px)" },
        h("div", { class: "cari" }, ikon("search", 20), input),
        bungkusChip(chips)
      )
    );

    var pilihKat = 0; /* indeks kategori yang tampil; -1 = semua */
    function isi(kata) {
      var k = u.norm(kata);
      var semua = !!k || pilihKat < 0 || pilihKat >= g.kategori.length;
      wadahBlok.replaceChildren();
      wadahBlok.classList.toggle("satu", !semua);
      chips.replaceChildren();
      var total = 0;
      if (!k) {
        var cs = h("button", { type: "button", class: "chip", "aria-pressed": semua ? "true" : "false", onclick: function () { pilihKat = -1; isi(""); } }, ikon("list", 16), "Semua", h("span", { class: "chip-n", text: String(semuaProduk(g).length) }));
        chips.append(cs);
      }
      g.kategori.forEach(function (kat, i) {
        var cocokKat = k && u.norm(kat.nama).indexOf(k) >= 0;
        var daftar = kat.produk.filter(function (p) {
          return !k || cocokKat || u.norm(p.nama).indexOf(k) >= 0 || u.norm(p.termasuk).indexOf(k) >= 0;
        });
        if (!daftar.length) return;
        var idBlok = "kat-" + i;
        if (!k) {
          chips.append(h("button", { type: "button", class: "chip", "aria-pressed": (!semua && pilihKat === i) ? "true" : "false", onclick: function () {
            pilihKat = i; isi("");
            var atas = wadahBlok.getBoundingClientRect().top + window.scrollY - 150;
            if (window.scrollY > atas) window.scrollTo({ top: atas, behavior: u.kurangGerak() ? "auto" : "smooth" });
          } }, ikon(ik.untukKategori(kat.nama), 16), kat.nama, h("span", { class: "chip-n", text: String(kat.produk.length) })));
        } else {
          chips.append(h("button", { type: "button", class: "chip", "data-ke": idBlok, "aria-current": "false", onclick: function () {
            var el = document.getElementById(idBlok);
            if (el) el.scrollIntoView({ behavior: u.kurangGerak() ? "auto" : "smooth", block: "start" });
          } }, ikon(ik.untukKategori(kat.nama), 16), kat.nama));
        }
        if (!semua && pilihKat !== i) return;
        total += daftar.length;
        wadahBlok.append(h("section", { class: "blok", id: idBlok, "aria-labelledby": idBlok + "-h" },
          h("div", { class: "blok-kepala" },
            h("span", { class: "blok-ikon" }, ikon(ik.untukKategori(kat.nama), 24)),
            h("h2", { id: idBlok + "-h", text: kat.nama }),
            h("span", { class: "blok-jumlah", text: daftar.length + " paket" })
          ),
          kat.ket ? h("p", { class: "catatan", text: kat.ket }) : null,
          h("ul", { class: "menu" }, daftar.map(function (p, n) {
            var cocokIsi = k && u.norm(p.nama).indexOf(k) < 0 && !cocokKat && u.norm(p.termasuk).indexOf(k) >= 0;
            var li = itemEl(p, g, cocokIsi); li.setAttribute("style", "--i:" + n); return li;
          }))
        ));
      });
      if (!total) {
        wadahBlok.append(h("div", { class: "kosong" },
          h("strong", { text: k ? "Tidak ada paket untuk \"" + kata.trim() + "\"." : "Belum ada paket." }),
          h("p", { text: k ? "Coba kata lain, atau hapus pencarian untuk melihat semua paket." : "Daftar harga game ini belum diisi." })
        ));
      }
      var aktifChip = chips.querySelector('[aria-pressed="true"]');
      if (aktifChip) chips.scrollLeft = Math.max(0, aktifChip.offsetLeft - (chips.clientWidth - aktifChip.offsetWidth) / 2);
      info.textContent = k ? total + " paket ditemukan." : "";
      if (k) pasangPengamat(); else if (pengamat) { pengamat.disconnect(); pengamat = null; }
      pasangMuncul(Array.prototype.slice.call(wadahBlok.querySelectorAll(".blok")));
    }

    function pasangPengamat() {
      if (pengamat) pengamat.disconnect();
      if (!("IntersectionObserver" in window)) return;
      var bloks = Array.prototype.slice.call(wadahBlok.querySelectorAll(".blok"));
      if (!bloks.length) return;
      function tandai(id) {
        Array.prototype.forEach.call(chips.children, function (c) {
          var aktif = c.getAttribute("data-ke") === id;
          c.setAttribute("aria-current", aktif ? "true" : "false");
          if (aktif && c.scrollIntoView) {
            var kiri = c.offsetLeft - 16;
            if (chips.scrollTo) chips.scrollTo({ left: kiri, behavior: u.kurangGerak() ? "auto" : "smooth" });
          }
        });
      }
      pengamat = new IntersectionObserver(function (entri) {
        entri.forEach(function (e) { if (e.isIntersecting) tandai(e.target.id); });
      }, { rootMargin: "-30% 0px -60% 0px" });
      bloks.forEach(function (b) { pengamat.observe(b); });
      tandai(bloks[0].id);
    }

    input.addEventListener("input", function () { isi(input.value); });
    isi("");

    tampilan.replaceChildren(h("div", { class: "tampil" }, kepala, alat, info, wadahBlok));
  }

  /* ---------- Rute ---------- */
  function render(tanpaGulir) {
    if (pengamat) { pengamat.disconnect(); pengamat = null; }
    var m = /^#\/game\/([a-z0-9-]+)\/?$/.exec(location.hash);
    if (tanpaGulir !== true) window.scrollTo(0, 0);
    if (m) {
      var g = daftarGame.find(function (x) { return x.slug === m[1]; });
      if (g) { renderGame(g); return; }
      document.title = "Game tidak ditemukan | " + C.NAMA_TOKO;
      tautanBalik.hidden = false;
      tampilan.replaceChildren(h("div", { class: "kosong", style: "margin-top:2rem" },
        h("strong", { text: "Game tidak ditemukan." }),
        h("p", {}, "Mungkin alamatnya salah atau game sudah tidak ditampilkan. ", h("a", { href: "#/", text: "Kembali ke daftar game" }), ".")
      ));
      return;
    }
    renderBeranda();
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
