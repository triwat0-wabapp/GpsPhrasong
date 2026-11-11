/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SignboardTypeCategory =
  | 'type1_static'     // ประเภท 1 (ข) ป้ายอักษรไทยล้วน นิ่ง (5 บ./500 ตร.ซม.)
  | 'type1_dynamic'    // ประเภท 1 (ก) ป้ายอักษรไทยล้วน เคลื่อนไหว/เปลี่ยนได้ (10 บ./500 ตร.ซม.)
  | 'type2_static'     // ประเภท 2 (ข) ป้ายอักษรไทยปนอักษรต่างประเทศ/ภาพ นิ่ง (26 บ./500 ตร.ซม.)
  | 'type2_dynamic'    // ประเภท 2 (ก) ป้ายอักษรไทยปนอักษรต่างประเทศ/ภาพ เคลื่อนไหว (52 บ./500 ตร.ซม.)
  | 'type3_static'     // ประเภท 3 (ข) ป้ายไม่มีอักษรไทย หรืออักษรไทยอยู่ต่ำกว่าต่างประเทศ นิ่ง (50 บ./500 ตร.ซม.)
  | 'type3_dynamic';   // ประเภท 3 (ก) ป้ายไม่มีอักษรไทย หรืออักษรไทยอยู่ต่ำกว่าต่างประเทศ เคลื่อนไหว (52 บ./500 ตร.ซม.)

export interface SignboardItem {
  id: string;
  signType: SignboardTypeCategory;
  widthCm: number;
  lengthCm: number;
  areaSqCm: number;
  quantity: number;
  messagePreview: string; // ข้อความหรือภาพหรือเครื่องหมายที่ปรากฏในป้ายโดยย่อ
  installLocation: string; // ป้ายตั้งอยู่ถนน, ซอย, สถานที่ใกล้เคียง
  installDate: string; // วันที่ติดตั้งป้าย (แสดงป้าย)
  isExempt?: boolean; // ได้รับการยกเว้นหรือไม่ (เช่น ป้ายราชการ, ป้ายในโรงเรือนไม่เกินเกณฑ์)
  exemptReason?: string;
  ratePer500SqCm: number;
  calculatedUnits: number; // Math.ceil(areaSqCm / 500)
  taxAmount: number; // Math.max(200, calculatedUnits * ratePer500SqCm) * quantity
  photos: string[]; // รูปถ่ายป้าย (สามารถมีได้หลายภาพต่อป้าย)
  notes?: string;
}

export type PaymentStatus = 'pending' | 'notified' | 'paid' | 'overdue';

export interface TaxpayerSurveyRecord {
  id: string; // รหัสอ้างอิง (ID)
  recordDate: string; // วันที่บันทึก
  nameCode: string; // รหัสชื่อ (เช่น ช-001)
  landPlotCode: string; // รหัสแปลงที่ดิน
  mapSheet: string; // แผ่นที่
  inSheet: string; // ในแผ่น
  taxpayerName: string; // ชื่อ-สกุล เจ้าของป้าย
  citizenId: string; // เลขบัตรประชาชน
  phone: string; // เบอร์โทรศัพท์
  email?: string; // อีเมลสำหรับแจ้งเตือน
  photos: string[]; // รูปถ่ายป้ายรวม / รูปถ่ายภาพรวม
  documents?: { name: string; url: string; uploadDate: string }[]; // เอกสารหลักฐาน

  // ที่อยู่เจ้าของป้าย
  houseNo: string; // บ้านเลขที่
  villageNo: string; // หมู่ที่ (ที่อยู่)
  street: string; // ถนน
  soi: string; // ซอย
  subdistrict: string; // ตำบล (พระซอง)
  district: string; // อำเภอ (นาแก)
  province: string; // จังหวัด (นครพนม)

  // สถานที่ตั้งป้าย
  signStreet: string; // ป้ายตั้งอยู่ถนน
  signSoi: string; // ป้ายตั้งอยู่ซอย
  signVillageNo: string; // หมู่บ้านที่ตั้งป้าย (1-16)
  latitude: number; // พิกัด Latitude
  longitude: number; // พิกัด Longitude

  // รายการป้าย
  signboards: SignboardItem[];
  totalEstimatedTax: number; // รวมภาษีป้ายประเมิน (บาท)

  // ข้อมูลผู้สำรวจและผู้ตรวจ
  surveyorName: string; // ชื่อผู้สำรวจ
  surveyorPosition: string; // ตำแหน่งผู้สำรวจ
  surveyDate: string; // วันที่สำรวจ
  inspectorName: string; // ชื่อผู้ตรวจ
  inspectorPosition: string; // ตำแหน่งผู้ตรวจ
  inspectionDate: string; // วันที่ตรวจ

  // การชำระเงินและแจ้งเตือน
  paymentStatus: PaymentStatus;
  dueDate: string; // วันครบกำหนดชำระ (เช่น 15 วันหลังแจ้ง หรือภายใน 31 มี.ค.)
  paidAmount?: number;
  paidDate?: string;
  receiptNumber?: string;
  notes?: string;
}

// 16 หมู่ในตำบลพระซอง อำเภอนาแก จังหวัดนครพนม (หมู่ 1-16)
export const PHRA_SONG_VILLAGES = [
  { no: '1', name: 'หมู่ 1' },
  { no: '2', name: 'หมู่ 2' },
  { no: '3', name: 'หมู่ 3' },
  { no: '4', name: 'หมู่ 4' },
  { no: '5', name: 'หมู่ 5' },
  { no: '6', name: 'หมู่ 6' },
  { no: '7', name: 'หมู่ 7' },
  { no: '8', name: 'หมู่ 8' },
  { no: '9', name: 'หมู่ 9' },
  { no: '10', name: 'หมู่ 10' },
  { no: '11', name: 'หมู่ 11' },
  { no: '12', name: 'หมู่ 12' },
  { no: '13', name: 'หมู่ 13' },
  { no: '14', name: 'หมู่ 14' },
  { no: '15', name: 'หมู่ 15' },
  { no: '16', name: 'หมู่ 16' },
];

export const SIGN_TYPE_INFO: Record<
  SignboardTypeCategory,
  { label: string; rate: number; categoryName: string; movingType: string }
> = {
  type1_static: {
    label: 'ประเภท 1 (ข) อักษรไทยล้วน - ป้ายนิ่ง',
    rate: 5,
    categoryName: 'ประเภท 1: อักษรไทยล้วน',
    movingType: 'ข้อความนิ่ง/ไม่เคลื่อนไหว (5 บ./500 ตร.ซม.)',
  },
  type1_dynamic: {
    label: 'ประเภท 1 (ก) อักษรไทยล้วน - เคลื่อนไหว/เปลี่ยนได้',
    rate: 10,
    categoryName: 'ประเภท 1: อักษรไทยล้วน',
    movingType: 'เคลื่อนไหวหรือเปลี่ยนข้อความได้ (10 บ./500 ตร.ซม.)',
  },
  type2_static: {
    label: 'ประเภท 2 (ข) อักษรไทยปนต่างประเทศ/ภาพ - ป้ายนิ่ง',
    rate: 26,
    categoryName: 'ประเภท 2: อักษรไทยปนต่างประเทศหรือภาพ',
    movingType: 'ข้อความ/ภาพนิ่ง (26 บ./500 ตร.ซม.)',
  },
  type2_dynamic: {
    label: 'ประเภท 2 (ก) อักษรไทยปนต่างประเทศ/ภาพ - เคลื่อนไหว',
    rate: 52,
    categoryName: 'ประเภท 2: อักษรไทยปนต่างประเทศหรือภาพ',
    movingType: 'เคลื่อนไหวหรือเปลี่ยนเป็นอย่างอื่นได้ (52 บ./500 ตร.ซม.)',
  },
  type3_static: {
    label: 'ประเภท 3 (ข) ไม่มีอักษรไทย หรือไทยต่ำกว่าต่างประเทศ - ป้ายนิ่ง',
    rate: 50,
    categoryName: 'ประเภท 3: ไม่มีอักษรไทย/ไทยอยู่ต่ำกว่า',
    movingType: 'ข้อความ/ภาพนิ่ง (50 บ./500 ตร.ซม.)',
  },
  type3_dynamic: {
    label: 'ประเภท 3 (ก) ไม่มีอักษรไทย หรือไทยต่ำกว่าต่างประเทศ - เคลื่อนไหว',
    rate: 52,
    categoryName: 'ประเภท 3: ไม่มีอักษรไทย/ไทยอยู่ต่ำกว่า',
    movingType: 'เคลื่อนไหวหรือเปลี่ยนเป็นอย่างอื่นได้ (52 บ./500 ตร.ซม.)',
  },
};

// 30 Column Headers in exact order matching attached file
export const CSV_EXCEL_HEADERS = [
  'รหัสอ้างอิง (ID)',
  'วันที่บันทึก',
  'รหัสชื่อ',
  'รหัสแปลงที่ดิน',
  'แผ่นที่',
  'ในแผ่น',
  'ชื่อ-สกุล เจ้าของป้าย',
  'เลขบัตรประชาชน',
  'เบอร์โทรศัพท์',
  'รูปถ่ายป้าย',
  'บ้านเลขที่',
  'หมู่ที่ (ที่อยู่)',
  'ถนน',
  'ซอย',
  'ตำบล',
  'อำเภอ',
  'จังหวัด',
  'ป้ายตั้งอยู่ถนน',
  'ป้ายตั้งอยู่ซอย',
  'หมู่บ้านที่ตั้งป้าย (1-16)',
  'พิกัด Latitude',
  'พิกัด Longitude',
  'รายการป้ายและใบอนุญาต (JSON)',
  'รวมภาษีป้ายประเมิน (บาท)',
  'ชื่อผู้สำรวจ',
  'ตำแหน่งผู้สำรวจ',
  'วันที่สำรวจ',
  'ชื่อผู้ตรวจ',
  'ตำแหน่งผู้ตรวจ',
  'วันที่ตรวจ',
];
