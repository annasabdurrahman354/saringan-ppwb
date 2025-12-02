import { Peserta, NilaiBacaan, NilaiPenyampaian, User } from '@/types/database.types';
import { getHasilLabel } from '@/lib/helpers';

interface NilaiBacaanWithGuru extends NilaiBacaan {
    guru: User;
}

interface NilaiPenyampaianWithGuru extends NilaiPenyampaian {
    guru: User;
}

interface PesertaPrintCardProps {
    peserta: Peserta;
    nilaiBacaan: NilaiBacaanWithGuru[];
    nilaiPenyampaian: NilaiPenyampaianWithGuru[];
}

const parseKekuranganArray = (jsonString: string | string[] | null | undefined): string[] => {
    if (!jsonString) return [];
    if (Array.isArray(jsonString)) return jsonString;
    try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const calculateAverage = (nilai: NilaiPenyampaian) => {
    return (
        (nilai.nilai_makna + nilai.nilai_keterangan + nilai.nilai_penjelasan + nilai.nilai_pemahaman) / 4
    );
};

export const PesertaPrintCard = ({ peserta, nilaiBacaan, nilaiPenyampaian }: PesertaPrintCardProps) => {
    return (
        <div className="page">
            {/* PHOTO + IDENTITY SIDE BY SIDE */}
            <div className="identity-section">
                <div className="photo-section">
                    {peserta.foto ? (
                        <img src={peserta.foto} alt={peserta.nama} />
                    ) : (
                        <span style={{ color: '#999' }}>Tidak Ada Foto</span>
                    )}
                </div>

                <div className="identity-info">
                    <table className="auto-width two-column">
                        <tbody>
                            <tr>
                                <td><strong>Nama Lengkap</strong></td>
                                <td>{peserta.nama || '-'}</td>
                                <td><strong>Jenis Kelamin</strong></td>
                                <td>{peserta.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                            </tr>
                            <tr>
                                <td><strong>NISPN</strong></td>
                                <td>{peserta.nispn || '-'}</td>
                                <td><strong>Nama Ayah</strong></td>
                                <td>{peserta.nama_ayah || '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Daerah Sambung</strong></td>
                                <td>{peserta.daerah_sambung || '-'}</td>
                                <td><strong>Status Mondok</strong></td>
                                <td>{peserta.status_mondok || '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Pendidikan</strong></td>
                                <td colSpan={3}>{peserta.pendidikan || '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <h2>Status Tes</h2>
            <table className="auto-width">
                <tbody>
                    <tr>
                        <td><strong>Status Tes</strong></td>
                        <td>{peserta.status_tes ? peserta.status_tes.toUpperCase() : '-'}</td>
                    </tr>
                    <tr>
                        <td><strong>Hasil Tes Penyampaian</strong></td>
                        <td>{getHasilLabel(peserta.hasil_tes_penyampaian)}</td>
                    </tr>
                    <tr>
                        <td><strong>Hasil Tes Bacaan</strong></td>
                        <td>{getHasilLabel(peserta.hasil_tes_bacaan)}</td>
                    </tr>
                </tbody>
            </table>

            <h2>Nilai Penyampaian</h2>
            {nilaiPenyampaian.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Guru</th>
                            <th>Materi</th>
                            <th>Makna</th>
                            <th>Keterangan</th>
                            <th>Penjelasan</th>
                            <th>Pemahaman</th>
                            <th>Rata-rata</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nilaiPenyampaian.map((nilai) => {
                            const avg = calculateAverage(nilai);
                            const status = avg >= 70 ? 'LULUS' : 'TIDAK LULUS';
                            return (
                                <tr key={nilai.id}>
                                    <td className="no-wrap-column">{nilai.guru.nama || '-'}</td>
                                    <td>{nilai.materi || '-'}</td>
                                    <td>{nilai.nilai_makna}</td>
                                    <td>{nilai.nilai_keterangan}</td>
                                    <td>{nilai.nilai_penjelasan}</td>
                                    <td>{nilai.nilai_pemahaman}</td>
                                    <td><strong>{avg.toFixed(2)}</strong></td>
                                    <td className="no-wrap-column"><strong>{status}</strong></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p style={{ color: '#777' }}>Tidak ada data penilaian penyampaian.</p>
            )}

            <h2>Nilai Bacaan</h2>
            {nilaiBacaan.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Guru</th>
                            <th>Materi</th>
                            <th>Nilai</th>
                            <th>Kekurangan</th>
                            <th>Catatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nilaiBacaan.map((nilai) => {
                            const allKekurangan = [
                                ...parseKekuranganArray(nilai.kekurangan_tajwid),
                                ...parseKekuranganArray(nilai.kekurangan_khusus),
                                ...parseKekuranganArray(nilai.kekurangan_keserasian),
                                ...parseKekuranganArray(nilai.kekurangan_kelancaran),
                            ];

                            return (
                                <tr key={nilai.id}>
                                    <td className="no-wrap-column">{nilai.guru.nama || '-'}</td>
                                    <td>{nilai.materi || '-'}</td>
                                    <td className="no-wrap-column">
                                        <strong>{nilai.nilai === 'lulus' ? 'LULUS' : 'TIDAK LULUS'}</strong>
                                    </td>
                                    <td>
                                        {allKekurangan.length > 0 ? allKekurangan.join(', ') : '-'}
                                    </td>
                                    <td>{nilai.catatan || '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p style={{ color: '#777' }}>Tidak ada data penilaian bacaan.</p>
            )}
        </div>
    );
};

export const PrintStyles = () => (
    <style>{`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Times New Roman', Times, serif;
      background: #fff;
      color: #000;
      font-size: 14px;
      line-height: 1.4;
      padding: 15px;
    }

    .page {
      max-width: 100%;
      margin: 0 auto;
    }
    .page:not(:last-child) {
      page-break-after: always;
    }

    .header p {
      font-size: 13px;
      color: #555;
      text-align: center;
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    td, th {
      padding: 4px 6px;
      vertical-align: top;
      border: 1px solid #000;
    }
    th {
      text-align: left;
      background: #f5f5f5;
    }

    h2 {
      margin: 18px 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
    }

    .identity-section {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 18px;
    }

    .photo-section {
      flex-shrink: 0;
      text-align: center;
    }
    .photo-section img {
      height: 160px;
      object-fit: cover;
      border: 1px solid #aaa;
      border-radius: 4px;
    }

    .identity-info {
      flex: 1;
    }

    .no-wrap-column {
      white-space: nowrap;
    }

    table.auto-width {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }

    table.auto-width td:first-child {
      width: 1%;
      white-space: nowrap;
      background: #f5f5f5;
    }

    table.two-column td:nth-child(odd) {
      width: 15%;
      white-space: nowrap;
      background: #f5f5f5;
    }

    table.two-column td:nth-child(even) {
      width: 35%;
    }

    @media print {
      body { margin: 0; padding: 10px; }
      .no-print { display: none; }
    }
  `}</style>
);
