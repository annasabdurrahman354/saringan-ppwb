import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Periode } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Calendar, CheckCircle, Circle, AlertTriangle } from 'lucide-react';

export const AdminPeriodePage = () => {
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPeriode, setEditingPeriode] = useState<Periode | null>(null);
  const [deletingPeriode, setDeletingPeriode] = useState<Periode | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id: '',
    aktif: false,
  });

  useEffect(() => {
    fetchPeriode();
  }, []);

  const fetchPeriode = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saringan_periode')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setPeriodeList(data || []);
    } catch (error) {
      console.error('Error fetching periode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (periode?: Periode) => {
    if (periode) {
      setEditingPeriode(periode);
      setFormData({
        id: periode.id,
        aktif: periode.aktif,
      });
    } else {
      setEditingPeriode(null);
      setFormData({
        id: '',
        aktif: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPeriode) {
        const { error } = await supabase
          .from('saringan_periode')
          .update({
            aktif: formData.aktif,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPeriode.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Periode berhasil diupdate' });
      } else {
        const { error } = await supabase
          .from('saringan_periode')
          .insert({
            id: formData.id,
            aktif: formData.aktif,
          });

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'Periode berhasil ditambahkan' });
      }

      setDialogOpen(false);
      fetchPeriode();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingPeriode) return;

    try {
      const { error } = await supabase
        .from('saringan_periode')
        .delete()
        .eq('id', deletingPeriode.id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Periode berhasil dihapus' });
      setDeleteDialogOpen(false);
      fetchPeriode();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="text-gray-600">Memuat data periode...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Periode</h1>
          <p className="text-gray-600 mt-1">Kelola periode saringan dan status aktif</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-green-700 hover:bg-green-800 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Periode
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Periode</p>
                <p className="text-2xl font-bold text-blue-900">{periodeList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-700 font-medium">Periode Aktif</p>
                <p className="text-2xl font-bold text-green-900">
                  {periodeList.filter(p => p.aktif).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Circle className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-700 font-medium">Tidak Aktif</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periodeList.filter(p => !p.aktif).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periode Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {periodeList.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-2">Tidak ada data periode</p>
            <p className="text-gray-400 text-sm">Tambahkan periode baru untuk memulai</p>
          </div>
        ) : (
          periodeList.map((periode) => (
            <Card key={periode.id} className={`hover:shadow-md transition-shadow ${
              periode.aktif ? 'ring-2 ring-green-200 bg-green-50/50' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      periode.aktif ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`h-5 w-5 ${
                        periode.aktif ? 'text-green-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        Periode {periode.id}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Dibuat: {new Date(periode.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={periode.aktif ? 'default' : 'secondary'}
                    className={periode.aktif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {periode.aktif ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {periode.aktif && (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Periode sedang berjalan</span>
                      </>
                    )}
                    {!periode.aktif && (
                      <>
                        <Circle className="h-4 w-4 text-gray-400" />
                        <span>Periode tidak aktif</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(periode)}
                      className="flex items-center gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingPeriode(periode);
                        setDeleteDialogOpen(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Hapus</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              {editingPeriode ? 'Edit Periode' : 'Tambah Periode Baru'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {editingPeriode
                  ? 'Perubahan status aktif akan mempengaruhi sistem penilaian.'
                  : 'Format ID periode: Ym (contoh: 202501 untuk Januari 2025)'
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id" className="text-sm font-medium text-gray-700">
                  ID Periode
                </Label>
                <Input
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={!!editingPeriode}
                  placeholder="202501"
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Format: Ym (contoh: 202501 untuk Januari 2025)
                </p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${formData.aktif ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {formData.aktif ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="aktif" className="text-sm font-medium text-gray-900">
                      Status Aktif
                    </Label>
                    <p className="text-xs text-gray-600">
                      {formData.aktif ? 'Periode ini sedang digunakan' : 'Periode ini tidak aktif'}
                    </p>
                  </div>
                </div>
                <Switch
                  id="aktif"
                  checked={formData.aktif}
                  onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-700 hover:bg-green-800 w-full sm:w-auto"
            >
              {editingPeriode ? 'Simpan Perubahan' : 'Tambah Periode'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">Konfirmasi Hapus</AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  Apakah Anda yakin ingin menghapus periode <strong>{deletingPeriode?.id}</strong>?
                  <br />
                  <span className="text-red-600 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Periode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
