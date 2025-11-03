import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Peserta } from '@/types/database.types';
import { calculateAge, getKelasLabel, getKelasBadgeClass } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, User, MapPin, Calendar, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export const DaftarPesertaPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const action = searchParams.get('action') || 'detail';
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<'all' | 'L' | 'P'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPeserta();
  }, []);

  const fetchPeserta = async () => {
    try {
      setLoading(true);
      const { data: periodeData } = await supabase
        .from('saringan_periode')
        .select('id')
        .eq('aktif', true)
        .maybeSingle();

      if (!periodeData) {
        setPesertaList([]);
        return;
      }

      const { data, error } = await supabase
        .from('saringan_peserta')
        .select('*')
        .eq('periode_id', periodeData.id)
        .order('nama', { ascending: true });

      if (error) throw error;
      setPesertaList(data || []);
    } catch (error) {
      console.error('Error fetching peserta:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeserta = pesertaList.filter((p) => {
    const matchesGender = genderFilter === 'all' ? true : p.jenis_kelamin === genderFilter;
    const matchesSearch = searchTerm === '' ||
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nispn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.daerah_sambung && p.daerah_sambung.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesGender && matchesSearch;
  });

  const handleCardClick = (peserta: Peserta) => {
    if (action === 'detail') {
      navigate(`/guru/detail/${peserta.id}`);
    } else if (action === 'nilai-penyampaian') {
      navigate(`/guru/nilai-penyampaian/${peserta.id}`);
    } else if (action === 'nilai-bacaan') {
      navigate(`/guru/nilai-bacaan/${peserta.id}`);
    }
  };

  const getTitle = () => {
    if (action === 'nilai-penyampaian') return 'Pilih Peserta - Nilai Penyampaian';
    if (action === 'nilai-bacaan') return 'Pilih Peserta - Nilai Bacaan';
    return 'Daftar Peserta';
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
        <div className="flex items-center gap-4">
          {(action !== 'detail' && action !== 'nilai-bacaan' && action !== 'nilai-penyampaian') && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
            <p className="text-gray-600 mt-1">
              {filteredPeserta.length} dari {pesertaList.length} peserta
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama, NISPN, atau daerah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter</span>
            </div>
            <Button
              variant={genderFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenderFilter('all')}
              className={genderFilter === 'all' ? 'bg-green-700' : ''}
            >
              Semua ({pesertaList.length})
            </Button>
            <Button
              variant={genderFilter === 'L' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenderFilter('L')}
              className={genderFilter === 'L' ? 'bg-green-700' : ''}
            >
              Laki-laki ({pesertaList.filter(p => p.jenis_kelamin === 'L').length})
            </Button>
            <Button
              variant={genderFilter === 'P' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGenderFilter('P')}
              className={genderFilter === 'P' ? 'bg-green-700' : ''}
            >
              Perempuan ({pesertaList.filter(p => p.jenis_kelamin === 'P').length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Section */}
      {filteredPeserta.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {searchTerm || genderFilter !== 'all' ? 'Tidak ada hasil pencarian' : 'Tidak ada data peserta'}
          </p>
          <p className="text-gray-400 text-sm">
            {searchTerm || genderFilter !== 'all'
              ? 'Coba ubah kata kunci atau filter pencarian'
              : 'Belum ada peserta yang terdaftar di periode aktif'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeserta.map((peserta) => (
            <Card
              key={peserta.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-green-500 hover:border-l-green-600"
              onClick={() => handleCardClick(peserta)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={peserta.foto || undefined} alt={peserta.nama} />
                    <AvatarFallback className="bg-green-100 text-green-800 font-semibold">
                      {peserta.nama.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {peserta.nama}
                      </h3>
                      <Badge
                        variant={peserta.jenis_kelamin === 'L' ? 'default' : 'secondary'}
                        className={peserta.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}
                      >
                        {peserta.jenis_kelamin}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">{peserta.nispn}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Usia: {calculateAge(peserta.tanggal_lahir)} tahun</span>
                  </div>
                  {peserta.daerah_sambung && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{peserta.daerah_sambung}</span>
                    </div>
                  )}
                  {peserta.pendidikan && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {peserta.pendidikan}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getKelasBadgeClass(peserta.kelas)}`}>
                      {getKelasLabel(peserta.kelas)}
                    </span>
                  </div>
                </div>

                {/* Action Indicator */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Klik untuk {action === 'detail' ? 'lihat detail' : action === 'nilai-penyampaian' ? 'nilai penyampaian' : 'nilai bacaan'}</span>
                    <span>→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
