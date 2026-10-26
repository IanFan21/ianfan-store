/* Membuat database/seed-hsr.sql dari data/games/hsr/hsr.json.  Jalankan:  node tools/bangun-sql.js */
const fs = require("fs");
const path = require("path");
const g = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "games", "hsr", "hsr.json"), "utf8"));
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
let o = "-- Isi awal game " + g.nama + " (dibuat dari data/games/hsr/hsr.json).\n-- Jalankan SETELAH schema.sql. Aman dijalankan ulang: dilewati jika game sudah ada.\n\n";
o += "do $$\ndeclare gid uuid; kid uuid;\nbegin\n";
o += "  if exists (select 1 from public.games where slug = " + q(g.slug) + ") then\n    raise notice 'Game " + g.slug + " sudah ada, dilewati.';\n    return;\n  end if;\n";
o += "  insert into public.games (slug, kode, nama, subjudul, aktif, urutan) values (" + [q(g.slug), q(g.kode), q(g.nama), q(g.subjudul), "true", 0].join(", ") + ") returning id into gid;\n";
g.kategori.forEach((k, i) => {
  o += "\n  insert into public.kategori (game_id, nama, ket, urutan) values (gid, " + [q(k.nama), q(k.ket || ""), i].join(", ") + ") returning id into kid;\n";
  k.produk.forEach((p, j) => {
    o += "  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, " + [q(p.nama), q(p.termasuk || ""), q(JSON.stringify(p.harga)) + "::jsonb", j].join(", ") + ");\n";
  });
});
o += "end $$;\n";
fs.writeFileSync(path.join(__dirname, "..", "database", "seed-hsr.sql"), o);
console.log("ditulis database/seed-hsr.sql (" + o.split("\n").length + " baris)");
