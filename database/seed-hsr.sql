-- Isi awal game Honkai: Star Rail (dibuat dari data/games/hsr/hsr.json).
-- Jalankan SETELAH schema.sql. Aman dijalankan ulang: dilewati jika game sudah ada.

do $$
declare gid uuid; kid uuid;
begin
  if exists (select 1 from public.games where slug = 'hsr') then
    raise notice 'Game hsr sudah ada, dilewati.';
    return;
  end if;
  insert into public.games (slug, kode, nama, subjudul, aktif, urutan) values ('hsr', 'HSR', 'Honkai: Star Rail', 'Joki akun, rawat akun, eksplorasi, dan story', true, 0) returning id into gid;

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'DU', '', 0) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Paket Lv', 'LV sampai 60, bonus rank X4, cicilan Galeri Probabilitas, Larik Stabil sebagian', '[{"label":"","min":60000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Paket No Conundrum', 'LV sampai 60, semua reward SJ (koneksi, strategi, lingkungan, tantangan), bonus rank X1', '[{"label":"","min":95000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Paket Full Reward SJ', 'LV sampai 60, full semua reward, Galeri Probabilitas & Larik Stabil full clear, bonus rank X9', '[{"label":"","min":115000,"max":null,"satuan":""}]'::jsonb, 2);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'CW', '', 1) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Paket Lv', 'CW sampai level 110 (atau sesuai request), bonus rank A5', '[{"label":"","min":110000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Paket Full Reward SJ', 'CW level 110, SJ full, rank sampai A8', '[{"label":"","min":200000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Paket Standard', 'CW level 110, SJ (koneksi, strategi, lingkungan, tantangan), bonus rank A5', '[{"label":"","min":168000,"max":null,"satuan":""}]'::jsonb, 2);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Simulated Universe (SU)', '', 2) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'SU Bencana Swarm (Full Reward SJ)', 'Full clear reward Swarm', '[{"label":"","min":70000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'SU Emas & Mesin / GNG (Full Reward SJ)', 'Full clear reward GNG', '[{"label":"","min":70000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'SU Unknown Domain (Full Reward SJ)', 'Full clear reward Unknown Domain', '[{"label":"","min":80000,"max":null,"satuan":""}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'SU Normal per World', 'SU normal per world', '[{"label":"","min":5000,"max":null,"satuan":""}]'::jsonb, 3);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Rawat Akun', '', 3) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Monthly', 'Daily, Spend stamina, Weekly boss + weekly reward, MoC, PF', '[{"label":"","min":65000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Monthly VIP', 'Daily, Spend stamina, Weekly boss + weekly reward, MoC, PF, AS, Ongoing event', '[{"label":"","min":100000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, '1 Patch', 'Daily mission, Weekly boss, Weekly reward, DU, CW, MoC, PF, AS', '[{"label":"","min":100000,"max":null,"satuan":""}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, '1 Patch + ongoing event', '', '[{"label":"","min":130000,"max":null,"satuan":""}]'::jsonb, 3);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'VIP 1 Patch', 'Daily mission, Weekly boss, DU, CW, MoC, PF, AS, AA, Event (hanya ongoing)', '[{"label":"","min":160000,"max":null,"satuan":""}]'::jsonb, 4);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Addon', '', 4) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'MoC', '', '[{"label":"","min":10000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'PF', '', '[{"label":"","min":10000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'AS', '', '[{"label":"","min":10000,"max":null,"satuan":""}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'AA', '', '[{"label":"","min":25000,"max":null,"satuan":""}]'::jsonb, 3);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Ongoing Event', '', '[{"label":"","min":20000,"max":null,"satuan":""}]'::jsonb, 4);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Conundrum DU', '', 5) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'X7', '', '[{"label":"","min":15000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'X8', '', '[{"label":"","min":20000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'X9', '', '[{"label":"","min":25000,"max":null,"satuan":""}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Bundle X7 → X9', '', '[{"label":"","min":40000,"max":null,"satuan":""}]'::jsonb, 3);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Eksplorasi', 'Ambil chest, puzzle, dan minigame di dunia tersebut.', 6) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Herta Space Station', '', '[{"label":"","min":5000,"max":null,"satuan":"/map"},{"label":"Paket semua map","min":20000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Jarilo-VI', '', '[{"label":"","min":5000,"max":null,"satuan":"/map"},{"label":"Paket semua map","min":40000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Xianzhou Luofu', '', '[{"label":"","min":8000,"max":null,"satuan":"/map"},{"label":"Paket semua map","min":80000,"max":null,"satuan":""}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Penacony', '', '[{"label":"","min":20000,"max":30000,"satuan":"/map"},{"label":"Paket semua map","min":180000,"max":null,"satuan":""}]'::jsonb, 3);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Amphoreus', '', '[{"label":"","min":20000,"max":30000,"satuan":"/map"},{"label":"Paket semua map","min":250000,"max":null,"satuan":""}]'::jsonb, 4);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Planarcadia', '', '[{"label":"","min":15000,"max":null,"satuan":"/map"},{"label":"Paket semua map","min":150000,"max":null,"satuan":""}]'::jsonb, 5);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Astropolis', '', '[{"label":"","min":15000,"max":null,"satuan":"/map"},{"label":"Paket semua map","min":50000,"max":null,"satuan":""}]'::jsonb, 6);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Build Character', '', 7) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Lv up 1-80', '', '[{"label":"","min":10000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Max trace', '', '[{"label":"","min":25000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Spam energi untuk relic +15 bagus', '', '[{"label":"","min":15000,"max":null,"satuan":"/relic"}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'All komplit', '', '[{"label":"","min":75000,"max":null,"satuan":""}]'::jsonb, 3);

  insert into public.kategori (game_id, nama, ket, urutan) values (gid, 'Story', '', 8) returning id into kid;
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Herta Space', '', '[{"label":"Total","min":20000,"max":null,"satuan":""}]'::jsonb, 0);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Jarilo-VI', '', '[{"label":"","min":10000,"max":null,"satuan":"/patch"},{"label":"Total","min":20000,"max":null,"satuan":""}]'::jsonb, 1);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Xianzhou Luofu', '', '[{"label":"","min":10000,"max":null,"satuan":"/patch"},{"label":"Total","min":40000,"max":null,"satuan":""}]'::jsonb, 2);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Penacony', '', '[{"label":"","min":15000,"max":null,"satuan":"/patch"},{"label":"Total","min":60000,"max":null,"satuan":""}]'::jsonb, 3);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Amphoreus', '', '[{"label":"","min":13000,"max":null,"satuan":"/patch"},{"label":"Total","min":100000,"max":null,"satuan":""}]'::jsonb, 4);
  insert into public.produk (kategori_id, nama, termasuk, harga, urutan) values (kid, 'Planarcadia', '', '[{"label":"","min":10000,"max":null,"satuan":"/patch"},{"label":"Total","min":40000,"max":null,"satuan":""}]'::jsonb, 5);
end $$;
