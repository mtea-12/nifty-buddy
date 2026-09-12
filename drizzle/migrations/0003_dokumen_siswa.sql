CREATE TABLE public.dokumen_siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
  nama_file text NOT NULL,
  jalur text NOT NULL,
  jenis text NOT NULL DEFAULT '',
  ukuran integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_dokumen_siswa_siswa ON public.dokumen_siswa(siswa_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dokumen_siswa TO authenticated;
GRANT ALL ON public.dokumen_siswa TO service_role;

ALTER TABLE public.dokumen_siswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dokumen siswa dibaca staf dan diri sendiri"
ON public.dokumen_siswa FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'guru')
  OR public.has_role(auth.uid(), 'wali')
  OR siswa_id = public.siswa_saya()
);

CREATE POLICY "dokumen siswa dikelola admin"
ON public.dokumen_siswa FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "berkas siswa dibaca staf"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dokumen-siswa'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'guru')
    OR public.has_role(auth.uid(), 'wali')
  )
);

CREATE POLICY "berkas siswa ditulis admin"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dokumen-siswa' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "berkas siswa diubah admin"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'dokumen-siswa' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'dokumen-siswa' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "berkas siswa dihapus admin"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dokumen-siswa' AND public.has_role(auth.uid(), 'admin'));