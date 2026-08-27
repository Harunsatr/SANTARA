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
  StudentAutocomplete,
} from '@/components/ui';
import {
  Pill,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  GraduationCap,
  Eye,
  FileText,
  Info,
} from 'lucide-react';
import { Student, School, ClassRoom, TTDRecord } from '@/types/models';
import { fetchTTD, createTTD } from '@/lib/api/ttd';
import { fetchStudents, createStudent } from '@/lib/api/students';
import { fetchSchools } from '@/lib/api/schools';
import { fetchClasses } from '@/lib/api/classes';
import { adaptStudentForUI, filterValidClasses, resolveClassName } from '@/lib/adapters/schoolAdapter';
import { formatDateIndo, getTodayDateString } from '@/lib/utils/date';
import { useSession } from '@/context/SessionContext';

export default function TtdPage() {
  const { user } = useSession();

  // Data states
  const [ttdRecords, setTtdRecords] = useState<TTDRecord[]>([]);
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
  const [filterConsumed, setFilterConsumed] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TTDRecord | null>(null);

  // Dynamic Inline Add Student Modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'L' | 'P'>('P');
  const [newStudentBirthDate, setNewStudentBirthDate] = useState('');
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // Form states
  const [formStudentId, setFormStudentId] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formDate, setFormDate] = useState(getTodayDateString());
  const [formConsumed, setFormConsumed] = useState<boolean>(true);
  const [formQuantity, setFormQuantity] = useState('1');
  const [formNotes, setFormNotes] = useState('');
  const [formValidation, setFormValidation] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // 1. Initial Load & Synchronization Function
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [ttdRes, studentsRes, schoolsRes, classesRes] = await Promise.all([
          fetchTTD(),
          fetchStudents(),
          fetchSchools(),
          fetchClasses(),
        ]);

        if (!ignore) {
          if (ttdRes.success) {
            setTtdRecords(ttdRes.data || []);
          } else {
            setFetchError(ttdRes.message || 'Gagal memuat log data TTD');
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
      const [ttdRes, studentsRes, schoolsRes, classesRes] = await Promise.all([
        fetchTTD(),
        fetchStudents(),
        fetchSchools(),
        fetchClasses(),
      ]);

      if (ttdRes.success) {
        setTtdRecords(ttdRes.data || []);
      } else {
        setFetchError(ttdRes.message || 'Gagal memuat log data TTD');
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
    setFormDate(getTodayDateString());
    setFormConsumed(true);
    setFormQuantity('1');
    setFormNotes('');
    setFormValidation({});
    setIsAddModalOpen(true);
  };

  // 4. Handle Student Selection via Autocomplete (Auto-adjust class)
  const handleStudentSelect = (student: Student | null) => {
    if (student) {
      setFormStudentId(student.id);
      if (student.class_id) {
        setFormClassId(student.class_id);
      } else if (classes.length > 0) {
        setFormClassId(classes[0].id);
      }
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
    setNewStudentGender('P');
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
      setAddStudentError('Nama siswi wajib diisi.');
      return;
    }
    if (/^\d+$/.test(cleanName)) {
      setAddStudentError('Nama siswi harus berupa huruf/teks.');
      return;
    }
    if (/^STD\d+$/i.test(cleanName)) {
      setAddStudentError('Nama siswi tidak boleh berupa format ID teknis (STDxxx). Gunakan nama lengkap asli.');
      return;
    }
    if (!newStudentClassId) {
      setAddStudentError('Pilih kelas siswi.');
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

        setStudents(prev => {
          const exists = prev.some(s => s.id === createdStudent.id);
          if (exists) return prev;
          return [createdStudent, ...prev];
        });

        setFormStudentId(createdStudent.id);
        setFormClassId(createdStudent.class_id);

        setFormValidation(prev => {
          const next = { ...prev };
          delete next.student_id;
          delete next.class_id;
          return next;
        });

        setIsAddStudentModalOpen(false);

        setToast({
          message: `Siswa "${createdStudent.nama}" (No. ${createdStudent.student_code || createdStudent.id}) berhasil ditambahkan dan otomatis dipilih.`,
          type: 'success',
        });

        fetchStudents().then(syncRes => {
          if (syncRes.success && syncRes.data) {
            setStudents(syncRes.data);
          }
        });
      } else {
        setAddStudentError(res.message || 'Gagal menyimpan data siswi ke Google Sheets.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan siswi.';
      setAddStudentError(msg);
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  // 7. Submit Form Handler
  const handleSubmitTTD = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    if (!formStudentId) errors.student_id = 'Pilih siswi penerima TTD.';
    if (!formClassId) errors.class_id = 'Pilih kelas.';
    if (!formDate) errors.consumption_date = 'Pilih tanggal konsumsi.';

    const qty = parseInt(formQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      errors.quantity = 'Jumlah tablet harus berupa angka valid (misal: 1).';
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
        consumption_date: formDate,
        consumed: formConsumed,
        quantity: qty,
        recorded_by: user?.id || 'USR001',
        notes: formNotes.trim() || '-',
        user_id: user?.id || 'USR001',
      };

      const res = await createTTD(payload);

      if (res.success && res.data) {
        const studentObj = students.find(s => s.id === formStudentId);
        setToast({
          message: `Catatan konsumsi TTD untuk ${studentObj?.nama || formStudentId} berhasil disimpan.`,
          type: 'success',
        });
        setIsAddModalOpen(false);
        await handleManualRefresh();
      } else {
        setFormValidation({
          general: res.message || 'Gagal menyimpan catatan TTD ke Google Sheets.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan data.';
      setFormValidation({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Student Lookup Map
  const studentMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof adaptStudentForUI>>();
    students.forEach(s => {
      map.set(s.id, adaptStudentForUI(s, schools, classes));
    });
    return map;
  }, [students, schools, classes]);

  // 7. Filtered Records List
  const filteredRecords = useMemo(() => {
    return ttdRecords.filter(rec => {
      const st = studentMap.get(rec.student_id);

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = st ? st.nama.toLowerCase().includes(q) : false;
        const matchCode = st ? st.student_code.toLowerCase().includes(q) : false;
        const matchId = rec.id.toLowerCase().includes(q) || rec.student_id.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchId) return false;
      }

      if (filterClass !== 'ALL' && rec.class_id !== filterClass) {
        return false;
      }

      if (filterConsumed !== 'ALL') {
        const isConsumed = String(rec.consumed).toLowerCase() === 'true' || rec.consumed === true;
        if (filterConsumed === 'true' && !isConsumed) return false;
        if (filterConsumed === 'false' && isConsumed) return false;
      }

      return true;
    });
  }, [ttdRecords, studentMap, searchQuery, filterClass, filterConsumed]);

  // 8. Metric Summaries
  const stats = useMemo(() => {
    const total = ttdRecords.length;
    const consumedCount = ttdRecords.filter(
      r => String(r.consumed).toLowerCase() === 'true' || r.consumed === true
    ).length;
    const notConsumedCount = total - consumedCount;
    const complianceRate = total > 0 ? ((consumedCount / total) * 100).toFixed(1) : '0.0';

    return { total, consumedCount, notConsumedCount, complianceRate };
  }, [ttdRecords]);

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
            <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pencatatan Konsumsi Tablet Tambah Darah (TTD)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Dokumentasi kepatuhan minum TTD bersama mingguan untuk remaja putri.
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

          {/* Add TTD Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Catat TTD</span>
          </Button>
        </div>
      </div>

      {/* Live Sync Timestamp Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Sheets Source of Truth terhubung pada sheet <strong className="text-slate-700">07_TTD</strong></span>
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catatan</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400">Total sesi pemantauan</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dikonsumsi</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.consumedCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">Diminum sesuai jadwal</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tidak Dikonsumsi</p>
              <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{stats.notConsumedCount}</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-500 font-medium">Absen / Halangan</div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Kepatuhan</p>
              <p className="text-2xl sm:text-3xl font-black text-sky-600 mt-1">{stats.complianceRate}%</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-sky-600 font-medium">Rasio konsumsi TTD</div>
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
              placeholder="Cari nama siswi, nomor/kode siswa, atau ID catatan..."
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
              value={filterConsumed}
              onChange={e => setFilterConsumed(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-700 bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">Semua Status Konsumsi</option>
              <option value="true">Dikonsumsi</option>
              <option value="false">Tidak Dikonsumsi</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main TTD Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Riwayat Pemantauan Minum TTD ({filteredRecords.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Pencatatan konsumsi Tablet Tambah Darah mingguan program pencegahan anemia remaja putri.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16">
              <LoadingState text="Memuat riwayat konsumsi TTD dari Google Sheets..." />
            </div>
          ) : fetchError ? (
            <div className="p-6">
              <Alert variant="error" title="Gagal Memuat Data">
                {fetchError}
              </Alert>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Tidak Ada Catatan TTD Ditemukan"
                description={
                  searchQuery
                    ? `Tidak ada catatan yang cocok dengan "${searchQuery}".`
                    : 'Belum ada log TTD yang sesuai filter yang dipilih.'
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Nama Siswi</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4 text-center">Status Konsumsi</th>
                    <th className="py-3.5 px-4 text-center">Jumlah</th>
                    <th className="py-3.5 px-4">Dicatat Oleh</th>
                    <th className="py-3.5 px-4">Catatan</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map(rec => {
                    const student = studentMap.get(rec.student_id);
                    const isConsumed = String(rec.consumed).toLowerCase() === 'true' || rec.consumed === true;

                    return (
                      <tr
                        key={rec.id}
                        className="hover:bg-sky-50/40 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        {/* Date & ID */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDateIndo(rec.consumption_date)}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">{rec.id}</div>
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
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
                            <span>{student?.class_name || rec.class_id}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isConsumed ? (
                            <Badge variant="success" className="text-xs font-semibold">
                              Dikonsumsi
                            </Badge>
                          ) : (
                            <Badge variant="danger" className="text-xs font-semibold">
                              Tidak Dikonsumsi
                            </Badge>
                          )}
                        </td>

                        {/* Quantity */}
                        <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-700">
                          {rec.quantity || 1} Tablet
                        </td>

                        {/* Recorded By */}
                        <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                          {rec.recorded_by || 'Kader SATRIA'}
                        </td>

                        {/* Notes */}
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {rec.notes || '-'}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(rec);
                              setIsDetailModalOpen(true);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
      {/* MODAL: CATAT KONSUMSI TTD (MODAL DIALOG)                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsAddModalOpen(false);
        }}
        title="Catat Konsumsi Tablet Tambah Darah"
        description="Dokumentasi kepatuhan minum TTD bersama mingguan untuk remaja putri."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitTTD} className="space-y-4 pt-2">
          {formValidation.general && (
            <Alert variant="error" title="Gagal Menyimpan">
              {formValidation.general}
            </Alert>
          )}

          {/* Searchable Autocomplete for Student */}
          <StudentAutocomplete
            label="Nama Siswi (Sasaran TTD)"
            value={formStudentId}
            onChange={handleStudentSelect}
            students={students}
            classes={classes}
            error={formValidation.student_id}
            required
            autoFocus
            onAddNewStudent={handleOpenInlineAddStudent}
          />

          <Select
            label="Kelas Siswa"
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

          {/* Date & Quantity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Konsumsi TTD"
              type="date"
              name="consumption_date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              error={formValidation.consumption_date}
              required
            />

            <Input
              label="Jumlah Tablet"
              type="number"
              name="quantity"
              min="0"
              max="5"
              value={formQuantity}
              onChange={e => setFormQuantity(e.target.value)}
              error={formValidation.quantity}
              required
            />
          </div>

          {/* Consumption Status Radio/Select */}
          <Select
            label="Status Kepatuhan Minum TTD"
            name="consumed"
            value={formConsumed ? 'true' : 'false'}
            onChange={e => setFormConsumed(e.target.value === 'true')}
            options={[
              { label: 'Ya — Dikonsumsi Bersama di Sekolah', value: 'true' },
              { label: 'Tidak — Tidak Dikonsumsi / Absen / Sakit', value: 'false' },
            ]}
          />

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan seperti: diminum setelah sarapan pagi, atau alasan tidak minum..."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Photo Evidence Notice Box */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Informasi Bukti Foto:</span> Upload foto bukti fisik belum tersedia pada versi sistem saat ini. Silakan gunakan kolom catatan di atas untuk dokumentasi tambahan pelaksanaan program.
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
                <span>Simpan Catatan TTD</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL CATATAN TTD (MODAL DIALOG)                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Catatan Konsumsi TTD"
        description="Informasi rinci kepatuhan minum Tablet Tambah Darah siswi."
        maxWidth="md"
      >
        {selectedRecord && (() => {
          const student = studentMap.get(selectedRecord.student_id);
          const isConsumed = String(selectedRecord.consumed).toLowerCase() === 'true' || selectedRecord.consumed === true;

          return (
            <div className="space-y-4 pt-2">
              {/* Header Status Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${isConsumed ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID: {selectedRecord.id}</span>
                  <h3 className="text-lg font-bold text-slate-900">{student?.nama || 'Data Siswa Tidak Ditemukan'}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Tanggal: {formatDateIndo(selectedRecord.consumption_date)}</p>
                </div>
                <Badge variant={isConsumed ? 'success' : 'danger'} className="text-xs font-bold">
                  {isConsumed ? 'Dikonsumsi' : 'Tidak Dikonsumsi'}
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
                  <p className="font-semibold text-slate-800 mt-0.5">{student?.class_name || selectedRecord.class_id}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Jumlah Tablet</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5">{selectedRecord.quantity || 1} Tablet</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Dicatat Oleh</p>
                  <p className="text-base font-bold text-slate-800 mt-0.5 font-mono">{selectedRecord.recorded_by || 'Kader SATRIA'}</p>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs">
                <p className="text-slate-400 font-medium flex items-center gap-1 mb-1"><FileText className="w-3.5 h-3.5" /> Catatan Tambahan</p>
                <p className="text-slate-700 leading-relaxed">{selectedRecord.notes || 'Tidak ada catatan tambahan.'}</p>
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

      {/* ========================================================================= */}
      {/* MODAL: INLINE TAMBAH SISWA BARU (INTEGRATED TO 04_STUDENTS)               */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => {
          if (!isSubmittingStudent) setIsAddStudentModalOpen(false);
        }}
        title="Tambah Siswi Baru"
        description="Tambahkan data siswi master baru ke Google Sheets 04_STUDENTS."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitInlineStudent} className="space-y-4 pt-2">
          {addStudentError && (
            <Alert variant="error" title="Gagal Menambahkan Siswi">
              {addStudentError}
            </Alert>
          )}

          {/* Student Name */}
          <Input
            label="Nama Lengkap Siswi"
            name="nama"
            placeholder="Contoh: Siti Rahmawati / Aisyah Putri"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            required
            autoFocus
            helperText="Masukkan nama lengkap siswi."
          />

          {/* Class Select (Dynamic from 03_CLASSES) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-800">
              Kelas Siswi <span className="text-rose-500">*</span>
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
                onClick={() => setNewStudentGender('P')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  newStudentGender === 'P'
                    ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Perempuan (P)
              </button>
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
              Simpan &amp; Pilih Siswi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
