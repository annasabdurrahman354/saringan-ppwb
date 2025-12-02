import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Peserta, NilaiBacaan, NilaiPenyampaian, User } from '@/types/database.types';
import { PesertaPrintCard, PrintStyles } from '@/components/print/PesertaPrintCard';
import { getHasilLabel } from '@/lib/helpers';

interface NilaiBacaanWithGuru extends NilaiBacaan {
    guru: User;
}

interface NilaiPenyampaianWithGuru extends NilaiPenyampaian {
    guru: User;
}

interface PesertaWithNilai extends Peserta {
    nilaiBacaan: NilaiBacaanWithGuru[];
    nilaiPenyampaian: NilaiPenyampaianWithGuru[];
}

export const PrintHasilSemuaPage = () => {
    const { periodeId } = useParams();
    const [pesertaList, setPesertaList] = useState<PesertaWithNilai[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [periodeId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all peserta for this periode
            const { data: pesertaData, error: pesertaError } = await supabase
                .from('saringan_peserta')
                .select('*')
                .eq('periode_id', periodeId);

            if (pesertaError) throw pesertaError;

            // Fetch nilai for each peserta
            const pesertaWithNilai: PesertaWithNilai[] = [];

            for (const peserta of pesertaData || []) {
                // Fetch nilai_penyampaian
                const { data: penyampaianData } = await supabase
                    .from('saringan_nilai_penyampaian')
                    .select('*, guru:saringan_user!saringan_nilai_penyampaian_guru_id_fkey(*)')
                    .eq('peserta_id', peserta.id)
                    .order('created_at', { ascending: false });

                // Get latest per guru
                const latestPenyampaian: NilaiPenyampaianWithGuru[] = [];
                const seenGuruIds = new Set<string>();

                (penyampaianData as any[] || []).forEach((nilai) => {
                    if (!seenGuruIds.has(nilai.guru_id)) {
                        seenGuruIds.add(nilai.guru_id);
                        latestPenyampaian.push(nilai);
                    }
                });

                // Fetch nilai_bacaan
                const { data: bacaanData } = await supabase
                    .from('saringan_nilai_bacaan')
                    .select('*, guru:saringan_user!saringan_nilai_bacaan_guru_id_fkey(*)')
                    .eq('peserta_id', peserta.id)
                    .order('created_at', { ascending: false });

                // Get latest per guru
                const latestBacaan: NilaiBacaanWithGuru[] = [];
                const seenBacaanGuruIds = new Set<string>();

                (bacaanData as any[] || []).forEach((nilai) => {
                    if (!seenBacaanGuruIds.has(nilai.guru_id)) {
                        seenBacaanGuruIds.add(nilai.guru_id);
                        latestBacaan.push(nilai);
                    }
                });

                pesertaWithNilai.push({
                    ...peserta,
                    nilaiBacaan: latestBacaan,
                    nilaiPenyampaian: latestPenyampaian,
                });
            }

            // Sort by gender (L first) then by name
            pesertaWithNilai.sort((a, b) => {
                if (a.jenis_kelamin !== b.jenis_kelamin) {
                    return a.jenis_kelamin === 'L' ? -1 : 1;
                }
                return a.nama.localeCompare(b.nama);
            });

            setPesertaList(pesertaWithNilai);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && pesertaList.length > 0) {
            // Auto-trigger print dialog after data is loaded
            window.print();
        }
    }, [loading, pesertaList]);

    const formatPeriodeName = (periodeId: string) => {
        // Format: "2024-01" -> "Januari 2024"
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        const [year, month] = periodeId.split('-');
        const monthIndex = parseInt(month) - 1;
        return `${months[monthIndex]} ${year}`;
    };

    const calculateStats = () => {
        const total = pesertaList.length;

        // Status Tes stats
        const statusLulus = pesertaList.filter(p => p.status_tes === 'lulus').length;
        const statusTidakLulus = pesertaList.filter(p => p.status_tes === 'tidak_lulus').length;
        const statusAktif = pesertaList.filter(p => p.status_tes === 'aktif').length;

        // Hasil Tes Bacaan stats
        const bacaanLulus = pesertaList.filter(p => p.hasil_tes_bacaan === 'lulus').length;
        const bacaanTidakLulus = pesertaList.filter(p => p.hasil_tes_bacaan === 'tidak_lulus').length;
        const bacaanPerluMusyawarah = pesertaList.filter(p => p.hasil_tes_bacaan === 'perlu_musyawarah').length;
        const bacaanBelum = pesertaList.filter(p => p.hasil_tes_bacaan === 'belum_pengetesan').length;

        // Hasil Tes Penyampaian stats
        const penyampaianLulus = pesertaList.filter(p => p.hasil_tes_penyampaian === 'lulus').length;
        const penyampaianTidakLulus = pesertaList.filter(p => p.hasil_tes_penyampaian === 'tidak_lulus').length;
        const penyampaianBelum = pesertaList.filter(p => p.hasil_tes_penyampaian === 'belum_pengetesan').length;

        return {
            total,
            statusLulus,
            statusTidakLulus,
            statusAktif,
            bacaanLulus,
            bacaanTidakLulus,
            bacaanPerluMusyawarah,
            bacaanBelum,
            penyampaianLulus,
            penyampaianTidakLulus,
            penyampaianBelum,
        };
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Memuat data semua peserta...</p>
            </div>
        );
    }

    if (pesertaList.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Tidak ada peserta ditemukan</p>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <>
            <PrintStyles />

            {/* Individual peserta cards */}
            {pesertaList.map((peserta) => (
                <PesertaPrintCard
                    key={peserta.id}
                    peserta={peserta}
                    nilaiBacaan={peserta.nilaiBacaan}
                    nilaiPenyampaian={peserta.nilaiPenyampaian}
                />
            ))}

            {/* Summary page */}
            <div className="page">
                <h1 style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '20px' }}>
                    Rekap Pengetesan Periode {formatPeriodeName(periodeId || '')}
                </h1>

                <h2>Statistik Keseluruhan</h2>
                <table className="auto-width">
                    <tbody>
                        <tr>
                            <td><strong>Total Peserta</strong></td>
                            <td>{stats.total}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>Status Tes</h2>
                <table className="auto-width">
                    <tbody>
                        <tr>
                            <td><strong>Lulus</strong></td>
                            <td>{stats.statusLulus}</td>
                        </tr>
                        <tr>
                            <td><strong>Tidak Lulus</strong></td>
                            <td>{stats.statusTidakLulus}</td>
                        </tr>
                        <tr>
                            <td><strong>Aktif</strong></td>
                            <td>{stats.statusAktif}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>Hasil Tes Bacaan</h2>
                <table className="auto-width">
                    <tbody>
                        <tr>
                            <td><strong>Lulus</strong></td>
                            <td>{stats.bacaanLulus}</td>
                        </tr>
                        <tr>
                            <td><strong>Tidak Lulus</strong></td>
                            <td>{stats.bacaanTidakLulus}</td>
                        </tr>
                        <tr>
                            <td><strong>Perlu Musyawarah</strong></td>
                            <td>{stats.bacaanPerluMusyawarah}</td>
                        </tr>
                        <tr>
                            <td><strong>Belum Pengetesan</strong></td>
                            <td>{stats.bacaanBelum}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>Hasil Tes Penyampaian</h2>
                <table className="auto-width">
                    <tbody>
                        <tr>
                            <td><strong>Lulus</strong></td>
                            <td>{stats.penyampaianLulus}</td>
                        </tr>
                        <tr>
                            <td><strong>Tidak Lulus</strong></td>
                            <td>{stats.penyampaianTidakLulus}</td>
                        </tr>
                        <tr>
                            <td><strong>Belum Pengetesan</strong></td>
                            <td>{stats.penyampaianBelum}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>Daftar Peserta</h2>
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama</th>
                            <th>L/K</th>
                            <th>Status Mondok</th>
                            <th>Hasil Bacaan</th>
                            <th>Hasil Penyampaian</th>
                            <th>Hasil Tes</th>
                            <th>Status Tes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pesertaList.map((peserta, index) => (
                            <tr key={peserta.id}>
                                <td>{index + 1}</td>
                                <td>{peserta.nama}</td>
                                <td>{peserta.jenis_kelamin}</td>
                                <td>{peserta.status_mondok || '-'}</td>
                                <td>{getHasilLabel(peserta.hasil_tes_bacaan)}</td>
                                <td>{getHasilLabel(peserta.hasil_tes_penyampaian)}</td>
                                <td>{getHasilLabel(peserta.hasil_tes)}</td>
                                <td>{peserta.status_tes?.toUpperCase() || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};
