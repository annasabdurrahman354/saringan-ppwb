import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Peserta, NilaiBacaan, NilaiPenyampaian, User } from '@/types/database.types';
import { PesertaPrintCard, PrintStyles } from '@/components/print/PesertaPrintCard';

interface NilaiBacaanWithGuru extends NilaiBacaan {
    guru: User;
}

interface NilaiPenyampaianWithGuru extends NilaiPenyampaian {
    guru: User;
}

export const PrintHasilPage = () => {
    const { pesertaId } = useParams();
    const [peserta, setPeserta] = useState<Peserta | null>(null);
    const [nilaiBacaan, setNilaiBacaan] = useState<NilaiBacaanWithGuru[]>([]);
    const [nilaiPenyampaian, setNilaiPenyampaian] = useState<NilaiPenyampaianWithGuru[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [pesertaId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch peserta data
            const { data: pesertaData, error: pesertaError } = await supabase
                .from('saringan_peserta')
                .select('*')
                .eq('id', pesertaId)
                .single();

            if (pesertaError) throw pesertaError;
            setPeserta(pesertaData);

            // Fetch all nilai_penyampaian for this peserta
            const { data: penyampaianData, error: penyampaianError } = await supabase
                .from('saringan_nilai_penyampaian')
                .select('*, guru:saringan_user!saringan_nilai_penyampaian_guru_id_fkey(*)')
                .eq('peserta_id', pesertaId)
                .order('created_at', { ascending: false });

            if (penyampaianError) throw penyampaianError;

            // Get latest nilai_penyampaian per guru
            const latestPenyampaian: NilaiPenyampaianWithGuru[] = [];
            const seenGuruIds = new Set<string>();

            (penyampaianData as any[]).forEach((nilai) => {
                if (!seenGuruIds.has(nilai.guru_id)) {
                    seenGuruIds.add(nilai.guru_id);
                    latestPenyampaian.push(nilai);
                }
            });

            setNilaiPenyampaian(latestPenyampaian);

            // Fetch all nilai_bacaan for this peserta
            const { data: bacaanData, error: bacaanError } = await supabase
                .from('saringan_nilai_bacaan')
                .select('*, guru:saringan_user!saringan_nilai_bacaan_guru_id_fkey(*)')
                .eq('peserta_id', pesertaId)
                .order('created_at', { ascending: false });

            if (bacaanError) throw bacaanError;

            // Get latest nilai_bacaan per guru
            const latestBacaan: NilaiBacaanWithGuru[] = [];
            const seenBacaanGuruIds = new Set<string>();

            (bacaanData as any[]).forEach((nilai) => {
                if (!seenBacaanGuruIds.has(nilai.guru_id)) {
                    seenBacaanGuruIds.add(nilai.guru_id);
                    latestBacaan.push(nilai);
                }
            });

            setNilaiBacaan(latestBacaan);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && peserta) {
            // Auto-trigger print dialog after data is loaded
            window.print();
        }
    }, [loading, peserta]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Memuat data...</p>
            </div>
        );
    }

    if (!peserta) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Peserta tidak ditemukan</p>
            </div>
        );
    }

    return (
        <>
            <PrintStyles />
            <PesertaPrintCard
                peserta={peserta}
                nilaiBacaan={nilaiBacaan}
                nilaiPenyampaian={nilaiPenyampaian}
            />
        </>
    );
};
