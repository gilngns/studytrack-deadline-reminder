/**
 * Logika fitur "Reminder Tugas Mendekati Deadline".
 *
 * Seluruh fungsi di sini bersifat murni (pure): waktu "sekarang" selalu
 * diterima sebagai parameter, sehingga hasilnya dapat diuji tanpa bergantung
 * pada jam server.
 */
import { APP_TZ_OFFSET } from "../config.js";

/** Ambang "mendekati deadline": kurang dari 24 jam (F01). Nilai tetap, tidak dapat dikonfigurasi pengguna. */
export const NEAR_DEADLINE_MS = 24 * 60 * 60 * 1000;

/** Kategori yang dikirim ke frontend. */
export const KATEGORI = Object.freeze({
  MENDEKATI: "mendekati_deadline",
  TERLEWAT: "terlewat",
  NORMAL: "normal"
});

/** Urutan prioritas tampil: angka kecil berada di atas (F02). */
const PRIORITAS = {
  [KATEGORI.MENDEKATI]: 0,
  [KATEGORI.TERLEWAT]: 1,
  [KATEGORI.NORMAL]: 2
};

const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Mengubah string deadline menjadi Date yang tidak ambigu.
 *
 * Data lama (termasuk seed) disimpan tanpa zona waktu, contoh "2026-07-03T23:59:00".
 * Jika langsung di-parse, hasilnya mengikuti zona waktu server, sehingga di server
 * cloud (UTC) deadline bisa bergeser 7 jam. Karena itu string tanpa zona waktu
 * ditafsirkan memakai zona waktu aplikasi (bawaan WIB, +07:00).
 *
 * @param {string} deadline
 * @returns {Date | null} null jika format tidak valid.
 */
export function parseDeadline(deadline) {
  if (typeof deadline !== "string" || deadline.trim() === "") return null;
  const value = deadline.trim();
  const date = new Date(HAS_TIMEZONE.test(value) ? value : `${value}${APP_TZ_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Menentukan kategori satu tugas.
 *
 * Aturan:
 *  - Tugas berstatus "selesai" selalu "normal" (tidak perlu diingatkan).
 *  - Deadline sudah lewat (sekarang > deadline) menjadi "terlewat" (F03).
 *  - Sisa waktu 0 sampai kurang dari 24 jam menjadi "mendekati_deadline" (F01).
 *  - Selain itu "normal". Sisa tepat 24 jam termasuk "normal" karena syaratnya "kurang dari".
 *
 * @param {{status: string, deadline: string}} task
 * @param {Date} now
 * @returns {{ kategori: string, sisa_waktu_ms: number | null }}
 */
export function kategorikanTugas(task, now) {
  const deadline = parseDeadline(task.deadline);
  if (!deadline) return { kategori: KATEGORI.NORMAL, sisa_waktu_ms: null };

  const sisa = deadline.getTime() - now.getTime();
  if (task.status === "selesai") return { kategori: KATEGORI.NORMAL, sisa_waktu_ms: sisa };
  if (sisa < 0) return { kategori: KATEGORI.TERLEWAT, sisa_waktu_ms: sisa };
  if (sisa < NEAR_DEADLINE_MS) return { kategori: KATEGORI.MENDEKATI, sisa_waktu_ms: sisa };
  return { kategori: KATEGORI.NORMAL, sisa_waktu_ms: sisa };
}

/**
 * Komparator urutan daftar tugas.
 *  1. Mendekati deadline: deadline paling dekat di atas.
 *  2. Terlewat: yang paling baru lewat di atas, supaya tugas yang masih mungkin
 *     dikejar tidak tertutup tugas lama yang sudah lama lewat.
 *  3. Normal: tetap memakai urutan lama (created_at terbaru di atas).
 */
export function bandingkanTugas(a, b) {
  const beda = PRIORITAS[a.kategori] - PRIORITAS[b.kategori];
  if (beda !== 0) return beda;

  if (a.kategori === KATEGORI.MENDEKATI) return a.sisa_waktu_ms - b.sisa_waktu_ms;
  if (a.kategori === KATEGORI.TERLEWAT) return b.sisa_waktu_ms - a.sisa_waktu_ms;
  return new Date(b.created_at) - new Date(a.created_at);
}

/**
 * Menambahkan kategori dan sisa waktu ke setiap tugas lalu mengurutkannya.
 *
 * @param {object[]} tasks
 * @param {Date} now Satu nilai waktu untuk seluruh tugas dalam satu request.
 * @returns {object[]}
 */
export function susunDaftarTugas(tasks, now) {
  return tasks.map((t) => ({ ...t, ...kategorikanTugas(t, now) })).sort(bandingkanTugas);
}
