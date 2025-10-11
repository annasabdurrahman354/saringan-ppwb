import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export const AdminUserPage = () => {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'guru' | 'admin'>('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nama: '',
    role: 'guru' as 'guru' | 'admin',
    username: '',
    password: '',
    aktif: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saringan_user')
        .select('*')
        .order('nama', { ascending: true });

      if (error) throw error;
      setUserList(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nama: user.nama,
        role: user.role,
        username: user.username,
        password: '',
        aktif: user.aktif,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nama: '',
        role: 'guru',
        username: '',
        password: '',
        aktif: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        const updateData: any = {
          nama: formData.nama,
          role: formData.role,
          aktif: formData.aktif,
          updated_at: new Date().toISOString(),
        };

        if (formData.password) {
          if (editingUser.auth_id) {
            const { error: authError } = await supabase.auth.admin.updateUserById(
              editingUser.auth_id,
              { password: formData.password }
            );
            if (authError) throw authError;
          }
        }

        const { error } = await supabase
          .from('saringan_user')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast({ title: 'Berhasil', description: 'User berhasil diupdate' });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: `${formData.username}@saringan.ppwb.my.id`,
          password: formData.password,
          options: {
            data: {
              username: formData.username,
            },
          },
        });

        if (authError) throw authError;

        const { error: userError } = await supabase
          .from('saringan_user')
          .insert({
            nama: formData.nama,
            role: formData.role,
            username: formData.username,
            aktif: formData.aktif,
            auth_id: authData.user?.id,
          });

        if (userError) throw userError;
        toast({ title: 'Berhasil', description: 'User berhasil ditambahkan' });
      }

      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const { error } = await supabase
        .from('saringan_user')
        .delete()
        .eq('id', deletingUser.id);

      if (error) throw error;
      toast({ title: 'Berhasil', description: 'User berhasil dihapus' });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = userList.filter((u) => {
    const matchesSearch = u.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
        <Button onClick={() => handleOpenDialog()} className="bg-green-700 hover:bg-green-800">
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('all')}
              className={roleFilter === 'all' ? 'bg-green-700' : ''}
            >
              Semua
            </Button>
            <Button
              variant={roleFilter === 'guru' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('guru')}
              className={roleFilter === 'guru' ? 'bg-green-700' : ''}
            >
              Guru
            </Button>
            <Button
              variant={roleFilter === 'admin' ? 'default' : 'outline'}
              onClick={() => setRoleFilter('admin')}
              className={roleFilter === 'admin' ? 'bg-green-700' : ''}
            >
              Admin
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  Tidak ada data user
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nama}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${
                      user.aktif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.aktif ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeletingUser(user);
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
            <DialogTitle>{editingUser ? 'Edit User' : 'Tambah User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {editingUser && '(kosongkan jika tidak diubah)'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as 'guru' | 'admin' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guru">Guru</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
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
              Apakah Anda yakin ingin menghapus user {deletingUser?.nama}? Tindakan ini tidak dapat dibatalkan.
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
