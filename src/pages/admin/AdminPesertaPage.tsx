import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Peserta, Periode, ApiStudent } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search, User, MapPin, GraduationCap, Phone, Edit, CheckCircle, Printer } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getHasilLabel, getKelasLabel, getKelasBadgeClass } from '@/lib/helpers';

export const AdminPesertaPage = () => {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState<string>('');
  const [syncPeriode, setSyncPeriode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);
  const [editFormData, setEditFormData] = useState<{ kelas: 'saringan' | 'bacaan' | 'penyampaian' }>({ kelas: 'saringan' });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
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

      console.log('Total API data:', apiData.length);

      // Helper function to convert date from DD-MM-YYYY to YYYY-MM-DD
      const convertDate = (dateStr: string | null): string | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          return `${year}-${month}-${day}`;
        }
        return dateStr; // Return as is if format is unexpected
      };

      // Prepare all data for upsert
      const pesertaDataList = apiData.map(student => ({
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
        tanggal_lahir: convertDate(student.tanggal_lahir),
        alamat_lengkap: student.alamat_lengkap || null,
        daerah_sambung: student.daerah_sambung || null,
        desa_sambung: student.desa_sambung || null,
        kelompok_sambung: student.kelompok_sambung || null,
        status_mondok: student.status_mondok || null,
        daerah_kiriman: student.daerah_kiriman || null,
        pendidikan: student.pendidikan || null,
        jurusan: student.jurusan || null,
        kelas: 'saringan',
      }));

      // Upsert all data in one operation
      const { error, count } = await supabase
        .from('saringan_peserta')
        .upsert(pesertaDataList, {
          onConflict: 'periode_id,nispn',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      console.log('Upsert success, count:', count);

      toast({
        title: 'Sinkronisasi Selesai',
        description: `Berhasil menyinkronkan ${apiData.length} data peserta`,
      });

      setSyncDialogOpen(false);
      if (selectedPeriode === syncPeriode) {
        fetchPeserta();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
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

  const handleEditPeserta = (peserta: Peserta) => {
    setEditingPeserta(peserta);
    setEditFormData({ kelas: peserta.kelas });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPeserta) return;

    try {
      const { error } = await supabase
        .from('saringan_peserta')
        .update({ kelas: editFormData.kelas })
        .eq('id', editingPeserta.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Kelas peserta berhasil diperbarui',
      });

      setEditDialogOpen(false);
      setEditingPeserta(null);
      fetchPeserta();
    } catch (error: any) {
      console.error('Error updating peserta:', error);
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal memperbarui kelas peserta',
        variant: 'destructive',
      });
    }
  };

  const handleTetapkanHasil = async () => {
    if (!selectedPeriode) {
      toast({
        title: 'Gagal',
        description: 'Pilih periode terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      // Get all peserta for the selected periode
      const { data: pesertaData, error: fetchError } = await supabase
        .from('saringan_peserta')
        .select('id, hasil_tes, nispn, nama')
        .eq('periode_id', selectedPeriode);

      if (fetchError) throw fetchError;

      if (!pesertaData || pesertaData.length === 0) {
        toast({
          title: 'Tidak Ada Data',
          description: 'Tidak ada peserta untuk periode ini',
          variant: 'destructive',
        });
        return;
      }

      // Update each peserta's status_tes with their hasil_tes
      // We must include all NOT NULL columns (periode_id, nispn, nama) for upsert to work
      const updates = pesertaData.map((peserta) => ({
        id: peserta.id,
        periode_id: selectedPeriode,
        nispn: peserta.nispn,
        nama: peserta.nama,
        status_tes: peserta.hasil_tes,
      }));

      const { error: updateError } = await supabase
        .from('saringan_peserta')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) throw updateError;

      toast({
        title: 'Berhasil',
        description: `Berhasil menetapkan hasil untuk ${pesertaData.length} peserta`,
      });

      setConfirmDialogOpen(false);
      fetchPeserta();
    } catch (error: any) {
      console.error('Error setting hasil:', error);
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat menetapkan hasil',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Peserta</h1>
          <p className="text-gray-600 mt-1">Kelola data peserta dan periode saringan</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setConfirmDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            disabled={!selectedPeriode}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Tetapkan Hasil
          </Button>
          <Button
            onClick={() => window.open(`/admin/print-hasil-semua/${selectedPeriode}`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            disabled={!selectedPeriode}
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak Semua
          </Button>
          <Button
            onClick={() => setSyncDialogOpen(true)}
            className="bg-green-700 hover:bg-green-800 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sinkronisasi Peserta
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Periode</label>
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pencarian</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama atau NISPN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Menampilkan {filteredPeserta.length} dari {pesertaList.length} peserta
        </p>
        {filteredPeserta.length > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {filteredPeserta.length} hasil
          </Badge>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="space-y-4">
        <ScrollArea
          className="h-[calc(100vh-300px)]"
          enablePullToRefresh={true}
          onRefresh={fetchPeserta}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
            {filteredPeserta.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <User className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg mb-2">Tidak ada data peserta</p>
                <p className="text-gray-400 text-sm">Coba ubah filter pencarian atau periode</p>
              </div>
            ) : (
              filteredPeserta.map((peserta) => (
                <Card key={peserta.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-800">
                            {peserta.nama.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-gray-900">
                            {peserta.nama}
                          </CardTitle>
                          <p className="text-sm text-gray-600 font-mono">{peserta.nispn}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/admin/print-hasil/${peserta.id}`, '_blank')}
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPeserta(peserta)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Badge
                          variant={peserta.jenis_kelamin === 'L' ? 'default' : 'secondary'}
                          className={peserta.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                        >
                          {peserta.jenis_kelamin}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Status Information */}
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Kelas</p>
                        <Badge
                          variant="outline"
                          className={`${getKelasBadgeClass(peserta.kelas)} border-0`}
                        >
                          {getKelasLabel(peserta.kelas)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Status Tes</p>
                        <Badge
                          variant="outline"
                          className={`${peserta.status_tes === 'lulus' ? 'border-green-200 bg-green-50 text-green-800' :
                            peserta.status_tes === 'tidak_lulus' ? 'border-red-200 bg-red-50 text-red-800' :
                              'border-blue-200 bg-blue-50 text-blue-800'
                            }`}
                        >
                          {getHasilLabel(peserta.status_tes)}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Hasil Tes</p>
                        <Badge
                          variant="outline"
                          className={`${peserta.hasil_tes === 'lulus' ? 'border-green-200 bg-green-50 text-green-800' :
                            peserta.hasil_tes === 'tidak_lulus' ? 'border-red-200 bg-red-50 text-red-800' :
                              peserta.hasil_tes === 'perlu_musyawarah' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
                                'border-gray-200 bg-gray-50 text-gray-800'
                            }`}
                        >
                          {getHasilLabel(peserta.hasil_tes)}
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      {peserta.daerah_sambung && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{peserta.daerah_sambung}</span>
                        </div>
                      )}
                      {peserta.pendidikan && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span>{peserta.pendidikan}</span>
                        </div>
                      )}
                      {peserta.nomor_identitas && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{peserta.nomor_identitas}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-600" />
              Sinkronisasi Peserta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Sinkronisasi akan mengambil data peserta terbaru dari API PPWB dan memperbarui database lokal.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Pilih Periode</label>
              <Select value={syncPeriode} onValueChange={setSyncPeriode}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode untuk sinkronisasi" />
                </SelectTrigger>
                <SelectContent>
                  {periodeList.map((periode) => (
                    <SelectItem key={periode.id} value={periode.id}>
                      <div className="flex items-center gap-2">
                        <span>{periode.id}</span>
                        {periode.aktif && <Badge variant="secondary" className="text-xs">Aktif</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setSyncDialogOpen(false)}
                disabled={syncing}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing || !syncPeriode}
                className="bg-green-700 hover:bg-green-800 w-full sm:w-auto"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyinkronkan...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Mulai Sinkronisasi
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Kelas Peserta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingPeserta && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{editingPeserta.nama}</p>
                  <p className="text-sm text-gray-600">{editingPeserta.nispn}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Kelas</label>
                  <Select
                    value={editFormData.kelas}
                    onValueChange={(value: 'saringan' | 'bacaan' | 'penyampaian') =>
                      setEditFormData({ ...editFormData, kelas: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saringan">Saringan</SelectItem>
                      <SelectItem value="bacaan">Bacaan</SelectItem>
                      <SelectItem value="penyampaian">Penyampaian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <CheckCircle className="h-5 w-5" />
              Tetapkan Hasil Pengetesan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {selectedPeriode && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium">
                      Anda yakin menetapkan hasil pengetesan saat ini sebagai hasil final status masing-masing peserta saringan periode <span className="font-bold">{selectedPeriode}</span>?
                    </p>
                  </div>
                  <p className="text-gray-600">
                    Tindakan ini akan mengubah <span className="font-semibold">status tes</span> setiap peserta dengan nilai dari <span className="font-semibold">hasil tes</span> mereka masing-masing.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTetapkanHasil}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ya, Tetapkan Hasil
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
