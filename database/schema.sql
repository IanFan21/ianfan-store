-- IanFan Store: skema database Supabase.
-- Jalankan SELURUH isi file ini sekali di Supabase > SQL Editor > New query > Run.
--
-- Hasilnya:
--   * Siapa saja (pelanggan) hanya bisa MEMBACA game yang aktif beserta kategori dan produknya.
--   * Hanya akun yang emailnya ada di tabel admin_email yang bisa menambah, mengubah, dan menghapus.
--   * Tabel admin_email tidak bisa dibaca atau ditulis lewat API (hanya lewat SQL Editor).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
create table if not exists public.admin_email (
  email text primary key
);
alter table public.admin_email enable row level security;   -- tanpa policy = tertutup untuk API

create or replace function public.saya_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_email
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.saya_admin() from public;
grant execute on function public.saya_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tabel data
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  kode      text not null default '' check (char_length(kode) <= 12),
  nama      text not null check (char_length(nama) between 1 and 80),
  subjudul  text not null default '' check (char_length(subjudul) <= 160),
  aktif     boolean not null default true,
  urutan    integer not null default 0,
  diubah    timestamptz not null default now()
);

create table if not exists public.kategori (
  id        uuid primary key default gen_random_uuid(),
  game_id   uuid not null references public.games(id) on delete cascade,
  nama      text not null check (char_length(nama) between 1 and 80),
  ket       text not null default '' check (char_length(ket) <= 500),
  urutan    integer not null default 0
);
create index if not exists kategori_game_idx on public.kategori(game_id);

create table if not exists public.produk (
  id           uuid primary key default gen_random_uuid(),
  kategori_id  uuid not null references public.kategori(id) on delete cascade,
  nama         text not null check (char_length(nama) between 1 and 120),
  termasuk     text not null default '' check (char_length(termasuk) <= 600),
  -- daftar opsi harga: [{"label":"","min":60000,"max":null,"satuan":""}, ...]
  harga        jsonb not null default '[]'::jsonb
               check (jsonb_typeof(harga) = 'array' and jsonb_array_length(harga) <= 10),
  tersedia     boolean not null default true,
  urutan       integer not null default 0,
  diubah       timestamptz not null default now()
);
create index if not exists produk_kategori_idx on public.produk(kategori_id);

-- ---------------------------------------------------------------------------
-- Hak akses dan aturan baris (RLS)
-- ---------------------------------------------------------------------------
alter table public.games    enable row level security;
alter table public.kategori enable row level security;
alter table public.produk   enable row level security;

revoke all on public.games, public.kategori, public.produk, public.admin_email from anon, authenticated;
grant select on public.games, public.kategori, public.produk to anon, authenticated;
grant insert, update, delete on public.games, public.kategori, public.produk to authenticated;

drop policy if exists games_baca on public.games;
create policy games_baca on public.games for select
  using (aktif or public.saya_admin());
drop policy if exists games_tulis on public.games;
create policy games_tulis on public.games for all to authenticated
  using (public.saya_admin()) with check (public.saya_admin());

drop policy if exists kategori_baca on public.kategori;
create policy kategori_baca on public.kategori for select
  using (exists (select 1 from public.games g where g.id = game_id and (g.aktif or public.saya_admin())));
drop policy if exists kategori_tulis on public.kategori;
create policy kategori_tulis on public.kategori for all to authenticated
  using (public.saya_admin()) with check (public.saya_admin());

drop policy if exists produk_baca on public.produk;
create policy produk_baca on public.produk for select
  using (exists (
    select 1 from public.kategori k join public.games g on g.id = k.game_id
    where k.id = kategori_id and (g.aktif or public.saya_admin())
  ));
drop policy if exists produk_tulis on public.produk;
create policy produk_tulis on public.produk for all to authenticated
  using (public.saya_admin()) with check (public.saya_admin());

-- ---------------------------------------------------------------------------
-- Daftarkan email admin (GANTI dengan emailmu, lalu jalankan baris ini juga).
-- Akunnya dibuat dulu di Supabase > Authentication > Users > Add user.
-- ---------------------------------------------------------------------------
-- insert into public.admin_email (email) values ('emailkamu@example.com') on conflict do nothing;
