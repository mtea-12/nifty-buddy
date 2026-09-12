import * as XLSX from "xlsx";
import type { Kelas, Siswa } from "./data";

export type BarisSiswaImpor = {
  no: number;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  namaKelas: string;
  kelasId: string | null;
  wali: string;
  tanggalLahir: string;
  adaId: string | null;
  pesan: string | null;
};

const ALIAS: Record<string, string> = {
  nis: "nis",
  no_induk: "nis",
  nomor_induk: "nis",
  nisn: "nisn",
  nama: "nama",
  nama_siswa: "nama",
  nama_lengkap: "nama",
  jk: "jk",
  l_p: "jk",
  jenis_kelamin: "jk",
  kelas: "kelas",
  nama_kelas: "kelas",
  rombel: "kelas",
  wali: "wali",
  orang_tua: "wali",
  orang_tua_wali: "wali",
  nama_wali: "wali",
  tanggal_lahir: "tanggal_lahir",
  tgl_lahir: "tanggal_lahir",
  lahir: "tanggal_lahir",
};

function kunci(h: string) {
  const k = h.trim().toLowerCase().replace(/[\s./-]+/g, "_");
  return ALIAS[k] ?? k;
}

function keTanggal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return "";
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const lokal = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (lokal) return `${lokal[3]}-${lokal[2]!.padStart(2, "0")}-${lokal[1]!.padStart(2, "0")}`;
  return "";
}

/** Baca file Excel (.xlsx/.xls) atau CSV menjadi baris objek berkunci baku. */
export async function bacaBerkasSiswa(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const nama = wb.SheetNames[0];
  if (!nama) return [];
  const sheet = wb.Sheets[nama];
  if (!sheet) return [];
  const mentah = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return mentah.map((r) => {
    const out: Record<string, unknown> = {};
    Object.entries(r).forEach(([k, v]) => {
      out[kunci(k)] = v;
    });
    return out;
  });
}

/** Validasi & cocokkan baris mentah dengan kelas dan siswa yang sudah ada. */
export function cocokkanSiswa(
  baris: Record<string, unknown>[],
  kelas: Kelas[],
  siswa: Siswa[],
): BarisSiswaImpor[] {
  const petaKelas = new Map<string, Kelas>();
  kelas.forEach((k) => petaKelas.set(k.nama.trim().toLowerCase(), k));
  const petaNis = new Map<string, Siswa>();
  siswa.forEach((s) => {
    if (s.nis) petaNis.set(String(s.nis).trim().toLowerCase(), s);
  });
  const terlihat = new Set<string>();

  return baris.map((r, i) => {
    const nis = String(r['nis'] ?? "").trim();
    const nisn = String(r['nisn'] ?? "").trim();
    const nama = String(r['nama'] ?? "").trim();
    const jkMentah = String(r['jk'] ?? "L").trim().toUpperCase();
    const jk = jkMentah.startsWith("P") ? "P" : "L";
    const namaKelas = String(r['kelas'] ?? "").trim();
    const k = petaKelas.get(namaKelas.toLowerCase()) ?? null;
    const wali = String(r['wali'] ?? "").trim();
    const tanggalLahir = keTanggal(r['tanggal_lahir']);
    const lama = petaNis.get(nis.toLowerCase()) ?? null;

    let pesan: string | null = null;
    if (!nis && !nama) pesan = "Baris kosong";
    else if (!nis) pesan = "NIS wajib diisi";
    else if (!/^\d{4,20}$/.test(nis)) pesan = "NIS harus 4–20 digit angka";
    else if (!nama) pesan = "Nama wajib diisi";
    else if (nisn && !/^\d{10}$/.test(nisn)) pesan = "NISN harus 10 digit angka";
    else if (!namaKelas) pesan = "Kelas wajib diisi";
    else if (!k) pesan = `Kelas "${namaKelas}" tidak ditemukan`;
    else if (terlihat.has(nis.toLowerCase())) pesan = "NIS ganda di dalam berkas";

    if (!pesan) terlihat.add(nis.toLowerCase());

    return {
      no: i + 1,
      nis,
      nisn,
      nama,
      jk,
      namaKelas,
      kelasId: k?.id ?? null,
      wali,
      tanggalLahir,
      adaId: lama?.id ?? null,
      pesan,
    };
  });
}

/** Unduh template CSV untuk impor siswa. */
export function unduhTemplateSiswa(contohKelas: string) {
  const baris = [
    "nis,nisn,nama,jk,kelas,tanggal_lahir,wali",
    `2024001,0012345678,Nama Siswa,L,${contohKelas || "X TKJ 1"},2009-05-17,Nama Orang Tua`,
  ];
  const blob = new Blob(["\uFEFF" + baris.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template-siswa.csv";
  a.click();
  URL.revokeObjectURL(url);
}
