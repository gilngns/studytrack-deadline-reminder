import { Router } from "express";
import { readDB, writeDB } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { parseDeadline, susunDaftarTugas } from "../lib/deadline.js";

const router = Router();

// Seluruh endpoint tugas membutuhkan login.
router.use(requireAuth);

/**
 * GET /api/tasks
 * Daftar seluruh tugas milik pengguna yang sedang login, lintas semua mata
 * kuliah (F04). Setiap tugas menyertakan `mata_kuliah` (nama mata kuliahnya).
 *
 * Fitur Reminder Tugas Mendekati Deadline:
 *  - Setiap tugas diberi `kategori` ("mendekati_deadline" | "terlewat" | "normal")
 *    dan `sisa_waktu_ms` (negatif jika sudah lewat). Kategori dihitung saat
 *    request, bukan disimpan, karena nilainya berubah seiring waktu.
 *  - Urutan: mendekati deadline, lalu terlewat, lalu normal (created_at terbaru).
 *  - `server_time` dikirim agar frontend memakai acuan waktu yang sama.
 *
 * Response : 200 { server_time, tasks }
 */
router.get("/", (req, res) => {
  const db = readDB();
  const now = new Date();
  const tasks = db.tasks
    .filter((t) => t.user_id === req.user.id)
    .map((t) => {
      const course = db.courses.find((c) => c.id === t.mata_kuliah_id);
      return { ...t, mata_kuliah: course ? course.name : null };
    });

  res.json({ server_time: now.toISOString(), tasks: susunDaftarTugas(tasks, now) });
});

/**
 * GET /api/tasks/:id
 * Detail satu tugas milik pengguna yang sedang login.
 *
 * Response : 200 { task } | 404 tidak ditemukan
 */
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }
  res.json({ task });
});

/**
 * POST /api/tasks
 * Menambahkan tugas baru dengan status awal "belum".
 *
 * Body     : { mata_kuliah_id, judul, deadline, deskripsi? }
 * Response : 201 { task } | 400 input tidak valid atau mata kuliah bukan milik user
 */
router.post("/", (req, res) => {
  const { mata_kuliah_id, judul, deskripsi, deadline } = req.body;
  if (!mata_kuliah_id || !judul || !deadline) {
    return res.status(400).json({ error: "mata_kuliah_id, judul, dan deadline wajib diisi." });
  }

  if (!parseDeadline(deadline)) {
    return res.status(400).json({ error: "Format deadline tidak valid." });
  }

  const db = readDB();
  const course = db.courses.find((c) => c.id === Number(mata_kuliah_id) && c.user_id === req.user.id);
  if (!course) {
    return res.status(400).json({ error: "Mata kuliah tidak ditemukan untuk user ini." });
  }

  const newTask = {
    id: db.nextIds.task++,
    user_id: req.user.id,
    mata_kuliah_id: Number(mata_kuliah_id),
    judul,
    deskripsi: deskripsi || "",
    deadline,
    status: "belum",
    created_at: new Date().toISOString()
  };
  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json({ task: newTask });
});

/**
 * PUT /api/tasks/:id
 * Memperbarui tugas, termasuk mengubah status. Hanya field yang dikirim yang
 * diubah.
 *
 * Body     : { judul?, deskripsi?, deadline?, status? } (status: "belum" | "selesai")
 * Response : 200 { task } | 400 status tidak valid | 404 tidak ditemukan
 */
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  const { judul, deskripsi, deadline, status } = req.body;
  if (judul !== undefined) task.judul = judul;
  if (deskripsi !== undefined) task.deskripsi = deskripsi;
  if (deadline !== undefined) {
    if (!parseDeadline(deadline)) {
      return res.status(400).json({ error: "Format deadline tidak valid." });
    }
    task.deadline = deadline;
  }
  if (status !== undefined) {
    if (!["belum", "selesai"].includes(status)) {
      return res.status(400).json({ error: "Status hanya boleh 'belum' atau 'selesai'." });
    }
    task.status = status;
  }
  writeDB(db);
  res.json({ task });
});

/**
 * DELETE /api/tasks/:id
 * Menghapus satu tugas.
 *
 * Response : 200 { success: true } | 404 tidak ditemukan
 */
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);
  res.json({ success: true });
});

export default router;
