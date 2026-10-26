/* Uji pembaca daftar harga terhadap teks HSR asli.  Jalankan:  node tools/uji-impor.js */
const fs = require("fs");
const path = require("path");
const impor = require("../assets/js/lib/impor.js");

const teks = fs.readFileSync(path.join(__dirname, "sumber", "hsr.txt"), "utf8");
const hasil = impor.baca(teks);
let gagal = 0;
function cek(nama, kondisi, info) {
  if (kondisi) console.log("  ok   " + nama);
  else { gagal++; console.log("  GAGAL " + nama + (info ? "  -> " + info : "")); }
}

const peta = {};
hasil.kategori.forEach((k) => (peta[k.nama] = k));
const urutan = hasil.kategori.map((k) => k.nama);
const jumlah = hasil.kategori.map((k) => k.produk.length);

cek("judul = HSR", hasil.judul === "HSR", hasil.judul);
cek("9 kategori", hasil.kategori.length === 9, urutan.join(" | "));
cek("jumlah item per kategori", jumlah.join() === "3,3,4,5,5,4,7,4,6", jumlah.join());
cek("total 41 item", jumlah.reduce((a, b) => a + b, 0) === 41, String(jumlah.reduce((a, b) => a + b, 0)));
cek("tanpa peringatan", hasil.peringatan.length === 0, hasil.peringatan.join(" / "));

const semuaNama = hasil.kategori.flatMap((k) => k.produk.map((p) => p.nama.toLowerCase()));
["harian", "mingguan", "vip 2 monthly", "full story patch 1-ongoing"].forEach((n) =>
  cek("tidak memuat \"" + n + "\"", !semuaNama.includes(n)));
cek("Termasuk/KET bukan item", !semuaNama.some((n) => n.startsWith("termasuk") || n.startsWith("ket")));

const p = (kat, nama) => (peta[kat] ? peta[kat].produk.find((x) => x.nama === nama) : undefined);
const harga = (x) => JSON.stringify(x && x.harga);
cek("DU / Paket Lv = 60.000", harga(p("DU", "Paket Lv")) === '[{"label":"","min":60000,"max":null,"satuan":""}]', harga(p("DU", "Paket Lv")));
cek("Rawat Akun / Monthly VIP rapi", !!p("Rawat Akun", "Monthly VIP"), JSON.stringify(peta["Rawat Akun"] && peta["Rawat Akun"].produk.map((x) => x.nama)));
cek("Eksplorasi: catatan kategori dari KET", /chest, puzzle/.test(peta["Eksplorasi"].ket), peta["Eksplorasi"].ket);
cek("Penacony: kisaran 20.000-30.000 per map + paket", harga(p("Eksplorasi", "Penacony")) === '[{"label":"","min":20000,"max":30000,"satuan":"/map"},{"label":"Paket semua map","min":180000,"max":null,"satuan":""}]', harga(p("Eksplorasi", "Penacony")));
cek("Story: Jarilo-VI 10K/patch + total 20K", harga(p("Story", "Jarilo-VI")) === '[{"label":"","min":10000,"max":null,"satuan":"/patch"},{"label":"Total","min":20000,"max":null,"satuan":""}]', harga(p("Story", "Jarilo-VI")));
cek("Story: judul tanpa \"(harga terbaru)\"", !!peta["Story"], urutan.join(" | "));
cek("Build: relic 15K/relic", harga(p("Build Character", "Spam energi untuk relic +15 bagus")) === '[{"label":"","min":15000,"max":null,"satuan":"/relic"}]');
cek("Conundrum: Bundle X7 → X9 = 40K", !!p("Conundrum DU", "Bundle X7 → X9"));
cek("Termasuk menempel pada item", /bonus rank X4/.test(p("DU", "Paket Lv").termasuk), p("DU", "Paket Lv") && p("DU", "Paket Lv").termasuk);
cek("1 Patch + ongoing event tanpa keterangan", p("Rawat Akun", "1 Patch + ongoing event") && p("Rawat Akun", "1 Patch + ongoing event").termasuk === "");

const h = impor.bacaHarga;
cek("bacaHarga 'Rp 15.000'", h("Rp 15.000").min === 15000);
cek("bacaHarga '1,5jt'", h("1,5jt").min === 1500000);
cek("bacaHarga '25k'", h("25k").min === 25000);
cek("bacaHarga teks acak -> null", h("hubungi admin") === null);

if (process.argv.includes("--tulis")) {
  const keluar = path.join(__dirname, "..", "data", "games", "hsr", "hsr.json");
  const game = {
    slug: "hsr", kode: "HSR", nama: "Honkai: Star Rail", subjudul: "Joki akun, rawat akun, eksplorasi, dan story",
    diperbarui: "2026-10-26",
    kategori: hasil.kategori
  };
  fs.writeFileSync(keluar, JSON.stringify(game, null, 2) + "\n");
  console.log("ditulis: " + keluar);
}
console.log(gagal ? "\n" + gagal + " pengujian gagal" : "\nsemua lulus");
process.exit(gagal ? 1 : 0);
