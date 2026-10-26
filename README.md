# IanFan Store – daftar harga joki
## Tentang proyek ini

IanFan Store adalah website daftar harga jasa joki game. Pelanggan membuka situs, memilih game, melihat paket beserta harganya, lalu memesan lewat WhatsApp. Pemilik toko login di halaman /admin/ untuk menambah atau mengubah game, kategori, produk, dan harga — perubahan tersimpan di database Supabase sehingga langsung terlihat oleh semua pelanggan.

Saat ini situs memuat satu game: Honkai: Star Rail (joki akun, rawat akun, eksplorasi, story, dan lainnya).

Situs live: https://ianfan21.github.io/ianfan-store/

Teknologi: situs statis (HTML, CSS, JavaScript) yang di-host gratis lewat GitHub Pages, dengan Supabase sebagai database toko.

Website statis (GitHub Pages). Pelanggan hanya melihat harga; pemilik login di `/admin/` untuk tambah/ubah game, kategori, produk, dan harga.

## Struktur folder
```
index.html                      halaman pelanggan (wajib di root)
admin/index.html                halaman admin
assets/css/style.css, tema.css  gaya dan tema
assets/js/config/config.js      PENGATURAN (nama toko, nomor WA, kunci Supabase)
assets/js/lib/                  util.js, ikon.js, latar.js, impor.js, logo.js
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

## Logo game
Saat menambah/ubah game di admin, logo dicari otomatis dari nama game (App Store + Wikipedia). Klik kandidat lain bila kurang cocok, atau **Unggah gambar** / tempel link. Gambar dikecilkan jadi 128 px agar situs ringan. Tanpa logo, kartu memakai ikon gamepad. Ikon kategori (Rawat Akun, Eksplorasi, dst.) dipilih otomatis dari namanya.

## Database lama?
Kalau tabel `games` dibuat sebelum fitur logo, jalankan sekali di SQL Editor:
`alter table public.games add column if not exists logo text not null default '' check (char_length(logo) <= 60000);`

## Performa
Salinan terakhir daftar harga disimpan di browser pelanggan sehingga halaman langsung tampil, lalu diperbarui di latar. Animasi latar dibatasi ~30 fps, otomatis dikurangi di perangkat hemat daya, dan mati bila pengguna meminta gerak dikurangi.
