import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Peserta } from '@/types/database.types';
import { calculateAge } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export const DaftarPesertaPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const action = searchParams.get('action') || 'detail';
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<'all' | 'L' | 'P'>('all');

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

  const filteredPeserta = pesertaList.filter((p) =>
    genderFilter === 'all' ? true : p.jenis_kelamin === genderFilter
  );

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {action !== 'detail' && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={genderFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setGenderFilter('all')}
            className={genderFilter === 'all' ? 'bg-green-700' : ''}
          >
            Semua
          </Button>
          <Button
            variant={genderFilter === 'L' ? 'default' : 'outline'}
            onClick={() => setGenderFilter('L')}
            className={genderFilter === 'L' ? 'bg-green-700' : ''}
          >
            Laki-laki
          </Button>
          <Button
            variant={genderFilter === 'P' ? 'default' : 'outline'}
            onClick={() => setGenderFilter('P')}
            className={genderFilter === 'P' ? 'bg-green-700' : ''}
          >
            Perempuan
          </Button>
        </div>
      </div>

      {filteredPeserta.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Tidak ada data peserta</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeserta.map((peserta) => (
            <Card
              key={peserta.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(peserta)}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {peserta.foto ? (
                    <img
                      src={peserta.foto}
                      alt={peserta.nama}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">
                        {peserta.nama.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {peserta.nama}
                    </h3>
                    <Badge variant={peserta.jenis_kelamin === 'L' ? 'default' : 'secondary'}>
                      {peserta.jenis_kelamin}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Usia: {calculateAge(peserta.tanggal_lahir)} tahun
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {peserta.daerah_sambung || '-'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
