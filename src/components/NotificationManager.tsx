/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { TaxpayerSurveyRecord, PaymentStatus } from '../types/tax';
import { thaiBahtText } from '../services/taxCalculator';

interface NotificationManagerProps {
  records: TaxpayerSurveyRecord[];
  onUpdateStatus: (id: string, newStatus: PaymentStatus) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  records,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<TaxpayerSurveyRecord | null>(null);
  const [notificationSent, setNotificationSent] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Filter records
  const filtered = records.filter((rec) => {
    const matchStatus = filterStatus === 'all' || rec.paymentStatus === filterStatus;
    const matchSearch =
      rec.taxpayerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.phone.includes(searchQuery) ||
      (rec.email && rec.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  // Calculate stats
  const totalCount = records.length;
  const overdueCount = records.filter((r) => r.paymentStatus === 'overdue').length;
  const pendingCount = records.filter((r) => r.paymentStatus === 'pending').length;
  const notifiedCount = records.filter((r) => r.paymentStatus === 'notified').length;
  const paidCount = records.filter((r) => r.paymentStatus === 'paid').length;

  const currentYear = new Date().getFullYear() + 543;

  // Generate Email Text Template
  const generateEmailBody = (rec: TaxpayerSurveyRecord) => {
    return `เรื่อง: แจ้งเตือนการชำระภาษีป้าย ประจำปี ${currentYear}
เรียน: ${rec.taxpayerName} (รหัสอ้างอิง: ${rec.id})

ด้วยกองคลัง เทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม ได้ดำเนินการสำรวจและประเมินภาษีป้ายตามพระราชบัญญัติภาษีป้าย พ.ศ. ๒๕๑๐ 
ของท่านเรียบร้อยแล้ว โดยมีรายละเอียดดังนี้:

- ชื่อเจ้าของป้าย: ${rec.taxpayerName}
- เลขประจำตัวผู้เสียภาษี: ${rec.citizenId}
- สถานที่ติดตั้งป้าย: ${rec.signStreet || '-'} หมู่ที่ ${rec.signVillageNo} ต.พระซอง อ.นาแก จ.นครพนม
- จำนวนป้ายที่ประเมิน: ${rec.signboards.length} รายการ
- รวมยอดภาษีป้ายที่ต้องชำระ: ${rec.totalEstimatedTax.toLocaleString()} บาท (${thaiBahtText(rec.totalEstimatedTax)})
- กำหนดชำระภายใน: ${rec.dueDate || '๓๑ มีนาคม'}

ช่องทางการชำระภาษี:
๑. ชำระด้วยเงินสด ณ งานพัฒนารายได้ กองคลัง เทศบาลตำบลพระซอง ในวันและเวลาราชการ
๒. โอนเงินผ่านบัญชีธนาคารกรุงไทย หรือ ธ.ก.ส. เทศบาลตำบลพระซอง
๓. ชำระผ่านระบบ QR Payment พร้อมส่งหลักฐานการโอนเงินผ่านระบบออนไลน์

หากมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม โปรดติดต่อ:
งานพัฒนารายได้ กองคลัง เทศบาลตำบลพระซอง
โทรศัพท์: ๐๔๒-๕๗๑-XXX
อีเมล: prhrasong2020@gmail.com

ขอแสดงความนับถือ
ฝ่ายพัฒนารายได้ กองคลัง เทศบาลตำบลพระซอง`;
  };

  const handleSendNotification = (rec: TaxpayerSurveyRecord) => {
    onUpdateStatus(rec.id, 'notified');
    setNotificationSent(`ส่งหนังสือแจ้งเตือนไปยัง ${rec.taxpayerName} (${rec.email || rec.phone}) เรียบร้อยแล้ว`);
    setTimeout(() => setNotificationSent(null), 4000);
  };

  const handleCopyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                ระบบแจ้งเตือนการชำระภาษีป้ายล่วงหน้า
              </h1>
              <p className="text-xs text-slate-500">
                ส่งการแจ้งเตือนทางอีเมลและแอปพลิเคชัน ติดตามกำหนดชำระภาษีป้ายประจำปี {currentYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="text-slate-500">ทั้งหมด:</span>{' '}
              <strong className="text-slate-800">{totalCount} ราย</strong>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <span>รอแจ้ง:</span> <strong>{pendingCount}</strong>
            </div>
            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <span>แจ้งแล้ว:</span> <strong>{notifiedCount}</strong>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
              <span>ชำระแล้ว:</span> <strong>{paidCount}</strong>
            </div>
            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <span>เกินกำหนด:</span> <strong>{overdueCount}</strong>
            </div>
          </div>
        </div>

        {notificationSent && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationSent}</span>
          </div>
        )}
      </div>

      {/* Main Grid: List & Email Preview Modal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Taxpayer Records List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส, เบอร์โทร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอประเมิน / รอแจ้ง</option>
                <option value="notified">ส่งแจ้งเตือนแล้ว</option>
                <option value="overdue">เกินกำหนดชำระ</option>
                <option value="paid">ชำระแล้ว</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                ไม่พบข้อมูลผู้เสียภาษีตามเงื่อนไขที่เลือก
              </div>
            ) : (
              filtered.map((rec) => {
                const isSelected = selectedRecord?.id === rec.id;
                let badgeClass = 'bg-slate-100 text-slate-700';
                let statusLabel = 'รอประเมิน';

                if (rec.paymentStatus === 'paid') {
                  badgeClass = 'bg-emerald-100 text-emerald-800';
                  statusLabel = 'ชำระแล้ว';
                } else if (rec.paymentStatus === 'notified') {
                  badgeClass = 'bg-blue-100 text-blue-800';
                  statusLabel = 'แจ้งเตือนแล้ว';
                } else if (rec.paymentStatus === 'overdue') {
                  badgeClass = 'bg-rose-100 text-rose-800';
                  statusLabel = 'เกินกำหนด';
                }

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {rec.taxpayerName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {rec.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          หมู่ {rec.signVillageNo} ต.พระซอง • {rec.signboards.length} ป้าย
                        </p>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        กำหนดชำระ: {rec.dueDate || '31 มี.ค.'}
                      </div>
                      <div className="font-mono font-bold text-emerald-800">
                        ฿{rec.totalEstimatedTax.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Notification Composer & Action */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              ร่างข้อความแจ้งเตือนภาษีป้าย
            </h2>
            {copySuccess && (
              <span className="text-[11px] text-emerald-600 font-semibold animate-pulse">
                คัดลอกข้อความแล้ว!
              </span>
            )}
          </div>

          {selectedRecord ? (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="text-slate-500">ผู้รับ:</span>{' '}
                  <strong className="text-slate-800">{selectedRecord.taxpayerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">อีเมล:</span>{' '}
                  <span className="font-mono text-emerald-800">
                    {selectedRecord.email || 'ยังไม่ได้ระบุอีเมล (ส่ง SMS/จดหมาย)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">เบอร์โทรศัพท์:</span>{' '}
                  <span className="font-mono text-slate-800">{selectedRecord.phone || '-'}</span>
                </div>
              </div>

              {/* Template Textbox */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เนื้อหาหนังสือแจ้งเตือนชำระภาษีป้าย:
                </label>
                <textarea
                  readOnly
                  rows={13}
                  value={generateEmailBody(selectedRecord)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-700 leading-relaxed outline-hidden resize-none"
                />
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyTemplate(generateEmailBody(selectedRecord))}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    คัดลอกข้อความ
                  </button>

                  {selectedRecord.email && (
                    <a
                      href={`mailto:${selectedRecord.email}?subject=${encodeURIComponent(
                        `แจ้งเตือนการชำระภาษีป้าย เทศบาลตำบลพระซอง ประจำปี ${currentYear}`
                      )}&body=${encodeURIComponent(generateEmailBody(selectedRecord))}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      เปิดในเมล
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSendNotification(selectedRecord)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  ส่งแจ้งเตือนเข้าระบบ (ปรับสถานะเป็นแจ้งแล้ว)
                </button>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">ปรับสถานะ:</span>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(selectedRecord.id, 'paid')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold"
                  >
                    ✓ บันทึกชำระแล้ว
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(selectedRecord.id, 'overdue')}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold"
                  >
                    ! เกินกำหนด
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              เลือกผู้เสียภาษีจากรายการด้านซ้ายเพื่อดูและส่งแบบแจ้งเตือนชำระภาษีป้าย
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
