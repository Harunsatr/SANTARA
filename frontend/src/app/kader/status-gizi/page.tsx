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
  Alert,
  Modal,
  Toast,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import {
  Activity,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  GraduationCap,
  Sparkles,
  Eye,
  Scale,
  Ruler,
  FileText,
} from 'lucide-react';
import { Student, School, ClassRoom, ExaminationWithLiLA } from '@/types/models';
import { fetchExaminations, createExamination } from '@/lib/api/examinations';
import { fetchStudents } from '@/lib/api/students';
import { fetchSchools } from '@/lib/api/schools';
import { fetchClasses } from '@/lib/api/classes';
import { adaptExaminationsFromApi, serializeExaminationNotes } from '@/lib/adapters/examinationAdapter';
import { adaptStudentForUI, filterValidClasses } from '@/lib/adapters/schoolAdapter';
import { getNutritionStyle } from '@/lib/utils/nutrition';
import { formatDateIndo, getTodayDateString } from '@/lib/utils/date';
import { calculateBMI } from '@/lib/utils/number';
import { useSession } from '@/context/SessionContext';

export default function StatusGiziPage() {
  const { user } = useSession();

  // Data states
  const [examinations, setExaminations] = useState<ExaminationWithLiLA[]>([]);
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
  const [filterStatusGizi, setFilterStatusGizi] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExaminationWithLiLA | null>(null);

  // Form states
  const [formStudentId, setFormStudentId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formExamDate, setFormExamDate] = useState(getTodayDateString());
  const [formHeight, setFormHeight] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formLiLA, setFormLiLA] = useState('');
  const [formCustomNotes, setFormCustomNotes] = useState('');
  const [formValidation, setFormValidation] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Initial Load & Synchronization Function
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [examsRes, studentsRes, schoolsRes, classesRes] = await Promise.all([
          fetchExaminations(),
          fetchStudents(),
          fetchSchools(),
          fetchClasses(),
        ]);

        if (!ignore) {
          if (examsRes.success) {
            setExaminations(adaptExaminationsFromApi(examsRes.data || []));
          } else {
            setFetchError(examsRes.message || 'Gagal memuat data pemeriksaan');
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
      const [examsRes, studentsRes, schoolsRes, classesRes] = await Promise.all([
        fetchExaminations(),
        fetchStudents(),
        fetchSchools(),
        fetchClasses(),
      ]);

      if (examsRes.success) {
        setExaminations(adaptExaminationsFromApi(examsRes.data || []));
      } else {
        setFetchError(examsRes.message || 'Gagal memuat data pemeriksaan');
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
    setFormExamDate(getTodayDateString());
    setFormHeight('');
    setFormWeight('');
    setFormLiLA('');
    setFormCustomNotes('');
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

  // 5. Live BMI & Status Calculation
  const liveBmiResult = useMemo(() => {
    const h = parseFloat(formHeight);
    const w = parseFloat(formWeight);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return null;

    const bmi = calculateBMI(w, h);
    if (bmi === null) return null;

    // Tentative classification based on adolescent BMI cut-offs
    let status = 'Normal';
    if (bmi < 14.5) status = 'Severely Thinness';
    else if (bmi < 17.0) status = 'Thinness';
    else if (bmi >= 27.0) status = 'Obese';
    else if (bmi >= 23.0) status = 'Overweight';

    return {
      bmi,
      status,
      style: getNutritionStyle(status),
    };
  }, [formHeight, formWeight]);

  // 6. Submit Form Handler
  const handleSubmitExamination = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    if (!formStudentId) errors.student_id = 'Pilih siswa yang diperiksa.';
    if (!formClassId) errors.class_id = 'Pilih kelas.';
    if (!formExamDate) errors.examination_date = 'Pilih tanggal pemeriksaan.';

    const h = parseFloat(formHeight);
    if (isNaN(h) || h <= 0 || h > 250) {
      errors.height_cm = 'Tinggi badan harus berupa angka valid (misal: 155 cm).';
    }

    const w = parseFloat(formWeight);
    if (isNaN(w) || w <= 0 || w > 250) {
      errors.weight_kg = 'Berat badan harus berupa angka valid (misal: 48.5 kg).';
    }

    if (formLiLA.trim() !== '') {
      const lilaVal = parseFloat(formLiLA);
      if (isNaN(lilaVal) || lilaVal < 0 || lilaVal > 70) {
        errors.lila = 'Lingkar Lengan Atas (LiLA) harus angka valid (misal: 23.5 cm).';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormValidation(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const serializedNotes = serializeExaminationNotes(
        formLiLA ? parseFloat(formLiLA) : undefined,
        formCustomNotes
      );

      const payload = {
        student_id: formStudentId,
        class_id: formClassId,
        examination_date: formExamDate,
        weight_kg: w,
        height_cm: h,
        nutrional_status: liveBmiResult ? liveBmiResult.status : 'Normal', // EXACT BACKEND SPELLING
        examiner_id: user?.id || 'USR001',
        notes: serializedNotes,
        user_id: user?.id || 'USR001',
      };

      const res = await createExamination(payload);

      if (res.success && res.data) {
        const studentObj = students.find(s => s.id === formStudentId);
        setToast({
          message: `Pemeriksaan antropometri untuk ${studentObj?.nama || formStudentId} (BMI: ${res.data.bmi}) berhasil disimpan.`,
          type: 'success',
        });
        setIsAddModalOpen(false);
        await handleManualRefresh();
      } else {
        setFormValidation({
          general: res.message || 'Gagal menyimpan pemeriksaan ke database Google Sheets.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan data.';
      setFormValidation({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Student Lookup Map for Table Rendering
  const studentMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof adaptStudentForUI>>();
    students.forEach(s => {
      map.set(s.id, adaptStudentForUI(s, schools, classes));
    });
    return map;
  }, [students, schools, classes]);

  // 8. Filtered Examinations List
  const filteredExaminations = useMemo(() => {
    return examinations.filter(ex => {
      const st = studentMap.get(ex.student_id);

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = st ? st.nama.toLowerCase().includes(q) : false;
        const matchCode = st ? st.student_code.toLowerCase().includes(q) : false;
        const matchId = ex.id.toLowerCase().includes(q) || ex.student_id.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchId) return false;
      }

      if (filterClass !== 'ALL' && ex.class_id !== filterClass) {
        return false;
      }

      if (filterStatusGizi !== 'ALL') {
        const category = getNutritionStyle(ex.nutrional_status).category;
        if (category !== filterStatusGizi) return false;
      }

      return true;
    });
  }, [examinations, studentMap, searchQuery, filterClass, filterStatusGizi]);

  // 9. Metric Summaries
  const stats = useMemo(() => {
    const total = examinations.length;
    const todayStr = getTodayDateString();
    const todayCount = examinations.filter(e => String(e.examination_date).startsWith(todayStr)).length;
    const normalCount = examinations.filter(e => getNutritionStyle(e.nutrional_status).category === 'Normal').length;
    const atRiskCount = examinations.filter(e => {
      const cat = getNutritionStyle(e.nutrional_status).category;
      return cat === 'Severely Thinness' || cat === 'Thinness' || cat === 'Obese' || cat === 'Overweight';
    }).length;

    return { total, todayCount, normalCount, atRiskCount };
  }, [examinations]);

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
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Entri & Riwayat Status Gizi Siswa
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Pencatatan antropometri tinggi badan, berat badan, IMT otomatis, dan pengukuran LiLA.
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

          {/* Add Exam Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pemeriksaan</span>
          </Button>
        </div>
      </div>

      {/* Live Sync Timestamp Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Sheets Source of Truth terhubung pada sheet <strong className="text-slate-700">05_EXAMINATIONS</strong></span>
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pemeriksaan</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Total rekam medis tersimpan</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pemeriksaan Hari Ini</p>
              <p className="text-2xl sm:text-3xl font-black text-sky-600 mt-1">{stats.todayCount}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Pemeriksaan tanggal hari ini</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gizi Baik (Normal)</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.normalCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">Rentang ideal WHO</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Perhatian</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{stats.atRiskCount}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">Gizi kurang / obesitas</div>
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
              placeholder="Cari nama siswa, nomor/kode siswa, atau ID pemeriksaan..."
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
              value={filterStatusGizi}
              onChange={e => setFilterStatusGizi(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status Gizi</option>
              <option value="Normal">Normal (Gizi Baik)</option>
              <option value="Thinness">Thinness (Gizi Kurang)</option>
              <option value="Severely Thinness">Severely Thinness (Gizi Buruk)</option>
              <option value="Overweight">Overweight (Gizi Lebih)</option>
              <option value="Obese">Obese (Obesitas)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Examinations Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Riwayat Antropometri & Status Gizi ({filteredExaminations.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Data pemeriksaan fisik siswa berstandar Standar WHO dan adapter LiLA.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16">
              <LoadingState text="Memuat riwayat pemeriksaan status gizi dari Google Sheets..." />
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <Alert variant="error" title="Gagal Memuat Data">
                {fetchError}
              </Alert>
            </div>
          ) : filteredExaminations.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Tidak Ada Data Pemeriksaan Ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada pemeriksaan yang cocok dengan "${searchQuery}".`
                    : 'Belum ada rekam pemeriksaan yang sesuai filter yang dipilih.'
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
                    <th className="py-3.5 px-4 text-center">TB (cm)</th>
                    <th className="py-3.5 px-4 text-center">BB (kg)</th>
                    <th className="py-3.5 px-4 text-center">IMT</th>
                    <th className="py-3.5 px-4 text-center">LiLA</th>
                    <th className="py-3.5 px-4 text-center">Status Gizi</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExaminations.map(ex => {
                    const student = studentMap.get(ex.student_id);
                    const style = getNutritionStyle(ex.nutrional_status);

                    return (
                      <tr
                        key={ex.id}
                        className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedExam(ex);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        {/* Date & ID */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateIndo(ex.examination_date)}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{ex.id}</div>
                        </td>

                        {/* Student Name & Code */}
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
                            <span>{student?.class_name || ex.class_id}</span>
                          </div>
                        </td>

                        {/* Height */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-800">
                          {ex.height_cm} cm
                        </td>

                        {/* Weight */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-800">
                          {ex.weight_kg} kg
                        </td>

                        {/* BMI */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {Number(ex.bmi).toFixed(1)}
                        </td>

                        {/* LiLA */}
                        <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                          {ex.lila_cm ? `${ex.lila_cm} cm` : '-'}
                        </td>

                        {/* Status Gizi Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.badgeClass}`}
                          >
                            {style.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExam(ex);
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
      {/* MODAL: TAMBAH PEMERIKSAAN ANTROPOMETRI (MODAL DIALOG)                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsAddModalOpen(false);
        }}
        title="Entri Pemeriksaan Status Gizi"
        description="Pencatatan pengukuran antropometri tinggi badan, berat badan, LiLA, dan kalkulasi IMT otomatis."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitExamination} className="space-y-4 pt-2">
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

          {/* Date Row */}
          <Input
            label="Tanggal Pemeriksaan"
            type="date"
            name="examination_date"
            value={formExamDate}
            onChange={e => setFormExamDate(e.target.value)}
            error={formValidation.examination_date}
            required
          />

          {/* Anthropometry Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Tinggi Badan (cm)"
              name="height_cm"
              placeholder="Contoh: 158"
              value={formHeight}
              onChange={e => setFormHeight(e.target.value)}
              error={formValidation.height_cm}
              required
            />

            <Input
              label="Berat Badan (kg)"
              name="weight_kg"
              placeholder="Contoh: 48.5"
              value={formWeight}
              onChange={e => setFormWeight(e.target.value)}
              error={formValidation.weight_kg}
              required
            />

            <Input
              label="LiLA (cm) — Opsional"
              name="lila_cm"
              placeholder="Contoh: 23.5"
              value={formLiLA}
              onChange={e => setFormLiLA(e.target.value)}
              error={formValidation.lila}
            />
          </div>

          {/* Live BMI Calculation Preview Card */}
          {liveBmiResult ? (
            <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Kalkulasi IMT Otomatis</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-sky-900">{liveBmiResult.bmi.toFixed(1)}</span>
                  <span className="text-xs text-sky-600">kg/m²</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Estimasi Kategori WHO:</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border mt-1 ${liveBmiResult.style.badgeClass}`}>
                  {liveBmiResult.style.label}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
              Masukkan Tinggi Badan dan Berat Badan untuk melihat perhitungan IMT otomatis.
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan kondisi fisik atau rekomendasi kader..."
              value={formCustomNotes}
              onChange={e => setFormCustomNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Notice Box */}
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Adapter LiLA:</span> Data Lingkar Lengan Atas (LiLA) diserialisasi secara otomatis ke catatan pemeriksaan berstandar backend tanpa mengubah skema spreadsheet.
            </div>
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
                <span>Simpan Pemeriksaan</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL PEMERIKSAAN (MODAL DIALOG)                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Pemeriksaan Status Gizi"
        description="Informasi rinci pengukuran antropometri dan status gizi siswa."
        maxWidth="md"
      >
        {selectedExam && (() => {
          const student = studentMap.get(selectedExam.student_id);
          const style = getNutritionStyle(selectedExam.nutrional_status);

          return (
            <div className="space-y-4 pt-2">
              {/* Header Status Card */}
              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: style.bgColor, borderColor: style.borderColor }}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID: {selectedExam.id}</span>
                  <h3 className="text-lg font-bold text-slate-900">{student?.nama || 'Data Siswa Tidak Ditemukan'}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Tanggal: {formatDateIndo(selectedExam.examination_date)}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${style.badgeClass}`}>
                  {style.label}
                </span>
              </div>

              {/* Measurements Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <p className="text-slate-400 font-medium flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> Tinggi Badan</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedExam.height_cm} cm</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium flex items-center gap-1"><Scale className="w-3.5 h-3.5" /> Berat Badan</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedExam.weight_kg} kg</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Indeks Massa Tubuh (IMT)</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{Number(selectedExam.bmi).toFixed(2)} kg/m²</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Lingkar Lengan Atas (LiLA)</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedExam.lila_cm ? `${selectedExam.lila_cm} cm` : '-'}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                <p className="text-slate-400 font-medium flex items-center gap-1 mb-1"><FileText className="w-3.5 h-3.5" /> Catatan Pemeriksaan</p>
                <p className="text-slate-700 leading-relaxed">{selectedExam.clean_notes || 'Tidak ada catatan tambahan.'}</p>
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
