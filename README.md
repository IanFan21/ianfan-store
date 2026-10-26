# IanFan Store – daftar harga joki

Website statis (GitHub Pages). Pelanggan hanya melihat harga; pemilik login di `/admin/` untuk tambah/ubah game, kategori, produk, dan harga.

## Struktur folder
```
index.html                      halaman pelanggan (wajib di root)
admin/index.html                halaman admin
assets/css/style.css, tema.css  gaya dan tema
assets/js/config/config.js      PENGATURAN (nama toko, nomor WA, kunci Supabase)
assets/js/lib/                  util.js, ikon.js, latar.js, impor.js
assets/js/data/data.js          akses data (Supabase / lokal)
assets/js/pages/                beranda.js (pelanggan), admin.js
assets/js/vendor/supabase.js    pustaka Supabase
assets/fonts/                   font + lisensi
data/games/daftar.json          daftar game bawaan (mode lokal)
data/games/hsr/hsr.json         data HSR
database/schema.sql, seed-hsr.sql
```

## Mode 1 – Lokal (langsung jalan)
Biarkan `SUPABASE_URL` kosong. Admin bisa dibuka tanpa login, tetapi perubahan hanya tersimpan di browser itu (pelanggan tidak melihatnya). Dipakai untuk mencoba saja.

## Mode 2 – Supabase (disarankan, agar perubahan terlihat semua orang)
1. Buat project di supabase.com.
2. SQL Editor: jalankan `database/schema.sql`, lalu `database/seed-hsr.sql`.
3. Authentication → Users: buat akun pemilik (email + sandi). Setelah itu **matikan Sign-ups** (Authentication → Providers → Email).
4. Daftarkan email pemilik sebagai admin (lihat bagian akhir `schema.sql`, `insert into admin_email ...`).
5. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` (anon/publishable) di `assets/js/config/config.js`. **Jangan pernah** memakai kunci `service_role`.
6. Isi `WA_NOMOR` (format `62812...`) agar tombol "Pesan lewat WhatsApp" muncul.
7. Upload ke GitHub, aktifkan Pages (branch main, folder root).

## Menambah game baru
Admin → **Tambah game** → buka game → **Impor dari teks**, tempel daftar harga dengan format:
```
---------- NAMA KATEGORI ----------
Nama paket = 60K
Termasuk: isi paket
Eksplor = 5K/map, paket semua map 20K
```
`Termasuk:`/`KET:` adalah keterangan (bukan item). Bagian "TIDAK MASUK LIST" diabaikan.
