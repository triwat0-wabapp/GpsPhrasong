/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { TaxpayerSurveyRecord, CSV_EXCEL_HEADERS, SignboardItem, SignboardTypeCategory } from '../types/tax';
import { formatRecordToRow } from './googleSheetsService';

const STORAGE_KEY = 'phrasong_tax_surveys_v1';
const WEBHOOK_URL_KEY = 'phrasong_webhook_url';

// Default initial records including the exact record from the user's attachment
export const INITIAL_RECORDS: TaxpayerSurveyRecord[] = [
  {
    id: 'FT3-1794229400718',
    recordDate: '2026-11-09',
    nameCode: '1-001/2569',
    landPlotCode: '04-A-012',
    mapSheet: '1',
    inSheet: '1',
    taxpayerName: 'นายไปตรวรรธก์ ทองยืน',
    citizenId: '1480700078864',
    phone: '0963657309',
    email: 'prhrasong2020@gmail.com',
    photos: [],
    documents: [],
    houseNo: '120',
    villageNo: '13',
    street: '-',
    soi: '-',
    subdistrict: 'พระซอง',
    district: 'นาแก',
    province: 'นครพนม',
    signStreet: '-',
    signSoi: '-',
    signVillageNo: '1',
    latitude: 16.9825,
    longitude: 104.5242,
    signboards: [
      {
        id: 'SIGN-1',
        signType: 'type1_static',
        widthCm: 100,
        lengthCm: 200,
        areaSqCm: 20000,
        quantity: 1,
        messagePreview: 'ร้านทดสอบ',
        installLocation: 'หมู่ 1 ต.พระซอง อ.นาแก จ.นครพนม',
        installDate: '2026-11-09',
        ratePer500SqCm: 5,
        calculatedUnits: 40,
        taxAmount: 200,
        photos: [],
        notes: 'ป้ายอักษรไทยล้วน',
      },
    ],
    totalEstimatedTax: 200,
    surveyorName: 'นายไตรวรรธก์ ทองยืน',
    surveyorPosition: 'ผช.จพ.จัดเก็บรายได้',
    surveyDate: '2026-11-09',
    inspectorName: 'จ่าเอกณัฐศักดิ์ รักษาผล',
    inspectorPosition: 'ผู้อำนวยการกองคลัง',
    inspectionDate: '2026-11-09',
    paymentStatus: 'pending',
    dueDate: '2027-03-31',
    notes: 'ข้อมูลสำรวจจากระบบฐานข้อมูลภาษีป้าย ทต.พระซอง',
  },
  {
    id: 'PS-67-0001',
    recordDate: '2025-01-15',
    nameCode: 'ช-001',
    landPlotCode: '4843 IV 1234-01',
    mapSheet: '4843 IV',
    inSheet: '12',
    taxpayerName: 'นายสมศักดิ์ วงศ์สวัสดิ์',
    citizenId: '3-4806-00123-45-1',
    phone: '081-234-5678',
    email: 'somsak.phrasong@gmail.com',
    photos: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    ],
    documents: [],
    houseNo: '88/1',
    villageNo: '1',
    street: 'นาแก-ดงหลวง',
    soi: 'เทศบาล 1',
    subdistrict: 'พระซอง',
    district: 'นาแก',
    province: 'นครพนม',
    signStreet: 'ทางหลวงแผ่นดิน 223 (นาแก-ดงหลวง)',
    signSoi: 'หน้าตลาดสดพระซอง',
    signVillageNo: '1',
    latitude: 16.9455,
    longitude: 104.5028,
    signboards: [
      {
        id: 'SIGN-001-A',
        signType: 'type2_static',
        widthCm: 120,
        lengthCm: 250,
        areaSqCm: 30000,
        quantity: 1,
        messagePreview: 'สมศักดิ์การเกษตร ปุ๋ย ยา เมล็ดพันธุ์ (Somsak Agro)',
        installLocation: 'หน้าร้าน ติดถนนสายหลัก ตรงข้ามวัดพระซอง',
        installDate: '2024-03-01',
        ratePer500SqCm: 26,
        calculatedUnits: 60,
        taxAmount: 1560,
        photos: [
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
        ],
        notes: 'ป้ายไวนิลโครงเหล็ก สภาพดี ตัวอักษรไทยชัดเจน มีชื่อภาษาอังกฤษปน',
      },
      {
        id: 'SIGN-001-B',
        signType: 'type1_static',
        widthCm: 80,
        lengthCm: 150,
        areaSqCm: 12000,
        quantity: 1,
        messagePreview: 'เปิดบริการทุกวัน 07.00 - 18.00 น.',
        installLocation: 'ติดข้างประตูทางเข้าร้าน',
        installDate: '2024-03-01',
        ratePer500SqCm: 5,
        calculatedUnits: 24,
        taxAmount: 200,
        photos: [
          'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=600&q=80',
        ],
        notes: 'ป้ายอักษรไทยล้วน คำนวณได้ 120 บาท คิดอัตราขั้นต่ำตามกฎหมาย 200 บาท',
      },
    ],
    totalEstimatedTax: 1760,
    surveyorName: 'นายไตรวรรธก์ ทองยืน',
    surveyorPosition: 'ผช.จพ.จัดเก็บรายได้',
    surveyDate: '2025-01-15',
    inspectorName: 'จ่าเอกณัฐศักดิ์ รักษาผล',
    inspectorPosition: 'ผู้อำนวยการกองคลัง',
    inspectionDate: '2025-01-16',
    paymentStatus: 'paid',
    dueDate: '2025-03-31',
    paidAmount: 1760,
    paidDate: '2025-02-10',
    receiptNumber: 'REC-67-0042',
    notes: 'ชำระภาษีป้ายประจำปีเรียบร้อยแล้ว',
  },
];

/**
 * Fetch records from server disk database without requiring login.
 * Falls back to localStorage and seed records if server is unreachable.
 */
export async function fetchServerRecords(): Promise<TaxpayerSurveyRecord[]> {
  try {
    const res = await fetch('/api/records');
    if (res.ok) {
      const data = await res.json();
      if (data.records && Array.isArray(data.records) && data.records.length > 0) {
        saveRecordsToLocal(data.records);
        return data.records;
      }
    }
  } catch (err) {
    console.warn('Cannot reach server API, using local storage cache:', err);
  }
  return getStoredRecords();
}

export function getStoredRecords(): TaxpayerSurveyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      return INITIAL_RECORDS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return INITIAL_RECORDS;
  }
}

export function saveRecordsToLocal(records: TaxpayerSurveyRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Save single record to both Server Database & LocalStorage (Zero Login required)
 */
export async function addOrUpdateRecord(
  record: TaxpayerSurveyRecord
): Promise<TaxpayerSurveyRecord[]> {
  const current = getStoredRecords();
  const index = current.findIndex((r) => r.id === record.id);
  let updated: TaxpayerSurveyRecord[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = record;
  } else {
    updated = [record, ...current];
  }

  saveRecordsToLocal(updated);

  // Sync to backend database silently
  try {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch (err) {
    console.warn('Server sync failed, cached locally:', err);
  }

  return updated;
}

/**
 * Delete record from both Server Database & LocalStorage
 */
export async function deleteRecord(id: string): Promise<TaxpayerSurveyRecord[]> {
  const current = getStoredRecords();
  const updated = current.filter((r) => r.id !== id);
  saveRecordsToLocal(updated);

  try {
    await fetch(`/api/records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Server delete failed, updated locally:', err);
  }

  return updated;
}

export function getSavedWebhookUrl(): string {
  return localStorage.getItem(WEBHOOK_URL_KEY) || '';
}

export function saveWebhookUrl(url: string): void {
  localStorage.setItem(WEBHOOK_URL_KEY, url);
}

/**
 * Sync all records to a Google Apps Script Webhook or custom URL without login!
 */
export async function syncToWebhookNoLogin(
  webhookUrl: string,
  records: TaxpayerSurveyRecord[]
): Promise<{ success: boolean; message: string }> {
  try {
    saveWebhookUrl(webhookUrl);
    const res = await fetch('/api/sync-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, records }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: 'ส่งข้อมูลไปยัง Google Sheets (Webhook) สำเร็จเรียบร้อย!' };
    }
    throw new Error(data.error || 'การส่งข้อมูลไม่สำเร็จ');
  } catch (err: any) {
    return { success: false, message: err?.message || 'เชื่อมต่อ Webhook ล้มเหลว' };
  }
}

/**
 * Parse CSV text matching the 30 Thai columns format
 */
export function parseThaiTaxCSV(csvText: string): TaxpayerSurveyRecord[] {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  // Split lines respecting quoted newlines
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = '';
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());

  if (lines.length < 2) return [];

  const parseCsvRow = (rowStr: string): string[] => {
    const cols: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === '"') {
        if (inQuote && rowStr[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        cols.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur);
    return cols;
  };

  const results: TaxpayerSurveyRecord[] = [];

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const cols = parseCsvRow(lines[lineIdx]);
    if (cols.length < 5) continue;

    const id = cols[0] || `PS-${Date.now()}-${lineIdx}`;
    const recordDate = cols[1] || new Date().toISOString().split('T')[0];
    const nameCode = cols[2] || '';
    const landPlotCode = cols[3] || '';
    const mapSheet = cols[4] || '';
    const inSheet = cols[5] || '';
    const taxpayerName = cols[6] || 'ไม่ระบุชื่อ';
    const citizenId = cols[7] || '';
    const phone = cols[8] || '';

    // Photos column 10 (index 9)
    let photos: string[] = [];
    try {
      if (cols[9]?.startsWith('[')) {
        photos = JSON.parse(cols[9]);
      } else if (cols[9]) {
        photos = cols[9].split(';').map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      photos = [];
    }

    const houseNo = cols[10] || '';
    const villageNoRaw = cols[11] || '';
    const villageNo = villageNoRaw.replace(/\D/g, '') || '1';
    const street = cols[12] || '-';
    const soi = cols[13] || '-';
    const subdistrict = cols[14] || 'พระซอง';
    const district = cols[15] || 'นาแก';
    const province = cols[16] || 'นครพนม';
    const signStreet = cols[17] || '-';
    const signSoi = cols[18] || '-';
    const signVillageNoRaw = cols[19] || '';
    const signVillageNo = signVillageNoRaw.replace(/\D/g, '') || '1';
    const latitude = parseFloat(cols[20]) || 16.9452;
    const longitude = parseFloat(cols[21]) || 104.5025;

    // Signboards JSON column 23 (index 22)
    let signboards: SignboardItem[] = [];
    try {
      if (cols[22]?.startsWith('[')) {
        const rawSigns = JSON.parse(cols[22]);
        signboards = rawSigns.map((rs: any, sIdx: number) => {
          let sType: SignboardTypeCategory = 'type1_static';
          if (rs.subType === '1ก') sType = 'type1_dynamic';
          else if (rs.subType === '1ข' || rs.type === '1') sType = 'type1_static';
          else if (rs.subType === '2ก') sType = 'type2_dynamic';
          else if (rs.subType === '2ข' || rs.type === '2') sType = 'type2_static';
          else if (rs.subType === '3ก') sType = 'type3_dynamic';
          else if (rs.subType === '3ข' || rs.type === '3') sType = 'type3_static';

          const width = Number(rs.width || rs.widthCm || 100);
          const length = Number(rs.length || rs.lengthCm || 200);
          const area = Number(rs.area || rs.areaSqCm || width * length);

          return {
            id: rs.id || `SIGN-${sIdx + 1}`,
            signType: sType,
            widthCm: width,
            lengthCm: length,
            areaSqCm: area,
            quantity: Number(rs.quantity || 1),
            messagePreview: rs.text || rs.messagePreview || 'ป้ายแสดงกิจการ',
            installLocation: rs.location || rs.installLocation || signStreet || '',
            installDate: rs.installDate || recordDate,
            ratePer500SqCm: Number(rs.rate || 5),
            calculatedUnits: Math.ceil(area / 500),
            taxAmount: Number(rs.tax || rs.taxAmount || 200),
            photos: rs.images || rs.photos || [],
            notes: rs.signNote || rs.notes || '',
          };
        });
      }
    } catch (e) {
      console.warn('Could not parse signboards JSON:', e);
    }

    if (signboards.length === 0) {
      signboards = [
        {
          id: 'SIGN-1',
          signType: 'type1_static',
          widthCm: 100,
          lengthCm: 200,
          areaSqCm: 20000,
          quantity: 1,
          messagePreview: 'ป้ายแสดงกิจการ',
          installLocation: signStreet,
          installDate: recordDate,
          ratePer500SqCm: 5,
          calculatedUnits: 40,
          taxAmount: 200,
          photos: [],
        },
      ];
    }

    const totalEstimatedTax = parseFloat(cols[23]) || signboards.reduce((a, s) => a + s.taxAmount, 0);
    const surveyorName = cols[24] || 'นายไตรวรรธก์ ทองยืน';
    const surveyorPosition = cols[25] || 'ผช.จพ.จัดเก็บรายได้';
    const surveyDate = cols[26] || recordDate;
    const inspectorName = cols[27] || 'จ่าเอกณัฐศักดิ์ รักษาผล';
    const inspectorPosition = cols[28] || 'ผู้อำนวยการกองคลัง';
    const inspectionDate = cols[29] || recordDate;

    results.push({
      id,
      recordDate,
      nameCode,
      landPlotCode,
      mapSheet,
      inSheet,
      taxpayerName,
      citizenId,
      phone,
      email: '',
      photos,
      documents: [],
      houseNo,
      villageNo,
      street,
      soi,
      subdistrict,
      district,
      province,
      signStreet,
      signSoi,
      signVillageNo,
      latitude,
      longitude,
      signboards,
      totalEstimatedTax,
      surveyorName,
      surveyorPosition,
      surveyDate,
      inspectorName,
      inspectorPosition,
      inspectionDate,
      paymentStatus: 'pending',
      dueDate: '2027-03-31',
    });
  }

  return results;
}

/**
 * Export all records to Excel (.xlsx) file with the exact 30 columns requested
 */
export function exportToExcel(records: TaxpayerSurveyRecord[], filename = 'รายงานสำรวจภาษีป้าย_ทต_พระซอง.xlsx') {
  const rows = records.map(formatRecordToRow);
  const data = [CSV_EXCEL_HEADERS, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-fit column widths
  const colWidths = CSV_EXCEL_HEADERS.map((header) => ({
    wch: Math.max(header.length * 2, 16),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลสำรวจภาษีป้าย');

  XLSX.writeFile(wb, filename);
}

/**
 * Export to standard CSV file (UTF-8 with BOM for Thai support in Excel)
 */
export function exportToCSV(records: TaxpayerSurveyRecord[], filename = 'รายงานสำรวจภาษีป้าย_ทต_พระซอง.csv') {
  const rows = records.map(formatRecordToRow);
  const data = [CSV_EXCEL_HEADERS, ...rows];

  const csvContent =
    '\uFEFF' +
    data
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
