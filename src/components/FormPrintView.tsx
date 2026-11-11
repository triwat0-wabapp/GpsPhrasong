/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Printer,
  ArrowLeft,
  FileText,
  CheckCircle,
  Eye,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TaxpayerSurveyRecord, SignboardItem, PHRA_SONG_VILLAGES } from '../types/tax';
import { PHRA_SONG_LOGO_URL } from './MunicipalEmblem';

interface FormPrintViewProps {
  record: TaxpayerSurveyRecord;
  onBack: () => void;
}

export const FormPrintView: React.FC<FormPrintViewProps> = ({ record, onBack }) => {
  const [printMode, setPrintMode] = useState<'both' | 'page1' | 'page2'>('both');
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);

  const handlePrint = () => {
    window.print();
  };

  const currentBuddhistYear = new Date().getFullYear() + 543;
  const villageObj = PHRA_SONG_VILLAGES.find((v) => v.no === record.signVillageNo);

  // Split signboards by official Thai category (1), (2), (3)
  const signsType1 = record.signboards.filter((s) => s.signType.startsWith('type1'));
  const signsType2 = record.signboards.filter((s) => s.signType.startsWith('type2'));
  const signsType3 = record.signboards.filter((s) => s.signType.startsWith('type3'));

  // Split estimated tax into Baht and Satang
  const taxInt = Math.floor(record.totalEstimatedTax || 0);
  const taxSatang = Math.round(((record.totalEstimatedTax || 0) - taxInt) * 100);

  // Render dotted fill row helper
  const renderRow = (sign: SignboardItem | null, isFirst: boolean, categoryLabel?: string) => {
    return (
      <tr className="border-b border-black text-[10.5pt] leading-tight">
        {/* Col 1: ประเภทป้าย */}
        <td className="border-r border-black px-1.5 py-1 text-center align-top font-normal">
          {categoryLabel ? (
            <div className="font-semibold text-left">{categoryLabel}</div>
          ) : (
            <div className="text-center font-mono text-[9pt] text-slate-400">...................</div>
          )}
        </td>

        {/* Col 2: ขนาด กว้าง */}
        <td className="border-r border-black px-1 py-1 text-center align-top font-mono">
          {sign ? (
            <span>{sign.widthCm}</span>
          ) : (
            <span className="text-slate-400 text-[9pt]">...................</span>
          )}
        </td>

        {/* Col 2: ขนาด ยาว */}
        <td className="border-r border-black px-1 py-1 text-center align-top font-mono">
          {sign ? (
            <span>{sign.lengthCm}</span>
          ) : (
            <span className="text-slate-400 text-[9pt]">...................</span>
          )}
        </td>

        {/* Col 3: เนื้อที่ป้าย ตาราง ซ.ม. */}
        <td className="border-r border-black px-1.5 py-1 text-right align-top font-mono">
          {sign ? (
            <span>{sign.areaSqCm?.toLocaleString()}</span>
          ) : (
            <div className="text-center text-slate-400 text-[9pt]">............................</div>
          )}
        </td>

        {/* Col 4: จำนวนป้าย */}
        <td className="border-r border-black px-1 py-1 text-center align-top font-mono">
          {sign ? (
            <span>{sign.quantity}</span>
          ) : (
            <span className="text-slate-400 text-[9pt]">............</span>
          )}
        </td>

        {/* Col 5: ข้อความหรือภาพหรือเครื่องหมายโดยย่อ */}
        <td className="border-r border-black px-2 py-1 align-top">
          {sign ? (
            <span className="font-normal">{sign.messagePreview}</span>
          ) : (
            <div className="text-slate-400 text-[9pt] tracking-widest">
              ........................................................................
            </div>
          )}
        </td>

        {/* Col 6: สถานที่ติดตั้งป้ายและวันติดตั้งป้าย */}
        <td className="border-r border-black px-2 py-1 align-top text-[10pt]">
          {sign ? (
            <div>
              <span>{sign.installLocation || record.signStreet || '-'}</span>
              {sign.installDate && (
                <span className="block text-[9pt] text-slate-700">
                  (ติดตั้งเมื่อ {sign.installDate})
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-[9pt] tracking-widest">
              ..............................................................................
            </div>
          )}
        </td>

        {/* Col 7: หมายเหตุ */}
        <td className="px-1.5 py-1 align-top text-center text-[9.5pt]">
          {sign ? (
            <span>{sign.notes || (sign.taxAmount ? `ภาษี ฿${sign.taxAmount}` : '')}</span>
          ) : (
            <span className="text-slate-400 text-[9pt]">...................</span>
          )}
        </td>
      </tr>
    );
  };

  // Generate rows for a category ensuring min number of rows like the physical form
  const renderCategoryRows = (
    signs: SignboardItem[],
    catTitle: string,
    minRows: number
  ) => {
    const rows = [];
    const count = Math.max(signs.length, minRows);

    for (let i = 0; i < count; i++) {
      const sign = signs[i] || null;
      const isFirst = i === 0;
      rows.push(
        <React.Fragment key={`${catTitle}-${i}`}>
          {renderRow(sign, isFirst, isFirst ? catTitle : undefined)}
        </React.Fragment>
      );
    }
    return rows;
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print bg-white p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับหน้ารายการ
        </button>

        {/* Print Option Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setPrintMode('both')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                printMode === 'both' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600'
              }`}
            >
              หน้า ๑ + หน้า ๒ (ครบชุด)
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('page1')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                printMode === 'page1' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600'
              }`}
            >
              เฉพาะหน้า ๑ (แบบแสดงรายการ)
            </button>
            <button
              type="button"
              onClick={() => setPrintMode('page2')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                printMode === 'page2' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-600'
              }`}
            >
              เฉพาะหน้า ๒ (รายงานการประเมิน)
            </button>
          </div>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={includePhotos}
              onChange={(e) => setIncludePhotos(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>แนบหน้าภาพถ่ายหลักฐาน</span>
          </label>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Printer className="w-4 h-4" />
          พิมพ์เอกสาร / บันทึกเป็น PDF
        </button>
      </div>

      {/* ======================================================== */}
      {/* PAGE 1: แบบแสดงรายการภาษีป้าย (ภ.ป. 1)                     */}
      {/* ======================================================== */}
      {(printMode === 'both' || printMode === 'page1') && (
        <div className="print-page page-break bg-white p-8 md:p-10 shadow-sm border border-slate-300 text-black font-serif text-[11pt] leading-normal mb-8 max-w-[1100px] mx-auto select-text">
          {/* Top Header */}
          <div className="relative mb-3 flex items-start justify-between">
            {/* Top Left Form Number */}
            <div className="text-left text-[11pt] leading-snug w-48">
              <div className="font-bold">ภ.ป. 1</div>
              <div className="font-semibold">แบบแสดงรายการภาษีป้าย</div>
              <div>ประจำ พ.ศ. 25<span className="font-mono">{String(currentBuddhistYear).slice(-2)}</span>...................</div>
            </div>

            {/* Center Official Emblem */}
            <div className="text-center flex-1 flex flex-col items-center">
              <img
                src={PHRA_SONG_LOGO_URL}
                alt="ตราสัญลักษณ์เทศบาลตำบลพระซอง"
                className="w-20 h-20 object-contain rounded-full border border-black/10"
              />
              <span className="text-[9pt] font-semibold text-slate-700 mt-1">
                เทศบาลตำบลพระซอง อ.นาแก จ.นครพนม
              </span>
            </div>

            {/* Top Right Reference box */}
            <div className="text-right text-[9pt] w-48 text-slate-700">
              <div>รหัสอ้างอิง: <strong className="font-mono">{record.id}</strong></div>
              <div>แปลงที่ดิน: {record.landPlotCode || '-'}</div>
              <div>พิกัด: {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}</div>
            </div>
          </div>

          {/* Owner details Section with dotted fill lines */}
          <div className="text-[10.5pt] space-y-1 mb-3 pt-1">
            {/* Line 1 */}
            <div className="flex items-baseline">
              <span className="shrink-0">ชื่อเจ้าของป้าย</span>
              <span className="mx-1 px-1.5 border-b border-dotted border-black grow font-bold">
                {record.taxpayerName || '...........................................................................................'}
              </span>
              <span className="shrink-0 ml-2">ชื่อสถานประกอบการค้าหรือกิจการอื่น</span>
              <span className="mx-1 px-1.5 border-b border-dotted border-black grow font-medium">
                {record.nameCode || record.signboards[0]?.messagePreview?.slice(0, 30) || '...................................................................'}
              </span>
            </div>

            {/* Line 2 */}
            <div className="flex items-baseline">
              <span className="shrink-0">เลขที่</span>
              <span className="mx-1 px-1 border-b border-dotted border-black w-24 text-center font-mono">
                {record.houseNo || '..................'}
              </span>
              <span className="shrink-0 ml-1">ตรอก,ซอย</span>
              <span className="mx-1 px-1 border-b border-dotted border-black grow text-center">
                {record.soi || '..................................................'}
              </span>
              <span className="shrink-0 ml-1">ถนน</span>
              <span className="mx-1 px-1 border-b border-dotted border-black grow text-center">
                {record.street || '................................................'}
              </span>
              <span className="shrink-0 ml-1">หมู่ที่</span>
              <span className="mx-1 px-1 border-b border-dotted border-black w-20 text-center font-bold">
                {record.villageNo || '..........'}
              </span>
            </div>

            {/* Line 3 */}
            <div className="flex items-baseline">
              <span className="shrink-0">ตำบล</span>
              <span className="mx-1 px-1 border-b border-dotted border-black grow text-center font-semibold">
                {record.subdistrict || 'พระซอง'}
              </span>
              <span className="shrink-0 ml-1">อำเภอ</span>
              <span className="mx-1 px-1 border-b border-dotted border-black grow text-center font-semibold">
                {record.district || 'นาแก'}
              </span>
              <span className="shrink-0 ml-1">จังหวัด</span>
              <span className="mx-1 px-1 border-b border-dotted border-black grow text-center font-semibold">
                {record.province || 'นครพนม'}
              </span>
              <span className="shrink-0 ml-1">โทรศัพท์</span>
              <span className="mx-1 px-1 border-b border-dotted border-black w-36 text-center font-mono">
                {record.phone || '.......................'}
              </span>
            </div>

            {/* Line 4 */}
            <div className="flex items-baseline">
              <span className="shrink-0">
                ขอยื่นแบบแสดงรายการภาษีป้ายต่อพนักงานเจ้าหน้าที่ ณ
              </span>
              <span className="mx-1 px-2 border-b border-dotted border-black grow font-bold text-center">
                สำนักงานเทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม
              </span>
              <span className="shrink-0 ml-1">ตามรายการต่อไปนี้</span>
            </div>
          </div>

          {/* Main Table: Matches PDF Page 1 */}
          <div className="w-full overflow-hidden border border-black mb-3">
            <table className="w-full border-collapse text-[10pt]">
              <thead>
                <tr className="border-b border-black text-center font-bold">
                  {/* Col 1 */}
                  <th rowSpan={2} className="border-r border-black p-1 w-28 align-middle">
                    <div>1</div>
                    <div>ประเภท</div>
                    <div>ป้าย</div>
                  </th>

                  {/* Col 2 */}
                  <th colSpan={2} className="border-r border-black p-0.5 align-middle">
                    <div>2</div>
                    <div>ขนาดป้าย ซ.ม.</div>
                  </th>

                  {/* Col 3 */}
                  <th rowSpan={2} className="border-r border-black p-1 w-24 align-middle">
                    <div>3</div>
                    <div>เนื้อที่ป้าย</div>
                    <div>ตาราง ซ.ม.</div>
                  </th>

                  {/* Col 4 */}
                  <th rowSpan={2} className="border-r border-black p-1 w-14 align-middle">
                    <div>4</div>
                    <div>จำนวน</div>
                    <div>ป้าย</div>
                  </th>

                  {/* Col 5 */}
                  <th rowSpan={2} className="border-r border-black p-1 align-middle">
                    <div>5</div>
                    <div>ข้อความหรือภาพหรือเครื่องหมายที่ปรากฏใน</div>
                    <div>ป้ายโดยย่อ</div>
                  </th>

                  {/* Col 6 */}
                  <th rowSpan={2} className="border-r border-black p-1 w-64 align-middle text-[9.5pt]">
                    <div>6</div>
                    <div>สถานที่ติดตั้งป้ายและวันติดตั้งป้าย (แสดงป้าย)</div>
                    <div className="font-normal text-[8.5pt]">
                      ถนน, ตรอก, ซอย, ตำบล, อำเภอ ,สถานที่ใกล้เคียง หรือระหว่าง ก.ม. ที่
                    </div>
                  </th>

                  {/* Col 7 */}
                  <th rowSpan={2} className="p-1 w-24 align-middle">
                    <div>หมายเหตุ</div>
                  </th>
                </tr>

                {/* Sub-header for Col 2: กว้าง / ยาว */}
                <tr className="border-b border-black text-center font-bold">
                  <th className="border-r border-black p-0.5 w-14 font-medium">กว้าง</th>
                  <th className="border-r border-black p-0.5 w-14 font-medium">ยาว</th>
                </tr>
              </thead>

              <tbody>
                {/* Category 1: มีอักษรไทยล้วน */}
                {renderCategoryRows(
                  signsType1,
                  '(1)\nมีอักษร\nไทยล้วน',
                  6
                )}

                {/* Category 2: มีอักษรไทยปนต่างประเทศ หรือ เครื่องหมาย */}
                {renderCategoryRows(
                  signsType2,
                  '(2)\nมีอักษร\nไทยปน\nต่างประเทศ\nหรือ\nเครื่องหมาย',
                  7
                )}

                {/* Category 3: ป้ายที่ไม่มีอักษรไทย */}
                {renderCategoryRows(
                  signsType3,
                  '(3)\nป้ายที่ไม่มี\nอักษรไทย',
                  4
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Certification & Signature (Page 1) */}
          <div className="pt-2 text-center text-[10.5pt] space-y-1">
            <div className="font-semibold">
              ข้าพเจ้าขอรับรองว่ารายการที่แจ้งไว้ในแบบนี้ถูกต้องและครบถ้วนตามความจริงทุกประการ
            </div>
            <div className="flex justify-center items-baseline gap-2 pt-1">
              <span>วันที่</span>
              <span className="w-16 border-b border-dotted border-black inline-block text-center font-mono">
                {record.recordDate ? record.recordDate.split('-')[2] : '........'}
              </span>
              <span>เดือน</span>
              <span className="w-36 border-b border-dotted border-black inline-block text-center">
                {record.recordDate ? 'มกราคม' : '...................................................'}
              </span>
              <span>พ.ศ.</span>
              <span className="w-20 border-b border-dotted border-black inline-block text-center font-mono font-bold">
                {currentBuddhistYear}
              </span>
            </div>
            <div className="flex justify-center items-baseline gap-2 pt-1">
              <span>ลงชื่อ</span>
              <span className="w-72 border-b border-dotted border-black inline-block text-center font-bold">
                {record.taxpayerName}
              </span>
              <span>เจ้าของป้าย</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE 2: ด้านหลังแบบ ภ.ป. 1 (รายงานการประเมินและรับชำระ)     */}
      {/* ======================================================== */}
      {(printMode === 'both' || printMode === 'page2') && (
        <div className="print-page page-break bg-white p-8 md:p-10 shadow-sm border border-slate-300 text-black font-serif text-[11pt] leading-normal mb-8 max-w-[1100px] mx-auto select-text">
          {/* Top Section: บันทึกการตรวจสอบของเจ้าหน้าที่ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-4 border-b border-black">
            {/* Left Box: บันทึกการตรวจสอบของเจ้าหน้าที่ */}
            <div className="md:col-span-5 border border-black p-3 text-[10.5pt] space-y-1.5">
              <div className="font-bold text-center border-b border-black pb-1 mb-2">
                บันทึกการตรวจสอบของเจ้าหน้าที่
              </div>
              <div className="flex items-baseline">
                <span className="w-28 shrink-0">เลขรับที่</span>
                <span className="border-b border-dotted border-black grow text-center font-mono font-bold">
                  {record.id}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 shrink-0">วันที่</span>
                <span className="border-b border-dotted border-black grow text-center font-mono">
                  {record.recordDate || '....../....../..........'}
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 shrink-0">สำนักงานที่รับ</span>
                <span className="border-b border-dotted border-black grow text-center font-medium">
                  สำนักงานเทศบาลตำบลพระซอง
                </span>
              </div>
              <div className="flex items-baseline">
                <span className="w-28 shrink-0">เลขรับปีก่อน</span>
                <span className="border-b border-dotted border-black grow text-center text-slate-400">
                  .........................................
                </span>
              </div>
              <div className="flex items-baseline pt-1">
                <span className="w-28 shrink-0">ลงชื่อ</span>
                <span className="border-b border-dotted border-black grow text-center font-bold">
                  {record.surveyorName || 'นายประสิทธิ์ บุญมี'}
                </span>
                <span className="ml-1 text-[9pt]">ผู้รับแบบ</span>
              </div>
            </div>

            {/* Right: Inspection Lines */}
            <div className="md:col-span-7 space-y-3 pt-1 text-[10.5pt]">
              <div className="border-b border-dotted border-black pb-1 text-slate-800">
                ได้ตรวจสอบสถานที่ติดตั้งป้ายตามพิกัด Lat {record.latitude.toFixed(5)}, Lng {record.longitude.toFixed(5)} ในเขต ทต.พระซอง
              </div>
              <div className="border-b border-dotted border-black pb-1 text-slate-800">
                พบป้ายตามรายการถูกต้องครบถ้วน รวมจำนวน {record.signboards.length} รายการ ({record.signboards.reduce((a, s) => a + (s.quantity || 1), 0)} ป้าย)
              </div>
              <div className="border-b border-dotted border-black pb-1 text-slate-400">
                ........................................................................................................................................................
              </div>
              <div className="border-b border-dotted border-black pb-1 text-slate-400">
                ........................................................................................................................................................
              </div>
              <div className="flex justify-end items-baseline gap-2 pt-2">
                <span>ลงชื่อ</span>
                <span className="w-64 border-b border-dotted border-black inline-block text-center font-bold">
                  {record.surveyorName || 'นายประสิทธิ์ บุญมี'}
                </span>
                <span>เจ้าหน้าที่</span>
              </div>
            </div>
          </div>

          {/* Section 2: รายงานการประเมินภาษีป้าย */}
          <div className="py-4 border-b border-black space-y-2 text-[10.5pt]">
            <div className="text-center font-bold text-[12pt] underline tracking-wide">
              รายงานการประเมินภาษีป้าย
            </div>
            <p className="indent-8">
              ได้ทำการประเมินภาษีป้ายตามรายการที่ปรากฏในแบบแสดงของรายการภาษีป้ายรายนี้แล้ว เจ้าของป้ายจะต้องเสียภาษีดังนี้.-
            </p>

            <div className="pl-6 space-y-1.5">
              <div className="flex items-baseline">
                <span>1. ค่าภาษีป้ายตามแสดงรายการภาษีป้ายเป็นเงิน</span>
                <span className="mx-2 px-3 border-b border-dotted border-black font-mono font-bold text-center w-48">
                  {taxInt.toLocaleString()}
                </span>
                <span>บาท</span>
                <span className="mx-2 px-2 border-b border-dotted border-black font-mono text-center w-24">
                  {String(taxSatang).padStart(2, '0')}
                </span>
                <span>สตางค์</span>
              </div>

              <div className="flex items-baseline">
                <span>2. ค่าเพิ่มภาษีป้ายตามมาตรา 25 (1) (ไม่ยื่นแบบแสดงรายการภาษีป้ายภายในเวลากำหนด)ร้อยละ</span>
                <span className="mx-2 border-b border-dotted border-black font-mono text-center w-16 text-slate-400">
                  -
                </span>
                <span>เป็นเงิน</span>
                <span className="mx-2 border-b border-dotted border-black font-mono text-center w-28 text-slate-400">
                  -
                </span>
                <span>บาท</span>
                <span className="mx-2 border-b border-dotted border-black font-mono text-center w-20 text-slate-400">
                  -
                </span>
                <span>สตางค์</span>
              </div>

              <div className="flex items-baseline font-bold pt-1">
                <span>รวมทั้งสิ้นเป็นเงิน</span>
                <span className="mx-2 px-3 border-b-2 border-double border-black font-mono text-center w-52 text-[12pt]">
                  {taxInt.toLocaleString()}
                </span>
                <span>บาท</span>
                <span className="mx-2 px-2 border-b-2 border-double border-black font-mono text-center w-24">
                  {String(taxSatang).padStart(2, '0')}
                </span>
                <span>สตางค์</span>
              </div>
            </div>

            <div className="flex flex-col items-end pt-3 pr-8 space-y-1 text-center">
              <div className="flex items-baseline gap-2">
                <span>ลงชื่อ</span>
                <span className="w-64 border-b border-dotted border-black inline-block font-bold">
                  {record.inspectorName || 'นางสาววิไลวรรณ พลจันทร์'}
                </span>
                <span>พนักงานเจ้าหน้าที่</span>
              </div>
              <div className="flex items-baseline gap-2 text-[10pt]">
                <span>วันที่</span>
                <span className="w-14 border-b border-dotted border-black inline-block font-mono">
                  {record.inspectionDate ? record.inspectionDate.split('-')[2] : '......'}
                </span>
                <span>เดือน</span>
                <span className="w-28 border-b border-dotted border-black inline-block">
                  {record.inspectionDate ? 'มกราคม' : '...................'}
                </span>
                <span>พ.ศ. 25</span>
                <span className="w-14 border-b border-dotted border-black inline-block font-mono font-bold">
                  {String(currentBuddhistYear).slice(-2)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: คำขอชำระภาษี */}
          <div className="py-4 border-b border-black space-y-2 text-[10.5pt]">
            <div className="text-center font-bold text-[12pt] underline tracking-wide">
              คำขอชำระภาษี
            </div>
            <p className="indent-8">
              ข้าพเจ้าได้ทราบการประเมินภาษีป้ายข้างต้นแล้ว ขอชำระภาษีป้ายให้เสร็จไปพร้อมนี้
            </p>
            <div className="flex flex-col items-end pt-2 pr-8 space-y-1 text-center">
              <div className="flex items-baseline gap-2">
                <span>ลงชื่อ</span>
                <span className="w-64 border-b border-dotted border-black inline-block font-bold">
                  {record.taxpayerName}
                </span>
                <span>ผู้ชำระภาษีป้าย</span>
              </div>
              <div className="flex items-baseline gap-2 text-[10pt]">
                <span>วันที่</span>
                <span className="w-14 border-b border-dotted border-black inline-block">......</span>
                <span>เดือน</span>
                <span className="w-28 border-b border-dotted border-black inline-block">...................</span>
                <span>พ.ศ. 25</span>
                <span className="w-14 border-b border-dotted border-black inline-block font-mono font-bold">
                  {String(currentBuddhistYear).slice(-2)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: รายการรับชำระภาษีป้าย */}
          <div className="py-4 border-b border-black space-y-2 text-[10.5pt]">
            <div className="text-center font-bold text-[12pt] underline tracking-wide">
              รายการรับชำระภาษีป้าย
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span>ได้รับเงินภาษีป้าย</span>
              <span className="w-36 border-b border-dotted border-black inline-block text-center font-mono font-bold">
                {record.paidAmount ? record.paidAmount.toLocaleString() : (record.paymentStatus === 'paid' ? taxInt.toLocaleString() : '........................')}
              </span>
              <span>บาท</span>
              <span className="w-20 border-b border-dotted border-black inline-block text-center font-mono">
                {record.paymentStatus === 'paid' ? '00' : '...............'}
              </span>
              <span>สตางค์ แต่วันที่</span>
              <span className="w-36 border-b border-dotted border-black inline-block text-center font-mono">
                {record.paidDate || '..................'}
              </span>
            </div>

            <div className="flex items-baseline justify-center gap-4 pt-1">
              <div className="flex items-baseline gap-1">
                <span>ใบเสร็จเล่มที่</span>
                <span className="w-32 border-b border-dotted border-black inline-block text-center font-mono">
                  {record.receiptNumber ? record.receiptNumber.split('-')[0] : '........................'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span>เลขที่</span>
                <span className="w-32 border-b border-dotted border-black inline-block text-center font-mono">
                  {record.receiptNumber || '........................'}
                </span>
              </div>
            </div>

            <div className="flex justify-end items-baseline gap-2 pt-2 pr-8">
              <span>ลงชื่อ</span>
              <span className="w-64 border-b border-dotted border-black inline-block text-center font-bold">
                {record.inspectorName || 'นางสาววิไลวรรณ พลจันทร์'}
              </span>
              <span>พนักงานเจ้าหน้าที่ผู้รับเงิน</span>
            </div>
          </div>

          {/* Section 5: บันทึกเพิ่มเติม */}
          <div className="pt-3 space-y-2 text-[10.5pt]">
            <div className="text-center font-bold text-[12pt] underline tracking-wide">
              บันทึกเพิ่มเติม
            </div>
            <div className="border-b border-dotted border-black pb-1 text-slate-800 text-[10pt]">
              {record.notes || 'สำรวจภาคสนามและจัดเก็บข้อมูลพิกัดภูมิศาสตร์ (GIS/GPS) โดยกองคลัง เทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม'}
            </div>
            <div className="border-b border-dotted border-black pb-1 text-slate-400">
              .....................................................................................................................................................................................................................................
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* APPENDIX: ภาพถ่ายป้ายประกอบการสำรวจ (ถ้าเลือกแนบ)             */}
      {/* ======================================================== */}
      {includePhotos && record.signboards.some((s) => s.photos && s.photos.length > 0) && (
        <div className="print-page bg-white p-8 md:p-10 shadow-sm border border-slate-300 text-black font-serif text-[11pt] max-w-[1100px] mx-auto select-text mt-8">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
            <div className="flex items-center gap-3">
              <img
                src={PHRA_SONG_LOGO_URL}
                alt="ตราสัญลักษณ์เทศบาลตำบลพระซอง"
                className="w-12 h-12 object-contain rounded-full"
              />
              <div>
                <h3 className="font-bold text-base leading-tight">
                  เอกสารประกอบ: ภาพถ่ายป้ายและสภาพแวดล้อมที่สำรวจจริง
                </h3>
                <p className="text-xs text-slate-600">
                  เทศบาลตำบลพระซอง • เจ้าของป้าย: {record.taxpayerName} (รหัส {record.id})
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <div>พิกัด: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}</div>
              <div>หมู่ที่ตั้งป้าย: หมู่ {record.signVillageNo}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {record.signboards.flatMap((sign, sIdx) =>
              (sign.photos || []).map((imgUrl, pIdx) => (
                <div
                  key={`${sIdx}-${pIdx}`}
                  className="border border-slate-400 p-2 rounded-sm bg-slate-50 text-center"
                >
                  <img
                    src={imgUrl}
                    alt={`ป้ายที่ ${sIdx + 1} ภาพที่ ${pIdx + 1}`}
                    className="w-full h-44 object-cover rounded-xs border border-slate-300 mb-1.5"
                  />
                  <div className="text-[10pt] font-semibold text-slate-900">
                    ป้ายที่ {sIdx + 1}: {sign.messagePreview || '-'}
                  </div>
                  <div className="text-[9pt] text-slate-600">
                    ขนาด {sign.widthCm} x {sign.lengthCm} ซม. (เนื้อที่ {sign.areaSqCm?.toLocaleString()} ตร.ซม.)
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
