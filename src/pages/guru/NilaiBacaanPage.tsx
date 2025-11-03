import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Peserta, NilaiBacaan, User } from '@/types/database.types';
import { calculateAge, formatDate, getKelasLabel, getKelasBadgeClass } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface NilaiBacaanWithGuru extends NilaiBacaan {
  guru: User;
}

export const NilaiBacaanPage = () => {
  const { pesertaId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [peserta, setPeserta] = useState<Peserta | null>(null);
  const [riwayat, setRiwayat] = useState<NilaiBacaanWithGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nilai: 'lulus' as 'lulus' | 'tidak_lulus',
    kekurangan_tajwid: [] as string[],
    kekurangan_khusus: [] as string[],
    kekurangan_keserasian: [] as string[],
    kekurangan_kelancaran: [] as string[],
    materi: '',
    catatan: '',
  });

  const tajwidOptions = ['Dengung', 'Mad', 'Makhraj', 'Tafkhim & Tarqiq'];
  const khususOptions = ['Harakat', 'Lafadz', 'Lam Jalalah'];
  const keserasianOptions = ['Panjang Pendek', 'Ikhtilash Huruf Sukun', 'Ikhtilash Huruf Syiddah'];
  const kelancaranOptions = ['Kecepatan', 'Ketartilan'];

  // Helper function to safely parse JSON strings to arrays
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
        .from('saringan_nilai_bacaan')
        .select('*, guru:saringan_user!saringan_nilai_bacaan_guru_id_fkey(*)')
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

  const handleCheckboxChange = (category: 'tajwid' | 'khusus' | 'keserasian' | 'kelancaran', value: string) => {
    const key = `kekurangan_${category}` as keyof typeof formData;
    const current = formData[key] as string[];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setFormData({ ...formData, [key]: updated });
  };

  const handleSave = async () => {
    if (!userProfile) return;

    try {
      setSaving(true);
      const { error } = await supabase.rpc('simpan_nilai_bacaan', {
        _peserta_id: pesertaId,
        _guru_id: userProfile.id,
        _materi: formData.materi || null,
        _nilai: formData.nilai,
        _kekurangan_tajwid: JSON.stringify(formData.kekurangan_tajwid),
        _kekurangan_khusus: JSON.stringify(formData.kekurangan_khusus),
        _kekurangan_keserasian: JSON.stringify(formData.kekurangan_keserasian),
        _kekurangan_kelancaran: JSON.stringify(formData.kekurangan_kelancaran),
        _catatan: formData.catatan || null,
      });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Nilai bacaan berhasil disimpan',
      });

      navigate('/guru/daftar-peserta?action=nilai-bacaan');
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
        <h1 className="text-2xl font-bold text-gray-900">Nilai Bacaan</h1>
        <Button
          variant="ghost"
          onClick={() => navigate('/guru/daftar-peserta?action=nilai-bacaan')}
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
              <div className='flex flex-col gap-0.5'>
                <p className="text-sm text-gray-600">Usia: {calculateAge(peserta.tanggal_lahir)} tahun</p>
                <p className="text-sm text-gray-600">{peserta.daerah_sambung || '-'}</p>
                <p className="text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getKelasBadgeClass(peserta.kelas)}`}>
                    {getKelasLabel(peserta.kelas)}
                  </span>
                </p>
              </div>
              
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
                <Label>Nilai</Label>
                <RadioGroup
                  value={formData.nilai}
                  onValueChange={(val) => setFormData({ ...formData, nilai: val as 'lulus' | 'tidak_lulus' })}
                >
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lulus" id="nilai-lulus" />
                      <Label htmlFor="nilai-lulus">Lulus</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tidak_lulus" id="nilai-tidak-lulus" />
                      <Label htmlFor="nilai-tidak-lulus">Tidak Lulus</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Kekurangan Tajwid</Label>
                <div className="grid grid-cols-2 gap-3">
                  {tajwidOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tajwid-${option}`}
                        checked={formData.kekurangan_tajwid.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('tajwid', option)}
                      />
                      <Label htmlFor={`tajwid-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Kekurangan Khusus</Label>
                <div className="grid grid-cols-2 gap-3">
                  {khususOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`khusus-${option}`}
                        checked={formData.kekurangan_khusus.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('khusus', option)}
                      />
                      <Label htmlFor={`khusus-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Kekurangan Keserasian</Label>
                <div className="grid grid-cols-2 gap-3">
                  {keserasianOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`keserasian-${option}`}
                        checked={formData.kekurangan_keserasian.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('keserasian', option)}
                      />
                      <Label htmlFor={`keserasian-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Kekurangan Kelancaran</Label>
                <div className="grid grid-cols-2 gap-3">
                  {kelancaranOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`kelancaran-${option}`}
                        checked={formData.kekurangan_kelancaran.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('kelancaran', option)}
                      />
                      <Label htmlFor={`kelancaran-${option}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
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
                  onClick={() => navigate('/guru/daftar-peserta?action=nilai-bacaan')}
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
            riwayat.map((nilai) => (
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
                  {parseKekuranganArray(nilai.kekurangan_tajwid).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Kekurangan Tajwid</p>
                      <div className="flex flex-wrap gap-2">
                        {parseKekuranganArray(nilai.kekurangan_tajwid).map((k, i) => (
                          <Badge key={i} variant="outline">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parseKekuranganArray(nilai.kekurangan_khusus).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Kekurangan Khusus</p>
                      <div className="flex flex-wrap gap-2">
                        {parseKekuranganArray(nilai.kekurangan_khusus).map((k, i) => (
                          <Badge key={i} variant="outline">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parseKekuranganArray(nilai.kekurangan_keserasian).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Kekurangan Keserasian</p>
                      <div className="flex flex-wrap gap-2">
                        {parseKekuranganArray(nilai.kekurangan_keserasian).map((k, i) => (
                          <Badge key={i} variant="outline">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {parseKekuranganArray(nilai.kekurangan_kelancaran).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Kekurangan Kelancaran</p>
                      <div className="flex flex-wrap gap-2">
                        {parseKekuranganArray(nilai.kekurangan_kelancaran).map((k, i) => (
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
  );
};
