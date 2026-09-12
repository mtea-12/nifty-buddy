import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Mail, Phone, Pencil, Save, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PanelTabel, thCls, tdCls, Lencana } from "@/components/Tabel";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/tahun-ajaran")({
  head: () => ({
    meta: [
      { title: "Tahun Ajaran — SMK Muhammadiyah 1 Paguyangan" },
      { name: "description", content: "Pengaturan tahun ajaran dan semester aktif untuk proses penilaian." },
      { property: "og:title", content: "Tahun Ajaran — SMK Muhammadiyah 1 Paguyangan" },
      { property: "og:description", content: "Atur tahun pelajaran dan semester aktif sekolah." },
    ],
  }),
  component: TahunAjaranPage,
});

function TahunAjaranPage() {
  const { sekolah, tahunAjaran, segarkan } = useData();
  const { akun } = useAuth();
  const aktif = tahunAjaran.find((t) => t.aktif)!;
  const isAdmin = akun?.peran === "admin";

  const [mengedit, setMengedit] = React.useState(false);
  const [memuat, setMemuat] = React.useState(false);
  const [form, setForm] = React.useState({
    nama: sekolah.nama,
    npsn: sekolah.npsn,
    alamat: sekolah.alamat,
    email: sekolah.email,
    telepon: sekolah.telepon,
  });

  React.useEffect(() => {
    setForm({
      nama: sekolah.nama,
      npsn: sekolah.npsn,
      alamat: sekolah.alamat,
      email: sekolah.email,
      telepon: sekolah.telepon,
    });
  }, [sekolah]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!sekolah.id) return;
    setMemuat(true);
    const { error } = await supabase.from("sekolah").update(form).eq("id", sekolah.id);
    setMemuat(false);
    if (error) {
      toast.error("Gagal menyimpan identitas sekolah. " + error.message);
      return;
    }
    toast.success("Identitas sekolah berhasil diperbarui.");
    setMengedit(false);
    await segarkan();
  }

  return (
    <AppLayout judul="Tahun Ajaran" deskripsi="Periode akademik dan semester aktif">
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Periode Aktif</p>
              <p className="font-display text-2xl font-bold">
                {aktif.tahun} — Semester {aktif.semester}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Seluruh input nilai dan rapor mengacu pada periode ini.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Identitas Sekolah</p>
              <p className="mt-2 font-display text-base font-bold">{sekolah.nama}</p>
              <p className="mt-1 text-sm text-muted-foreground">NPSN {sekolah.npsn}</p>
              <p className="mt-1 text-sm text-muted-foreground">{sekolah.alamat}</p>
              {sekolah.email && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${sekolah.email}`} className="hover:text-primary hover:underline">
                    {sekolah.email}
                  </a>
                </p>
              )}
              {sekolah.telepon && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${sekolah.telepon.replace(/\s/g, "")}`} className="hover:text-primary hover:underline">
                    {sekolah.telepon}
                  </a>
                </p>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => setMengedit(true)}
                className="rounded-lg border border-border p-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Ubah identitas sekolah"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {mengedit && (
        <form
          onSubmit={simpan}
          className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <h3 className="font-display text-base font-bold">Ubah Identitas Sekolah</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Nama Sekolah</label>
              <input
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">NPSN</label>
              <input
                value={form.npsn}
                onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium">Alamat Lengkap</label>
              <input
                value={form.alamat}
                onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Telepon</label>
              <input
                value={form.telepon}
                onChange={(e) => setForm((f) => ({ ...f, telepon: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setMengedit(false)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <X className="h-4 w-4" /> Batal
            </button>
            <button
              type="submit"
              disabled={memuat}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {memuat ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      )}

      <PanelTabel>
        <table className="w-full min-w-[560px]">
          <thead className="bg-secondary/60">
            <tr>
              <th className={thCls}>No</th>
              <th className={thCls}>Tahun Pelajaran</th>
              <th className={thCls}>Semester</th>
              <th className={thCls}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tahunAjaran.map((t, i) => (
              <tr key={t.id} className="hover:bg-secondary/40">
                <td className={`${tdCls} text-muted-foreground`}>{i + 1}</td>
                <td className={`${tdCls} font-medium`}>{t.tahun}</td>
                <td className={tdCls}>{t.semester}</td>
                <td className={tdCls}>
                  <Lencana jenis={t.aktif ? "sukses" : "netral"} anak={t.aktif ? "Aktif" : "Arsip"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelTabel>
    </AppLayout>
  );
}
