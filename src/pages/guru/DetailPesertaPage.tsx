import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Peserta, NilaiBacaan, NilaiPenyampaian, User } from '@/types/database.types';
import { calculateAge, formatDate, getHasilLabel, getStatusColor } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface NilaiBacaanWithGuru extends NilaiBacaan {
  guru: User;
}

interface NilaiPenyampaianWithGuru extends NilaiPenyampaian {
  guru: User;
}

export const DetailPesertaPage = () => {
  const { pesertaId } = useParams();
  const navigate = useNavigate();
  const [peserta, setPeserta] = useState<Peserta | null>(null);
  const [nilaiBacaan, setNilaiBacaan] = useState<NilaiBacaanWithGuru[]>([]);
  const [nilaiPenyampaian, setNilaiPenyampaian] = useState<NilaiPenyampaianWithGuru[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [pesertaId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: pesertaData, error: pesertaError } = await supabase
        .from('saringan_peserta')
        .select('*')
        .eq('id', pesertaId)
        .single();

      if (pesertaError) throw pesertaError;
      setPeserta(pesertaData);

      const { data: bacaanData, error: bacaanError } = await supabase
        .from('saringan_nilai_bacaan')
        .select('*, guru:saringan_user!saringan_nilai_bacaan_guru_id_fkey(*)')
        .eq('peserta_id', pesertaId)
        .order('created_at', { ascending: false });

      if (bacaanError) throw bacaanError;
      setNilaiBacaan(bacaanData as any);

      const { data: penyampaianData, error: penyampaianError } = await supabase
        .from('saringan_nilai_penyampaian')
        .select('*, guru:saringan_user!saringan_nilai_penyampaian_guru_id_fkey(*)')
        .eq('peserta_id', pesertaId)
        .order('created_at', { ascending: false });

      if (penyampaianError) throw penyampaianError;
      setNilaiPenyampaian(penyampaianData as any);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Peserta tidak ditemukan</p>
      </div>
    );
  }

  const calculateAverage = (nilai: NilaiPenyampaian) => {
    return (
      (nilai.nilai_makna + nilai.nilai_keterangan + nilai.nilai_penjelasan + nilai.nilai_pemahaman) / 4
    );
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Detail Peserta</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profil Identitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6">
              {peserta.foto ? (
                <img
                  src={peserta.foto}
                  alt={peserta.nama}
                  className="w-32 h-32 rounded-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">{peserta.nama.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">NISPN</p>
                  <p className="font-medium">{peserta.nispn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Lengkap</p>
                  <p className="font-medium">{peserta.nama}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Panggilan</p>
                  <p className="font-medium">{peserta.nama_panggilan || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jenis Kelamin</p>
                  <p className="font-medium">{peserta.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tempat, Tanggal Lahir</p>
                  <p className="font-medium">{peserta.tempat_lahir}, {formatDate(peserta.tanggal_lahir)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Usia</p>
                  <p className="font-medium">{calculateAge(peserta.tanggal_lahir)} tahun</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Ayah</p>
                  <p className="font-medium">{peserta.nama_ayah || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Ibu</p>
                  <p className="font-medium">{peserta.nama_ibu || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Alamat Lengkap</p>
                  <p className="font-medium">{peserta.alamat_lengkap || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Daerah Sambung</p>
                  <p className="font-medium">{peserta.daerah_sambung || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Desa Sambung</p>
                  <p className="font-medium">{peserta.desa_sambung || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kelompok Sambung</p>
                  <p className="font-medium">{peserta.kelompok_sambung || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status Mondok</p>
                  <p className="font-medium">{peserta.status_mondok || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pendidikan</p>
                  <p className="font-medium">{peserta.pendidikan || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jurusan</p>
                  <p className="font-medium">{peserta.jurusan || '-'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hasil Tes & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Hasil Tes</p>
                <Badge className={getStatusColor(peserta.hasil_tes)}>
                  {getHasilLabel(peserta.hasil_tes)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Hasil Penyampaian</p>
                <Badge className={getStatusColor(peserta.hasil_tes_penyampaian)}>
                  {getHasilLabel(peserta.hasil_tes_penyampaian)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Hasil Bacaan</p>
                <Badge className={getStatusColor(peserta.hasil_tes_bacaan)}>
                  {getHasilLabel(peserta.hasil_tes_bacaan)}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Status Tes</p>
                <Badge className={getStatusColor(peserta.status_tes)}>
                  {peserta.status_tes.charAt(0).toUpperCase() + peserta.status_tes.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="penyampaian" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="penyampaian">Nilai Penyampaian</TabsTrigger>
            <TabsTrigger value="bacaan">Nilai Bacaan</TabsTrigger>
          </TabsList>
          <TabsContent value="penyampaian" className="space-y-4">
            {nilaiPenyampaian.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Belum ada nilai penyampaian</p>
              </Card>
            ) : (
              nilaiPenyampaian.map((nilai) => {
                const avg = calculateAverage(nilai);
                const status = avg >= 70 ? 'Lulus' : 'Tidak Lulus';
                return (
                  <Card key={nilai.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{nilai.guru.nama}</CardTitle>
                          <p className="text-sm text-gray-500">{formatDate(nilai.created_at)}</p>
                        </div>
                        <Badge className={avg >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Materi</p>
                        <p className="font-medium">{nilai.materi || '-'}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nilai Makna</p>
                          <p className="font-semibold text-lg">{nilai.nilai_makna}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nilai Keterangan</p>
                          <p className="font-semibold text-lg">{nilai.nilai_keterangan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nilai Penjelasan</p>
                          <p className="font-semibold text-lg">{nilai.nilai_penjelasan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nilai Pemahaman</p>
                          <p className="font-semibold text-lg">{nilai.nilai_pemahaman}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Rata-rata</p>
                        <p className="font-bold text-xl">{avg.toFixed(2)}</p>
                      </div>
                      {nilai.catatan && (
                        <div>
                          <p className="text-sm text-gray-500">Catatan</p>
                          <p className="font-medium">{nilai.catatan}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
          <TabsContent value="bacaan" className="space-y-4">
            {nilaiBacaan.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Belum ada nilai bacaan</p>
              </Card>
            ) : (
              nilaiBacaan.map((nilai) => (
                <Card key={nilai.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{nilai.guru.nama}</CardTitle>
                        <p className="text-sm text-gray-500">{formatDate(nilai.created_at)}</p>
                      </div>
                      <Badge className={nilai.nilai === 'lulus' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {nilai.nilai === 'lulus' ? 'Lulus' : 'Tidak Lulus'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Materi</p>
                      <p className="font-medium">{nilai.materi || '-'}</p>
                    </div>
                    {nilai.kekurangan_tajwid && nilai.kekurangan_tajwid.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Kekurangan Tajwid</p>
                        <div className="flex flex-wrap gap-2">
                          {nilai.kekurangan_tajwid.map((k, i) => (
                            <Badge key={i} variant="outline">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {nilai.kekurangan_khusus && nilai.kekurangan_khusus.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Kekurangan Khusus</p>
                        <div className="flex flex-wrap gap-2">
                          {nilai.kekurangan_khusus.map((k, i) => (
                            <Badge key={i} variant="outline">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {nilai.kekurangan_keserasian && nilai.kekurangan_keserasian.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Kekurangan Keserasian</p>
                        <div className="flex flex-wrap gap-2">
                          {nilai.kekurangan_keserasian.map((k, i) => (
                            <Badge key={i} variant="outline">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {nilai.kekurangan_kelancaran && nilai.kekurangan_kelancaran.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Kekurangan Kelancaran</p>
                        <div className="flex flex-wrap gap-2">
                          {nilai.kekurangan_kelancaran.map((k, i) => (
                            <Badge key={i} variant="outline">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {nilai.catatan && (
                      <div>
                        <p className="text-sm text-gray-500">Catatan</p>
                        <p className="font-medium">{nilai.catatan}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
