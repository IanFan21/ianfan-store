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
    if (C.DISCORD) k.push({ nama: "Discord", ikon: "discord", ket: C.DISCORD, salin: C.DISCORD });
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
  function itemEl(p, g) {
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
    if (p.termasuk) li.append(h("p", { class: "termasuk", text: "Termasuk: " + p.termasuk }));
    if (C.WA_NOMOR && !habis) {
      var teks = "Halo " + C.NAMA_TOKO + ", saya mau pesan joki " + g.nama + ": " + p.nama + (opsi.length === 1 ? " (" + ringkasHarga(p) + ")" : "");
      li.append(h("a", { class: "pesan", href: "https://wa.me/" + C.WA_NOMOR + "?text=" + encodeURIComponent(teks), target: "_blank", rel: "noopener" }, ikon("chat", 16), "Pesan lewat WhatsApp"));
    }
    return li;
  }

  function renderGame(g) {
    document.title = "Harga joki " + g.nama + " | " + C.NAMA_TOKO;
    tautanBalik.hidden = false;

    var n = semuaProduk(g).length;
    var kataTerbaru = g.diperbarui ? "Diperbarui " + u.tanggal(g.diperbarui) + " · " : "";
    var wadahBlok = h("div", { id: "blok-daftar" });
    var info = h("p", { class: "sr-only", role: "status", id: "info-cari" });
    var chips = h("div", { class: "chip-nav", role: "group", "aria-label": "Lompat ke kategori" });
    var input = h("input", { type: "search", id: "cari", placeholder: "Cari paket, misalnya Monthly", autocomplete: "off", "aria-label": "Cari paket" });

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
        chips
      )
    );

    function isi(kata) {
      var k = u.norm(kata);
      wadahBlok.replaceChildren();
      chips.replaceChildren();
      var total = 0;
      g.kategori.forEach(function (kat, i) {
        var cocokKat = k && u.norm(kat.nama).indexOf(k) >= 0;
        var daftar = kat.produk.filter(function (p) {
          return !k || cocokKat || u.norm(p.nama).indexOf(k) >= 0 || u.norm(p.termasuk).indexOf(k) >= 0;
        });
        if (!daftar.length) return;
        total += daftar.length;
        var idBlok = "kat-" + i;
        wadahBlok.append(h("section", { class: "blok", id: idBlok, "aria-labelledby": idBlok + "-h" },
          h("div", { class: "blok-kepala" },
            h("span", { class: "blok-ikon" }, ikon(ik.untukKategori(kat.nama), 24)),
            h("h2", { id: idBlok + "-h", text: kat.nama }),
            h("span", { class: "blok-jumlah", text: daftar.length + " paket" })
          ),
          kat.ket ? h("p", { class: "catatan", text: kat.ket }) : null,
          h("ul", { class: "menu" }, daftar.map(function (p, n) { var li = itemEl(p, g); li.setAttribute("style", "--i:" + n); return li; }))
        ));
        chips.append(h("button", { type: "button", class: "chip", "data-ke": idBlok, "aria-current": "false", onclick: function () {
          var el = document.getElementById(idBlok);
          if (el) el.scrollIntoView({ behavior: u.kurangGerak() ? "auto" : "smooth", block: "start" });
        } }, ikon(ik.untukKategori(kat.nama), 16), kat.nama));
      });
      if (!total) {
        wadahBlok.append(h("div", { class: "kosong" },
          h("strong", { text: k ? "Tidak ada paket untuk \"" + kata.trim() + "\"." : "Belum ada paket." }),
          h("p", { text: k ? "Coba kata lain, atau hapus pencarian untuk melihat semua paket." : "Daftar harga game ini belum diisi." })
        ));
      }
      info.textContent = k ? total + " paket ditemukan." : "";
      pasangPengamat();
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
