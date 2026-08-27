'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Student, ClassRoom } from '@/types/models';
import { resolveClassName } from '@/lib/adapters/schoolAdapter';
import { Search, UserCheck, X, ChevronDown, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StudentAutocompleteProps {
  label?: string;
  value?: string; // selected student ID (e.g. STD001)
  onChange: (student: Student | null) => void;
  students: Student[];
  classes?: ClassRoom[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  autoFocus?: boolean;
}

export function StudentAutocomplete({
  label = 'Nama Siswa',
  value,
  onChange,
  students = [],
  classes = [],
  error,
  required,
  placeholder = 'Ketik nama siswa (contoh: Siti / Muhammad / Putri)...',
  disabled = false,
  helperText,
  autoFocus = false,
}: StudentAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find currently selected student
  const selectedStudent = useMemo(() => {
    if (!value) return null;
    return students.find(s => s.id === value) || null;
  }, [value, students]);

  // Debounce search term (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on partial search
  const filteredStudents = useMemo(() => {
    if (!debouncedSearch) {
      // Return first 15 active students when search is empty
      return students
        .filter(s => s.status === 'active' || !s.status)
        .slice(0, 15);
    }

    return students
      .filter(student => {
        const nameMatch = (student.nama || '').toLowerCase().includes(debouncedSearch);
        const codeMatch = (student.student_code || '').toLowerCase().includes(debouncedSearch);
        return nameMatch || codeMatch;
      })
      .slice(0, 15);
  }, [students, debouncedSearch]);

  // Handle student selection
  const handleSelectStudent = useCallback(
    (student: Student) => {
      onChange(student);
      setSearchTerm('');
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  // Clear selection
  const handleClearSelection = useCallback(() => {
    onChange(null);
    setSearchTerm('');
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onChange]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredStudents.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredStudents.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredStudents.length) {
        handleSelectStudent(filteredStudents[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full" ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {selectedStudent && (
            <span className="text-[11px] font-medium text-sky-600">Siswa Terpilih</span>
          )}
        </label>
      )}

      {/* Selected Student Display or Search Input */}
      {selectedStudent && !isOpen ? (
        <div className="flex items-center justify-between p-2.5 sm:p-3 bg-sky-50/80 border border-sky-200 rounded-xl transition-all hover:bg-sky-50 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 shadow-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {selectedStudent.nama}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider',
                    selectedStudent.gender === 'P'
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  )}
                >
                  {selectedStudent.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-sky-700">
                  {resolveClassName(selectedStudent.class_id, classes)}
                </span>
                {selectedStudent.student_code && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-slate-500">
                      No. {selectedStudent.student_code}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearSelection}
            disabled={disabled}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
            title="Ganti Siswa"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              className={cn(
                'w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-medium bg-white border rounded-xl transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-2xs',
                error
                  ? 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-rose-400'
                  : 'border-slate-300 text-slate-900 hover:border-slate-400'
              )}
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChevronDown
                className="absolute right-3 w-4 h-4 text-slate-400 cursor-pointer pointer-events-none"
                onClick={() => setIsOpen(!isOpen)}
              />
            )}
          </div>

          {/* Autocomplete Dropdown Menu */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    Siswa tidak ditemukan
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {debouncedSearch
                      ? `Tidak ada siswa yang cocok dengan "${debouncedSearch}".`
                      : 'Belum ada data siswa terdaftar.'}
                  </p>
                </div>
              ) : (
                <div className="py-1">
                  {filteredStudents.map((student, idx) => {
                    const isSelected = selectedStudent?.id === student.id;
                    const isHighlighted = highlightedIndex === idx;
                    const studentClassName = resolveClassName(student.class_id, classes);

                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleSelectStudent(student)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          'w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors',
                          isHighlighted ? 'bg-sky-50 text-sky-950' : 'text-slate-800 hover:bg-slate-50',
                          isSelected && 'bg-sky-100/60 font-bold'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {student.nama ? student.nama.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                              {student.nama}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <span className="font-semibold text-sky-700">{studentClassName}</span>
                              {student.student_code && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">No. {student.student_code}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}</span>
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-sky-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation Error or Helper Text */}
      {error ? (
        <p className="text-xs font-semibold text-rose-600 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
