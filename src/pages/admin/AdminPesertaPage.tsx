import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Peserta, Periode, ApiStudent } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AdminPesertaPage = () => {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [syncPeriode, setSyncPeriode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPeriode) {
      fetchPeserta();
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
        setSyncPeriode(activePeriode.id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeserta = async () => {
    if (!selectedPeriode) return;

    try {
      const { data, error } = await supabase
        .from('saringan_peserta')
        .select('*')
        .eq('periode_id', selectedPeriode)
        .order('nama', { ascending: true });

      if (error) throw error;
      setPesertaList(data || []);
    } catch (error) {
      console.error('Error fetching peserta:', error);
    }
  };

  const handleSync = async () => {
    if (!syncPeriode) {
      toast({
        title: 'Gagal',
        description: 'Pilih periode terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('https://tes.ppwb.my.id/api/siswa-ppwb/peserta-saringan');
      if (!response.ok) throw new Error('Gagal mengambil data dari API');

      const apiData: ApiStudent[] = await response.json();
      let successCount = 0;
      let errorCount = 0;

      for (const student of apiData) {
        try {
          const pesertaData = {
            periode_id: syncPeriode,
            nispn: student.nispn,
            nama: student.nama,
            nama_panggilan: student.nama,
            jenis_kelamin: student.jenis_kelamin as 'L' | 'P',
            rfid: student.rfid || null,
            nomor_identitas: student.nik || null,
            foto: student.foto_siswa || null,
            nama_ayah: student.nama_ayah || null,
            nama_ibu: student.nama_ibu || null,
            tempat_lahir: student.tempat_lahir || null,
            tanggal_lahir: student.tanggal_lahir || null,
            alamat_lengkap: student.alamat_lengkap || null,
            daerah_sambung: student.daerah_sambung || null,
            desa_sambung: student.desa_sambung || null,
            kelompok_sambung: student.kelompok_sambung || null,
            status_mondok: student.status_mondok || null,
            daerah_kiriman: student.daerah_kiriman || null,
            pendidikan: student.pendidikan || null,
            jurusan: student.jurusan || null,
          };

          const { data: existingData } = await supabase
            .from('saringan_peserta')
            .select('id')
            .eq('periode_id', syncPeriode)
            .eq('nispn', student.nispn)
            .maybeSingle();

          if (existingData) {
            const { error } = await supabase
              .from('saringan_peserta')
              .update({ ...pesertaData, updated_at: new Date().toISOString() })
              .eq('id', existingData.id);

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('saringan_peserta')
              .insert(pesertaData);

            if (error) throw error;
          }

          successCount++;
        } catch (error) {
          console.error('Error syncing student:', student.nispn, error);
          errorCount++;
        }
      }

      toast({
        title: 'Sinkronisasi Selesai',
        description: `Berhasil: ${successCount}, Gagal: ${errorCount}`,
      });

      setSyncDialogOpen(false);
      if (selectedPeriode === syncPeriode) {
        fetchPeserta();
      }
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat sinkronisasi',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const filteredPeserta = pesertaList.filter((p) =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nispn.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Peserta</h1>
        <Button
          onClick={() => setSyncDialogOpen(true)}
          className="bg-green-700 hover:bg-green-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sinkronisasi Peserta
        </Button>
      </div>

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
              placeholder="Cari nama atau NISPN..."
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
                <TableHead>NISPN</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Daerah Sambung</TableHead>
                <TableHead>Status Tes</TableHead>
                <TableHead>Hasil Tes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeserta.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Tidak ada data peserta
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeserta.map((peserta) => (
                  <TableRow key={peserta.id}>
                    <TableCell className="font-medium">{peserta.nispn}</TableCell>
                    <TableCell>{peserta.nama}</TableCell>
                    <TableCell>{peserta.jenis_kelamin}</TableCell>
                    <TableCell>{peserta.daerah_sambung || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        peserta.status_tes === 'lulus' ? 'bg-green-100 text-green-800' :
                        peserta.status_tes === 'tidak_lulus' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {peserta.status_tes}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        peserta.hasil_tes === 'lulus' ? 'bg-green-100 text-green-800' :
                        peserta.hasil_tes === 'tidak_lulus' ? 'bg-red-100 text-red-800' :
                        peserta.hasil_tes === 'perlu_musyawarah' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {peserta.hasil_tes.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sinkronisasi Peserta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Pilih periode untuk sinkronisasi data peserta dari API.
            </p>
            <Select value={syncPeriode} onValueChange={setSyncPeriode}>
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
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSyncDialogOpen(false)} disabled={syncing}>
                Batal
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="bg-green-700 hover:bg-green-800"
              >
                {syncing ? 'Menyinkronkan...' : 'Sinkronisasi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
