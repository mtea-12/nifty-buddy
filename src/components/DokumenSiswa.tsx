import * as React from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Dokumen = {
  id: string;
  nama_file: string;
  jalur: string;
  ukuran: number;
  created_at: string;
};

const BUCKET = "dokumen-siswa";
const MAKS = 10 * 1024 * 1024;

function ukuranTeks(b: number) {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

/** Daftar & unggah berkas pendukung milik satu siswa (admin). */
export function DokumenSiswa({ siswaId, bolehUbah }: { siswaId: string; bolehUbah: boolean }) {
  const [daftar, setDaftar] = React.useState<Dokumen[]>([]);
  const [memuat, setMemuat] = React.useState(true);
  const [sibuk, setSibuk] = React.useState(false);
  const berkasRef = React.useRef<HTMLInputElement>(null);

  const muat = React.useCallback(async () => {
    setMemuat(true);
    const { data, error } = await supabase
      .from("dokumen_siswa")
      .select("id, nama_file, jalur, ukuran, created_at")
      .eq("siswa_id", siswaId)
      .order("created_at", { ascending: false });
    if (error) toast.error(`Gagal memuat dokumen: ${error.message}`);
    setDaftar(data ?? []);
    setMemuat(false);
  }, [siswaId]);

  React.useEffect(() => {
    void muat();
  }, [muat]);

  async function unggah(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSibuk(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAKS) {
          toast.error(`${file.name} melebihi 10 MB.`);
          continue;
        }
        const bersih = file.name.replace(/[^\w.\- ]+/g, "_");
        const jalur = `${siswaId}/${Date.now()}-${bersih}`;
        const { error: eUp } = await supabase.storage.from(BUCKET).upload(jalur, file, {
          contentType: file.type || "application/octet-stream",
        });
        if (eUp) throw new Error(eUp.message);
        const { error: eDb } = await supabase.from("dokumen_siswa").insert({
          siswa_id: siswaId,
          nama_file: file.name,
          jalur,
          jenis: file.type,
          ukuran: file.size,
        });
        if (eDb) throw new Error(eDb.message);
      }
      toast.success("Dokumen diunggah.");
      await muat();
    } catch (e) {
      toast.error(`Gagal mengunggah: ${(e as Error).message}`);
    } finally {
      setSibuk(false);
      if (berkasRef.current) berkasRef.current.value = "";
    }
  }

  async function buka(d: Dokumen) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(d.jalur, 300);
    if (error || !data) {
      toast.error("Gagal membuka dokumen.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  async function hapus(d: Dokumen) {
    setSibuk(true);
    try {
      await supabase.storage.from(BUCKET).remove([d.jalur]);
      const { error } = await supabase.from("dokumen_siswa").delete().eq("id", d.id);
      if (error) throw new Error(error.message);
      toast.success("Dokumen dihapus.");
      await muat();
    } catch (e) {
      toast.error(`Gagal menghapus: ${(e as Error).message}`);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">Dokumen Siswa</span>
        {bolehUbah && (
          <>
            <input
              ref={berkasRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => void unggah(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={sibuk}
              onClick={() => berkasRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> {sibuk ? "Mengunggah…" : "Unggah"}
            </Button>
          </>
        )}
      </div>
      {memuat ? (
        <p className="text-xs text-muted-foreground">Memuat dokumen…</p>
      ) : daftar.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Belum ada dokumen. Unggah foto, akta, kartu keluarga, atau berkas lain (maks. 10 MB).
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {daftar.map((d) => (
            <li key={d.id} className="flex items-center gap-2 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <button
                type="button"
                onClick={() => void buka(d)}
                className="flex-1 truncate text-left text-sm text-primary hover:underline"
              >
                {d.nama_file}
              </button>
              <span className="shrink-0 text-xs text-muted-foreground">{ukuranTeks(d.ukuran)}</span>
              {bolehUbah && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Hapus ${d.nama_file}`}
                  disabled={sibuk}
                  onClick={() => void hapus(d)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
