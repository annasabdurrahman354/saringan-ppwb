import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NilaiPenyampaian, User, Peserta, Periode } from '@/types/database.types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/lib/helpers';
import { Search } from 'lucide-react';

interface NilaiWithRelations extends NilaiPenyampaian {
  peserta: Peserta;
  guru: User;
}

export const AdminNilaiPenyampaianPage = () => {
  const [nilaiList, setNilaiList] = useState<NilaiWithRelations[]>([]);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPeriode) {
      fetchNilai();
    }
  }, [selectedPeriode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: periodeData, error: periodeError } = await supabase
        .from('saringan_periode')
        .select('*')
        .order('id', { ascending: false });

      if (periodeError) throw periodeError;
      setPeriodeList(periodeData || []);

      const activePeriode = periodeData?.find((p) => p.aktif);
      if (activePeriode) {
        setSelectedPeriode(activePeriode.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNilai = async () => {
    if (!selectedPeriode) return;

    try {
      const { data, error } = await supabase
        .from('saringan_nilai_penyampaian')
        .select(`
          *,
          peserta:saringan_peserta!saringan_nilai_penyampaian_peserta_id_fkey(*),
          guru:saringan_user!saringan_nilai_penyampaian_guru_id_fkey(*)
        `)
        .eq('peserta.periode_id', selectedPeriode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNilaiList(data as any || []);
    } catch (error) {
      console.error('Error fetching nilai:', error);
    }
  };

  const calculateAverage = (nilai: NilaiPenyampaian) => {
    return ((nilai.nilai_makna + nilai.nilai_keterangan + nilai.nilai_penjelasan + nilai.nilai_pemahaman) / 4).toFixed(2);
  };

  const filteredNilai = nilaiList.filter((n) =>
    n.peserta?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.guru?.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kelola Nilai Penyampaian</h1>

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodeList.map((periode) => (
                  <SelectItem key={periode.id} value={periode.id}>
                    {periode.id} {periode.aktif && '(Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama peserta atau guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden lg:block">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Peserta</TableHead>
                <TableHead>Nama Guru</TableHead>
                <TableHead>N. Makna</TableHead>
                <TableHead>N. Keterangan</TableHead>
                <TableHead>N. Penjelasan</TableHead>
                <TableHead>N. Pemahaman</TableHead>
                <TableHead>Rata-rata</TableHead>
                <TableHead>Materi</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNilai.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    Tidak ada data nilai penyampaian
                  </TableCell>
                </TableRow>
              ) : (
                filteredNilai.map((nilai) => (
                  <TableRow key={nilai.id}>
                    <TableCell className="font-medium">{nilai.peserta?.nama || '-'}</TableCell>
                    <TableCell>{nilai.guru?.nama || '-'}</TableCell>
                    <TableCell>{nilai.nilai_makna}</TableCell>
                    <TableCell>{nilai.nilai_keterangan}</TableCell>
                    <TableCell>{nilai.nilai_penjelasan}</TableCell>
                    <TableCell>{nilai.nilai_pemahaman}</TableCell>
                    <TableCell className="font-semibold">{calculateAverage(nilai)}</TableCell>
                    <TableCell>{nilai.materi || '-'}</TableCell>
                    <TableCell>{formatDate(nilai.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredNilai.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Tidak ada data nilai penyampaian</p>
          </Card>
        ) : (
          filteredNilai.map((nilai) => (
            <Card key={nilai.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{nilai.peserta?.nama || '-'}</h3>
                    <p className="text-sm text-gray-600">Peserta</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{calculateAverage(nilai)}</p>
                    <p className="text-sm text-gray-500">Rata-rata</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Guru</p>
                    <p className="font-medium">{nilai.guru?.nama || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Makna</p>
                      <p className="font-medium">{nilai.nilai_makna}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Keterangan</p>
                      <p className="font-medium">{nilai.nilai_keterangan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Penjelasan</p>
                      <p className="font-medium">{nilai.nilai_penjelasan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pemahaman</p>
                      <p className="font-medium">{nilai.nilai_pemahaman}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Materi</p>
                    <p className="font-medium">{nilai.materi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatDate(nilai.created_at)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
