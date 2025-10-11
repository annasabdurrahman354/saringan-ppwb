import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Periode } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kelola Periode</h1>
        <Button onClick={() => handleOpenDialog()} className="bg-green-700 hover:bg-green-800">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Periode
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Periode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodeList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  Tidak ada data periode
                </TableCell>
              </TableRow>
            ) : (
              periodeList.map((periode) => (
                <TableRow key={periode.id}>
                  <TableCell className="font-medium">{periode.id}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${periode.aktif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {periode.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(periode)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeletingPeriode(periode);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPeriode ? 'Edit Periode' : 'Tambah Periode'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID Periode (Format: Ym, contoh: 202501)</Label>
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                disabled={!!editingPeriode}
                placeholder="202501"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="aktif"
                checked={formData.aktif}
                onCheckedChange={(checked) => setFormData({ ...formData, aktif: checked })}
              />
              <Label htmlFor="aktif">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-green-700 hover:bg-green-800">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus periode {deletingPeriode?.id}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
