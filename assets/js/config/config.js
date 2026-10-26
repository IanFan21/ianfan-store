/* Pengaturan toko. Ubah di sini, lalu simpan dan push ke GitHub.
   SUPABASE_URL dan SUPABASE_ANON_KEY: lihat README (Langkah 2). Kunci "anon" memang publik,
   keamanan ada di aturan database (schema.sql). JANGAN pernah menaruh kunci "service_role" di sini. */
window.IFS = window.IFS || {};
window.IFS.CONFIG = {
  NAMA_TOKO: "IanFan Store",
  SLOGAN: "Daftar harga joki game",

  /* Nomor WhatsApp untuk tombol "Pesan" (format internasional tanpa + dan tanpa spasi, contoh 6281234567890).
     Kosongkan jika belum mau menampilkan tombol pesan. */
  WA_NOMOR: "6285175452966",

  /* Kontak lain. Kosongkan salah satu untuk menyembunyikannya. */
  FB_URL: "https://www.facebook.com/ianfan.xbayu/",
  DISCORD: "ianfan",
  DOMAIN: "https://ianfanstore.my.id",

  /* Database. Kosong = mode lokal (data dari folder data/, hasil edit admin hanya tersimpan di browser ini). */
  SUPABASE_URL: "https://nqwlpufbuguxkumizfay.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xd2xwdWZidWd1eGt1bWl6ZmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTg3MTUsImV4cCI6MjEwODUzNDcxNX0.pyP7uL2CvSlqWeVZrk8NaGTru8kbIMyfDoNKE7cxbl8",

  KUNCI_LOKAL: "ianfan-store-lokal-v1"
};
