ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE public.sekolah ADD COLUMN IF NOT EXISTS telepon text NOT NULL DEFAULT '';

UPDATE public.sekolah SET
  nama = 'SMK Muhammadiyah 1 Paguyangan',
  alamat = 'Jl. Raya Paguyangan Km. 3 Kec. Paguyangan, Kab. Brebes, Jawa Tengah 52276',
  npsn = '20338410',
  email = 'smkmuhpgy@gmail.com',
  telepon = '(0289) 4311929'
WHERE id = '66666666-6666-4666-8666-000000000001';
