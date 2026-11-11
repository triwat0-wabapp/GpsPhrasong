/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SignboardItem, SignboardTypeCategory, SIGN_TYPE_INFO } from '../types/tax';

/**
 * คำนวณเนื้อที่และภาษีป้ายตามกฎกระทรวงกำหนดอัตราภาษีป้าย พ.ศ. 2563
 * และพระราชบัญญัติภาษีป้าย พ.ศ. 2510
 * - ฐานภาษี: เนื้อที่ป้ายทุก 500 ตารางเซนติเมตร (เศษของ 500 ตร.ซม. ปัดเป็น 1 หน่วย)
 * - ภาษีขั้นต่ำ: หากคำนวณแล้วไม่ถึง 200 บาท ให้เสียขั้นต่ำ 200 บาทต่อป้าย
 */
export function calculateSignboardTax(
  widthCm: number,
  lengthCm: number,
  signType: SignboardTypeCategory,
  quantity: number = 1,
  isExempt: boolean = false
): {
  areaSqCm: number;
  calculatedUnits: number;
  ratePer500SqCm: number;
  subtotalBeforeMin: number;
  taxAmount: number;
  formulaDescription: string;
} {
  if (isExempt) {
    return {
      areaSqCm: Math.round(widthCm * lengthCm),
      calculatedUnits: 0,
      ratePer500SqCm: 0,
      subtotalBeforeMin: 0,
      taxAmount: 0,
      formulaDescription: 'ได้รับการยกเว้นตามกฎหมายภาษีป้าย',
    };
  }

  const safeWidth = Math.max(0, widthCm || 0);
  const safeLength = Math.max(0, lengthCm || 0);
  const safeQty = Math.max(1, quantity || 1);
  const areaSqCm = Math.round(safeWidth * safeLength * 100) / 100;

  const rateInfo = SIGN_TYPE_INFO[signType] || SIGN_TYPE_INFO.type1_static;
  const ratePer500SqCm = rateInfo.rate;

  // ทุก 500 ตร.ซม. เศษปัดขึ้น
  const calculatedUnits = areaSqCm > 0 ? Math.ceil(areaSqCm / 500) : 0;
  const calculatedPerSign = calculatedUnits * ratePer500SqCm;

  // กฎหมายกำหนดภาษีป้ายขั้นต่ำไม่น้อยกว่า 200 บาทต่อป้าย
  const finalPerSign = areaSqCm > 0 ? Math.max(200, calculatedPerSign) : 0;
  const totalTax = finalPerSign * safeQty;

  const isMinApplied = calculatedPerSign < 200 && areaSqCm > 0;
  const formulaDescription =
    areaSqCm > 0
      ? `กว้าง ${safeWidth} x ยาว ${safeLength} = ${areaSqCm.toLocaleString()} ตร.ซม. (${calculatedUnits} หน่วย x ${ratePer500SqCm} บ. = ${calculatedPerSign.toLocaleString()} บ. ${
          isMinApplied ? '-> คิดขั้นต่ำ 200 บ.' : ''
        }) x ${safeQty} ป้าย`
      : 'กรุณาระบุขนาดป้าย';

  return {
    areaSqCm,
    calculatedUnits,
    ratePer500SqCm,
    subtotalBeforeMin: calculatedPerSign * safeQty,
    taxAmount: totalTax,
    formulaDescription,
  };
}

/**
 * คำนวณยอดรวมของภาษีป้ายทั้งหมดสำหรับผู้เสียภาษี 1 ราย
 */
export function calculateTotalTax(signboards: SignboardItem[]): number {
  if (!signboards || signboards.length === 0) return 0;
  return signboards.reduce((acc, sign) => acc + (sign.taxAmount || 0), 0);
}

/**
 * แปลงจำนวนเงินเป็นตัวหนังสือภาษาไทย (Baht Text) สำหรับแบบ ภ.ป.1
 */
export function thaiBahtText(num: number): string {
  if (num === 0 || isNaN(num)) return 'ศูนย์บาทถ้วน';

  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const parts = num.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let result = '';

  function convertGroup(group: string): string {
    let text = '';
    const len = group.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(group[i], 10);
      const pos = len - 1 - i;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          text += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          text += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && group[len - 2] !== '0') {
          text += 'เอ็ด';
        } else {
          text += numbers[digit] + units[pos];
        }
      }
    }
    return text;
  }

  // Handle millions
  if (integerPart.length > 6) {
    const millionPart = integerPart.slice(0, -6);
    integerPart = integerPart.slice(-6);
    result += convertGroup(millionPart) + 'ล้าน';
  }

  result += convertGroup(integerPart) + 'บาท';

  if (decimalPart === '00' || !decimalPart) {
    result += 'ถ้วน';
  } else {
    let satangText = '';
    const d1 = parseInt(decimalPart[0], 10);
    const d2 = parseInt(decimalPart[1], 10);
    if (d1 === 1) satangText += 'สิบ';
    else if (d1 === 2) satangText += 'ยี่สิบ';
    else if (d1 > 2) satangText += numbers[d1] + 'สิบ';

    if (d2 === 1 && d1 !== 0) satangText += 'เอ็ด';
    else if (d2 > 0) satangText += numbers[d2];

    result += satangText + 'สตางค์';
  }

  return result;
}
