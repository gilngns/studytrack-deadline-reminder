import React from "react";

/**
 * Memformat deadline ke tampilan lokal Indonesia, contoh: "03 Jul 2026, 23.59".
 *
 * @param {string} deadline Tanggal dan jam deadline dari API.
 * @returns {string}
 */
function formatDeadline(deadline) {
  const d = new Date(deadline);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Mengubah selisih waktu (ms) menjadi teks singkat, contoh: "5 jam 12 menit".
 *
 * @param {number} ms Nilai mutlak selisih waktu.
 * @returns {string}
 */
function formatDurasi(ms) {
  const menitTotal = Math.floor(ms / 60000);
  const hari = Math.floor(menitTotal / 1440);
  const jam = Math.floor((menitTotal % 1440) / 60);
  const menit = menitTotal % 60;
  if (hari > 0) return `${hari} hari ${jam} jam`;
  if (jam > 0) return `${jam} jam ${menit} menit`;
  return `${menit} menit`;
}

/**
 * Penanda visual berdasarkan `kategori` dari backend. Frontend tidak menghitung
 * ulang kategori, sehingga aturan bisnis hanya ada di satu tempat (backend).
 */
const PENANDA = {
  mendekati_deadline: {
    label: "Mendekati Deadline",
    teks: (ms) => `Sisa ${formatDurasi(ms)}`
  },
  terlewat: {
    label: "Terlewat",
    teks: (ms) => `Lewat ${formatDurasi(Math.abs(ms))}`
  }
};

/**
 * Card satu tugas pada halaman Daftar Tugas.
 *
 * @param {object} props
 * @param {object} props.task Data tugas dari API (termasuk `mata_kuliah`).
 * @param {(task: object) => void} props.onToggleStatus Dipanggil saat tombol status ditekan.
 * @param {(id: number) => void} props.onDelete Dipanggil saat tombol hapus ditekan.
 *
 * Kondisi tampilan ditentukan oleh `task.kategori`:
 *  - "mendekati_deadline": garis tepi merah, badge "Mendekati Deadline", dan sisa waktu.
 *  - "terlewat": latar abu-abu, badge "Terlewat", dan lama keterlambatan.
 *  - "normal" atau tidak ada: tampilan card seperti semula.
 */
export default function TaskCard({ task, onToggleStatus, onDelete }) {
  const penanda = PENANDA[task.kategori];
  return (
    <div className={`card task-card ${task.kategori ? `kategori-${task.kategori}` : ""}`}>
      <div>
        {penanda && (
          <div className="penanda-row">
            <span className={`badge penanda ${task.kategori}`}>{penanda.label}</span>
            <span className="sisa-waktu">{penanda.teks(task.sisa_waktu_ms)}</span>
          </div>
        )}
        <strong>{task.judul}</strong>
        <div className="meta">{task.mata_kuliah}</div>
        <div className="meta">Deadline: {formatDeadline(task.deadline)}</div>
        {task.deskripsi && <div className="meta">{task.deskripsi}</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <span className={`badge ${task.status}`}>
          {task.status === "selesai" ? "Selesai" : "Belum"}
        </span>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => onToggleStatus(task)}>
            {task.status === "selesai" ? "Tandai Belum" : "Tandai Selesai"}
          </button>
          <button className="btn" onClick={() => onDelete(task.id)}>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
