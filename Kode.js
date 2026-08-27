/**
 * ============================================================
 * SANTARA — API BACKEND
 * Sistem Pemantauan Kesehatan Remaja SMA
 * Google Apps Script REST API + Google Sheets Database
 * Version 2.0.0
 * ============================================================
 */

// ============================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================

const SHEETS = {
  USERS: "01_USERS",
  SCHOOLS: "02_SCHOOLS",
  CLASSES: "03_CLASSES",
  STUDENTS: "04_STUDENTS",
  EXAMINATIONS: "05_EXAMINATIONS",
  SCREENINGS: "06_SCREENINGS",
  TTD: "07_TTD",
  EDUCATIONS: "08_EDUCATIONS",
  AUDIT_LOG: "09_AUDIT_LOG"
};

const ID_PREFIXES = {
  [SHEETS.USERS]: "USR",
  [SHEETS.SCHOOLS]: "SCH",
  [SHEETS.CLASSES]: "CLS",
  [SHEETS.STUDENTS]: "STD",
  [SHEETS.EXAMINATIONS]: "EXM",
  [SHEETS.SCREENINGS]: "SCR",
  [SHEETS.TTD]: "TTD",
  [SHEETS.EDUCATIONS]: "EDU",
  [SHEETS.AUDIT_LOG]: "LOG"
};

// ============================================================
// 2. RESPONSE HELPERS
// ============================================================

/**
 * Mengembalikan output response JSON dengan MIME type yang benar.
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Format standar untuk error response.
 */
function errorResponse(message, errorCode, extra) {
  const response = {
    success: false,
    message: message || "Terjadi kesalahan",
    error: errorCode || "UNKNOWN_ERROR"
  };
  if (extra && typeof extra === "object") {
    Object.assign(response, extra);
  }
  return jsonResponse(response);
}

/**
 * Format standar untuk success response single item.
 */
function successResponse(message, data, extra) {
  const response = {
    success: true,
    message: message || "Operasi berhasil",
    data: data
  };
  if (extra && typeof extra === "object") {
    Object.assign(response, extra);
  }
  return jsonResponse(response);
}

/**
 * Format standar untuk success response list data.
 */
function listResponse(message, list) {
  const data = Array.isArray(list) ? list : [];
  return jsonResponse({
    success: true,
    message: message || "Data berhasil diambil",
    total: data.length,
    data: data
  });
}

// ============================================================
// 3. SPREADSHEET & ROW HELPERS
// ============================================================

/**
 * Mendapatkan instance Spreadsheet aktif.
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Mengambil objek Sheet berdasarkan nama sheet.
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(sheetName);
}

/**
 * Mengambil seluruh data sheet dalam bentuk 2D array.
 */
function getSheetValues(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return null;
  return sheet.getDataRange().getValues();
}

/**
 * Format cell value agar aman dikembalikan ke JSON:
 * Mengubah Date object menjadi ISO string, null/undefined menjadi string/number.
 */
function formatCellValue(val) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    // Cek apakah tanggal valid
    if (!isNaN(val.getTime())) {
      return val.toISOString();
    }
    return "";
  }
  return val;
}

/**
 * Mengubah baris array sheet menjadi Javascript Object berdasarkan headers.
 */
function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = formatCellValue(row[idx]);
  });
  return obj;
}

/**
 * Mencari index baris data (1-based sheet row) berdasarkan ID.
 * Returns: { rowNumber: number, rowValues: array } atau null.
 */
function findRowById(sheetName, idValue) {
  const sheet = getSheet(sheetName);
  if (!sheet) return null;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  if (idIndex === -1) return null;

  const targetId = String(idValue).trim();
  for (let i = 1; i < values.length; i++) {
    const currentId = String(values[i][idIndex] || "").trim();
    if (currentId === targetId) {
      return {
        rowNumber: i + 1, // 1-based index untuk getRange
        rowValues: values[i],
        headers: headers,
        sheet: sheet
      };
    }
  }
  return null;
}

// ============================================================
// 4. ID GENERATOR
// ============================================================

/**
 * Menghasilkan ID berikutnya secara sekuensial berdasarkan prefix dan nilai tertinggi di sheet.
 * Contoh: STD001, STD002 -> STD003
 */
function generateNextId(sheetName, prefix) {
  const sheet = getSheet(sheetName);
  if (!sheet) return `${prefix}001`;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return `${prefix}001`;

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  if (idIndex === -1) return `${prefix}001`;

  const regex = new RegExp(`^${prefix}(\\d+)$`, "i");
  let maxNumber = 0;

  for (let i = 1; i < values.length; i++) {
    const cellValue = String(values[i][idIndex] || "").trim();
    const match = cellValue.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }

  const nextNumber = maxNumber + 1;
  return prefix + String(nextNumber).padStart(3, "0");
}

// ============================================================
// 5. FOREIGN KEY & DATA VALIDATORS
// ============================================================

/**
 * Mengecek apakah suatu record dengan ID tertentu ada di sheet tujuan.
 */
function recordExists(sheetName, idValue) {
  if (!idValue || String(idValue).trim() === "") return false;
  const match = findRowById(sheetName, idValue);
  return match !== null;
}

// ============================================================
// 6. AUDIT LOG SYSTEM
// ============================================================

/**
 * Mencatat aktivitas perubahan data ke sheet 09_AUDIT_LOG.
 * Kolom: id, user_id, action, table_name, record_id, description, timestamp
 */
function createAuditLog(logData) {
  try {
    const sheet = getSheet(SHEETS.AUDIT_LOG);
    if (!sheet) return;

    const values = sheet.getDataRange().getValues();
    if (values.length === 0) return;

    const headers = values[0];
    const newId = generateNextId(SHEETS.AUDIT_LOG, ID_PREFIXES[SHEETS.AUDIT_LOG]);
    const now = new Date().toISOString();

    const record = {
      id: newId,
      user_id: logData.user_id ? String(logData.user_id).trim() : "",
      action: logData.action ? String(logData.action).trim().toUpperCase() : "UNKNOWN",
      table_name: logData.table_name ? String(logData.table_name).trim() : "",
      record_id: logData.record_id ? String(logData.record_id).trim() : "",
      description: logData.description ? String(logData.description).trim() : "",
      timestamp: now
    };

    const row = headers.map(header => {
      return record[header] !== undefined ? record[header] : "";
    });

    sheet.appendRow(row);
  } catch (err) {
    // Audit log tidak boleh menyebabkan crash pada operasi utama
    console.error("Gagal mencatat audit log:", err);
  }
}

// ============================================================
// 7. STUDENTS HANDLERS (04_STUDENTS)
// ============================================================

/**
 * Mengambil daftar data siswa yang valid.
 * Filter: student_code & nama tidak kosong.
 * Query parameter opsional: school_id, class_id, status.
 */
function getStudents(params) {
  const sheet = getSheet(SHEETS.STUDENTS);
  if (!sheet) {
    return errorResponse("Sheet 04_STUDENTS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data siswa masih kosong", []);
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  const studentCodeIndex = headers.indexOf("student_code");
  const namaIndex = headers.indexOf("nama");
  const schoolIdIndex = headers.indexOf("school_id");
  const classIdIndex = headers.indexOf("class_id");
  const statusIndex = headers.indexOf("status");

  if (studentCodeIndex === -1 || namaIndex === -1) {
    return errorResponse("Kolom student_code atau nama tidak ditemukan", "COLUMN_NOT_FOUND");
  }

  const filterSchoolId = params && params.school_id ? String(params.school_id).trim() : null;
  const filterClassId = params && params.class_id ? String(params.class_id).trim() : null;
  const filterStatus = params && params.status ? String(params.status).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const studentCode = String(row[studentCodeIndex] || "").trim();
      const nama = String(row[namaIndex] || "").trim();
      if (!studentCode || !nama) return false;

      if (filterSchoolId && String(row[schoolIdIndex] || "").trim() !== filterSchoolId) {
        return false;
      }
      if (filterClassId && String(row[classIdIndex] || "").trim() !== filterClassId) {
        return false;
      }
      if (filterStatus && String(row[statusIndex] || "").trim() !== filterStatus) {
        return false;
      }
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data siswa berhasil diambil", data);
}

/**
 * Menambahkan data siswa baru.
 */
function createStudent(data) {
  if (!data) {
    return errorResponse("Data siswa wajib diisi", "DATA_REQUIRED");
  }

  const requiredFields = ["school_id", "class_id", "student_code", "nama", "gender"];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
      return errorResponse(`Field ${field} wajib diisi`, "REQUIRED_FIELD", { field: field });
    }
  }

  const schoolId = String(data.school_id).trim();
  const classId = String(data.class_id).trim();
  const studentCode = String(data.student_code).trim();
  const nama = String(data.nama).trim();
  const gender = String(data.gender).trim().toUpperCase();

  // Validasi Foreign Keys
  if (!recordExists(SHEETS.SCHOOLS, schoolId)) {
    return errorResponse("Sekolah tidak ditemukan", "SCHOOL_NOT_FOUND", { school_id: schoolId });
  }
  if (!recordExists(SHEETS.CLASSES, classId)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: classId });
  }

  const sheet = getSheet(SHEETS.STUDENTS);
  if (!sheet) {
    return errorResponse("Sheet 04_STUDENTS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const schoolIdIndex = headers.indexOf("school_id");
  const classIdIndex = headers.indexOf("class_id");
  const studentCodeIndex = headers.indexOf("student_code");

  // Cegah duplikasi student_code pada sekolah dan kelas yang sama
  const isDuplicate = values.slice(1).some(row => {
    return String(row[schoolIdIndex] || "").trim() === schoolId &&
           String(row[classIdIndex] || "").trim() === classId &&
           String(row[studentCodeIndex] || "").trim() === studentCode;
  });

  if (isDuplicate) {
    return errorResponse("Student code sudah digunakan pada kelas tersebut", "DUPLICATE_STUDENT_CODE");
  }

  const newId = generateNextId(SHEETS.STUDENTS, ID_PREFIXES[SHEETS.STUDENTS]);
  const now = new Date().toISOString();

  const newRecord = {
    id: newId,
    school_id: schoolId,
    class_id: classId,
    student_code: studentCode,
    nama: nama,
    gender: gender,
    birth_date: data.birth_date ? String(data.birth_date).trim() : "",
    status: data.status ? String(data.status).trim() : "active",
    created_at: now,
    updated_at: now
  };

  const row = headers.map(header => {
    return newRecord[header] !== undefined ? newRecord[header] : "";
  });

  sheet.appendRow(row);

  // Audit Log
  createAuditLog({
    user_id: data.user_id || data.created_by || "",
    action: "CREATE",
    table_name: SHEETS.STUDENTS,
    record_id: newId,
    description: `Menambahkan siswa baru: ${nama} (${studentCode})`
  });

  return successResponse("Data siswa berhasil ditambahkan", newRecord);
}

/**
 * Memperbarui data siswa yang sudah ada.
 */
function updateStudent(data) {
  if (!data) {
    return errorResponse("Data siswa wajib diisi", "DATA_REQUIRED");
  }
  if (!data.id) {
    return errorResponse("ID siswa wajib diisi", "ID_REQUIRED");
  }

  const studentId = String(data.id).trim();
  const existing = findRowById(SHEETS.STUDENTS, studentId);
  if (!existing) {
    return errorResponse("Data siswa tidak ditemukan", "STUDENT_NOT_FOUND", { id: studentId });
  }

  // Validasi Foreign Keys jika dikirim
  if (data.school_id !== undefined && data.school_id !== null && String(data.school_id).trim() !== "") {
    if (!recordExists(SHEETS.SCHOOLS, data.school_id)) {
      return errorResponse("Sekolah tidak ditemukan", "SCHOOL_NOT_FOUND", { school_id: data.school_id });
    }
  }
  if (data.class_id !== undefined && data.class_id !== null && String(data.class_id).trim() !== "") {
    if (!recordExists(SHEETS.CLASSES, data.class_id)) {
      return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: data.class_id });
    }
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const now = new Date().toISOString();

  const updatedRow = headers.map((header, idx) => {
    if (header === "id") return rowValues[idx];
    if (header === "created_at") return rowValues[idx];
    if (header === "updated_at") return now;

    if (data[header] !== undefined && data[header] !== null) {
      return data[header];
    }
    return rowValues[idx];
  });

  sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);

  const updatedRecord = rowToObject(headers, updatedRow);

  // Audit Log
  createAuditLog({
    user_id: data.user_id || data.updated_by || "",
    action: "UPDATE",
    table_name: SHEETS.STUDENTS,
    record_id: studentId,
    description: `Memperbarui data siswa: ${updatedRecord.nama || studentId}`
  });

  return successResponse("Data siswa berhasil diperbarui", updatedRecord);
}

/**
 * Mengarsipkan siswa (ubah status = inactive tanpa menghapus baris).
 */
function archiveStudent(data) {
  if (!data || !data.id) {
    return errorResponse("ID siswa wajib diisi", "ID_REQUIRED");
  }

  const studentId = String(data.id).trim();
  const existing = findRowById(SHEETS.STUDENTS, studentId);
  if (!existing) {
    return errorResponse("Data siswa tidak ditemukan", "STUDENT_NOT_FOUND", { id: studentId });
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const statusIndex = headers.indexOf("status");
  const updatedAtIndex = headers.indexOf("updated_at");

  if (statusIndex === -1) {
    return errorResponse("Kolom status tidak ditemukan", "STATUS_COLUMN_NOT_FOUND");
  }

  const now = new Date().toISOString();
  sheet.getRange(rowNumber, statusIndex + 1).setValue("inactive");

  if (updatedAtIndex !== -1) {
    sheet.getRange(rowNumber, updatedAtIndex + 1).setValue(now);
  }

  // Audit Log
  createAuditLog({
    user_id: data.user_id || data.archived_by || "",
    action: "ARCHIVE",
    table_name: SHEETS.STUDENTS,
    record_id: studentId,
    description: `Mengarsipkan siswa ${studentId}`
  });

  return successResponse("Data siswa berhasil diarsipkan", {
    id: studentId,
    status: "inactive",
    updated_at: now
  });
}

// ============================================================
// 8. EXAMINATIONS HANDLERS (05_EXAMINATIONS)
// ============================================================

/**
 * Mengambil daftar data pemeriksaan fisik / status gizi.
 * Query parameter opsional: student_id, class_id.
 */
function getExaminations(params) {
  const sheet = getSheet(SHEETS.EXAMINATIONS);
  if (!sheet) {
    return errorResponse("Sheet 05_EXAMINATIONS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data pemeriksaan masih kosong", []);
  }

  const headers = values[0];
  const studentIdIndex = headers.indexOf("student_id");
  const classIdIndex = headers.indexOf("class_id");

  if (studentIdIndex === -1) {
    return errorResponse("Kolom student_id tidak ditemukan", "STUDENT_ID_COLUMN_NOT_FOUND");
  }

  const filterStudentId = params && params.student_id ? String(params.student_id).trim() : null;
  const filterClassId = params && params.class_id ? String(params.class_id).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const studentId = String(row[studentIdIndex] || "").trim();
      if (!studentId) return false;

      if (filterStudentId && studentId !== filterStudentId) {
        return false;
      }
      if (filterClassId && String(row[classIdIndex] || "").trim() !== filterClassId) {
        return false;
      }
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data pemeriksaan berhasil diambil", data);
}

/**
 * Menambahkan data pemeriksaan siswa.
 * Menghitung BMI secara otomatis dan menyimpan field nutrional_status.
 */
function createExamination(data) {
  if (!data) {
    return errorResponse("Data pemeriksaan wajib diisi", "DATA_REQUIRED");
  }

  const required = ["student_id", "class_id", "examination_date", "weight_kg", "height_cm"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
      return errorResponse(`Field ${field} wajib diisi`, "REQUIRED_FIELD", { field: field });
    }
  }

  const studentId = String(data.student_id).trim();
  const classId = String(data.class_id).trim();
  const examinerId = data.examiner_id ? String(data.examiner_id).trim() : "";

  // Validasi Foreign Keys
  if (!recordExists(SHEETS.STUDENTS, studentId)) {
    return errorResponse("Siswa tidak ditemukan", "STUDENT_NOT_FOUND", { student_id: studentId });
  }
  if (!recordExists(SHEETS.CLASSES, classId)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: classId });
  }
  if (examinerId && !recordExists(SHEETS.USERS, examinerId)) {
    return errorResponse("Pemeriksa (User) tidak ditemukan", "USER_NOT_FOUND", { examiner_id: examinerId });
  }

  const weight = Number(data.weight_kg);
  const heightCm = Number(data.height_cm);

  if (!isFinite(weight) || weight <= 0) {
    return errorResponse("Berat badan tidak valid", "INVALID_WEIGHT");
  }
  if (!isFinite(heightCm) || heightCm <= 0) {
    return errorResponse("Tinggi badan tidak valid", "INVALID_HEIGHT");
  }

  // Hitung BMI
  const heightMeter = heightCm / 100;
  const bmi = Number((weight / (heightMeter * heightMeter)).toFixed(2));

  // Field nutrional_status (wajib dipertahankan ejaan persis)
  const nutrionalStatus = data.nutrional_status !== undefined && data.nutrional_status !== null
    ? String(data.nutrional_status).trim()
    : "";

  const sheet = getSheet(SHEETS.EXAMINATIONS);
  if (!sheet) {
    return errorResponse("Sheet 05_EXAMINATIONS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const newId = generateNextId(SHEETS.EXAMINATIONS, ID_PREFIXES[SHEETS.EXAMINATIONS]);
  const now = new Date().toISOString();

  const newRecord = {
    id: newId,
    student_id: studentId,
    class_id: classId,
    examination_date: data.examination_date,
    weight_kg: weight,
    height_cm: heightCm,
    bmi: bmi,
    nutrional_status: nutrionalStatus,
    examiner_id: examinerId,
    notes: data.notes ? String(data.notes).trim() : "",
    created_at: now,
    updated_at: now
  };

  const row = headers.map(header => {
    return newRecord[header] !== undefined ? newRecord[header] : "";
  });

  sheet.appendRow(row);

  // Audit Log
  createAuditLog({
    user_id: examinerId,
    action: "CREATE",
    table_name: SHEETS.EXAMINATIONS,
    record_id: newId,
    description: `Menambahkan pemeriksaan siswa: ${studentId} (BMI: ${bmi})`
  });

  return successResponse("Data pemeriksaan berhasil ditambahkan", newRecord);
}

/**
 * Memperbarui data pemeriksaan siswa.
 */
function updateExamination(data) {
  if (!data) {
    return errorResponse("Data pemeriksaan wajib diisi", "DATA_REQUIRED");
  }
  if (!data.id) {
    return errorResponse("ID pemeriksaan wajib diisi", "ID_REQUIRED");
  }

  const examId = String(data.id).trim();
  const existing = findRowById(SHEETS.EXAMINATIONS, examId);
  if (!existing) {
    return errorResponse("Data pemeriksaan tidak ditemukan", "EXAMINATION_NOT_FOUND", { id: examId });
  }

  // Validasi Foreign Keys jika dikirim
  if (data.student_id && !recordExists(SHEETS.STUDENTS, data.student_id)) {
    return errorResponse("Siswa tidak ditemukan", "STUDENT_NOT_FOUND", { student_id: data.student_id });
  }
  if (data.class_id && !recordExists(SHEETS.CLASSES, data.class_id)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: data.class_id });
  }
  if (data.examiner_id && !recordExists(SHEETS.USERS, data.examiner_id)) {
    return errorResponse("Pemeriksa tidak ditemukan", "USER_NOT_FOUND", { examiner_id: data.examiner_id });
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const currentObj = rowToObject(headers, rowValues);

  // Hitung ulang BMI jika weight atau height berubah
  const finalWeight = data.weight_kg !== undefined ? Number(data.weight_kg) : Number(currentObj.weight_kg);
  const finalHeight = data.height_cm !== undefined ? Number(data.height_cm) : Number(currentObj.height_cm);

  let newBmi = currentObj.bmi;
  if (isFinite(finalWeight) && finalWeight > 0 && isFinite(finalHeight) && finalHeight > 0) {
    const hMeter = finalHeight / 100;
    newBmi = Number((finalWeight / (hMeter * hMeter)).toFixed(2));
  }

  const now = new Date().toISOString();

  const updatedRow = headers.map((header, idx) => {
    if (header === "id") return rowValues[idx];
    if (header === "created_at") return rowValues[idx];
    if (header === "updated_at") return now;
    if (header === "bmi") return newBmi;

    if (data[header] !== undefined && data[header] !== null) {
      return data[header];
    }
    return rowValues[idx];
  });

  sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);

  const updatedRecord = rowToObject(headers, updatedRow);

  // Audit Log
  createAuditLog({
    user_id: data.examiner_id || currentObj.examiner_id || "",
    action: "UPDATE",
    table_name: SHEETS.EXAMINATIONS,
    record_id: examId,
    description: `Memperbarui data pemeriksaan: ${examId}`
  });

  return successResponse("Data pemeriksaan berhasil diperbarui", updatedRecord);
}

// ============================================================
// 9. SCREENINGS HANDLERS (06_SCREENINGS)
// ============================================================

/**
 * Mengambil data skrining kesehatan.
 * Query parameter opsional: student_id, class_id, screening_type.
 */
function getScreenings(params) {
  const sheet = getSheet(SHEETS.SCREENINGS);
  if (!sheet) {
    return errorResponse("Sheet 06_SCREENINGS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data skrining masih kosong", []);
  }

  const headers = values[0];
  const studentIdIndex = headers.indexOf("student_id");
  const classIdIndex = headers.indexOf("class_id");
  const typeIndex = headers.indexOf("screening_type");

  if (studentIdIndex === -1) {
    return errorResponse("Kolom student_id tidak ditemukan", "STUDENT_ID_COLUMN_NOT_FOUND");
  }

  const filterStudentId = params && params.student_id ? String(params.student_id).trim() : null;
  const filterClassId = params && params.class_id ? String(params.class_id).trim() : null;
  const filterType = params && params.screening_type ? String(params.screening_type).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const studentId = String(row[studentIdIndex] || "").trim();
      if (!studentId) return false;

      if (filterStudentId && studentId !== filterStudentId) return false;
      if (filterClassId && String(row[classIdIndex] || "").trim() !== filterClassId) return false;
      if (filterType && String(row[typeIndex] || "").trim() !== filterType) return false;
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data skrining berhasil diambil", data);
}

/**
 * Menambahkan data skrining kesehatan baru.
 */
function createScreening(data) {
  if (!data) {
    return errorResponse("Data skrining wajib diisi", "DATA_REQUIRED");
  }

  const required = ["student_id", "class_id", "screening_date", "screening_type", "result"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
      return errorResponse(`Field ${field} wajib diisi`, "REQUIRED_FIELD", { field: field });
    }
  }

  const studentId = String(data.student_id).trim();
  const classId = String(data.class_id).trim();
  const examinerId = data.examiner_id ? String(data.examiner_id).trim() : "";

  // Validasi Foreign Keys
  if (!recordExists(SHEETS.STUDENTS, studentId)) {
    return errorResponse("Siswa tidak ditemukan", "STUDENT_NOT_FOUND", { student_id: studentId });
  }
  if (!recordExists(SHEETS.CLASSES, classId)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: classId });
  }
  if (examinerId && !recordExists(SHEETS.USERS, examinerId)) {
    return errorResponse("Pemeriksa (User) tidak ditemukan", "USER_NOT_FOUND", { examiner_id: examinerId });
  }

  const sheet = getSheet(SHEETS.SCREENINGS);
  if (!sheet) {
    return errorResponse("Sheet 06_SCREENINGS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const newId = generateNextId(SHEETS.SCREENINGS, ID_PREFIXES[SHEETS.SCREENINGS]);
  const now = new Date().toISOString();

  const newRecord = {
    id: newId,
    student_id: studentId,
    class_id: classId,
    screening_date: data.screening_date,
    screening_type: String(data.screening_type).trim(),
    result: String(data.result).trim(),
    notes: data.notes ? String(data.notes).trim() : "",
    examiner_id: examinerId,
    created_at: now,
    updated_at: now
  };

  const row = headers.map(header => {
    return newRecord[header] !== undefined ? newRecord[header] : "";
  });

  sheet.appendRow(row);

  // Audit Log
  createAuditLog({
    user_id: examinerId,
    action: "CREATE",
    table_name: SHEETS.SCREENINGS,
    record_id: newId,
    description: `Menambahkan skrining ${newRecord.screening_type} untuk siswa ${studentId}`
  });

  return successResponse("Data skrining berhasil ditambahkan", newRecord);
}

/**
 * Memperbarui data skrining kesehatan.
 */
function updateScreening(data) {
  if (!data) {
    return errorResponse("Data skrining wajib diisi", "DATA_REQUIRED");
  }
  if (!data.id) {
    return errorResponse("ID skrining wajib diisi", "ID_REQUIRED");
  }

  const screeningId = String(data.id).trim();
  const existing = findRowById(SHEETS.SCREENINGS, screeningId);
  if (!existing) {
    return errorResponse("Data skrining tidak ditemukan", "SCREENING_NOT_FOUND", { id: screeningId });
  }

  // Validasi Foreign Keys jika dikirim
  if (data.student_id && !recordExists(SHEETS.STUDENTS, data.student_id)) {
    return errorResponse("Siswa tidak ditemukan", "STUDENT_NOT_FOUND", { student_id: data.student_id });
  }
  if (data.class_id && !recordExists(SHEETS.CLASSES, data.class_id)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: data.class_id });
  }
  if (data.examiner_id && !recordExists(SHEETS.USERS, data.examiner_id)) {
    return errorResponse("Pemeriksa tidak ditemukan", "USER_NOT_FOUND", { examiner_id: data.examiner_id });
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const now = new Date().toISOString();

  const updatedRow = headers.map((header, idx) => {
    if (header === "id") return rowValues[idx];
    if (header === "created_at") return rowValues[idx];
    if (header === "updated_at") return now;

    if (data[header] !== undefined && data[header] !== null) {
      return data[header];
    }
    return rowValues[idx];
  });

  sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);

  const updatedRecord = rowToObject(headers, updatedRow);

  // Audit Log
  createAuditLog({
    user_id: data.examiner_id || updatedRecord.examiner_id || "",
    action: "UPDATE",
    table_name: SHEETS.SCREENINGS,
    record_id: screeningId,
    description: `Memperbarui data skrining: ${screeningId}`
  });

  return successResponse("Data skrining berhasil diperbarui", updatedRecord);
}

// ============================================================
// 10. TTD HANDLERS (07_TTD)
// ============================================================

/**
 * Mengambil data dokumentasi konsumsi Tablet Tambah Darah.
 * Query parameter opsional: student_id, class_id.
 */
function getTTD(params) {
  const sheet = getSheet(SHEETS.TTD);
  if (!sheet) {
    return errorResponse("Sheet 07_TTD tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data konsumsi TTD masih kosong", []);
  }

  const headers = values[0];
  const studentIdIndex = headers.indexOf("student_id");
  const classIdIndex = headers.indexOf("class_id");

  if (studentIdIndex === -1) {
    return errorResponse("Kolom student_id tidak ditemukan", "STUDENT_ID_COLUMN_NOT_FOUND");
  }

  const filterStudentId = params && params.student_id ? String(params.student_id).trim() : null;
  const filterClassId = params && params.class_id ? String(params.class_id).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const studentId = String(row[studentIdIndex] || "").trim();
      if (!studentId) return false;

      if (filterStudentId && studentId !== filterStudentId) return false;
      if (filterClassId && String(row[classIdIndex] || "").trim() !== filterClassId) return false;
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data konsumsi TTD berhasil diambil", data);
}

/**
 * Menambahkan pencatatan konsumsi Tablet Tambah Darah baru.
 */
function createTTD(data) {
  if (!data) {
    return errorResponse("Data TTD wajib diisi", "DATA_REQUIRED");
  }

  const required = ["student_id", "class_id", "consumption_date", "consumed"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
      return errorResponse(`Field ${field} wajib diisi`, "REQUIRED_FIELD", { field: field });
    }
  }

  const studentId = String(data.student_id).trim();
  const classId = String(data.class_id).trim();
  const recordedBy = data.recorded_by ? String(data.recorded_by).trim() : "";

  // Validasi Foreign Keys
  if (!recordExists(SHEETS.STUDENTS, studentId)) {
    return errorResponse("Siswa tidak ditemukan", "STUDENT_NOT_FOUND", { student_id: studentId });
  }
  if (!recordExists(SHEETS.CLASSES, classId)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: classId });
  }
  if (recordedBy && !recordExists(SHEETS.USERS, recordedBy)) {
    return errorResponse("Pencatat (User) tidak ditemukan", "USER_NOT_FOUND", { recorded_by: recordedBy });
  }

  const quantity = data.quantity !== undefined && data.quantity !== null && data.quantity !== ""
    ? Number(data.quantity)
    : 1;

  const sheet = getSheet(SHEETS.TTD);
  if (!sheet) {
    return errorResponse("Sheet 07_TTD tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const newId = generateNextId(SHEETS.TTD, ID_PREFIXES[SHEETS.TTD]);
  const now = new Date().toISOString();

  const newRecord = {
    id: newId,
    student_id: studentId,
    class_id: classId,
    consumption_date: data.consumption_date,
    consumed: data.consumed,
    quantity: quantity,
    recorded_by: recordedBy,
    notes: data.notes ? String(data.notes).trim() : "",
    created_at: now,
    updated_at: now
  };

  const row = headers.map(header => {
    return newRecord[header] !== undefined ? newRecord[header] : "";
  });

  sheet.appendRow(row);

  // Audit Log
  createAuditLog({
    user_id: recordedBy,
    action: "CREATE",
    table_name: SHEETS.TTD,
    record_id: newId,
    description: `Mencatat konsumsi TTD siswa ${studentId}`
  });

  return successResponse("Data konsumsi TTD berhasil ditambahkan", newRecord);
}

/**
 * Memperbarui data konsumsi TTD.
 */
function updateTTD(data) {
  if (!data) {
    return errorResponse("Data TTD wajib diisi", "DATA_REQUIRED");
  }
  if (!data.id) {
    return errorResponse("ID TTD wajib diisi", "ID_REQUIRED");
  }

  const ttdId = String(data.id).trim();
  const existing = findRowById(SHEETS.TTD, ttdId);
  if (!existing) {
    return errorResponse("Data TTD tidak ditemukan", "TTD_NOT_FOUND", { id: ttdId });
  }

  // Validasi Foreign Keys jika dikirim
  if (data.student_id && !recordExists(SHEETS.STUDENTS, data.student_id)) {
    return errorResponse("Siswa tidak ditemukan", "STUDENT_NOT_FOUND", { student_id: data.student_id });
  }
  if (data.class_id && !recordExists(SHEETS.CLASSES, data.class_id)) {
    return errorResponse("Kelas tidak ditemukan", "CLASS_NOT_FOUND", { class_id: data.class_id });
  }
  if (data.recorded_by && !recordExists(SHEETS.USERS, data.recorded_by)) {
    return errorResponse("Pencatat tidak ditemukan", "USER_NOT_FOUND", { recorded_by: data.recorded_by });
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const now = new Date().toISOString();

  const updatedRow = headers.map((header, idx) => {
    if (header === "id") return rowValues[idx];
    if (header === "created_at") return rowValues[idx];
    if (header === "updated_at") return now;

    if (data[header] !== undefined && data[header] !== null) {
      return data[header];
    }
    return rowValues[idx];
  });

  sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);

  const updatedRecord = rowToObject(headers, updatedRow);

  // Audit Log
  createAuditLog({
    user_id: data.recorded_by || updatedRecord.recorded_by || "",
    action: "UPDATE",
    table_name: SHEETS.TTD,
    record_id: ttdId,
    description: `Memperbarui data konsumsi TTD: ${ttdId}`
  });

  return successResponse("Data konsumsi TTD berhasil diperbarui", updatedRecord);
}

// ============================================================
// 11. EDUCATIONS HANDLERS (08_EDUCATIONS)
// ============================================================

/**
 * Mengambil daftar artikel / materi edukasi kesehatan.
 * Query parameter opsional: category, status.
 */
function getEducations(params) {
  const sheet = getSheet(SHEETS.EDUCATIONS);
  if (!sheet) {
    return errorResponse("Sheet 08_EDUCATIONS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data edukasi masih kosong", []);
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  const titleIndex = headers.indexOf("title");
  const categoryIndex = headers.indexOf("category");
  const statusIndex = headers.indexOf("status");

  if (titleIndex === -1) {
    return errorResponse("Kolom title tidak ditemukan", "TITLE_COLUMN_NOT_FOUND");
  }

  const filterCategory = params && params.category ? String(params.category).trim() : null;
  const filterStatus = params && params.status ? String(params.status).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const title = String(row[titleIndex] || "").trim();
      if (!title) return false;

      if (filterCategory && String(row[categoryIndex] || "").trim() !== filterCategory) return false;
      if (filterStatus && String(row[statusIndex] || "").trim() !== filterStatus) return false;
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data edukasi berhasil diambil", data);
}

/**
 * Menambahkan artikel / materi edukasi baru.
 */
function createEducation(data) {
  if (!data) {
    return errorResponse("Data edukasi wajib diisi", "DATA_REQUIRED");
  }

  const required = ["title", "content"];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || String(data[field]).trim() === "") {
      return errorResponse(`Field ${field} wajib diisi`, "REQUIRED_FIELD", { field: field });
    }
  }

  const title = String(data.title).trim();
  const createdBy = data.created_by ? String(data.created_by).trim() : "";

  // Validasi Foreign Key created_by
  if (createdBy && !recordExists(SHEETS.USERS, createdBy)) {
    return errorResponse("Penulis (User) tidak ditemukan", "USER_NOT_FOUND", { created_by: createdBy });
  }

  // Slug generator jika tidak disediakan
  let slug = data.slug ? String(data.slug).trim() : "";
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const sheet = getSheet(SHEETS.EDUCATIONS);
  if (!sheet) {
    return errorResponse("Sheet 08_EDUCATIONS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const newId = generateNextId(SHEETS.EDUCATIONS, ID_PREFIXES[SHEETS.EDUCATIONS]);
  const now = new Date().toISOString();

  const newRecord = {
    id: newId,
    title: title,
    slug: slug,
    category: data.category ? String(data.category).trim() : "Umum",
    excerpt: data.excerpt ? String(data.excerpt).trim() : "",
    content: String(data.content).trim(),
    thumbnail_url: data.thumbnail_url ? String(data.thumbnail_url).trim() : "",
    status: data.status ? String(data.status).trim() : "published",
    created_by: createdBy,
    created_at: now,
    updated_at: now
  };

  const row = headers.map(header => {
    return newRecord[header] !== undefined ? newRecord[header] : "";
  });

  sheet.appendRow(row);

  // Audit Log
  createAuditLog({
    user_id: createdBy,
    action: "CREATE",
    table_name: SHEETS.EDUCATIONS,
    record_id: newId,
    description: `Menambahkan artikel edukasi: ${title}`
  });

  return successResponse("Data edukasi berhasil ditambahkan", newRecord);
}

/**
 * Memperbarui artikel edukasi.
 */
function updateEducation(data) {
  if (!data) {
    return errorResponse("Data edukasi wajib diisi", "DATA_REQUIRED");
  }
  if (!data.id) {
    return errorResponse("ID edukasi wajib diisi", "ID_REQUIRED");
  }

  const eduId = String(data.id).trim();
  const existing = findRowById(SHEETS.EDUCATIONS, eduId);
  if (!existing) {
    return errorResponse("Data edukasi tidak ditemukan", "EDUCATION_NOT_FOUND", { id: eduId });
  }

  // Validasi Foreign Key jika dikirim
  if (data.created_by && !recordExists(SHEETS.USERS, data.created_by)) {
    return errorResponse("User tidak ditemukan", "USER_NOT_FOUND", { created_by: data.created_by });
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const now = new Date().toISOString();

  const updatedRow = headers.map((header, idx) => {
    if (header === "id") return rowValues[idx];
    if (header === "created_at") return rowValues[idx];
    if (header === "updated_at") return now;

    if (data[header] !== undefined && data[header] !== null) {
      return data[header];
    }
    return rowValues[idx];
  });

  sheet.getRange(rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);

  const updatedRecord = rowToObject(headers, updatedRow);

  // Audit Log
  createAuditLog({
    user_id: data.user_id || data.updated_by || "",
    action: "UPDATE",
    table_name: SHEETS.EDUCATIONS,
    record_id: eduId,
    description: `Memperbarui artikel edukasi: ${updatedRecord.title || eduId}`
  });

  return successResponse("Data edukasi berhasil diperbarui", updatedRecord);
}

// ============================================================
// 12. MASTER DATA HANDLERS (SCHOOLS, CLASSES, USERS)
// ============================================================

/**
 * Mengambil daftar data sekolah (02_SCHOOLS).
 */
function getSchools() {
  const sheet = getSheet(SHEETS.SCHOOLS);
  if (!sheet) {
    return errorResponse("Sheet 02_SCHOOLS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data sekolah masih kosong", []);
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  const nameIndex = headers.indexOf("name");

  const data = values
    .slice(1)
    .filter(row => {
      const id = String(row[idIndex] || "").trim();
      const name = String(row[nameIndex] || "").trim();
      return id !== "" && name !== "";
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data sekolah berhasil diambil", data);
}

/**
 * Mengambil daftar data kelas (03_CLASSES).
 * Query parameter opsional: school_id, status.
 */
function getClasses(params) {
  const sheet = getSheet(SHEETS.CLASSES);
  if (!sheet) {
    return errorResponse("Sheet 03_CLASSES tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data kelas masih kosong", []);
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  const schoolIdIndex = headers.indexOf("school_id");
  const classNameIndex = headers.indexOf("class_name");
  const gradeIndex = headers.indexOf("grade");
  const statusIndex = headers.indexOf("status");

  const filterSchoolId = params && params.school_id ? String(params.school_id).trim() : null;
  const filterStatus = params && params.status ? String(params.status).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const id = String(row[idIndex] || "").trim();
      const schoolId = String(row[schoolIdIndex] || "").trim();
      const className = String(row[classNameIndex] || "").trim();
      const grade = String(row[gradeIndex] || "").trim();
      const status = String(row[statusIndex] || "").trim();

      // Skip invalid or completely empty placeholder rows
      if (!id || (!schoolId && !className && !grade)) return false;
      if (filterSchoolId && schoolId !== filterSchoolId) return false;
      if (filterStatus && status !== filterStatus) return false;
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data kelas berhasil diambil", data);
}

/**
 * Menambahkan data kelas baru (03_CLASSES).
 * Parameter: { school_id, grade, class_name, academic_year, address, status }
 */
function createClass(data) {
  if (!data) {
    return errorResponse("Data kelas wajib diisi", "DATA_REQUIRED");
  }

  const className = String(data.class_name || "").trim();
  const rawGrade = String(data.grade || "").trim();

  if (!className && !rawGrade) {
    return errorResponse("Nama atau tingkat kelas wajib diisi", "REQUIRED_FIELD", { field: "class_name" });
  }

  // Resolving school_id with fallback to SCH001
  let schoolId = data.school_id ? String(data.school_id).trim() : "SCH001";
  if (!recordExists(SHEETS.SCHOOLS, schoolId)) {
    schoolId = "SCH001";
  }

  // Format grade number
  let grade = rawGrade;
  if (!grade) {
    const match = className.match(/\d+/);
    grade = match ? match[0] : "10";
  }

  const finalClassName = className || `Kelas ${grade}`;

  const sheet = getSheet(SHEETS.CLASSES);
  if (!sheet) {
    return errorResponse("Sheet 03_CLASSES tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const schoolIdIndex = headers.indexOf("school_id");
  const classNameIndex = headers.indexOf("class_name");
  const gradeIndex = headers.indexOf("grade");

  // Duplicate Check: Same school, same normalized class name or grade
  const isDuplicate = values.slice(1).some(row => {
    const rSchool = String(row[schoolIdIndex] || "").trim();
    const rName = String(row[classNameIndex] || "").trim().toLowerCase();
    const rGrade = String(row[gradeIndex] || "").trim();

    if (rSchool === schoolId) {
      if (rName === finalClassName.toLowerCase()) return true;
      if (gradeIndex !== -1 && rGrade === grade && rName === finalClassName.toLowerCase()) return true;
    }
    return false;
  });

  if (isDuplicate) {
    return errorResponse(`Kelas "${finalClassName}" sudah terdaftar pada sekolah ini`, "DUPLICATE_CLASS");
  }

  const newId = generateNextId(SHEETS.CLASSES, ID_PREFIXES[SHEETS.CLASSES]);
  const now = new Date().toISOString();

  const newRecord = {
    id: newId,
    school_id: schoolId,
    address: data.address ? String(data.address).trim() : "Jl. KH. Agus Salim No. 57, Sisir, Kecamatan Batu, Kota Batu, Jawa Timur 65314",
    academic_year: data.academic_year ? String(data.academic_year).trim() : "2026/2027",
    grade: Number(grade) || grade,
    class_name: finalClassName,
    status: data.status ? String(data.status).trim() : "active",
    created_at: now
  };

  const row = headers.map(header => {
    return newRecord[header] !== undefined ? newRecord[header] : "";
  });

  sheet.appendRow(row);

  createAuditLog({
    user_id: data.user_id || data.created_by || "ADMIN",
    action: "CREATE",
    table_name: SHEETS.CLASSES,
    record_id: newId,
    description: `Menambahkan kelas baru: ${finalClassName} (Grade ${grade})`
  });

  return successResponse("Data kelas berhasil ditambahkan", newRecord);
}

/**
 * Memperbarui data kelas (03_CLASSES).
 */
function updateClass(data) {
  if (!data || !data.id) {
    return errorResponse("ID kelas wajib diisi", "ID_REQUIRED");
  }

  const classId = String(data.id).trim();
  const existing = findRowById(SHEETS.CLASSES, classId);
  if (!existing) {
    return errorResponse("Data kelas tidak ditemukan", "CLASS_NOT_FOUND", { id: classId });
  }

  const { sheet, rowNumber, rowValues, headers } = existing;
  const currentObj = rowToObject(headers, rowValues);

  const updatedObj = Object.assign({}, currentObj);
  if (data.class_name !== undefined) updatedObj.class_name = String(data.class_name).trim();
  if (data.grade !== undefined) updatedObj.grade = Number(data.grade) || data.grade;
  if (data.school_id !== undefined) updatedObj.school_id = String(data.school_id).trim();
  if (data.academic_year !== undefined) updatedObj.academic_year = String(data.academic_year).trim();
  if (data.address !== undefined) updatedObj.address = String(data.address).trim();
  if (data.status !== undefined) updatedObj.status = String(data.status).trim();

  const newRowValues = headers.map(header => {
    return updatedObj[header] !== undefined ? updatedObj[header] : "";
  });

  sheet.getRange(rowNumber, 1, 1, newRowValues.length).setValues([newRowValues]);

  createAuditLog({
    user_id: data.user_id || data.updated_by || "ADMIN",
    action: "UPDATE",
    table_name: SHEETS.CLASSES,
    record_id: classId,
    description: `Memperbarui kelas ${classId}: ${updatedObj.class_name}`
  });

  return successResponse("Data kelas berhasil diperbarui", updatedObj);
}

/**
 * Menjalankan audit dan sinkronisasi struktur relasi Google Sheets secara non-destruktif.
 */
function syncDatabaseStructure() {
  const ss = getSpreadsheet();
  const results = {
    classesUpdated: 0,
    studentsUpdated: 0,
    examinationsUpdated: 0,
    screeningsUpdated: 0,
    ttdUpdated: 0,
    usersUpdated: 0
  };

  // 1. SYNC 03_CLASSES
  const classSheet = ss.getSheetByName(SHEETS.CLASSES);
  if (classSheet) {
    const values = classSheet.getDataRange().getValues();
    const headers = values[0];
    const idIdx = headers.indexOf("id");
    const schoolIdx = headers.indexOf("school_id");
    const gradeIdx = headers.indexOf("grade");
    const classNameIdx = headers.indexOf("class_name");
    const statusIdx = headers.indexOf("status");
    const addressIdx = headers.indexOf("address");
    const yearIdx = headers.indexOf("academic_year");

    const schoolAddress = "Jl. KH. Agus Salim No. 57, Sisir, Kecamatan Batu, Kota Batu, Jawa Timur 65314";
    const academicYear = "2026/2027";

    const classConfigs = {
      "CLS001": { grade: 10, name: "Kelas 10" },
      "CLS002": { grade: 11, name: "Kelas 11" },
      "CLS003": { grade: 12, name: "Kelas 12" }
    };

    for (let r = 1; r < values.length; r++) {
      const rowId = String(values[r][idIdx] || "").trim();
      if (classConfigs[rowId]) {
        const config = classConfigs[rowId];
        if (schoolIdx !== -1) classSheet.getRange(r + 1, schoolIdx + 1).setValue("SCH001");
        if (gradeIdx !== -1) classSheet.getRange(r + 1, gradeIdx + 1).setValue(config.grade);
        if (classNameIdx !== -1) classSheet.getRange(r + 1, classNameIdx + 1).setValue(config.name);
        if (statusIdx !== -1) classSheet.getRange(r + 1, statusIdx + 1).setValue("active");
        if (addressIdx !== -1 && (!values[r][addressIdx] || String(values[r][addressIdx]).trim() === "")) {
          classSheet.getRange(r + 1, addressIdx + 1).setValue(schoolAddress);
        }
        if (yearIdx !== -1 && (!values[r][yearIdx] || String(values[r][yearIdx]).trim() === "")) {
          classSheet.getRange(r + 1, yearIdx + 1).setValue(academicYear);
        }
        results.classesUpdated++;
      }
    }
  }

  // 2. SYNC 04_STUDENTS (relate to correct class_id based on student_code prefix)
  const studentSheet = ss.getSheetByName(SHEETS.STUDENTS);
  const studentClassMap = {}; // student_id -> class_id

  if (studentSheet) {
    const values = studentSheet.getDataRange().getValues();
    const headers = values[0];
    const idIdx = headers.indexOf("id");
    const schoolIdx = headers.indexOf("school_id");
    const classIdx = headers.indexOf("class_id");
    const codeIdx = headers.indexOf("student_code");

    for (let r = 1; r < values.length; r++) {
      const studentId = String(values[r][idIdx] || "").trim();
      const code = String(values[r][codeIdx] || "").trim();
      if (!studentId) continue;

      let targetClassId = "CLS001";
      if (code.startsWith("11_") || code.startsWith("11-") || code.startsWith("11")) {
        targetClassId = "CLS002";
      } else if (code.startsWith("12_") || code.startsWith("12-") || code.startsWith("12")) {
        targetClassId = "CLS003";
      } else {
        targetClassId = "CLS001";
      }

      studentClassMap[studentId] = targetClassId;

      if (schoolIdx !== -1) studentSheet.getRange(r + 1, schoolIdx + 1).setValue("SCH001");
      if (classIdx !== -1) {
        studentSheet.getRange(r + 1, classIdx + 1).setValue(targetClassId);
        results.studentsUpdated++;
      }
    }
  }

  // 3. SYNC 05_EXAMINATIONS (relate to correct class_id based on student)
  const examSheet = ss.getSheetByName(SHEETS.EXAMINATIONS);
  if (examSheet) {
    const values = examSheet.getDataRange().getValues();
    const headers = values[0];
    const studentIdx = headers.indexOf("student_id");
    const classIdx = headers.indexOf("class_id");

    for (let r = 1; r < values.length; r++) {
      const studentId = String(values[r][studentIdx] || "").trim();
      if (studentId && studentClassMap[studentId]) {
        const correctClassId = studentClassMap[studentId];
        if (classIdx !== -1) {
          examSheet.getRange(r + 1, classIdx + 1).setValue(correctClassId);
          results.examinationsUpdated++;
        }
      }
    }
  }

  // 4. SYNC 06_SCREENINGS (relate to correct class_id based on student)
  const screenSheet = ss.getSheetByName(SHEETS.SCREENINGS);
  if (screenSheet) {
    const values = screenSheet.getDataRange().getValues();
    const headers = values[0];
    const studentIdx = headers.indexOf("student_id");
    const classIdx = headers.indexOf("class_id");

    for (let r = 1; r < values.length; r++) {
      const studentId = String(values[r][studentIdx] || "").trim();
      if (studentId && studentClassMap[studentId]) {
        const correctClassId = studentClassMap[studentId];
        if (classIdx !== -1) {
          screenSheet.getRange(r + 1, classIdx + 1).setValue(correctClassId);
          results.screeningsUpdated++;
        }
      }
    }
  }

  // 5. SYNC 07_TTD (relate to correct class_id based on student)
  const ttdSheet = ss.getSheetByName(SHEETS.TTD);
  if (ttdSheet) {
    const values = ttdSheet.getDataRange().getValues();
    const headers = values[0];
    const studentIdx = headers.indexOf("student_id");
    const classIdx = headers.indexOf("class_id");

    for (let r = 1; r < values.length; r++) {
      const studentId = String(values[r][studentIdx] || "").trim();
      if (studentId && studentClassMap[studentId]) {
        const correctClassId = studentClassMap[studentId];
        if (classIdx !== -1) {
          ttdSheet.getRange(r + 1, classIdx + 1).setValue(correctClassId);
          results.ttdUpdated++;
        }
      }
    }
  }

  // 6. SYNC 01_USERS (ensure school_id is SCH001)
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  if (userSheet) {
    const values = userSheet.getDataRange().getValues();
    const headers = values[0];
    const schoolIdx = headers.indexOf("school_id");
    const classIdx = headers.indexOf("class_id");
    const idIdx = headers.indexOf("id");

    for (let r = 1; r < values.length; r++) {
      const userId = String(values[r][idIdx] || "").trim();
      if (schoolIdx !== -1) {
        userSheet.getRange(r + 1, schoolIdx + 1).setValue("SCH001");
        results.usersUpdated++;
      }
      if (userId === "USR002" && classIdx !== -1) {
        userSheet.getRange(r + 1, classIdx + 1).setValue("CLS002");
      }
    }
  }

  createAuditLog({
    user_id: "SYSTEM_MIGRATION",
    action: "DATABASE_SYNC",
    table_name: "SCHEMA_MIGRATION",
    record_id: "SYNC_PHASE2",
    description: `Database and class relations synchronized: ${JSON.stringify(results)}`
  });

  return successResponse("Database synchronization completed successfully", results);
}

/**
 * Mengambil daftar data pengguna / kader (01_USERS).
 * Query parameter opsional: school_id, role, status.
 */
function getUsers(params) {
  const sheet = getSheet(SHEETS.USERS);
  if (!sheet) {
    return errorResponse("Sheet 01_USERS tidak ditemukan", "SHEET_NOT_FOUND");
  }

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return listResponse("Data pengguna masih kosong", []);
  }

  const headers = values[0];
  const idIndex = headers.indexOf("id");
  const nameIndex = headers.indexOf("name");
  const schoolIdIndex = headers.indexOf("school_id");
  const roleIndex = headers.indexOf("role");
  const statusIndex = headers.indexOf("status");

  const filterSchoolId = params && params.school_id ? String(params.school_id).trim() : null;
  const filterRole = params && params.role ? String(params.role).trim() : null;
  const filterStatus = params && params.status ? String(params.status).trim() : null;

  const data = values
    .slice(1)
    .filter(row => {
      const id = String(row[idIndex] || "").trim();
      const name = String(row[nameIndex] || "").trim();
      if (!id || !name) return false;

      if (filterSchoolId && String(row[schoolIdIndex] || "").trim() !== filterSchoolId) return false;
      if (filterRole && String(row[roleIndex] || "").trim() !== filterRole) return false;
      if (filterStatus && String(row[statusIndex] || "").trim() !== filterStatus) return false;
      return true;
    })
    .map(row => rowToObject(headers, row));

  return listResponse("Data pengguna berhasil diambil", data);
}

// ============================================================
// 13. ROUTING & CONTROLLERS (doGet, doPost)
// ============================================================

/**
 * Entry point untuk HTTP GET Request.
 * Parameter: e.parameter.action
 */
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action;

    // Default action
    if (!action || action === "getStudents") {
      return getStudents(params);
    }

    switch (action) {
      case "getExaminations":
        return getExaminations(params);

      case "getScreenings":
        return getScreenings(params);

      case "getTTD":
        return getTTD(params);

      case "getEducations":
        return getEducations(params);

      case "getSchools":
        return getSchools();

      case "getClasses":
        return getClasses(params);

      case "getUsers":
        return getUsers(params);

      case "syncDatabaseStructure":
        return syncDatabaseStructure();

      default:
        return errorResponse("Action GET tidak dikenali", "UNKNOWN_ACTION", { action: action });
    }
  } catch (error) {
    return errorResponse("Terjadi kesalahan pada server", "INTERNAL_SERVER_ERROR", { error_detail: error.message });
  }
}

/**
 * Entry point untuk HTTP POST Request.
 * Body: JSON payload { "action": "...", "data": { ... } }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return errorResponse("Request body kosong", "EMPTY_REQUEST_BODY");
    }

    let request;
    try {
      request = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return errorResponse("Format JSON tidak valid", "INVALID_JSON");
    }

    const action = request.action;
    const data = request.data;

    if (!action) {
      return errorResponse("Parameter action wajib diisi", "ACTION_REQUIRED");
    }

    switch (action) {
      // Classes
      case "createClass":
        return createClass(data);

      case "updateClass":
        return updateClass(data);

      case "syncDatabaseStructure":
        return syncDatabaseStructure();

      // Students
      case "createStudent":
        return createStudent(data);

      case "updateStudent":
        return updateStudent(data);

      case "archiveStudent":
        return archiveStudent(data);

      // Examinations
      case "createExamination":
        return createExamination(data);

      case "updateExamination":
        return updateExamination(data);

      // Screenings
      case "createScreening":
        return createScreening(data);

      case "updateScreening":
        return updateScreening(data);

      // TTD
      case "createTTD":
        return createTTD(data);

      case "updateTTD":
        return updateTTD(data);

      // Educations
      case "createEducation":
        return createEducation(data);

      case "updateEducation":
        return updateEducation(data);

      default:
        return errorResponse("Action POST tidak dikenali", "UNKNOWN_ACTION", { action: action });
    }
  } catch (error) {
    return errorResponse("Terjadi kesalahan pada server", "INTERNAL_SERVER_ERROR", { error_detail: error.message });
  }
}