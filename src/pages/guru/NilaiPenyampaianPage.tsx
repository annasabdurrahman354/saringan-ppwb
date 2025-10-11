import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Peserta, NilaiPenyampaian, User } from '@/types/database.types';
import { calculateAge, formatDate } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface NilaiPenyampaianWithGuru extends NilaiPenyampaian {
  guru: User;
}

export const NilaiPenyampaianPage = () => {
  const { pesertaId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [peserta, setPeserta] = useState<Peserta | null>(null);
  const [riwayat, setRiwayat] = useState<NilaiPenyampaianWithGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nilai_makna: 70,
    nilai_keterangan: 70,
    nilai_penjelasan: 70,
    nilai_pemahaman: 70,
    materi: '',
    catatan: '',
  });

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

      const { data: nilaiData, error: nilaiError } = await supabase
        .from('saringan_nilai_penyampaian')
        .select('*, guru:saringan_user!saringan_nilai_penyampaian_guru_id_fkey(*)')
        .eq('peserta_id', pesertaId)
        .order('created_at', { ascending: false });

      if (nilaiError) throw nilaiError;
      setRiwayat(nilaiData as any);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;

    try {
      setSaving(true);
      const { error } = await supabase.rpc('simpan_nilai_penyampaian', {
        _peserta_id: pesertaId,
        _guru_id: userProfile.id,
        _materi: formData.materi || null,
        _nilai_makna: formData.nilai_makna,
        _nilai_keterangan: formData.nilai_keterangan,
        _nilai_penjelasan: formData.nilai_penjelasan,
        _nilai_pemahaman: formData.nilai_pemahaman,
        _catatan: formData.catatan || null,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Nilai penyampaian berhasil disimpan',
      });

      navigate('/guru/daftar-peserta?action=nilai-penyampaian');
    } catch (error: any) {
      console.error('Error saving nilai:', error);
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menyimpan nilai',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateAverage = (nilai: NilaiPenyampaian) => {
    return (
      (nilai.nilai_makna + nilai.nilai_keterangan + nilai.nilai_penjelasan + nilai.nilai_pemahaman) / 4
    );
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nilai Penyampaian</h1>
        <Button
          variant="ghost"
          onClick={() => navigate('/guru/daftar-peserta?action=nilai-penyampaian')}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Batal
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {peserta.foto ? (
              <img
                src={peserta.foto}
                alt={peserta.nama}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-400">{peserta.nama.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900">{peserta.nama}</h3>
                <Badge variant={peserta.jenis_kelamin === 'L' ? 'default' : 'secondary'}>
                  {peserta.jenis_kelamin}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Usia: {calculateAge(peserta.tanggal_lahir)} tahun</p>
              <p className="text-sm text-gray-600">{peserta.daerah_sambung || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="penilaian" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="penilaian">Penilaian</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>
        <TabsContent value="penilaian">
          <Card>
            <CardHeader>
              <CardTitle>Form Penilaian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Nilai Makna</Label>
                <RadioGroup
                  value={formData.nilai_makna.toString()}
                  onValueChange={(val) => setFormData({ ...formData, nilai_makna: parseInt(val) })}
                >
                  <div className="flex gap-4">
                    {[60, 70, 80, 90].map((val) => (
                      <div key={val} className="flex items-center space-x-2">
                        <RadioGroupItem value={val.toString()} id={`makna-${val}`} />
                        <Label htmlFor={`makna-${val}`}>{val}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Nilai Keterangan</Label>
                <RadioGroup
                  value={formData.nilai_keterangan.toString()}
                  onValueChange={(val) => setFormData({ ...formData, nilai_keterangan: parseInt(val) })}
                >
                  <div className="flex gap-4">
                    {[60, 70, 80, 90].map((val) => (
                      <div key={val} className="flex items-center space-x-2">
                        <RadioGroupItem value={val.toString()} id={`keterangan-${val}`} />
                        <Label htmlFor={`keterangan-${val}`}>{val}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Nilai Penjelasan</Label>
                <RadioGroup
                  value={formData.nilai_penjelasan.toString()}
                  onValueChange={(val) => setFormData({ ...formData, nilai_penjelasan: parseInt(val) })}
                >
                  <div className="flex gap-4">
                    {[60, 70, 80, 90].map((val) => (
                      <div key={val} className="flex items-center space-x-2">
                        <RadioGroupItem value={val.toString()} id={`penjelasan-${val}`} />
                        <Label htmlFor={`penjelasan-${val}`}>{val}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Nilai Pemahaman</Label>
                <RadioGroup
                  value={formData.nilai_pemahaman.toString()}
                  onValueChange={(val) => setFormData({ ...formData, nilai_pemahaman: parseInt(val) })}
                >
                  <div className="flex gap-4">
                    {[60, 70, 80, 90].map((val) => (
                      <div key={val} className="flex items-center space-x-2">
                        <RadioGroupItem value={val.toString()} id={`pemahaman-${val}`} />
                        <Label htmlFor={`pemahaman-${val}`}>{val}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="materi">Materi</Label>
                <Input
                  id="materi"
                  value={formData.materi}
                  onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                  placeholder="Masukkan materi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan</Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Masukkan catatan (opsional)"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/guru/daftar-peserta?action=nilai-penyampaian')}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-700 hover:bg-green-800"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="riwayat" className="space-y-4">
          {riwayat.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Belum ada riwayat penilaian</p>
            </Card>
          ) : (
            riwayat.map((nilai) => {
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
      </Tabs>
    </div>
  );
};
