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
  StudentAutocomplete,
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
  PlusCircle,
} from 'lucide-react';
import { Student, School, ClassRoom, ExaminationWithLiLA } from '@/types/models';
import { fetchExaminations, createExamination } from '@/lib/api/examinations';
import { fetchStudents, createStudent } from '@/lib/api/students';
import { fetchSchools } from '@/lib/api/schools';
import { fetchClasses, createClass } from '@/lib/api/classes';
import { adaptExaminationsFromApi, serializeExaminationNotes } from '@/lib/adapters/examinationAdapter';
import { adaptStudentForUI, filterValidClasses, resolveClassName } from '@/lib/adapters/schoolAdapter';
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

  // Dynamic Add Class Modal state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState('10');
  const [isSubmittingClass, setIsSubmittingClass] = useState(false);
  const [addClassError, setAddClassError] = useState<string | null>(null);

  // Dynamic Inline Add Student Modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('L');
  const [newStudentBirthDate, setNewStudentBirthDate] = useState('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

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
    setFormStudentId('');
    setFormClassId('');
    setFormExamDate(getTodayDateString());
    setFormHeight('');
    setFormWeight('');
    setFormLiLA('');
    setFormCustomNotes('');
    setFormValidation({});
    setIsAddModalOpen(true);
  };

  // 4. Handle Student Selection via Autocomplete (Auto-fills class)
  const handleStudentSelect = (student: Student | null) => {
    if (student) {
      setFormStudentId(student.id);
      if (student.class_id) {
        setFormClassId(student.class_id);
      } else if (classes.length > 0) {
        setFormClassId(classes[0].id);
      }
      // Clear student_id validation error if present
      if (formValidation.student_id) {
        setFormValidation(prev => {
          const next = { ...prev };
          delete next.student_id;
          return next;
        });
      }
    } else {
      setFormStudentId('');
      setFormClassId('');
    }
  };

  // 5. Handle Open Inline Add Student Modal
  const handleOpenInlineAddStudent = (initialName?: string) => {
    setNewStudentName(initialName || '');
    setNewStudentClassId(formClassId || classes[0]?.id || '');
    setNewStudentGender('L');
    setNewStudentBirthDate('');
    setAddStudentError(null);
    setIsAddStudentModalOpen(true);
  };

  // 6. Handle Submit Inline Student
  const handleSubmitInlineStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);

    const cleanName = newStudentName.trim();
    if (!cleanName) {
      setAddStudentError('Nama siswa wajib diisi.');
      return;
    }
    if (/^\d+$/.test(cleanName)) {
      setAddStudentError('Nama siswa harus berupa huruf/teks.');
      return;
    }
    if (/^STD\d+$/i.test(cleanName)) {
      setAddStudentError('Nama siswa tidak boleh berupa format ID teknis (STDxxx). Gunakan nama lengkap asli.');
      return;
    }
    if (!newStudentClassId) {
      setAddStudentError('Pilih kelas siswa.');
      return;
    }

    setIsSubmittingStudent(true);
    try {
      const payload = {
        school_id: user?.schoolId || user?.school_id || 'SCH001',
        class_id: newStudentClassId,
        nama: cleanName,
        gender: newStudentGender,
        birth_date: newStudentBirthDate || undefined,
        user_id: user?.id || 'USR001',
      };

      const res = await createStudent(payload);

      if (res.success && res.data) {
        const createdStudent = res.data;

        // Update local student state immediately
        setStudents(prev => {
          const exists = prev.some(s => s.id === createdStudent.id);
          if (exists) return prev;
          return [createdStudent, ...prev];
        });

        // Auto-select the newly created student in examination form
        setFormStudentId(createdStudent.id);
        setFormClassId(createdStudent.class_id);

        // Clear validation error if any
        setFormValidation(prev => {
          const next = { ...prev };
          delete next.student_id;
          delete next.class_id;
          return next;
        });

        // Close inline modal
        setIsAddStudentModalOpen(false);

        // Toast notification
        setToast({
          message: `Siswa "${createdStudent.nama}" (No. ${createdStudent.student_code || createdStudent.id}) berhasil ditambahkan dan otomatis dipilih.`,
          type: 'success',
        });

        // Background sync
        fetchStudents().then(syncRes => {
          if (syncRes.success && syncRes.data) {
            setStudents(syncRes.data);
          }
        });
      } else {
        setAddStudentError(res.message || 'Gagal menyimpan data siswa ke Google Sheets.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan siswa.';
      setAddStudentError(msg);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // 7. Handle Add New Class Dynamically
  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClassError(null);

    const name = newClassName.trim();
    const gr = newGrade.trim();

    if (!name && !gr) {
      setAddClassError('Nama kelas atau tingkat wajib diisi');
      return;
    }

    const finalName = name || `Kelas ${gr}`;

    // Duplicate check on client
    const isDup = classes.some(
      c => c.class_name.toLowerCase() === finalName.toLowerCase()
    );
    if (isDup) {
      setAddClassError(`Kelas "${finalName}" sudah terdaftar di database 03_CLASSES.`);
      return;
    }

    setIsSubmittingClass(true);
    try {
      const res = await createClass({
        class_name: finalName,
        grade: gr,
        academic_year: '2026/2027',
        school_id: user?.schoolId || 'SCH001',
      });

      if (res.success && res.data) {
        setToast({
          message: `Kelas "${finalName}" berhasil ditambahkan ke database Google Sheets.`,
          type: 'success',
        });
        setNewClassName('');
        setIsAddClassModalOpen(false);

        // Refresh classes and select the new class
        const refreshedClasses = await fetchClasses();
        if (refreshedClasses.success) {
          const valid = filterValidClasses(refreshedClasses.data || []);
          setClasses(valid);
          if (res.data.id) {
            setFormClassId(res.data.id);
          }
        }
      } else {
        setAddClassError(res.message || 'Gagal menambahkan kelas baru');
      }
    } catch (err) {
      setAddClassError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat kelas');
    } finally {
      setIsSubmittingClass(false);
    }
  };

  // 6. Live BMI & Status Calculation
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

  // 7. Submit Form Handler
  const handleSubmitExamination = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    if (!formStudentId) errors.student_id = 'Pilih siswa melalui pencarian nama.';
    if (!formClassId) errors.class_id = 'Pilih kelas siswa.';
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

  // 8. Student Lookup Map for Table Rendering
  const studentMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof adaptStudentForUI>>();
    students.forEach(s => {
      map.set(s.id, adaptStudentForUI(s, schools, classes));
    });
    return map;
  }, [students, schools, classes]);

  // 9. Filtered Examinations List
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

  // 10. Metric Summaries
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

          {/* Add Exam Button (Primary Entry Point) */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 shadow-sm font-bold bg-sky-600 hover:bg-sky-700 text-white"
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
              placeholder="Cari nama siswa atau kelas..."
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
                  {resolveClassName(c.id, classes)}
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
                        {/* Date */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateIndo(ex.examination_date)}</span>
                          </div>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                            {student?.nama || 'Data Siswa'}
                          </div>
                          {student?.student_code && (
                            <div className="text-xs text-slate-400 font-mono">
                              No. {student.student_code}
                            </div>
                          )}
                        </td>

                        {/* Class */}
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span>{resolveClassName(ex.class_id, classes)}</span>
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
      {/* MODAL: TAMBAH PEMERIKSAAN ANTROPOMETRI (PRIMARY ENTRY POINT)              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsAddModalOpen(false);
        }}
        title="Entri Pemeriksaan Status Gizi"
        description="Ketik nama siswa untuk pencarian instan, kelas akan terisi otomatis."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitExamination} className="space-y-4 pt-2">
          {formValidation.general && (
            <Alert variant="error" title="Gagal Menyimpan">
              {formValidation.general}
            </Alert>
          )}

          {/* Searchable Autocomplete for Student */}
          <StudentAutocomplete
            label="Nama Siswa"
            value={formStudentId}
            onChange={handleStudentSelect}
            students={students}
            classes={classes}
            error={formValidation.student_id}
            required
            autoFocus
            onAddNewStudent={handleOpenInlineAddStudent}
          />

          {/* Class Field with Dynamic Auto-fill & Add Class Option */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                Kelas Siswa <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(true)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Tambah Kelas Baru</span>
              </button>
            </div>

            <Select
              name="class_id"
              value={formClassId}
              onChange={e => setFormClassId(e.target.value)}
              options={classes.map(c => ({
                label: resolveClassName(c.id, classes),
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
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500 shrink-0" />
              <span>Masukkan tinggi dan berat badan untuk melihat estimasi IMT dan klasifikasi status gizi Standar WHO.</span>
            </div>
          )}

          {/* Custom Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-semibold text-slate-700">
              Catatan Khusus / Keluhan (Opsional)
            </label>
            <textarea
              name="custom_notes"
              rows={2}
              placeholder="Contoh: Riwayat sering pusing, sedang diet, atau anjuran makan..."
              value={formCustomNotes}
              onChange={e => setFormCustomNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Simpan Pemeriksaan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH KELAS BARU DINAMIS (DYNAMIC CLASS SUPPORT)                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddClassModalOpen}
        onClose={() => {
          if (!isSubmittingClass) setIsAddClassModalOpen(false);
        }}
        title="Tambah Kelas Baru"
        description="Tambahkan kelas master baru ke 03_CLASSES Google Sheets."
        maxWidth="md"
      >
        <form onSubmit={handleCreateNewClass} className="space-y-4 pt-2">
          {addClassError && (
            <Alert variant="error" title="Gagal Menambahkan Kelas">
              {addClassError}
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Tingkat Kelas (Grade) <span className="text-rose-500">*</span>
            </label>
            <select
              value={newGrade}
              onChange={e => setNewGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
              <option value="13">Kelas 13 (SMK 4 Tahun / Khusus)</option>
            </select>
          </div>

          <Input
            label="Nama Kelas / Rombel"
            name="class_name"
            placeholder="Contoh: Kelas 10, X-A, XI IPA 1"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            helperText="Kosongkan untuk menggunakan nama default (misal: Kelas 10)."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddClassModalOpen(false)}
              disabled={isSubmittingClass}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingClass}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Simpan Kelas
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: INLINE TAMBAH SISWA BARU (INTEGRATED TO 04_STUDENTS)               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => {
          if (!isSubmittingStudent) setIsAddStudentModalOpen(false);
        }}
        title="Tambah Siswa Baru"
        description="Tambahkan data siswa master baru ke Google Sheets 04_STUDENTS."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitInlineStudent} className="space-y-4 pt-2">
          {addStudentError && (
            <Alert variant="error" title="Gagal Menambahkan Siswa">
              {addStudentError}
            </Alert>
          )}

          {/* Student Name */}
          <Input
            label="Nama Lengkap Siswa"
            name="nama"
            placeholder="Contoh: Muhammad Harun / Siti Rahmawati"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            required
            autoFocus
            helperText="Masukkan nama lengkap siswa."
          />

          {/* Class Select (Dynamic from 03_CLASSES) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Kelas Siswa <span className="text-rose-500">*</span>
            </label>
            <Select
              name="new_student_class"
              value={newStudentClassId}
              onChange={e => setNewStudentClassId(e.target.value)}
              options={classes.map(c => ({
                label: resolveClassName(c.id, classes),
                value: c.id,
              }))}
              required
            />
          </div>

          {/* Gender Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Jenis Kelamin <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewStudentGender('L')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  newStudentGender === 'L'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Laki-laki (L)
              </button>
              <button
                type="button"
                onClick={() => setNewStudentGender('P')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  newStudentGender === 'P'
                    ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Perempuan (P)
              </button>
            </div>
          </div>

          {/* Birth Date (Optional) */}
          <Input
            label="Tanggal Lahir (Opsional)"
            type="date"
            name="birth_date"
            value={newStudentBirthDate}
            onChange={e => setNewStudentBirthDate(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddStudentModalOpen(false)}
              disabled={isSubmittingStudent}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingStudent}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Simpan &amp; Pilih Siswa
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL PEMERIKSAAN                                                 */}
      {/* ========================================================================= */}
      {selectedExam && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detail Pemeriksaan Status Gizi"
          maxWidth="md"
        >
          {(() => {
            const student = studentMap.get(selectedExam.student_id);
            const style = getNutritionStyle(selectedExam.nutrional_status);

            return (
              <div className="space-y-4 pt-1">
                {/* Student Info Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {student?.nama || 'Data Siswa'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {resolveClassName(selectedExam.class_id, classes)} • {student?.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                      </p>
                    </div>
                    {student?.student_code && (
                      <span className="text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                        No. {student.student_code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Measurements Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Tinggi Badan</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedExam.height_cm} cm</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Berat Badan</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedExam.weight_kg} kg</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Indeks Massa Tubuh (IMT)</p>
                    <p className="text-lg font-black text-sky-700 mt-0.5">{Number(selectedExam.bmi).toFixed(1)}</p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-[11px] text-slate-400 font-semibold uppercase">Lingkar Lengan (LiLA)</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedExam.lila_cm ? `${selectedExam.lila_cm} cm` : '-'}</p>
                  </div>
                </div>

                {/* Status Gizi Banner */}
                <div
                  className="p-4 rounded-xl border flex items-center justify-between"
                  style={{ backgroundColor: style.bgColor, borderColor: style.borderColor }}
                >
                  <div>
                    <p className="text-xs font-semibold" style={{ color: style.textColor }}>
                      Klasifikasi Status Gizi (Standar WHO):
                    </p>
                    <p className="text-base font-black mt-0.5" style={{ color: style.textColor }}>
                      {style.label}
                    </p>
                  </div>
                </div>

                {/* Date & Notes */}
                <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal Pemeriksaan:</span>
                    <span className="font-semibold text-slate-800">{formatDateIndo(selectedExam.examination_date)}</span>
                  </div>
                  {selectedExam.notes && (
                    <div className="flex flex-col gap-1 pt-1">
                      <span className="text-slate-400">Catatan:</span>
                      <p className="p-2 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-200">
                        &quot;{selectedExam.notes}&quot;
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
