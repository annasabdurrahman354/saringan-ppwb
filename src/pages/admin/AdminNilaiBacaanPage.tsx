import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NilaiBacaan, User, Peserta, Periode } from '@/types/database.types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/helpers';
import { Search, Trash2 } from 'lucide-react';

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
  const [deleting, setDeleting] = useState<string>('');

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

  const handleDeleteNilai = async (nilaiId: string) => {
    try {
      setDeleting(nilaiId);
      const { data, error } = await supabase.rpc('hapus_nilai_bacaan', {
        _id: nilaiId
      });

      if (error) throw error;
      
      // Refresh the nilai list after successful deletion
      await fetchNilai();
      
      console.log('Nilai bacaan berhasil dihapus:', data);
    } catch (error) {
      console.error('Error deleting nilai bacaan:', error);
      alert('Gagal menghapus nilai bacaan. Silakan coba lagi.');
    } finally {
      setDeleting('');
    }
  };

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
      <Card className="hidden md:block">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Peserta</TableHead>
                <TableHead>Nama Guru</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead>Materi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNilai.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
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
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            disabled={deleting === nilai.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus nilai bacaan untuk {nilai.peserta?.nama}?
                              Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi hasil tes peserta.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteNilai(nilai.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleting === nilai.id}
                            >
                              {deleting === nilai.id ? 'Menghapus...' : 'Hapus'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredNilai.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Tidak ada data nilai bacaan</p>
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
                  <span className={`px-2 py-1 rounded text-xs ${
                    nilai.nilai === 'lulus' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {nilai.nilai}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Guru</p>
                    <p className="font-medium">{nilai.guru?.nama || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Materi</p>
                    <p className="font-medium">{nilai.materi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatDate(nilai.created_at)}</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          disabled={deleting === nilai.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus nilai bacaan untuk {nilai.peserta?.nama}?
                            Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi hasil tes peserta.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteNilai(nilai.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting === nilai.id}
                          >
                            {deleting === nilai.id ? 'Menghapus...' : 'Hapus'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
