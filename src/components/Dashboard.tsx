/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  DollarSign,
  Users,
  Layers,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
  Download,
  MapPin,
} from 'lucide-react';
import { TaxpayerSurveyRecord, PHRA_SONG_VILLAGES, SIGN_TYPE_INFO } from '../types/tax';
import { MunicipalEmblem } from './MunicipalEmblem';

interface DashboardProps {
  records: TaxpayerSurveyRecord[];
  onAddNew: () => void;
  onGoToList: () => void;
  onOpenGoogleSheets: () => void;
  onExportExcel: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  onAddNew,
  onGoToList,
  onOpenGoogleSheets,
  onExportExcel,
}) => {
  const totalTaxAmount = records.reduce((acc, r) => acc + (r.totalEstimatedTax || 0), 0);
  const totalTaxpayers = records.length;
  const totalSigns = records.reduce((acc, r) => acc + (r.signboards?.length || 0), 0);

  const paidRecords = records.filter((r) => r.paymentStatus === 'paid');
  const paidTaxAmount = paidRecords.reduce((acc, r) => acc + (r.totalEstimatedTax || 0), 0);
  const pendingRecords = records.filter((r) => r.paymentStatus === 'pending');
  const notifiedRecords = records.filter((r) => r.paymentStatus === 'notified');
  const overdueRecords = records.filter((r) => r.paymentStatus === 'overdue');

  // Breakdown by sign category (Type 1, 2, 3)
  const signTypeBreakdown = {
    type1: 0,
    type2: 0,
    type3: 0,
    type1Tax: 0,
    type2Tax: 0,
    type3Tax: 0,
  };

  records.forEach((r) => {
    r.signboards?.forEach((s) => {
      if (s.signType.startsWith('type1')) {
        signTypeBreakdown.type1 += s.quantity || 1;
        signTypeBreakdown.type1Tax += s.taxAmount || 0;
      } else if (s.signType.startsWith('type2')) {
        signTypeBreakdown.type2 += s.quantity || 1;
        signTypeBreakdown.type2Tax += s.taxAmount || 0;
      } else if (s.signType.startsWith('type3')) {
        signTypeBreakdown.type3 += s.quantity || 1;
        signTypeBreakdown.type3Tax += s.taxAmount || 0;
      }
    });
  });

  // Breakdown by villages in Phra Song
  const villageStats = PHRA_SONG_VILLAGES.map((v) => {
    const vRecords = records.filter((r) => r.signVillageNo === v.no);
    const vTax = vRecords.reduce((acc, r) => acc + (r.totalEstimatedTax || 0), 0);
    const vSigns = vRecords.reduce((acc, r) => acc + (r.signboards?.length || 0), 0);
    return {
      no: v.no,
      name: v.name,
      taxpayerCount: vRecords.length,
      signCount: vSigns,
      totalTax: vTax,
    };
  }).sort((a, b) => b.totalTax - a.totalTax);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Welcome / Hero Bar */}
      <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white rounded-2xl shadow-md shrink-0">
            <MunicipalEmblem size={68} />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-200 mb-1 border border-emerald-400/30">
              ระบบจัดเก็บและบริหารข้อมูลภาษีป้าย
            </span>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              เทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม
            </h1>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-xl">
              สำรวจและประเมินภาษีป้ายตามแบบ ภ.ป.1 ปักหมุดพิกัดภูมิศาสตร์ (GPS) คำนวณภาษีอัตโนมัติ พร้อมส่งออก Excel และซิงค์ Google Sheets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={onAddNew}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            สำรวจป้ายใหม่
          </button>
          <button
            type="button"
            onClick={onOpenGoogleSheets}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            Google Sheets
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            ส่งออก Excel
          </button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Estimated Tax */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              รวมภาษีป้ายประเมินทั้งสิ้น
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              ฿{totalTaxAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
              จัดเก็บแล้ว: ฿{paidTaxAmount.toLocaleString()} (
              {totalTaxAmount > 0 ? Math.round((paidTaxAmount / totalTaxAmount) * 100) : 0}%)
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Taxpayers count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              ผู้มีหน้าที่เสียภาษีป้าย
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {totalTaxpayers.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">ราย</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">
              ในเขต 16 หมู่บ้าน ทต.พระซอง
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Signboards count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              จำนวนป้ายทั้งหมดที่สำรวจ
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">
              {totalSigns.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">ป้าย</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">
              เฉลี่ย {totalTaxpayers > 0 ? (totalSigns / totalTaxpayers).toFixed(1) : 0} ป้าย/ราย
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Payment Status Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">
              สถานะการชำระเงิน
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-emerald-700">
                ชำระแล้ว {paidRecords.length}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-amber-700">
                รอชำระ {pendingRecords.length + notifiedRecords.length}
              </span>
            </div>
            <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-block">
              เกินกำหนด: {overdueRecords.length} ราย
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two columns: Sign Types & Village Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Signboard Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">
              แจกแจงตามประเภทป้าย (กฎกระทรวง 2563)
            </h2>
            <span className="text-[11px] text-slate-400">อัตราภาษี</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Type 1 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  ประเภท 1: อักษรไทยล้วน
                </span>
                <span className="font-mono font-bold text-emerald-800">
                  {signTypeBreakdown.type1} ป้าย
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>5 - 10 บาท / 500 ตร.ซม.</span>
                <span className="font-mono font-semibold text-slate-700">
                  ฿{signTypeBreakdown.type1Tax.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{
                    width: `${totalSigns > 0 ? (signTypeBreakdown.type1 / totalSigns) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Type 2 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  ประเภท 2: อักษรไทยปนต่างประเทศ/ภาพ
                </span>
                <span className="font-mono font-bold text-emerald-800">
                  {signTypeBreakdown.type2} ป้าย
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>26 - 52 บาท / 500 ตร.ซม.</span>
                <span className="font-mono font-semibold text-slate-700">
                  ฿{signTypeBreakdown.type2Tax.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{
                    width: `${totalSigns > 0 ? (signTypeBreakdown.type2 / totalSigns) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Type 3 */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">
                  ประเภท 3: ไม่มีอักษรไทย/ไทยอยู่ต่ำกว่า
                </span>
                <span className="font-mono font-bold text-emerald-800">
                  {signTypeBreakdown.type3} ป้าย
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>50 - 52 บาท / 500 ตร.ซม.</span>
                <span className="font-mono font-semibold text-slate-700">
                  ฿{signTypeBreakdown.type3Tax.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-600 h-1.5 rounded-full"
                  style={{
                    width: `${totalSigns > 0 ? (signTypeBreakdown.type3 / totalSigns) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
            💡 <strong>เกร็ดกฎหมาย:</strong> พระราชบัญญัติภาษีป้ายกำหนดว่า ป้ายใดมีอัตราคำนวณต่ำกว่า 200 บาท ให้คิดภาษีป้ายขั้นต่ำ 200 บาทต่อป้าย
          </div>
        </div>

        {/* Right Column: Village Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <h2 className="text-sm font-bold text-slate-800">
                สถิติการสำรวจรายหมู่บ้าน (ตำบลพระซอง 16 หมู่บ้าน)
              </h2>
            </div>
            <button
              type="button"
              onClick={onGoToList}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1"
            >
              <span>ดูข้อมูลทั้งหมด</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">หมู่ที่</th>
                  <th className="py-2.5 px-3 text-center">จำนวนผู้เสียภาษี</th>
                  <th className="py-2.5 px-3 text-center">จำนวนป้าย</th>
                  <th className="py-2.5 px-3 text-right">ภาษีประเมิน (บาท)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {villageStats.slice(0, 8).map((v) => (
                  <tr key={v.no} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      หมู่ {v.no}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                      {v.taxpayerCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                      {v.signCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                      ฿{v.totalTax.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
