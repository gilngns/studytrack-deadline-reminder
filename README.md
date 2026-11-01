# StudyTrack Baseline

Starter kit untuk bonus **Implementasi kode nyata** pada studi kasus seleksi Software Engineer, Academya Arkavidia 11.0.

Isinya adalah kondisi StudyTrack saat ini: empat modul yang sudah berjalan (autentikasi, manajemen mata kuliah, manajemen tugas, dan halaman daftar tugas). Fitur **Reminder Tugas Mendekati Deadline** sengaja belum ada karena itulah yang perlu Anda rancang dan kerjakan.

> Starter kit ini bersifat opsional. Anda boleh memakai stack lain selama struktur datanya konsisten dengan Bagian 1 (Konteks Aplikasi) pada dokumen studi kasus.

## Stack

- **Backend:** Node.js + Express. Data disimpan di file JSON, jadi tidak perlu memasang database terpisah.
- **Frontend:** React + Vite.

## Prasyarat

- Node.js 20.19 atau lebih baru (atau 22.12+), sesuai syarat Vite 8.
- npm.

## Fitur yang Sudah Tersedia

- Registrasi, login, dan logout. Password di-hash dengan bcrypt dan sesi memakai JWT.
- Manajemen Mata Kuliah: lihat, tambah, dan hapus di UI. Endpoint ubah (`PUT`) juga tersedia di API.
- Manajemen Tugas per mata kuliah: lihat, tambah, ubah status (belum/selesai), dan hapus di UI. Endpoint ubah (`PUT`) juga tersedia di API.
- Halaman Daftar Tugas: seluruh tugas pengguna lintas mata kuliah, terurut dari `created_at` terbaru.

## Cara Menjalankan

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend berjalan di `http://localhost:4000`. Port dan `JWT_SECRET` bisa diatur lewat file `.env`.

### 2. Frontend

Buka terminal baru, lalu jalankan:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Selama mode development, request `/api/*` otomatis diteruskan ke backend oleh proxy Vite.

### 3. Akun Demo

File `backend/db.json` dibuat otomatis saat backend pertama kali dijalankan dan langsung berisi data seed. Anda bisa masuk dengan akun berikut:

| Email | Password |
| --- | --- |
| `demo@studytrack.test` | `demo1234` |

Untuk mengembalikan data ke kondisi seed kapan pun:

```bash
curl -X POST http://localhost:4000/api/dev/reset
```

Endpoint ini hanya aktif selama `NODE_ENV` bukan `production`.

## Struktur Data

Struktur ini mengikuti Bagian 1 (Konteks Aplikasi) pada dokumen studi kasus. Kolom `user_id` ditambahkan di luar daftar itu supaya setiap mahasiswa hanya melihat datanya sendiri.

**Mata kuliah** (`courses`)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Identitas unik |
| `name` | string | Nama mata kuliah |
| `kode` | string | Kode mata kuliah, contoh: `CS 186` |
| `dosen` | string | Nama dosen pengampu |
| `user_id` | integer | Pemilik data |

**Tugas** (`tasks`)

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | integer | Identitas unik |
| `judul` | string | Judul tugas |
| `deskripsi` | string | Deskripsi atau catatan tambahan |
| `deadline` | datetime | Batas pengumpulan |
| `status` | enum | `belum` atau `selesai` |
| `mata_kuliah_id` | integer | Referensi ke mata kuliah terkait |
| `created_at` | datetime | Waktu tugas ditambahkan |
| `user_id` | integer | Pemilik data |

> **Format waktu.** `deadline` disimpan sebagai waktu lokal tanpa zona waktu, persis seperti keluaran input `datetime-local` (contoh: `2026-07-03T23:59`). Sementara itu `created_at` pada tugas baru berformat ISO 8601 UTC (contoh: `2026-10-23T09:00:00.000Z`). Perhatikan perbedaan ini saat Anda menghitung sisa waktu hingga deadline.

## Data Seed

Data awal sama dengan contoh pada dokumen studi kasus:

| ID | Judul | Mata Kuliah | Deadline | Status |
| --- | --- | --- | --- | --- |
| 1 | Lab 4: Query Optimization Report | CS 186, Database Systems | 2026-07-03 23:59 | belum |
| 2 | Project 3: BSTMap Implementation | CS 61B, Data Structures | 2026-07-02 10:00 | belum |
| 3 | Sprint 2: Backend API Integration | CS 169, Software Engineering | 2026-07-06 23:59 | belum |

Tanggal pada data seed mengikuti dokumen, sehingga semuanya sudah lewat dari tanggal pengerjaan Anda. Untuk mencoba fitur yang Anda buat, tambahkan tugas baru dengan deadline yang dekat lewat form **Tambah Tugas**.

## Ringkasan API

Semua endpoint di bawah `/api`. Endpoint bertanda "Ya" membutuhkan header `Authorization: Bearer <token>`.

| Method | Path | Login | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/health` | Tidak | Cek status server |
| `POST` | `/auth/register` | Tidak | Daftar akun baru |
| `POST` | `/auth/login` | Tidak | Login, mengembalikan token |
| `GET` | `/auth/me` | Ya | Profil pengguna yang sedang login |
| `GET` | `/courses` | Ya | Daftar mata kuliah |
| `POST` | `/courses` | Ya | Tambah mata kuliah |
| `PUT` | `/courses/:id` | Ya | Ubah mata kuliah |
| `DELETE` | `/courses/:id` | Ya | Hapus mata kuliah beserta tugasnya |
| `GET` | `/tasks` | Ya | Daftar seluruh tugas, lintas mata kuliah |
| `GET` | `/tasks/:id` | Ya | Detail satu tugas |
| `POST` | `/tasks` | Ya | Tambah tugas (`mata_kuliah_id`, `judul`, `deadline`, `deskripsi?`) |
| `PUT` | `/tasks/:id` | Ya | Ubah tugas, termasuk status |
| `DELETE` | `/tasks/:id` | Ya | Hapus tugas |
| `POST` | `/dev/reset` | Tidak | Reset data ke seed (hanya di luar production) |

## Struktur Proyek

```
studytrack-baseline/
├── backend/
│   ├── server.js            # Entry point Express
│   ├── config.js            # Membaca .env (PORT, JWT_SECRET)
│   ├── db.js                # Penyimpanan JSON file dan data seed
│   ├── middleware/auth.js   # Verifikasi JWT
│   └── routes/
│       ├── auth.js          # Register, login, profil
│       ├── courses.js       # CRUD mata kuliah
│       └── tasks.js         # CRUD tugas (ada catatan untuk peserta)
└── frontend/
    └── src/
        ├── main.jsx, App.jsx, AuthContext.jsx, api.js
        ├── components/
        │   ├── Navbar.jsx
        │   └── TaskCard.jsx # Card tugas (ada catatan untuk peserta)
        └── pages/
            ├── Login.jsx, Register.jsx
            ├── Courses.jsx
            └── Tasks.jsx    # Halaman Daftar Tugas
```

## Titik Awal Fitur "Reminder Tugas Mendekati Deadline"

Cari komentar bertuliskan **"CATATAN UNTUK PESERTA STUDI KASUS"** pada dua file berikut:

- `backend/routes/tasks.js`
- `frontend/src/components/TaskCard.jsx`

Keduanya hanya penunjuk titik yang relevan. Anda tidak harus menaruh logika di sana, silakan sesuaikan dengan rancangan teknis Anda sendiri.

## Catatan

- Starter kit ini sengaja dibuat minimal. Fokus utamanya adalah fitur reminder deadline. Bonus lain pada dokumen (pemanfaatan AI/LLM, deployment, dan Git history yang rapi) bersifat opsional.
- Anda boleh memigrasikan penyimpanan dari file JSON ke database sungguhan (SQLite, PostgreSQL, dan sebagainya), tetapi itu tidak wajib.
- **Git history.** Salin starter kit ini ke repositori Anda sendiri dan commit kondisi awalnya lebih dulu, lalu kerjakan fitur di branch terpisah dengan commit message yang deskriptif.
- **Deployment.** Proxy Vite hanya berlaku saat `npm run dev`, jadi frontend hasil build perlu diarahkan ke URL backend (misalnya lewat `baseURL` di `frontend/src/api.js`). Ganti juga `JWT_SECRET` dengan nilai acak dan atur `NODE_ENV=production`. Penyimpanan file di layanan gratis seperti Render atau Railway umumnya bersifat sementara, sehingga `db.json` bisa hilang saat redeploy.

## Fitur Baru: Reminder Tugas Mendekati Deadline

Dikerjakan oleh Gilang Nanda Saputra sebagai bonus implementasi studi kasus.

| Kategori | Kondisi | Tampilan |
| --- | --- | --- |
| `mendekati_deadline` | Status `belum` dan sisa waktu 0 sampai kurang dari 24 jam | Paling atas, tepi merah, badge "Mendekati Deadline", sisa waktu |
| `terlewat` | Status `belum` dan waktu sekarang sudah melewati deadline | Di bawah kategori mendekati, latar abu-abu, badge "Terlewat", lama keterlambatan |
| `normal` | Sisa waktu 24 jam atau lebih, atau status `selesai` | Card seperti semula, urutan `created_at` terbaru |

Keputusan teknis utama:

- Skema data tidak diubah. Kategori dihitung saat request karena nilainya berubah seiring waktu, sehingga tidak disimpan di database.
- Logika ada di `backend/lib/deadline.js` sebagai fungsi murni dengan parameter waktu, sehingga mudah diuji.
- Deadline tanpa zona waktu (data lama) ditafsirkan memakai `APP_TZ_OFFSET` (bawaan `+07:00`). Deadline baru dikirim frontend dalam format ISO 8601 UTC. Dengan begitu hasil tetap benar walaupun server berjalan di zona UTC.
- `GET /api/tasks` kini mengembalikan `{ server_time, tasks }` dan setiap tugas memiliki `kategori` serta `sisa_waktu_ms`.

Menjalankan pengujian:

```bash
cd backend
npm test
```
