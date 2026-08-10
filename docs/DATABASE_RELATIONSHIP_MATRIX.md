# SANTARA DATABASE RELATIONSHIP MATRIX
**Matriks Pemetaan Hubungan Antar Tabel (Relational Entity Dependency Matrix)**
*Sistem Pemantauan Kesehatan Remaja SMA (SANTARA)*  
*Waktu Penyusunan: 2026-08-10T18:30:40+07:00*

---

## 1. Entity-Relationship Flowchart

```mermaid
erDiagram
    02_SCHOOLS ||--o{ 03_CLASSES : "has classes (school_id)"
    02_SCHOOLS ||--o{ 01_USERS : "belongs to (school_id)"
    02_SCHOOLS ||--o{ 04_STUDENTS : "enrolled at (school_id)"
    03_CLASSES ||--o{ 04_STUDENTS : "contains (class_id)"
    01_USERS ||--o{ 05_EXAMINATIONS : "examines (examiner_id)"
    01_USERS ||--o{ 06_SCREENINGS : "screens (examiner_id)"
    01_USERS ||--o{ 07_TTD : "records (recorded_by)"
    01_USERS ||--o{ 08_EDUCATIONS : "author (created_by)"
    01_USERS ||--o{ 09_AUDIT_LOG : "triggers (user_id)"
    04_STUDENTS ||--o{ 05_EXAMINATIONS : "measured in (student_id)"
    04_STUDENTS ||--o{ 06_SCREENINGS : "evaluated in (student_id)"
    04_STUDENTS ||--o{ 07_TTD : "receives (student_id)"
    03_CLASSES ||--o{ 05_EXAMINATIONS : "scoped to (class_id)"
    03_CLASSES ||--o{ 06_SCREENINGS : "scoped to (class_id)"
    03_CLASSES ||--o{ 07_TTD : "scoped to (class_id)"
```

---

## 2. Detailed Foreign Key Relationship Specifications

### Chain 1: Master Data Foundations (01 -> 02 -> 03)
| Parent Entity | Parent PK | Child Entity | Child FK Column | Cardinality | Enforced By | Integrity Status |
|---|:---:|---|:---:|:---:|---|:---:|
| `02_SCHOOLS` | `id` | `03_CLASSES` | `school_id` | 1 : N | Application Layer (`recordExists`) | **PASS** |
| `02_SCHOOLS` | `id` | `01_USERS` | `school_id` | 1 : N | Application Layer (`recordExists`) | **PASS** |
| `03_CLASSES` | `id` | `01_USERS` | `class_id` | 1 : N | Application Layer (`recordExists`) | **PASS** |

### Chain 2: Student Enrollment (02 + 03 -> 04)
| Parent Entity | Parent PK | Child Entity | Child FK Column | Consistency Condition | Integrity Status |
|---|:---:|---|:---:|---|:---:|
| `02_SCHOOLS` | `id` | `04_STUDENTS` | `school_id` | `STUDENTS.school_id == CLASSES.school_id` | **PASS** |
| `03_CLASSES` | `id` | `04_STUDENTS` | `class_id` | `recordExists(03_CLASSES, class_id)` | **PASS** |

### Chain 3: Clinical & Anthropometry Records (04 + 03 + 01 -> 05)
| Parent Entity | Parent PK | Child Entity | Child FK Column | Purpose / Context | Integrity Status |
|---|:---:|---|:---:|---|:---:|
| `04_STUDENTS` | `id` | `05_EXAMINATIONS` | `student_id` | Riwayat antropometri IMT & LiLA | **PASS** |
| `03_CLASSES` | `id` | `05_EXAMINATIONS` | `class_id` | Tingkat kelas saat pemeriksaan | **PASS** |
| `01_USERS` | `id` | `05_EXAMINATIONS` | `examiner_id` | Petugas / Kader pemeriksa | **PASS** |

### Chain 4: Screening Records (04 + 03 + 01 -> 06)
| Parent Entity | Parent PK | Child Entity | Child FK Column | Purpose / Context | Integrity Status |
|---|:---:|---|:---:|---|:---:|
| `04_STUDENTS` | `id` | `06_SCREENINGS` | `student_id` | Hasil skrining Hb / Tekanan Darah | **PASS** |
| `03_CLASSES` | `id` | `06_SCREENINGS` | `class_id` | Tingkat kelas saat skrining | **PASS** |
| `01_USERS` | `id` | `06_SCREENINGS` | `examiner_id` | Kader pelaksana skrining | **PASS** |

### Chain 5: TTD Weekly Distribution (04 + 03 + 01 -> 07)
| Parent Entity | Parent PK | Child Entity | Child FK Column | Purpose / Context | Integrity Status |
|---|:---:|---|:---:|---|:---:|
| `04_STUDENTS` | `id` | `07_TTD` | `student_id` | Log konsumsi TTD mingguan siswa putri | **PASS** |
| `03_CLASSES` | `id` | `07_TTD` | `class_id` | Kelas siswa penerima TTD | **PASS** |
| `01_USERS` | `id` | `07_TTD` | `recorded_by` | Kader pencatat kepatuhan | **PASS** |

### Chain 6: Educational Content & System Audit (01 -> 08, 09)
| Parent Entity | Parent PK | Child Entity | Child FK Column | Purpose / Context | Integrity Status |
|---|:---:|---|:---:|---|:---:|
| `01_USERS` | `id` | `08_EDUCATIONS` | `created_by` | Penulis artikel edukasi kesehatan | **PASS** |
| `01_USERS` | `id` | `09_AUDIT_LOG` | `user_id` | Aktor pelaku mutasi data | **PASS** |

---

## 3. Data Integrity Verification Matrix

| Verification Aspect | Audit Result | Status |
|---|---|:---:|
| **Parent Record Existence** | Setiap child record memiliki parent yang terdaftar di database | **PASS** |
| **Cross-Table Consistency** | `students.school_id` konsisten dengan `classes.school_id` (`SCH001`) | **PASS** |
| **No Orphan Children** | 0 Orphan record pada seluruh data transaksi aktif | **PASS** |
| **Exact Schema Parity** | Nama field exact `nutrional_status` tetap dipertahankan | **PASS** |
