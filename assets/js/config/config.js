/* Pengaturan toko. Ubah di sini, lalu simpan dan push ke GitHub.
   SUPABASE_URL dan SUPABASE_ANON_KEY: lihat README (Langkah 2). Kunci "anon" memang publik,
   keamanan ada di aturan database (schema.sql). JANGAN pernah menaruh kunci "service_role" di sini. */
window.IFS = window.IFS || {};
window.IFS.CONFIG = {
  NAMA_TOKO: "IanFan Store",
  SLOGAN: "Daftar harga joki game",

  /* Nomor WhatsApp untuk tombol "Pesan" (format internasional tanpa + dan tanpa spasi, contoh 6281234567890).
     Kosongkan jika belum mau menampilkan tombol pesan. */
  WA_NOMOR: "",

  /* Database. Kosong = mode lokal (data dari folder data/, hasil edit admin hanya tersimpan di browser ini). */
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  KUNCI_LOKAL: "ianfan-store-lokal-v1"
};
