/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Plus,
  Eye,
  Edit,
  Trash2,
  Printer,
  MapPin,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import {
  TaxpayerSurveyRecord,
  PHRA_SONG_VILLAGES,
  SIGN_TYPE_INFO,
} from '../types/tax';
import { exportToExcel, exportToCSV } from '../services/storageService';

interface SignboardListProps {
  records: TaxpayerSurveyRecord[];
  onAddNew: () => void;
  onEdit: (record: TaxpayerSurveyRecord) => void;
  onDelete: (id: string) => void;
  onPrint: (record: TaxpayerSurveyRecord) => void;
  onOpenGoogleSheetsModal: () => void;
}

export const SignboardList: React.FC<SignboardListProps> = ({
  records,
  onAddNew,
  onEdit,
  onDelete,
  onPrint,
  onOpenGoogleSheetsModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [previewRecord, setPreviewRecord] = useState<TaxpayerSurveyRecord | null>(null);

  // Filter logic
  const filtered = records.filter((rec) => {
    const matchSearch =
      rec.taxpayerName.toLowerCase().includes(search.toLowerCase()) ||
      rec.id.toLowerCase().includes(search.toLowerCase()) ||
      rec.citizenId.includes(search) ||
      rec.phone.includes(search) ||
      rec.landPlotCode.toLowerCase().includes(search.toLowerCase()) ||
      rec.signboards.some((s) => s.messagePreview.toLowerCase().includes(search.toLowerCase()));

    const matchVillage = selectedVillage === 'all' || rec.signVillageNo === selectedVillage;
    const matchStatus = selectedStatus === 'all' || rec.paymentStatus === selectedStatus;

    return matchSearch && matchVillage && matchStatus;
  });

  const totalFilteredTax = filtered.reduce((acc, r) => acc + (r.totalEstimatedTax || 0), 0);
  const totalSignsCount = filtered.reduce((acc, r) => acc + (r.signboards?.length || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Action Header */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            ทะเบียนคุมและสรุปข้อมูลสำรวจภาษีป้าย
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            เทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม • รายการผู้มีหน้าที่เสียภาษีป้ายและข้อมูลภาคสนาม
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Google Sheets Sync Button */}
          <button
            type="button"
            onClick={onOpenGoogleSheetsModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            เชื่อมต่อ Google Sheets
          </button>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={() => exportToExcel(filtered)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            title="ส่งออกไฟล์ Excel (.xlsx) ตรงตามคอลัมน์ ภ.ป."
          >
            <Download className="w-4 h-4 text-emerald-600" />
            ส่งออก Excel (.xlsx)
          </button>

          {/* Add New Record */}
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            + บันทึกสำรวจใหม่
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="ค้นหาชื่อเจ้าของป้าย, รหัส, เลขบัตร ปชช., แปลงที่ดิน, ข้อความป้าย..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">ทุกหมู่ (หมู่ 1-16)</option>
              {PHRA_SONG_VILLAGES.map((v) => (
                <option key={v.no} value={v.no}>
                  หมู่ {v.no}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">ทุกสถานะการชำระ</option>
              <option value="pending">รอประเมิน / รอแจ้ง</option>
              <option value="notified">แจ้งประเมินแล้ว</option>
              <option value="paid">ชำระแล้ว</option>
              <option value="overdue">เกินกำหนดชำระ</option>
            </select>
          </div>
        </div>

        {/* Quick summary counters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              พบข้อมูล: <strong className="text-slate-900">{filtered.length}</strong> ราย
            </span>
            <span>
              จำนวนป้ายรวม: <strong className="text-slate-900">{totalSignsCount}</strong> ป้าย
            </span>
            <span>
              รวมภาษีประเมิน: <strong className="font-mono text-emerald-800 text-sm">฿{totalFilteredTax.toLocaleString()}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => exportToCSV(filtered)}
            className="text-[11px] text-slate-500 hover:text-emerald-700 underline"
          >
            ดาวน์โหลดสำรองเป็น CSV (UTF-8)
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">รหัสอ้างอิง / วันที่</th>
                <th className="py-3 px-3">ชื่อ-สกุล เจ้าของป้าย</th>
                <th className="py-3 px-3">สถานที่ติดตั้ง / หมู่บ้าน</th>
                <th className="py-3 px-3 text-center">พิกัด GPS</th>
                <th className="py-3 px-3 text-center">จำนวนป้าย</th>
                <th className="py-3 px-3 text-right">ภาษีประเมิน (บาท)</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    ไม่พบรายการข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filtered.map((record, index) => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  let statusText = 'รอประเมิน';

                  if (record.paymentStatus === 'paid') {
                    statusBadge = 'bg-emerald-100 text-emerald-800';
                    statusText = 'ชำระแล้ว';
                  } else if (record.paymentStatus === 'notified') {
                    statusBadge = 'bg-blue-100 text-blue-800';
                    statusText = 'แจ้งประเมินแล้ว';
                  } else if (record.paymentStatus === 'overdue') {
                    statusBadge = 'bg-rose-100 text-rose-800';
                    statusText = 'เกินกำหนด';
                  }

                  const village = PHRA_SONG_VILLAGES.find((v) => v.no === record.signVillageNo);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-900">{record.id}</div>
                        <div className="text-[11px] text-slate-400">{record.recordDate}</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{record.taxpayerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {record.citizenId}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-800">{record.signStreet || '-'}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          หมู่ {record.signVillageNo}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <a
                          href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                          title="ดูตำแหน่งบน Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}</span>
                        </a>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {record.signboards?.length || 0}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-sm text-emerald-800">
                          ฿{record.totalEstimatedTax?.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick View */}
                          <button
                            type="button"
                            onClick={() => setPreviewRecord(record)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="ดูรายละเอียดสรุปข้อมูล"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print PDF / ภ.ป.1 */}
                          <button
                            type="button"
                            onClick={() => onPrint(record)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="พิมพ์แบบ ภ.ป.1 (PDF)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => onEdit(record)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`ต้องการลบข้อมูลแบบสำรวจ ${record.id} (${record.taxpayerName}) หรือไม่?`)) {
                                onDelete(record.id);
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="ลบข้อมูล"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Summary Preview Modal */}
      {previewRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setPreviewRecord(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {previewRecord.id}
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  {previewRecord.taxpayerName}
                </h3>
                <p className="text-xs text-slate-500">
                  เลขบัตร ปชช. {previewRecord.citizenId} • โทร {previewRecord.phone || '-'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const rec = previewRecord;
                    setPreviewRecord(null);
                    onPrint(rec);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์แบบ ภ.ป.๑ (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Address & GPS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4 p-3 bg-slate-50 rounded-xl">
              <div>
                <strong className="text-slate-700 block mb-0.5">ที่อยู่เจ้าของป้าย:</strong>
                <p className="text-slate-600">
                  {previewRecord.houseNo} ม.{previewRecord.villageNo} ถ.{previewRecord.street || '-'} ต.พระซอง อ.นาแก จ.นครพนม
                </p>
              </div>
              <div>
                <strong className="text-slate-700 block mb-0.5">สถานที่ติดตั้งป้าย:</strong>
                <p className="text-slate-600">
                  {previewRecord.signStreet || '-'} หมู่ที่ {previewRecord.signVillageNo} (พิกัด: {previewRecord.latitude.toFixed(5)}, {previewRecord.longitude.toFixed(5)})
                </p>
              </div>
            </div>

            {/* Signboards List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">
                รายการป้ายที่สำรวจ ({previewRecord.signboards.length} รายการ):
              </h4>

              {previewRecord.signboards.map((sign, idx) => {
                const typeObj = SIGN_TYPE_INFO[sign.signType];
                return (
                  <div
                    key={sign.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800">
                        ป้ายที่ {idx + 1}: {typeObj?.label}
                      </span>
                      <span className="font-mono font-bold text-emerald-900">
                        ฿{sign.taxAmount?.toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-700 italic">
                      "{sign.messagePreview || 'ไม่มีข้อความ'}"
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div>ขนาด: {sign.widthCm}x{sign.lengthCm} ซม.</div>
                      <div>เนื้อที่: {sign.areaSqCm?.toLocaleString()} ตร.ซม.</div>
                      <div>จำนวน: {sign.quantity} ป้าย</div>
                      <div>วันติดตั้ง: {sign.installDate}</div>
                    </div>

                    {/* Photos */}
                    {sign.photos && sign.photos.length > 0 && (
                      <div className="pt-2 flex items-center gap-2 overflow-x-auto">
                        {sign.photos.map((img, pIdx) => (
                          <img
                            key={pIdx}
                            src={img}
                            alt=""
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
