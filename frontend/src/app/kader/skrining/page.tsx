'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Alert,
  Modal,
  Toast,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import {
  Stethoscope,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  Calendar,
  GraduationCap,
  Eye,
  Heart,
  Droplet,
  FileText,
} from 'lucide-react';
import { Student, School, ClassRoom, Screening, ScreeningType } from '@/types/models';
import { fetchScreenings, createScreening } from '@/lib/api/screenings';
import { fetchStudents } from '@/lib/api/students';
import { fetchSchools } from '@/lib/api/schools';
import { fetchClasses } from '@/lib/api/classes';
import { formatHbResult, formatBloodPressureResult } from '@/lib/adapters/screeningAdapter';
import { adaptStudentForUI, filterValidClasses } from '@/lib/adapters/schoolAdapter';
import { formatDateIndo, getTodayDateString } from '@/lib/utils/date';
import { useSession } from '@/context/SessionContext';

export default function SkriningPage() {
  const { user } = useSession();

  // Data states
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);

  // Form states
  const [formStudentId, setFormStudentId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formType, setFormType] = useState<ScreeningType>('Anemia');
  const [formHbValue, setFormHbValue] = useState('');
  const [formSystolic, setFormSystolic] = useState('');
  const [formDiastolic, setFormDiastolic] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formValidation, setFormValidation] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Initial Load & Synchronization Function
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [screeningsRes, studentsRes, schoolsRes, classesRes] = await Promise.all([
          fetchScreenings(),
          fetchStudents(),
          fetchSchools(),
          fetchClasses(),
        ]);

        if (!ignore) {
          if (screeningsRes.success) {
            setScreenings(screeningsRes.data || []);
          } else {
            setFetchError(screeningsRes.message || 'Gagal memuat data skrining');
          }

          if (studentsRes.success) setStudents(studentsRes.data || []);
          if (schoolsRes.success) setSchools(schoolsRes.data || []);
          if (classesRes.success) setClasses(filterValidClasses(classesRes.data || []));

          setLastUpdated(new Date());
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
          setFetchError(msg);
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Manual Refresh Function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setFetchError(null);

    try {
      const [screeningsRes, studentsRes, schoolsRes, classesRes] = await Promise.all([
        fetchScreenings(),
        fetchStudents(),
        fetchSchools(),
        fetchClasses(),
      ]);

      if (screeningsRes.success) {
        setScreenings(screeningsRes.data || []);
      } else {
        setFetchError(screeningsRes.message || 'Gagal memuat data skrining');
      }

      if (studentsRes.success) setStudents(studentsRes.data || []);
      if (schoolsRes.success) setSchools(schoolsRes.data || []);
      if (classesRes.success) setClasses(filterValidClasses(classesRes.data || []));

      setLastUpdated(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setFetchError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 3. Open Modal Handler with Reset
  const handleOpenAddModal = () => {
    const defaultStudent = students.find(s => s.status === 'active') || students[0];
    const defaultStudentId = defaultStudent ? defaultStudent.id : '';
    const defaultClassId = defaultStudent ? defaultStudent.class_id : (classes[0]?.id || 'CLS001');

    setFormStudentId(defaultStudentId);
    setFormClassId(defaultClassId);
    setFormDate(getTodayDateString());
    setFormType('Anemia');
    setFormHbValue('');
    setFormSystolic('');
    setFormDiastolic('');
    setFormNotes('');
    setFormValidation({});
    setIsAddModalOpen(true);
  };

  // 4. Handle Student Selection in Form (Auto-adjust class)
  const handleStudentSelectChange = (studentId: string) => {
    setFormStudentId(studentId);
    const selected = students.find(s => s.id === studentId);
    if (selected && selected.class_id) {
      setFormClassId(selected.class_id);
    }
  };

  // 5. Live Calculation & Category Previews
  const liveHbCategory = useMemo(() => {
    if (formType !== 'Anemia') return null;
    const hb = parseFloat(formHbValue);
    if (isNaN(hb) || hb <= 0) return null;

    if (hb >= 12.0) return { label: 'Normal (Tidak Anemia)', variant: 'success' as const };
    if (hb >= 11.0) return { label: 'Anemia Ringan', variant: 'warning' as const };
    if (hb >= 8.0) return { label: 'Anemia Sedang', variant: 'danger' as const };
    return { label: 'Anemia Berat', variant: 'danger' as const };
  }, [formType, formHbValue]);

  const liveBpCategory = useMemo(() => {
    if (formType !== 'Tekanan Darah') return null;
    const sys = parseInt(formSystolic, 10);
    const dia = parseInt(formDiastolic, 10);
    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) return null;

    if (sys < 120 && dia < 80) return { label: 'Optimal / Normal', variant: 'success' as const };
    if (sys <= 139 || dia <= 89) return { label: 'Pre-Hipertensi', variant: 'warning' as const };
    return { label: 'Hipertensi', variant: 'danger' as const };
  }, [formType, formSystolic, formDiastolic]);

  // 6. Submit Form Handler
  const handleSubmitScreening = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    if (!formStudentId) errors.student_id = 'Pilih siswa.';
    if (!formClassId) errors.class_id = 'Pilih kelas.';
    if (!formDate) errors.screening_date = 'Pilih tanggal skrining.';

    let resultString = '';

    if (formType === 'Anemia') {
      const hb = parseFloat(formHbValue);
      if (isNaN(hb) || hb <= 0 || hb > 25) {
        errors.hb_value = 'Kadar Hb harus berupa angka valid (misal: 12.5 g/dL).';
      } else {
        const cat = liveHbCategory ? liveHbCategory.label.split(' ')[0] : undefined;
        resultString = formatHbResult(hb, cat);
      }
    } else if (formType === 'Tekanan Darah') {
      const sys = parseInt(formSystolic, 10);
      const dia = parseInt(formDiastolic, 10);
      if (isNaN(sys) || sys <= 50 || sys > 250) {
        errors.systolic = 'Sistolik tidak valid (misal: 110).';
      }
      if (isNaN(dia) || dia <= 30 || dia > 150) {
        errors.diastolic = 'Diastolik tidak valid (misal: 70).';
      }
      if (!errors.systolic && !errors.diastolic) {
        const cat = liveBpCategory ? liveBpCategory.label : undefined;
        resultString = formatBloodPressureResult(sys, dia, cat);
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormValidation(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        student_id: formStudentId,
        class_id: formClassId,
        screening_date: formDate,
        screening_type: formType,
        result: resultString,
        examiner_id: user?.id || 'USR001',
        notes: formNotes.trim() || '-',
        user_id: user?.id || 'USR001',
      };

      const res = await createScreening(payload);

      if (res.success && res.data) {
        const studentObj = students.find(s => s.id === formStudentId);
        setToast({
          message: `Skrining ${formType} untuk ${studentObj?.nama || formStudentId} berhasil disimpan ke Google Sheets.`,
          type: 'success',
        });
        setIsAddModalOpen(false);
        await handleManualRefresh();
      } else {
        setFormValidation({
          general: res.message || 'Gagal menyimpan data skrining ke Google Sheets.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan data.';
      setFormValidation({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Student Lookup Map
  const studentMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof adaptStudentForUI>>();
    students.forEach(s => {
      map.set(s.id, adaptStudentForUI(s, schools, classes));
    });
    return map;
  }, [students, schools, classes]);

  // 8. Filtered Screenings List
  const filteredScreenings = useMemo(() => {
    return screenings.filter(sc => {
      const st = studentMap.get(sc.student_id);

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = st ? st.nama.toLowerCase().includes(q) : false;
        const matchCode = st ? st.student_code.toLowerCase().includes(q) : false;
        const matchId = sc.id.toLowerCase().includes(q) || sc.student_id.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchId) return false;
      }

      if (filterClass !== 'ALL' && sc.class_id !== filterClass) {
        return false;
      }

      if (filterType !== 'ALL' && sc.screening_type !== filterType) {
        return false;
      }

      return true;
    });
  }, [screenings, studentMap, searchQuery, filterClass, filterType]);

  // 9. Metric Summaries
  const stats = useMemo(() => {
    const total = screenings.length;
    const anemiaCount = screenings.filter(s => s.screening_type === 'Anemia').length;
    const bpCount = screenings.filter(s => s.screening_type === 'Tekanan Darah').length;
    const attentionCount = screenings.filter(s => {
      const res = s.result.toLowerCase();
      return res.includes('ringan') || res.includes('sedang') || res.includes('berat') || res.includes('hipertensi');
    }).length;

    return { total, anemiaCount, bpCount, attentionCount };
  }, [screenings]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 rounded-xl text-sky-700">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Entri Skrining Kesehatan (Hb &amp; Tekanan Darah)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Pencatatan kadar Hemoglobin (Hb) dan Tekanan Darah siswa oleh kader SATRIA.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Data Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Refresh Data'}</span>
          </Button>

          {/* Add Screening Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Skrining</span>
          </Button>
        </div>
      </div>

      {/* Live Sync Timestamp Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Sheets Source of Truth terhubung pada sheet <strong className="text-slate-700">06_SCREENINGS</strong></span>
        </div>
        <div>
          {lastUpdated ? (
            <span>Data diperbarui pada {lastUpdated.toLocaleTimeString('id-ID')}</span>
          ) : (
            <span>Memuat waktu sinkronisasi...</span>
          )}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Skrining</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Total rekam skrining tersimpan</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skrining Hb (Anemia)</p>
              <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{stats.anemiaCount}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-500 font-medium">Pemeriksaan Hemoglobin</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tekanan Darah</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{stats.bpCount}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-500 font-medium">Sistolik / Diastolik</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Perhatian</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{stats.attentionCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">Anemia / Pre-Hipertensi</div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, nomor/kode siswa, atau ID skrining..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.grade ? `Kelas ${c.grade} ${c.class_name}` : c.class_name || c.id}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Jenis Skrining</option>
              <option value="Anemia">Anemia (Hemoglobin)</option>
              <option value="Tekanan Darah">Tekanan Darah</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Screenings Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Riwayat Skrining Kesehatan ({filteredScreenings.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Data pemeriksaan klinis hemoglobin dan tekanan darah berkala.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16">
              <LoadingState text="Memuat riwayat skrining kesehatan dari Google Sheets..." />
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <Alert variant="error" title="Gagal Memuat Data">
                {fetchError}
              </Alert>
            </div>
          ) : filteredScreenings.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Tidak Ada Data Skrining Ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada rekam skrining yang cocok dengan "${searchQuery}".`
                    : 'Belum ada rekam skrining yang sesuai filter yang dipilih.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Jenis Skrining</th>
                    <th className="py-3.5 px-4">Hasil Skrining</th>
                    <th className="py-3.5 px-4">Catatan</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScreenings.map(sc => {
                    const student = studentMap.get(sc.student_id);
                    const isAnemia = sc.screening_type === 'Anemia';

                    return (
                      <tr
                        key={sc.id}
                        className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedScreening(sc);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        {/* Date & ID */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateIndo(sc.screening_date)}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{sc.id}</div>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                            {student?.nama || 'Data Siswa Tidak Ditemukan'}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            No. {student?.student_code || '-'}
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span>{student?.class_name || sc.class_id}</span>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">
                          {isAnemia ? (
                            <Badge variant="danger" className="text-xs font-semibold flex items-center gap-1 w-fit">
                              <Droplet className="w-3 h-3" />
                              <span>Anemia</span>
                            </Badge>
                          ) : (
                            <Badge variant="primary" className="text-xs font-semibold flex items-center gap-1 w-fit">
                              <Heart className="w-3 h-3" />
                              <span>Tekanan Darah</span>
                            </Badge>
                          )}
                        </td>

                        {/* Result */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{sc.result}</span>
                        </td>

                        {/* Notes */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {sc.notes || '-'}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedScreening(sc);
                              setIsDetailModalOpen(true);
                            }}
                            className="text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Detail</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH SKRINING (MODAL DIALOG)                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsAddModalOpen(false);
        }}
        title="Entri Skrining Kesehatan Siswa"
        description="Pencatatan kadar Hemoglobin (Hb) dan Tekanan Darah siswa oleh kader SATRIA."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitScreening} className="space-y-4 pt-2">
          {formValidation.general && (
            <Alert variant="error" title="Gagal Menyimpan">
              {formValidation.general}
            </Alert>
          )}

          {/* Student & Class Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Pilih Siswa"
              name="student_id"
              value={formStudentId}
              onChange={e => handleStudentSelectChange(e.target.value)}
              options={students.map(s => ({
                label: `${s.nama} (No: ${s.student_code} - ${s.gender === 'P' ? 'P' : 'L'})`,
                value: s.id,
              }))}
              error={formValidation.student_id}
              required
            />

            <Select
              label="Kelas"
              name="class_id"
              value={formClassId}
              onChange={e => setFormClassId(e.target.value)}
              options={classes.map(c => ({
                label: c.grade ? `Kelas ${c.grade} ${c.class_name}` : c.class_name || c.id,
                value: c.id,
              }))}
              error={formValidation.class_id}
              required
            />
          </div>

          {/* Date & Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Skrining"
              type="date"
              name="screening_date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              error={formValidation.screening_date}
              required
            />

            <Select
              label="Jenis Skrining"
              name="screening_type"
              value={formType}
              onChange={e => setFormType(e.target.value as ScreeningType)}
              options={[
                { label: 'Anemia (Kadar Hemoglobin Hb)', value: 'Anemia' },
                { label: 'Tekanan Darah (Sistolik / Diastolik)', value: 'Tekanan Darah' },
              ]}
              required
            />
          </div>

          {/* Dynamic Inputs based on Screening Type */}
          {formType === 'Anemia' ? (
            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wider">
                <Droplet className="w-4 h-4" />
                <span>Pemeriksaan Hemoglobin (Hb)</span>
              </div>
              <Input
                label="Kadar Hemoglobin (g/dL)"
                name="hb_value"
                placeholder="Contoh: 12.5"
                value={formHbValue}
                onChange={e => setFormHbValue(e.target.value)}
                error={formValidation.hb_value}
                required
              />
              {liveHbCategory && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-rose-200 text-xs">
                  <span className="text-slate-600 font-medium">Interpretasi Klinis:</span>
                  <Badge variant={liveHbCategory.variant} className="text-xs font-bold">
                    {liveHbCategory.label}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs uppercase tracking-wider">
                <Heart className="w-4 h-4" />
                <span>Pemeriksaan Tekanan Darah</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Sistolik (mmHg)"
                  name="systolic"
                  placeholder="Contoh: 115"
                  value={formSystolic}
                  onChange={e => setFormSystolic(e.target.value)}
                  error={formValidation.systolic}
                  required
                />
                <Input
                  label="Diastolik (mmHg)"
                  name="diastolic"
                  placeholder="Contoh: 75"
                  value={formDiastolic}
                  onChange={e => setFormDiastolic(e.target.value)}
                  error={formValidation.diastolic}
                  required
                />
              </div>
              {liveBpCategory && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 text-xs">
                  <span className="text-slate-600 font-medium">Interpretasi Klinis:</span>
                  <Badge variant={liveBpCategory.variant} className="text-xs font-bold">
                    {liveBpCategory.label}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan kondisi fisik atau rekomendasi kader SATRIA..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Spreadsheet...</span>
                </>
              ) : (
                <span>Simpan Skrining</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL SKRINING (MODAL DIALOG)                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Hasil Skrining Kesehatan"
        description="Informasi rinci hasil pemeriksaan skrining klinis siswa."
        maxWidth="md"
      >
        {selectedScreening && (() => {
          const student = studentMap.get(selectedScreening.student_id);
          const isAnemia = selectedScreening.screening_type === 'Anemia';

          return (
            <div className="space-y-4 pt-2">
              {/* Header Status Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${isAnemia ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID: {selectedScreening.id}</span>
                  <h3 className="text-lg font-bold text-slate-900">{student?.nama || 'Data Siswa Tidak Ditemukan'}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Tanggal: {formatDateIndo(selectedScreening.screening_date)}</p>
                </div>
                <Badge variant={isAnemia ? 'danger' : 'primary'} className="text-xs font-bold">
                  {selectedScreening.screening_type}
                </Badge>
              </div>

              {/* Measurements Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-slate-400 font-medium">Sekolah</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{student?.school_name || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Kelas</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{student?.class_name || selectedScreening.class_id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 font-medium">Hasil Pemeriksaan</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{selectedScreening.result}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                <p className="text-slate-400 font-medium flex items-center gap-1 mb-1"><FileText className="w-3.5 h-3.5" /> Catatan Tambahan</p>
                <p className="text-slate-700 leading-relaxed">{selectedScreening.notes || 'Tidak ada catatan tambahan.'}</p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
