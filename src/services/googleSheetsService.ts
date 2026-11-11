/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { TaxpayerSurveyRecord, CSV_EXCEL_HEADERS } from '../types/tax';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (Do NOT store in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // In-memory token might have cleared upon page refresh
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถรับ Access Token จาก Google ได้');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Format a TaxpayerSurveyRecord into an array of 30 values matching CSV_EXCEL_HEADERS
 */
export function formatRecordToRow(record: TaxpayerSurveyRecord): (string | number)[] {
  // Extract all photos summary
  const allPhotos = [
    ...(record.photos || []),
    ...(record.signboards?.flatMap((s) => s.photos || []) || []),
  ].filter(Boolean);
  const photosStr = allPhotos.length > 0 ? allPhotos.join(' ; ') : '';

  // Format signboards JSON summary
  const signsSummaryJson = JSON.stringify(
    record.signboards?.map((s, idx) => ({
      ลำดับ: idx + 1,
      ประเภท: s.signType,
      ขนาด: `${s.widthCm}x${s.lengthCm} ซม.`,
      เนื้อที่: `${s.areaSqCm} ตร.ซม.`,
      จำนวนป้าย: s.quantity,
      ข้อความ: s.messagePreview,
      สถานที่ติดตั้ง: s.installLocation,
      วันที่ติดตั้ง: s.installDate,
      ภาษี: s.taxAmount,
      รูปถ่ายจำนวน: s.photos?.length || 0,
    })) || []
  );

  return [
    record.id || '', // 1. รหัสอ้างอิง (ID)
    record.recordDate || '', // 2. วันที่บันทึก
    record.nameCode || '', // 3. รหัสชื่อ
    record.landPlotCode || '', // 4. รหัสแปลงที่ดิน
    record.mapSheet || '', // 5. แผ่นที่
    record.inSheet || '', // 6. ในแผ่น
    record.taxpayerName || '', // 7. ชื่อ-สกุล เจ้าของป้าย
    record.citizenId || '', // 8. เลขบัตรประชาชน
    record.phone || '', // 9. เบอร์โทรศัพท์
    photosStr, // 10. รูปถ่ายป้าย
    record.houseNo || '', // 11. บ้านเลขที่
    record.villageNo || '', // 12. หมู่ที่ (ที่อยู่)
    record.street || '', // 13. ถนน
    record.soi || '', // 14. ซอย
    record.subdistrict || 'พระซอง', // 15. ตำบล
    record.district || 'นาแก', // 16. อำเภอ
    record.province || 'นครพนม', // 17. จังหวัด
    record.signStreet || '', // 18. ป้ายตั้งอยู่ถนน
    record.signSoi || '', // 19. ป้ายตั้งอยู่ซอย
    record.signVillageNo || '', // 20. หมู่บ้านที่ตั้งป้าย (1-16)
    record.latitude || 0, // 21. พิกัด Latitude
    record.longitude || 0, // 22. พิกัด Longitude
    signsSummaryJson, // 23. รายการป้ายและใบอนุญาต (JSON)
    record.totalEstimatedTax || 0, // 24. รวมภาษีป้ายประเมิน (บาท)
    record.surveyorName || '', // 25. ชื่อผู้สำรวจ
    record.surveyorPosition || '', // 26. ตำแหน่งผู้สำรวจ
    record.surveyDate || '', // 27. วันที่สำรวจ
    record.inspectorName || '', // 28. ชื่อผู้ตรวจ
    record.inspectorPosition || '', // 29. ตำแหน่งผู้ตรวจ
    record.inspectionDate || '', // 30. วันที่ตรวจ
  ];
}

/**
 * สร้าง Google Spreadsheet ใหม่ใน Google Drive ของผู้ใช้
 */
export async function createGoogleSpreadsheet(
  title: string = 'ฐานข้อมูลสำรวจภาษีป้าย เทศบาลตำบลพระซอง'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google เพื่อสร้างเอกสาร');

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'ข้อมูลสำรวจภาษีป้าย',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err?.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;

  // Add the 30 header columns
  await appendSheetValues(spreadsheetId, 'ข้อมูลสำรวจภาษีป้าย!A1', [CSV_EXCEL_HEADERS]);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * เพิ่มแถวข้อมูลลงใน Google Sheet
 */
export async function appendSheetValues(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google ก่อนซิงค์ข้อมูล');

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err?.error?.message || 'ไม่สามารถบันทึกข้อมูลลง Google Sheet ได้');
  }
}

/**
 * ซิงค์ข้อมูลทั้งหมดลงใน Google Sheet (แทนที่เนื้อหาหรืออัปเดตข้อมูล)
 */
export async function syncAllRecordsToGoogleSheet(
  spreadsheetId: string,
  records: TaxpayerSurveyRecord[]
): Promise<number> {
  const token = await getAccessToken();
  if (!token) throw new Error('กรุณาลงชื่อเข้าใช้ Google ก่อนซิงค์ข้อมูล');

  const rows = records.map(formatRecordToRow);
  const allData = [CSV_EXCEL_HEADERS, ...rows];

  // Overwrite Sheet from A1
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ข้อมูลสำรวจภาษีป้าย!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'ข้อมูลสำรวจภาษีป้าย!A1',
        values: allData,
      }),
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err?.error?.message || 'ซิงค์ข้อมูลลง Google Sheet ไม่สำเร็จ');
  }

  return rows.length;
}
