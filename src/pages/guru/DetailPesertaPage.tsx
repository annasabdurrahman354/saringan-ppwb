import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Peserta, NilaiBacaan, NilaiPenyampaian, User } from '@/types/database.types';
import { calculateAge, formatDate, getHasilLabel, getStatusColor, getKelasLabel } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User as UserIcon,
  MapPin,
  GraduationCap,
  Users,
  Home,
  Calendar,
  Award,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-600">Memuat data peserta...</p>
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <UserIcon className="h-16 w-16 text-gray-400" />
        <p className="text-gray-500 text-lg">Peserta tidak ditemukan</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  const calculateAverage = (nilai: NilaiPenyampaian) => {
    return (
      (nilai.nilai_makna + nilai.nilai_keterangan + nilai.nilai_penjelasan + nilai.nilai_pemahaman) / 4
    );
  };

  const parseKekuranganArray = (jsonString: string | string[] | null | undefined): string[] => {
    if (!jsonString) return [];
    if (Array.isArray(jsonString)) return jsonString;
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="p-2 rounded-lg bg-white">
        <Icon className="h-4 w-4 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="font-medium text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="pb-6">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Detail Peserta</h1>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Profile Card - Mobile First */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Photo and Name Section */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {peserta.foto ? (
                    <img
                      src={peserta.foto}
                      alt={peserta.nama}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center ring-4 ring-white shadow-lg">
                      <span className="text-4xl sm:text-5xl font-bold text-white">
                        {peserta.nama.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name and Basic Info */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{peserta.nama}</h2>
                    <p className="text-sm text-gray-600 font-mono mt-1">{peserta.nispn}</p>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    <Badge
                      variant={peserta.jenis_kelamin === 'L' ? 'default' : 'secondary'}
                      className={peserta.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                    >
                      {peserta.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      {getKelasLabel(peserta.kelas)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                  <p className="text-xs text-gray-600 mb-1">Hasil Tes</p>
                  <Badge className={`${getStatusColor(peserta.hasil_tes)} text-xs`}>
                    {getHasilLabel(peserta.hasil_tes)}
                  </Badge>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Status Tes</p>
                  <Badge className={`${getStatusColor(peserta.status_tes)} text-xs`}>
                    {peserta.status_tes.charAt(0).toUpperCase() + peserta.status_tes.slice(1)}
                  </Badge>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <p className="text-xs text-gray-600 mb-1">Penyampaian</p>
                  <Badge className={`${getStatusColor(peserta.hasil_tes_penyampaian)} text-xs`}>
                    {getHasilLabel(peserta.hasil_tes_penyampaian)}
                  </Badge>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                  <p className="text-xs text-gray-600 mb-1">Bacaan</p>
                  <Badge className={`${getStatusColor(peserta.hasil_tes_bacaan)} text-xs`}>
                    {getHasilLabel(peserta.hasil_tes_bacaan)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-green-600" />
              Informasi Pribadi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoItem
              icon={UserIcon}
              label="Nama Panggilan"
              value={peserta.nama_panggilan || '-'}
            />
            <InfoItem
              icon={Calendar}
              label="Tempat, Tanggal Lahir"
              value={`${peserta.tempat_lahir}, ${formatDate(peserta.tanggal_lahir)} (${calculateAge(peserta.tanggal_lahir)} tahun)`}
            />
            <InfoItem
              icon={Users}
              label="Nama Ayah"
              value={peserta.nama_ayah || '-'}
            />
            <InfoItem
              icon={Users}
              label="Nama Ibu"
              value={peserta.nama_ibu || '-'}
            />
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Informasi Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <InfoItem
              icon={Home}
              label="Alamat Lengkap"
              value={peserta.alamat_lengkap || '-'}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoItem
                icon={MapPin}
                label="Daerah Sambung"
                value={peserta.daerah_sambung || '-'}
              />
              <InfoItem
                icon={MapPin}
                label="Desa Sambung"
                value={peserta.desa_sambung || '-'}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoItem
                icon={MapPin}
                label="Kelompok Sambung"
                value={peserta.kelompok_sambung || '-'}
              />
              <InfoItem
                icon={Home}
                label="Status Mondok"
                value={peserta.status_mondok || '-'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Education Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              Informasi Pendidikan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <InfoItem
                icon={GraduationCap}
                label="Pendidikan"
                value={peserta.pendidikan || '-'}
              />
              <InfoItem
                icon={BookOpen}
                label="Jurusan"
                value={peserta.jurusan || '-'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Nilai Tabs - Mobile Optimized */}
        <Card>
          <Tabs defaultValue="penyampaian" className="w-full">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="penyampaian" className="text-xs sm:text-sm py-2">
                  <Award className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Nilai </span>Penyampaian
                </TabsTrigger>
                <TabsTrigger value="bacaan" className="text-xs sm:text-sm py-2">
                  <BookOpen className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Nilai </span>Bacaan
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-0">
              <TabsContent value="penyampaian" className="mt-0 space-y-3">
                {nilaiPenyampaian.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <Award className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">Belum ada nilai penyampaian</p>
                  </div>
                ) : (
                  nilaiPenyampaian.map((nilai) => {
                    const avg = calculateAverage(nilai);
                    const status = avg >= 70 ? 'Lulus' : 'Tidak Lulus';
                    return (
                      <Card key={nilai.id} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{nilai.guru.nama}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{formatDate(nilai.created_at)}</p>
                            </div>
                            <Badge className={avg >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {nilai.materi && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Materi</p>
                              <p className="font-medium text-sm">{nilai.materi}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Makna</p>
                              <p className="font-bold text-xl text-purple-700">{nilai.nilai_makna}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Keterangan</p>
                              <p className="font-bold text-xl text-blue-700">{nilai.nilai_keterangan}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Penjelasan</p>
                              <p className="font-bold text-xl text-green-700">{nilai.nilai_penjelasan}</p>
                            </div>
                            <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg text-center">
                              <p className="text-xs text-gray-600 mb-1">Pemahaman</p>
                              <p className="font-bold text-xl text-orange-700">{nilai.nilai_pemahaman}</p>
                            </div>
                          </div>

                          <Separator />

                          <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-center">
                            <p className="text-sm text-gray-600 mb-1">Rata-rata</p>
                            <p className="font-bold text-3xl text-gray-900">{avg.toFixed(2)}</p>
                          </div>

                          {nilai.catatan && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs text-gray-600 mb-1">Catatan</p>
                                  <p className="text-sm text-gray-900">{nilai.catatan}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="bacaan" className="mt-0 space-y-3">
                {nilaiBacaan.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                    <BookOpen className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500">Belum ada nilai bacaan</p>
                  </div>
                ) : (
                  nilaiBacaan.map((nilai) => (
                    <Card key={nilai.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{nilai.guru.nama}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDate(nilai.created_at)}</p>
                          </div>
                          <Badge className={nilai.nilai === 'lulus' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {nilai.nilai === 'lulus' ? 'Lulus' : 'Tidak Lulus'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {nilai.materi && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Materi</p>
                            <p className="font-medium text-sm">{nilai.materi}</p>
                          </div>
                        )}

                        {parseKekuranganArray(nilai.kekurangan_tajwid).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Kekurangan Tajwid</p>
                            <div className="flex flex-wrap gap-2">
                              {parseKekuranganArray(nilai.kekurangan_tajwid).map((k, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {parseKekuranganArray(nilai.kekurangan_khusus).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Kekurangan Khusus</p>
                            <div className="flex flex-wrap gap-2">
                              {parseKekuranganArray(nilai.kekurangan_khusus).map((k, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {parseKekuranganArray(nilai.kekurangan_keserasian).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Kekurangan Keserasian</p>
                            <div className="flex flex-wrap gap-2">
                              {parseKekuranganArray(nilai.kekurangan_keserasian).map((k, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {parseKekuranganArray(nilai.kekurangan_kelancaran).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700">Kekurangan Kelancaran</p>
                            <div className="flex flex-wrap gap-2">
                              {parseKekuranganArray(nilai.kekurangan_kelancaran).map((k, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700">
                                  {k}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {nilai.catatan && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 mb-1">Catatan</p>
                                <p className="text-sm text-gray-900">{nilai.catatan}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};
