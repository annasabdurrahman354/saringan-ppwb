import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NilaiBacaan, User, Peserta, Periode } from '@/types/database.types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDate } from '@/lib/helpers';
import { Search } from 'lucide-react';

interface NilaiWithRelations extends NilaiBacaan {
  peserta: Peserta;
  guru: User;
}

export const AdminNilaiBacaanPage = () => {
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
        .from('saringan_nilai_bacaan')
        .select(`
          *,
          peserta:saringan_peserta!saringan_nilai_bacaan_peserta_id_fkey(*),
          guru:saringan_user!saringan_nilai_bacaan_guru_id_fkey(*)
        `)
        .eq('peserta.periode_id', selectedPeriode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNilaiList(data as any || []);
    } catch (error) {
      console.error('Error fetching nilai:', error);
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kelola Nilai Bacaan</h1>

      <Card className="p-4 mb-6">
        <div className="flex gap-4">
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

      <Card>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Peserta</TableHead>
                <TableHead>Nama Guru</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Materi</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNilai.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Tidak ada data nilai bacaan
                  </TableCell>
                </TableRow>
              ) : (
                filteredNilai.map((nilai) => (
                  <TableRow key={nilai.id}>
                    <TableCell className="font-medium">{nilai.peserta?.nama || '-'}</TableCell>
                    <TableCell>{nilai.guru?.nama || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        nilai.nilai === 'lulus' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {nilai.nilai}
                      </span>
                    </TableCell>
                    <TableCell>{nilai.materi || '-'}</TableCell>
                    <TableCell>{formatDate(nilai.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
};
