'use client';

import { useState, useRef, useCallback } from 'react';
import { ChildWithGrowth } from '@/lib/childrenStore';
import { GrowthDomain } from '@/types/child';
import { getGradeInFiscalYear } from '@/lib/fiscalYear';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (child: ChildWithGrowth) => void;
  fiscalYear: number;
}

const DEFAULT_DOMAINS: GrowthDomain[] = [
  'health',
  'relationships',
  'environment',
  'language',
  'expression',
];

const CSV_HEADERS = [
  '姓（ひらがな）',
  '名（ひらがな）',
  '姓（漢字）',
  '名（漢字）',
  '生年月日',
  '性別',
  'クラス',
  'アレルギー',
] as const;

const TEMPLATE_SAMPLE = [
  'やまだ',
  'たろう',
  '山田',
  '太郎',
  '2020-04-15',
  '男',
  'さくら組',
  '卵',
];

interface ParsedRow {
  rowIndex: number;
  lastName: string;
  firstName: string;
  lastNameKanji: string;
  firstNameKanji: string;
  birthDate: string;
  gender: string;
  className: string;
  allergies: string;
  errors: string[];
}

type Step = 'upload' | 'preview' | 'done';

/** BOM付きUTF-8対応: 先頭のBOMを除去 */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** ダブルクォート対応のCSV行パーサー */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/** CSV全体をパースして行配列を返す */
function parseCsv(text: string): string[][] {
  const cleaned = stripBom(text);
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map(parseCsvLine);
}

/** 性別文字列を正規化 */
function normalizeGender(raw: string): 'male' | 'female' | 'other' | null {
  const s = raw.trim();
  if (s === '男' || s === '男の子' || s === 'male') return 'male';
  if (s === '女' || s === '女の子' || s === 'female') return 'female';
  if (s === 'その他' || s === 'other') return 'other';
  return null;
}

/** 日付文字列を検証してDateを返す */
function parseDate(raw: string): Date | null {
  const s = raw.trim().replace(/\//g, '-');
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
  return d;
}

/** 各行をバリデーション付きでパース */
function validateRows(rows: string[][]): ParsedRow[] {
  return rows.map((cols, i) => {
    const errors: string[] = [];
    const lastName = cols[0] ?? '';
    const firstName = cols[1] ?? '';
    const lastNameKanji = cols[2] ?? '';
    const firstNameKanji = cols[3] ?? '';
    const birthDate = cols[4] ?? '';
    const gender = cols[5] ?? '';
    const className = cols[6] ?? '';
    const allergies = cols[7] ?? '';

    if (!lastName) errors.push('姓（ひらがな）は必須です');
    if (!firstName) errors.push('名（ひらがな）は必須です');
    if (!className) errors.push('クラスは必須です');
    if (birthDate && !parseDate(birthDate)) errors.push('生年月日の形式が不正です（YYYY-MM-DD）');
    if (gender && !normalizeGender(gender)) errors.push('性別は「男」「女」「その他」のいずれかを入力してください');

    return {
      rowIndex: i + 1,
      lastName,
      firstName,
      lastNameKanji,
      firstNameKanji,
      birthDate,
      gender,
      className,
      allergies,
      errors,
    };
  });
}

export default function ChildCsvImportModal({ open, onClose, onCreate, fiscalYear }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [addedCount, setAddedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const allRows = parseCsv(text);
      if (allRows.length === 0) return;

      // ヘッダー行をスキップ（最初の行が「姓」を含んでいたら）
      const firstCell = allRows[0][0] ?? '';
      const dataRows = firstCell.includes('姓') ? allRows.slice(1) : allRows;
      if (dataRows.length === 0) return;

      const validated = validateRows(dataRows);
      setParsedRows(validated);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!open) return null;

  const reset = () => {
    setStep('upload');
    setParsedRows([]);
    setAddedCount(0);
    setIsDragging(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const bom = '\uFEFF';
    const header = CSV_HEADERS.join(',');
    const sample = TEMPLATE_SAMPLE.join(',');
    const csvContent = bom + header + '\n' + sample + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '園児インポートテンプレート.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const hasErrors = parsedRows.some((r) => r.errors.length > 0);
  const validRows = parsedRows.filter((r) => r.errors.length === 0);

  const handleImport = () => {
    const now = new Date();
    let count = 0;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      const bd = row.birthDate ? parseDate(row.birthDate) ?? new Date() : new Date();
      const grade = getGradeInFiscalYear(bd, fiscalYear);

      const newChild: ChildWithGrowth = {
        id: `child-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        firstName: row.firstName,
        lastName: row.lastName,
        firstNameKanji: row.firstNameKanji || undefined,
        lastNameKanji: row.lastNameKanji || undefined,
        birthDate: bd,
        classId: row.className,
        className: row.className,
        grade,
        gender: normalizeGender(row.gender) ?? 'other',
        allergies: row.allergies
          ? row.allergies.split(/[,、]/).map((s) => s.trim()).filter(Boolean)
          : [],
        characteristics: [],
        interests: [],
        relationships: [],
        emergencyContact: { name: '', phone: '', relationship: '' },
        createdAt: now,
        updatedAt: now,
        growthLevels: DEFAULT_DOMAINS.map((domain) => ({
          domain,
          level: 1 as const,
          lastUpdated: now,
          linkedEpisodeIds: [],
        })),
      };

      onCreate(newChild);
      count++;
    }

    setAddedCount(count);
    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-secondary/20 flex items-center justify-between sticky top-0 bg-surface z-10">
          <h2 className="text-lg font-bold text-headline">CSVインポート</h2>
          <button onClick={handleClose} className="text-paragraph/60 hover:text-paragraph">
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-paragraph/70">
                CSVファイルから園児を一括登録できます。まずテンプレートをダウンロードして、園児情報を入力してください。
              </p>

              {/* Template Download */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 border border-button/30 text-button rounded-lg hover:bg-button/5 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                テンプレートCSVをダウンロード
              </button>

              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-button bg-button/5'
                    : 'border-secondary/40 hover:border-button/50'
                }`}
              >
                <svg className="w-10 h-10 mx-auto mb-3 text-paragraph/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-paragraph/70">
                  CSVファイルをドラッグ&ドロップ
                </p>
                <p className="text-xs text-paragraph/50 mt-1">
                  またはクリックしてファイルを選択
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Format Info */}
              <div className="text-xs text-paragraph/50 space-y-1">
                <p>対応形式: UTF-8 CSV（BOM付き可）</p>
                <p>列: 姓（ひらがな）, 名（ひらがな）, 姓（漢字）, 名（漢字）, 生年月日, 性別, クラス, アレルギー</p>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-paragraph/70">
                  {parsedRows.length}件のデータを検出しました
                  {hasErrors && (
                    <span className="text-alert ml-2">
                      （{parsedRows.length - validRows.length}件にエラーあり）
                    </span>
                  )}
                </p>
                <button
                  onClick={reset}
                  className="text-xs text-button hover:underline"
                >
                  やり直す
                </button>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border border-secondary/20 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/10 text-left text-xs text-paragraph/60">
                      <th className="px-3 py-2 w-8">#</th>
                      <th className="px-3 py-2">姓</th>
                      <th className="px-3 py-2">名</th>
                      <th className="px-3 py-2">漢字</th>
                      <th className="px-3 py-2">生年月日</th>
                      <th className="px-3 py-2">性別</th>
                      <th className="px-3 py-2">クラス</th>
                      <th className="px-3 py-2">アレルギー</th>
                      <th className="px-3 py-2">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={row.errors.length > 0 ? 'bg-red-50' : 'hover:bg-secondary/5'}
                      >
                        <td className="px-3 py-2 text-xs text-paragraph/50">{row.rowIndex}</td>
                        <td className="px-3 py-2">{row.lastName}</td>
                        <td className="px-3 py-2">{row.firstName}</td>
                        <td className="px-3 py-2 text-xs">
                          {row.lastNameKanji} {row.firstNameKanji}
                        </td>
                        <td className="px-3 py-2 text-xs">{row.birthDate}</td>
                        <td className="px-3 py-2 text-xs">{row.gender}</td>
                        <td className="px-3 py-2 text-xs">{row.className}</td>
                        <td className="px-3 py-2 text-xs">{row.allergies}</td>
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <span className="text-xs text-alert" title={row.errors.join('\n')}>
                              {row.errors[0]}
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-secondary/30 rounded-lg text-paragraph hover:bg-secondary/10"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0}
                  className="flex-1 px-4 py-2 bg-button text-white rounded-lg hover:bg-button/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validRows.length}件をインポート
                </button>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-headline">
                {addedCount}名の園児を追加しました
              </h3>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-button text-white rounded-lg hover:bg-button/90"
              >
                閉じる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
