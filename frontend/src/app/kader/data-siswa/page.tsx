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
  Users,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  User,
  Heart,
  Calendar,
  Building2,
  GraduationCap,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Student, School, ClassRoom, StudentWithAge } from '@/types/models';
import { fetchStudents, createStudent } from '@/lib/api/students';
import { fetchSchools } from '@/lib/api/schools';
import { fetchClasses } from '@/lib/api/classes';
import { adaptStudentForUI, filterValidClasses, resolveClassName } from '@/lib/adapters/schoolAdapter';
import { formatDateIndo } from '@/lib/utils/date';
import { useSession } from '@/context/SessionContext';

export default function DataSiswaPage() {
  const { user } = useSession();

  // Data states
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
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal & Form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAge | null>(null);

  const [formData, setFormData] = useState({
    school_id: '',
    class_id: '',
    student_code: '',
    nama: '',
    gender: 'P' as 'L' | 'P',
    birth_date: '2008-05-15',
    status: 'active' as 'active' | 'inactive',
  });

  const [formValidation, setFormValidation] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Initial Load & Synchronization Function
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [studentsRes, schoolsRes, classesRes] = await Promise.all([
          fetchStudents(),
          fetchSchools(),
          fetchClasses(),
        ]);

        if (!ignore) {
          if (studentsRes.success) {
            setStudents(studentsRes.data || []);
          } else {
            setFetchError(studentsRes.message || 'Gagal memuat data siswa');
          }

          if (schoolsRes.success) {
            setSchools(schoolsRes.data || []);
          }

          if (classesRes.success) {
            setClasses(filterValidClasses(classesRes.data || []));
          }

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
      const [studentsRes, schoolsRes, classesRes] = await Promise.all([
        fetchStudents(),
        fetchSchools(),
        fetchClasses(),
      ]);

      if (studentsRes.success) {
        setStudents(studentsRes.data || []);
      } else {
        setFetchError(studentsRes.message || 'Gagal memuat data siswa');
      }

      if (schoolsRes.success) {
        setSchools(schoolsRes.data || []);
      }

      if (classesRes.success) {
        setClasses(filterValidClasses(classesRes.data || []));
      }

      setLastUpdated(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setFetchError(msg);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 3. Background Auto-Sync Interval (60 seconds)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      fetchStudents().then(res => {
        if (res.success && res.data) {
          setStudents(res.data);
          setLastUpdated(new Date());
        }
      });
    }, 60000);

    return () => clearInterval(syncInterval);
  }, []);

  // 4. Open Modal Handler with Reset
  const handleOpenAddModal = () => {
    const defaultSchoolId = schools.length > 0 ? schools[0].id : 'SCH001';
    const availableClasses = classes.filter(c => !c.school_id || c.school_id === defaultSchoolId);
    const defaultClassId = availableClasses.length > 0 ? availableClasses[0].id : 'CLS001';

    setFormData({
      school_id: defaultSchoolId,
      class_id: defaultClassId,
      student_code: '',
      nama: '',
      gender: 'P',
      birth_date: '2008-05-15',
      status: 'active',
    });
    setFormValidation({});
    setIsAddModalOpen(true);
  };

  // 5. Form Change Handlers with Validation
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'school_id') {
        const matchedClasses = classes.filter(c => c.school_id === value);
        if (matchedClasses.length > 0) {
          updated.class_id = matchedClasses[0].id;
        }
      }
      return updated;
    });

    setFormValidation(prev => {
      const errors = { ...prev };
      delete errors[field];
      delete errors.general;

      if (field === 'student_code') {
        const trimmed = value.trim();
        if (trimmed) {
          const isDupe = students.some(
            s =>
              (String(s.student_code).trim() === trimmed ||
                (!isNaN(Number(s.student_code)) && Number(s.student_code) === Number(trimmed))) &&
              s.school_id === (formData.school_id || 'SCH001') &&
              s.class_id === formData.class_id
          );
          if (isDupe) {
            errors.student_code = 'Nomor siswa sudah digunakan pada kelas ini.';
          }
        }
      }

      if (field === 'nama') {
        const trimmed = value.trim();
        if (!trimmed) {
          errors.nama = 'Nama siswa wajib diisi.';
        } else if (/^\d+$/.test(trimmed)) {
          errors.nama = 'Nama siswa harus berupa teks/huruf, tidak boleh hanya angka.';
        } else if (/^STD\d+$/i.test(trimmed)) {
          errors.nama = 'Nama siswa tidak boleh menggunakan format ID teknis (STDxxx). Gunakan nama lengkap asli.';
        } else if (trimmed.length < 2) {
          errors.nama = 'Nama siswa minimal 2 karakter.';
        }
      }

      return errors;
    });
  };

  // 6. Submit Form Handler
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    // Validate student_code (Optional - auto-generated if empty)
    const code = formData.student_code.trim();
    if (code) {
      const isDupe = students.some(
        s =>
          (String(s.student_code).trim() === code ||
            (!isNaN(Number(s.student_code)) && Number(s.student_code) === Number(code))) &&
          s.school_id === formData.school_id &&
          s.class_id === formData.class_id
      );
      if (isDupe) {
        errors.student_code = 'Nomor siswa sudah digunakan pada kelas tersebut.';
      }
    }

    // Validate nama (String/Text Only, No ID pattern)
    const name = formData.nama.trim();
    if (!name) {
      errors.nama = 'Nama siswa wajib diisi.';
    } else if (/^\d+$/.test(name)) {
      errors.nama = 'Nama siswa harus berupa teks/huruf, tidak boleh hanya angka.';
    } else if (/^STD\d+$/i.test(name)) {
      errors.nama = 'Nama siswa tidak boleh menggunakan format ID teknis (STDxxx). Gunakan nama lengkap asli.';
    } else if (name.length < 2) {
      errors.nama = 'Nama siswa minimal 2 karakter.';
    }

    // Validate school and class
    if (!formData.school_id) errors.school_id = 'Pilih sekolah.';
    if (!formData.class_id) errors.class_id = 'Pilih kelas.';

    if (Object.keys(errors).length > 0) {
      setFormValidation(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        school_id: formData.school_id,
        class_id: formData.class_id,
        student_code: code || undefined,
        nama: name,
        gender: formData.gender,
        birth_date: formData.birth_date,
        status: formData.status,
        user_id: user?.id || 'USR001',
      };

      const res = await createStudent(payload);

      if (res.success && res.data) {
        setToast({
          message: `Data siswa ${res.data.nama} (No: ${res.data.student_code}) berhasil disimpan ke Google Sheets.`,
          type: 'success',
        });
        setIsAddModalOpen(false);
        // Refresh from Google Sheets to guarantee source of truth
        await handleManualRefresh();
      } else {
        setFormValidation({
          general: res.message || 'Gagal menyimpan data siswa ke Google Sheets.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan data.';
      setFormValidation({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Adapted & Filtered Students
  const adaptedStudents = useMemo(() => {
    return students.map(s => adaptStudentForUI(s, schools, classes));
  }, [students, schools, classes]);

  const filteredStudents = useMemo(() => {
    return adaptedStudents.filter(st => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = st.nama.toLowerCase().includes(q);
        const matchCode = st.student_code.toLowerCase().includes(q);
        const matchId = st.id.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchId) return false;
      }

      if (filterClass !== 'ALL' && st.class_id !== filterClass) {
        return false;
      }

      if (filterGender !== 'ALL' && st.gender !== filterGender) {
        return false;
      }

      if (filterStatus !== 'ALL' && st.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [adaptedStudents, searchQuery, filterClass, filterGender, filterStatus]);

  // 8. Metric Summaries
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const female = students.filter(s => s.gender === 'P').length;
    const male = students.filter(s => s.gender === 'L').length;
    return { total, active, female, male };
  }, [students]);

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
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Direktori Data Siswa & Manajemen Siswa
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Sinkronisasi real-time dengan Google Spreadsheet <span className="font-semibold text-slate-700">04_STUDENTS</span>.
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

          {/* Add Student Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </Button>
        </div>
      </div>

      {/* Live Sync Timestamp Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Sheets Source of Truth terhubung via Apps Script API @13</span>
        </div>
        <div>
          {lastUpdated ? (
            <span>Data diperbarui pada {lastUpdated.toLocaleTimeString('id-ID')}</span>
          ) : (
            <span>Memuat waktu sinkronisasi...</span>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Terdaftar di database</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Siswa Aktif</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Status active di sekolah</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaja Putri</p>
              <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{stats.female}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-500 font-medium">Target suplemen TTD</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remaja Putra</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{stats.male}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Skrining & Antropometri</div>
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
              placeholder="Cari nama siswa, nomor/kode siswa, atau ID..."
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
              value={filterGender}
              onChange={e => setFilterGender(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Gender</option>
              <option value="P">Perempuan (P)</option>
              <option value="L">Laki-laki (L)</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Student Directory Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Daftar Siswa Terdaftar ({filteredStudents.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Pilih baris siswa untuk melihat pratinjau kartu Jejak Kesehatan Remaja (JAKRA).
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16">
              <LoadingState text="Memuat direktori data siswa dari Google Sheets..." />
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <Alert variant="error" title="Gagal Memuat Data">
                {fetchError}
              </Alert>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Tidak Ada Data Siswa Ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada siswa yang cocok dengan kata kunci "${searchQuery}".`
                    : 'Belum ada siswa yang sesuai filter yang dipilih.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">No / ID</th>
                    <th className="py-3.5 px-4">Nomor / Kode Siswa</th>
                    <th className="py-3.5 px-4">Nama Lengkap</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4 text-center">Gender</th>
                    <th className="py-3.5 px-4">Tanggal Lahir & Usia</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, idx) => (
                    <tr
                      key={st.id}
                      className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedStudent(st);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500">
                        <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                        <span className="font-semibold text-slate-700">{st.id}</span>
                      </td>

                      {/* Student Code (Numeric) */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200">
                          {st.student_code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                          {st.nama}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{st.school_name || st.school_id}</span>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.class_name || st.class_id}</span>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-4 text-center">
                        {st.gender === 'P' ? (
                          <Badge variant="danger" className="text-xs font-semibold">
                            Perempuan (P)
                          </Badge>
                        ) : (
                          <Badge variant="primary" className="text-xs font-semibold">
                            Laki-laki (L)
                          </Badge>
                        )}
                      </td>

                      {/* Birth Date & Age */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDateIndo(st.birth_date)}</span>
                        </div>
                        {st.formatted_age && st.formatted_age !== '-' && (
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Usia: {st.formatted_age}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {st.status === 'active' ? (
                          <Badge variant="success" className="text-[11px]">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="text-[11px]">
                            Nonaktif
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsDetailModalOpen(true);
                          }}
                          className="text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>JAKRA</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH DATA SISWA (ADMIN CREATE STUDENT FORM)                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsAddModalOpen(false);
        }}
        title="Tambah Data Siswa Baru"
        description="Data siswa baru akan otomatis diverifikasi dan disimpan langsung ke Google Spreadsheet 04_STUDENTS."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitStudent} className="space-y-4 pt-2">
          {formValidation.general && (
            <Alert variant="error" title="Gagal Menyimpan">
              {formValidation.general}
            </Alert>
          )}

          {/* School & Class Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Sekolah Mitra"
              name="school_id"
              value={formData.school_id}
              onChange={e => handleInputChange('school_id', e.target.value)}
              options={schools.map(s => ({
                label: `${s.name} (${s.id})`,
                value: s.id,
              }))}
              error={formValidation.school_id}
              required
            />

            <Select
              label="Kelas"
              name="class_id"
              value={formData.class_id}
              onChange={e => handleInputChange('class_id', e.target.value)}
              options={classes.map(c => ({
                label: resolveClassName(c.id, classes),
                value: c.id,
              }))}
              error={formValidation.class_id}
              required
            />
          </div>

          {/* Student Code (NUMERIC ONLY) & Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Nomor / Kode Siswa (Opsional)"
                name="student_code"
                placeholder="Otomatis digenerate sistem jika kosong"
                value={formData.student_code}
                onChange={e => handleInputChange('student_code', e.target.value)}
                error={formValidation.student_code}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Kosongkan untuk penomoran otomatis oleh sistem.
              </p>
            </div>

            <div>
              <Input
                label="Nama Lengkap Siswa"
                name="nama"
                placeholder="Contoh: Siti Rahmawati"
                value={formData.nama}
                onChange={e => handleInputChange('nama', e.target.value)}
                error={formValidation.nama}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Nama siswa berupa teks/huruf alfabetis.
              </p>
            </div>
          </div>

          {/* Gender & Birth Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Jenis Kelamin"
              name="gender"
              value={formData.gender}
              onChange={e => handleInputChange('gender', e.target.value as 'L' | 'P')}
              options={[
                { label: 'Perempuan (P) — Sasaran TTD', value: 'P' },
                { label: 'Laki-laki (L)', value: 'L' },
              ]}
              required
            />

            <Input
              label="Tanggal Lahir"
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={e => handleInputChange('birth_date', e.target.value)}
              error={formValidation.birth_date}
            />
          </div>

          {/* Status Row */}
          <Select
            label="Status Kesiswaan"
            name="status"
            value={formData.status}
            onChange={e => handleInputChange('status', e.target.value as 'active' | 'inactive')}
            options={[
              { label: 'Aktif (Terdaftar & Mengikuti Program UKS)', value: 'active' },
              { label: 'Nonaktif / Lulus / Pindah', value: 'inactive' },
            ]}
          />

          {/* Notice Box */}
          <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">ID Siswa Otomatis:</span> ID sistem unik (seperti <code>STD027</code>) akan digenerate otomatis oleh backend Google Apps Script.
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
                <span>Simpan Siswa</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL SISWA & KARTU DIGITAL JAKRA                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Kartu Jejak Kesehatan Remaja (JAKRA)"
        description="Ringkasan profil siswa dan status pemantauan kesehatan berkala SANTARA."
        maxWidth="md"
      >
        {selectedStudent && (
          <div className="space-y-4 pt-2">
            {/* Header Badge */}
            <div className="p-4 bg-gradient-to-r from-sky-600 to-sky-700 rounded-xl text-white shadow-sm flex items-center justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-white/20 rounded uppercase tracking-wider mb-1">
                  ID: {selectedStudent.id}
                </span>
                <h3 className="text-xl font-bold">{selectedStudent.nama}</h3>
                <p className="text-xs text-sky-100 mt-0.5 font-mono">
                  No. Induk: {selectedStudent.student_code}
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                {selectedStudent.gender === 'P' ? (
                  <Heart className="w-7 h-7 text-rose-200" />
                ) : (
                  <User className="w-7 h-7 text-sky-200" />
                )}
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <p className="text-slate-400 font-medium">Sekolah</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedStudent.school_name || selectedStudent.school_id}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Kelas</p>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedStudent.class_name || selectedStudent.class_id}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Jenis Kelamin</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {selectedStudent.gender === 'P' ? 'Perempuan (Sasaran TTD)' : 'Laki-laki'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Tanggal Lahir & Usia</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDateIndo(selectedStudent.birth_date)} ({selectedStudent.formatted_age || '-'})
                </p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-600 font-medium">Status Kesiswaan:</span>
              {selectedStudent.status === 'active' ? (
                <Badge variant="success">Aktif (Mengikuti Program)</Badge>
              ) : (
                <Badge variant="neutral">Nonaktif</Badge>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <a
                href="https://drive.google.com/file/d/18pUXE47Lp1gzSQRWU18PK67D1sIOI4wE/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Format Cetak JAKRA (F4)</span>
                <span className="text-[10px]">&rarr;</span>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
