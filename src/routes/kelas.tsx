import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, thCls, tdCls, KosongTabel, Lencana } from "@/components/Tabel";
import { useData } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Kelas } from "@/lib/data";

export const Route = createFileRoute("/kelas")({
  head: () => ({
    meta: [
      { title: "Data Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Daftar rombongan belajar, jurusan, wali kelas, dan jumlah siswa." },
      { property: "og:title", content: "Data Kelas — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Kelola rombongan belajar dan penugasan wali kelas." },
    ],
  }),
  component: DataKelas,
});

function DialogUbahKelas({
  kelas,
  tutup,
}: {
  kelas: Kelas;
  tutup: () => void;
}) {
  const { guru, segarkan } = useData();
  const [jurusan, setJurusan] = React.useState(kelas.jurusan);
  const [waliId, setWaliId] = React.useState(kelas.waliId ?? "");
  const [simpan, setSimpan] = React.useState(false);

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setSimpan(true);
    const { error } = await supabase
      .from("kelas")
      .update({ jurusan: jurusan.trim(), wali_id: waliId || null })
      .eq("id", kelas.id);
    setSimpan(false);
    if (error) {
      toast.error("Gagal menyimpan: " + error.message);
      return;
    }
    await segarkan();
    toast.success(`Kelas ${kelas.nama} diperbarui.`);
    tutup();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal>
      <form onSubmit={kirim} className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <h2 className="font-display text-lg font-bold">Ubah Kelas {kelas.nama}</h2>
        <label className="mt-4 block text-sm font-medium">
          Program Keahlian
          <input
            value={jurusan}
            onChange={(e) => setJurusan(e.target.value)}
            maxLength={80}
            required
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Wali Kelas
          <select
            value={waliId}
            onChange={(e) => setWaliId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
          >
            <option value="">— Belum ditentukan —</option>
            {guru.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nama}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={tutup}
            className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={simpan}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {simpan ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DataKelas() {
  const { kelas, mapelKelas, namaGuru, siswa } = useData();
  const { akun } = useAuth();
  const bolehUbah = akun?.peran === "admin";
  const [ubah, setUbah] = React.useState<Kelas | null>(null);
  const [cari, setCari] = React.useState("");
  const hasil = kelas.filter(
    (k) => k.nama.toLowerCase().includes(cari.toLowerCase()) || k.jurusan.toLowerCase().includes(cari.toLowerCase()),
  );


  return (
    <AppLayout judul="Data Kelas" deskripsi={`${kelas.length} rombongan belajar aktif`}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kelas.map((k) => {
          const jml = siswa.filter((s) => s.kelasId === k.id);
          return (
            <div key={k.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold">{k.nama}</h3>
                  <p className="truncate text-xs text-muted-foreground">{k.jurusan}</p>
                </div>
                <Lencana anak={`${jml.length} siswa`} />
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Wali Kelas</dt>
                  <dd className="min-w-0 truncate font-medium">{namaGuru(k.waliId)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Mata Pelajaran</dt>
                  <dd className="font-medium">{(mapelKelas[k.id] ?? []).length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">L / P</dt>
                  <dd className="font-medium">
                    {jml.filter((s) => s.jk === "L").length} / {jml.filter((s) => s.jk === "P").length}
                  </dd>
                </div>
              </dl>
              {bolehUbah && (
                <button
                  type="button"
                  onClick={() => setUbah(k)}
                  className="mt-4 w-full rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Ubah program keahlian / wali kelas
                </button>
              )}

            </div>
          );
        })}
      </div>

      <PanelTabel cari={cari} onCari={setCari} placeholder="Cari kelas atau jurusan…">
        <table className="w-full min-w-[680px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Kelas</th>
              <th className={thCls}>Tingkat</th>
              <th className={thCls}>Program Keahlian</th>
              <th className={thCls}>Wali Kelas</th>
              <th className={thCls}>Jumlah Siswa</th>
              {bolehUbah && <th className={thCls}>Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hasil.length === 0 && <KosongTabel pesan="Data kelas tidak ditemukan." />}
            {hasil.map((k, i) => (
              <tr key={k.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                <td className={`${tdCls} font-medium`}>{k.nama}</td>
                <td className={tdCls}>{k.tingkat}</td>
                <td className={`${tdCls} whitespace-normal`}>{k.jurusan}</td>
                <td className={tdCls}>{namaGuru(k.waliId)}</td>
                <td className={tdCls}>{siswa.filter((s) => s.kelasId === k.id).length}</td>
                {bolehUbah && (
                  <td className={tdCls}>
                    <button
                      type="button"
                      onClick={() => setUbah(k)}
                      className="rounded-lg border border-input px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                    >
                      Ubah
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
      {ubah && <DialogUbahKelas kelas={ubah} tutup={() => setUbah(null)} />}
    </AppLayout>

  );
}
