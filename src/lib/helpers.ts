export const calculateAge = (tanggalLahir: string | null): number => {
  if (!tanggalLahir) return 0;
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const formatDate = (date: string | null): string => {
  if (!date) return '-';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getHasilLabel = (hasil: string): string => {
  const labels: Record<string, string> = {
    'lulus': 'Lulus',
    'tidak_lulus': 'Tidak Lulus',
    'perlu_musyawarah': 'Perlu Musyawarah',
    'belum_pengetesan': 'Belum Pengetesan',
    'belum_pengetesan_bacaan': 'Belum Pengetesan Bacaan',
    'belum_pengetesan_penyampaian': 'Belum Pengetesan Penyampaian',
  };
  return labels[hasil] || hasil;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'lulus': 'bg-green-100 text-green-800',
    'tidak_lulus': 'bg-red-100 text-red-800',
    'perlu_musyawarah': 'bg-yellow-100 text-yellow-800',
    'belum_pengetesan': 'bg-gray-100 text-gray-800',
    'belum_pengetesan_bacaan': 'bg-gray-100 text-gray-800',
    'belum_pengetesan_penyampaian': 'bg-gray-100 text-gray-800',
    'aktif': 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};
