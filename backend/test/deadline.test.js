/**
 * Pengujian logika fitur Reminder Tugas Mendekati Deadline.
 * Jalankan dengan: npm test
 *
 * Waktu "sekarang" diinjeksi sehingga hasil tidak bergantung pada jam server.
 * Data mengacu pada contoh di dokumen studi kasus (deadline tanpa zona waktu = WIB).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { kategorikanTugas, parseDeadline, susunDaftarTugas, KATEGORI } from "../lib/deadline.js";

const WIB = (s) => new Date(`${s}+07:00`);

const SEED = [
  { id: 1, judul: "Lab 4", deadline: "2026-07-03T23:59:00", status: "belum", created_at: "2026-06-15T09:00:00" },
  { id: 2, judul: "Project 3", deadline: "2026-07-02T10:00:00", status: "belum", created_at: "2026-06-16T14:00:00" },
  { id: 3, judul: "Sprint 2", deadline: "2026-07-06T23:59:00", status: "belum", created_at: "2026-06-17T11:00:00" }
];

test("S1 positif: sisa < 24 jam ditandai mendekati dan naik ke posisi teratas", () => {
  const now = WIB("2026-07-01T12:00:00"); // Project 3 tersisa 22 jam
  const hasil = susunDaftarTugas(SEED, now);
  assert.deepEqual(hasil.map((t) => t.id), [2, 3, 1]);
  assert.equal(hasil[0].kategori, KATEGORI.MENDEKATI);
  assert.equal(hasil[1].kategori, KATEGORI.NORMAL);
});

test("S2 negatif: tidak ada tugas < 24 jam, urutan lama (created_at terbaru) dipertahankan", () => {
  const now = WIB("2026-06-30T08:00:00");
  const hasil = susunDaftarTugas(SEED, now);
  assert.deepEqual(hasil.map((t) => t.id), [3, 2, 1]);
  assert.ok(hasil.every((t) => t.kategori === KATEGORI.NORMAL));
});

test("S3 positif: tugas lewat deadline ditandai terlewat, di bawah tugas mendekati", () => {
  const now = WIB("2026-07-03T12:00:00"); // Project 3 lewat, Lab 4 sisa ~12 jam
  const hasil = susunDaftarTugas(SEED, now);
  assert.deepEqual(hasil.map((t) => [t.id, t.kategori]), [
    [1, KATEGORI.MENDEKATI],
    [2, KATEGORI.TERLEWAT],
    [3, KATEGORI.NORMAL]
  ]);
});

test("S4 edge case: sisa tepat 24 jam belum termasuk mendekati, satu milidetik kemudian termasuk", () => {
  const task = { deadline: "2026-07-02T10:00:00", status: "belum" };
  assert.equal(kategorikanTugas(task, WIB("2026-07-01T10:00:00")).kategori, KATEGORI.NORMAL);
  const lewatSedikit = new Date(WIB("2026-07-01T10:00:00").getTime() + 1);
  assert.equal(kategorikanTugas(task, lewatSedikit).kategori, KATEGORI.MENDEKATI);
});

test("S5 edge case: tepat pada jam deadline masih mendekati, satu milidetik setelahnya terlewat", () => {
  const task = { deadline: "2026-07-02T10:00:00", status: "belum" };
  assert.equal(kategorikanTugas(task, WIB("2026-07-02T10:00:00")).kategori, KATEGORI.MENDEKATI);
  const telat = new Date(WIB("2026-07-02T10:00:00").getTime() + 1);
  assert.equal(kategorikanTugas(task, telat).kategori, KATEGORI.TERLEWAT);
});

test("S6 negatif: tugas berstatus selesai tidak diberi penanda walau deadline dekat atau lewat", () => {
  const now = WIB("2026-07-02T09:00:00");
  assert.equal(kategorikanTugas({ deadline: "2026-07-02T10:00:00", status: "selesai" }, now).kategori, KATEGORI.NORMAL);
  assert.equal(kategorikanTugas({ deadline: "2026-07-01T10:00:00", status: "selesai" }, now).kategori, KATEGORI.NORMAL);
});

test("S7 edge case: deadline tanpa zona waktu ditafsirkan WIB, setara dengan format UTC", () => {
  assert.equal(parseDeadline("2026-07-02T10:00:00").toISOString(), "2026-07-02T03:00:00.000Z");
  assert.equal(parseDeadline("2026-07-02T03:00:00.000Z").toISOString(), "2026-07-02T03:00:00.000Z");
  assert.equal(parseDeadline("bukan-tanggal"), null);
});

test("S8 edge case: beberapa tugas mendekati diurutkan dari deadline paling dekat", () => {
  const now = WIB("2026-07-02T00:00:00");
  const tasks = [
    { id: "a", deadline: "2026-07-02T20:00:00", status: "belum", created_at: "2026-06-01T00:00:00" },
    { id: "b", deadline: "2026-07-02T08:00:00", status: "belum", created_at: "2026-06-02T00:00:00" }
  ];
  assert.deepEqual(susunDaftarTugas(tasks, now).map((t) => t.id), ["b", "a"]);
});
