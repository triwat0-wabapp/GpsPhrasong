/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Upload,
  MapPin,
  Calculator,
  Save,
  CheckCircle2,
  FileText,
  AlertCircle,
  Copy,
  Camera,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import {
  TaxpayerSurveyRecord,
  SignboardItem,
  SignboardTypeCategory,
  PHRA_SONG_VILLAGES,
  SIGN_TYPE_INFO,
} from '../types/tax';
import { calculateSignboardTax, calculateTotalTax, thaiBahtText } from '../services/taxCalculator';
import { GPSPickerModal } from './GPSPickerModal';
import { MunicipalEmblem } from './MunicipalEmblem';

interface TaxSurveyFormProps {
  initialData?: TaxpayerSurveyRecord | null;
  onSave: (record: TaxpayerSurveyRecord) => void;
  onCancel?: () => void;
}

const DEFAULT_SIGN: SignboardItem = {
  id: 'SIGN-01',
  signType: 'type1_static',
  widthCm: 100,
  lengthCm: 200,
  areaSqCm: 20000,
  quantity: 1,
  messagePreview: '',
  installLocation: '',
  installDate: new Date().toISOString().split('T')[0],
  ratePer500SqCm: 5,
  calculatedUnits: 40,
  taxAmount: 200,
  photos: [],
  notes: '',
};

export const TaxSurveyForm: React.FC<TaxSurveyFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const isEditing = !!initialData;
  const todayStr = new Date().toISOString().split('T')[0];

  // Record details
  const [formData, setFormData] = useState<TaxpayerSurveyRecord>(() => {
    if (initialData) return initialData;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return {
      id: `PS-68-${randomSuffix}`,
      recordDate: todayStr,
      nameCode: `ช-${Math.floor(100 + Math.random() * 900)}`,
      landPlotCode: '',
      mapSheet: '4843 IV',
      inSheet: '1',
      taxpayerName: '',
      citizenId: '',
      phone: '',
      email: '',
      photos: [],
      documents: [],
      houseNo: '',
      villageNo: '1',
      street: '',
      soi: '',
      subdistrict: 'พระซอง',
      district: 'นาแก',
      province: 'นครพนม',
      signStreet: '',
      signSoi: '',
      signVillageNo: '1',
      latitude: 16.9452,
      longitude: 104.5025,
      signboards: [DEFAULT_SIGN],
      totalEstimatedTax: 200,
      surveyorName: 'นายไตรวรรธก์ ทองยืน',
      surveyorPosition: 'ผช.จพ.จัดเก็บรายได้',
      surveyDate: todayStr,
      inspectorName: 'จ่าเอกณัฐศักดิ์ รักษาผล',
      inspectorPosition: 'ผู้อำนวยการกองคลัง',
      inspectionDate: todayStr,
      paymentStatus: 'pending',
      dueDate: `${new Date().getFullYear()}-03-31`,
      notes: '',
    };
  });

  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Update field in main record
  const updateField = (field: keyof TaxpayerSurveyRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Signboards management
  const handleAddSignboard = () => {
    const newId = `SIGN-${String(formData.signboards.length + 1).padStart(2, '0')}`;
    const newSign: SignboardItem = {
      ...DEFAULT_SIGN,
      id: newId,
      installLocation: formData.signStreet || formData.street || '',
      installDate: todayStr,
    };
    const updatedSigns = [...formData.signboards, newSign];
    const total = calculateTotalTax(updatedSigns);
    setFormData((prev) => ({
      ...prev,
      signboards: updatedSigns,
      totalEstimatedTax: total,
    }));
  };

  const handleRemoveSignboard = (index: number) => {
    if (formData.signboards.length <= 1) {
      alert('ผู้เสียภาษีต้องมีรายการป้ายอย่างน้อย 1 รายการ');
      return;
    }
    const updatedSigns = formData.signboards.filter((_, idx) => idx !== index);
    const total = calculateTotalTax(updatedSigns);
    setFormData((prev) => ({
      ...prev,
      signboards: updatedSigns,
      totalEstimatedTax: total,
    }));
  };

  const handleUpdateSignboard = (index: number, updates: Partial<SignboardItem>) => {
    const updatedSigns = [...formData.signboards];
    const target = { ...updatedSigns[index], ...updates };

    // Recompute tax if dimensions, type, or quantity changed
    const calc = calculateSignboardTax(
      target.widthCm,
      target.lengthCm,
      target.signType,
      target.quantity,
      target.isExempt
    );

    target.areaSqCm = calc.areaSqCm;
    target.calculatedUnits = calc.calculatedUnits;
    target.ratePer500SqCm = calc.ratePer500SqCm;
    target.taxAmount = calc.taxAmount;

    updatedSigns[index] = target;
    const total = calculateTotalTax(updatedSigns);

    setFormData((prev) => ({
      ...prev,
      signboards: updatedSigns,
      totalEstimatedTax: total,
    }));
  };

  // Photo uploads per signboard
  const handleSignPhotoUpload = (signIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          const currentPhotos = formData.signboards[signIndex].photos || [];
          handleUpdateSignboard(signIndex, {
            photos: [...currentPhotos, base64],
          });
          // Also add to overall taxpayer photos
          setFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), base64],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Overall taxpayer document / photo upload
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>, docName?: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          const newDoc = {
            name: docName || file.name,
            url: base64,
            uploadDate: todayStr,
          };
          setFormData((prev) => ({
            ...prev,
            documents: [...(prev.documents || []), newDoc],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const copyAddressToSignLocation = () => {
    setFormData((prev) => ({
      ...prev,
      signStreet: prev.street,
      signSoi: prev.soi,
      signVillageNo: prev.villageNo,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.taxpayerName.trim()) {
      alert('กรุณากรอกชื่อ-สกุล เจ้าของป้าย');
      return;
    }

    if (!formData.citizenId.trim()) {
      alert('กรุณากรอกเลขประจำตัวประชาชน หรือเลขประจำตัวผู้เสียภาษี 13 หลัก');
      return;
    }

    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-2xl shadow-md shrink-0">
              <MunicipalEmblem size={64} />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-200 mb-1 border border-emerald-400/30">
                แบบฟอร์ม ภ.ป.1 / สำรวจภาคสนาม
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                แบบสำรวจและประเมินภาษีป้าย เทศบาลตำบลพระซอง
              </h1>
              <p className="text-xs md:text-sm text-emerald-100 mt-0.5">
                อำเภอนาแก จังหวัดนครพนม • บันทึกข้อมูลปักหมุด GPS และคำนวณภาษีป้ายอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-right">
              <div className="text-xs text-emerald-200 font-medium">รวมภาษีประเมินสุทธิ</div>
              <div className="text-2xl font-extrabold text-white font-mono">
                ฿{formData.totalEstimatedTax.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              บันทึกข้อมูลแบบสำรวจสำเร็จเรียบร้อยแล้ว! ข้อมูลพร้อมสำหรับการพิมพ์แบบ ภ.ป.1 และส่งออก Excel
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: ข้อมูลทั่วไปและการระบุแปลงที่ดิน */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-bold text-slate-800">
                ข้อมูลรหัสอ้างอิงและแปลงที่ดิน
              </h2>
            </div>
            <span className="text-xs text-slate-400">หมวดระวางที่ดินและเอกสารสิทธิ์</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                รหัสอ้างอิง (ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => updateField('id', e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                วันที่บันทึก
              </label>
              <input
                type="date"
                value={formData.recordDate}
                onChange={(e) => updateField('recordDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                รหัสชื่อ (เช่น ช-001)
              </label>
              <input
                type="text"
                placeholder="ช-XXX"
                value={formData.nameCode}
                onChange={(e) => updateField('nameCode', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                รหัสแปลงที่ดิน
              </label>
              <input
                type="text"
                placeholder="4843 IV 1234-XX"
                value={formData.landPlotCode}
                onChange={(e) => updateField('landPlotCode', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                แผ่นที่ (ระวาง)
              </label>
              <input
                type="text"
                value={formData.mapSheet}
                onChange={(e) => updateField('mapSheet', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ในแผ่น
              </label>
              <input
                type="text"
                value={formData.inSheet}
                onChange={(e) => updateField('inSheet', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                สถานะการชำระเงิน
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => updateField('paymentStatus', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                <option value="pending">รอประเมิน / รอแจ้งชำระ</option>
                <option value="notified">แจ้งประเมินแล้ว (ภ.ป.3)</option>
                <option value="paid">ชำระภาษีเรียบร้อยแล้ว</option>
                <option value="overdue">เกินกำหนดชำระ</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                กำหนดชำระภาษีป้าย
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: ข้อมูลเจ้าของป้ายและที่อยู่ */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-bold text-slate-800">
                ชื่อและที่อยู่ของเจ้าของป้าย (ผู้มีหน้าที่เสียภาษีป้าย)
              </h2>
            </div>
            <span className="text-xs text-slate-400">บุคคลธรรมดา / นิติบุคคล</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">
                ชื่อ-สกุล เจ้าของป้าย / ชื่อนิติบุคคล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น นายสมศักดิ์ วงศ์สวัสดิ์ หรือ ห้างหุ้นส่วนจำกัด พระซองการค้า"
                value={formData.taxpayerName}
                onChange={(e) => updateField('taxpayerName', e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                เลขประจำตัวประชาชน / เลขนิติบุคคล (13 หลัก) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="X-XXXX-XXXXX-XX-X"
                value={formData.citizenId}
                onChange={(e) => updateField('citizenId', e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-mono text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="tel"
                placeholder="เช่น 081-234-5678"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                อีเมล (สำหรับส่งระบบแจ้งเตือนชำระภาษีป้าย)
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Address fields */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-600 mb-3 block">
              ที่อยู่ตามทะเบียนบ้าน / สำนักงานใหญ่ของเจ้าของป้าย:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">บ้านเลขที่</label>
                <input
                  type="text"
                  placeholder="88/1"
                  value={formData.houseNo}
                  onChange={(e) => updateField('houseNo', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">หมู่ที่</label>
                <select
                  value={formData.villageNo}
                  onChange={(e) => updateField('villageNo', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {PHRA_SONG_VILLAGES.map((v) => (
                    <option key={v.no} value={v.no}>
                      หมู่ {v.no}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ถนน</label>
                <input
                  type="text"
                  placeholder="นาแก-ดงหลวง"
                  value={formData.street}
                  onChange={(e) => updateField('street', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ซอย</label>
                <input
                  type="text"
                  placeholder="เทศบาล 1"
                  value={formData.soi}
                  onChange={(e) => updateField('soi', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">ตำบล</label>
                <input
                  type="text"
                  value={formData.subdistrict}
                  onChange={(e) => updateField('subdistrict', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">อำเภอ/จังหวัด</label>
                <input
                  type="text"
                  value={`${formData.district}, ${formData.province}`}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: สถานที่ติดตั้งป้าย และ การปักหมุด GPS */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-5 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="text-base font-bold text-slate-800">
                สถานที่ติดตั้งป้าย และการปักหมุดพิกัด GPS
              </h2>
            </div>
            <button
              type="button"
              onClick={copyAddressToSignLocation}
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-medium px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" />
              คัดลอกจากที่อยู่เจ้าของป้าย
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ป้ายตั้งอยู่ถนน / ทางหลวง
              </label>
              <input
                type="text"
                placeholder="เช่น ทางหลวงแผ่นดิน 223 (นาแก-ดงหลวง) กม.18"
                value={formData.signStreet}
                onChange={(e) => updateField('signStreet', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ป้ายตั้งอยู่ซอย / จุดสังเกตใกล้เคียง
              </label>
              <input
                type="text"
                placeholder="เช่น ตรงข้ามวัดพระซอง หรือ ปากซอยเทศบาล 2"
                value={formData.signSoi}
                onChange={(e) => updateField('signSoi', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                หมู่ที่ตั้งป้าย (หมู่ 1-16 ใน ทต.พระซอง)
              </label>
              <select
                value={formData.signVillageNo}
                onChange={(e) => updateField('signVillageNo', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              >
                {PHRA_SONG_VILLAGES.map((v) => (
                  <option key={v.no} value={v.no}>
                    หมู่ {v.no}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GPS Pin Box */}
          <div className="bg-linear-to-r from-emerald-50/70 to-teal-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-emerald-800 font-bold block">
                  พิกัดตำแหน่งภูมิศาสตร์ (GPS Coordinates)
                </span>
                <div className="flex items-center gap-3 mt-1 text-xs font-mono font-bold text-slate-800">
                  <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-300">
                    Lat: {formData.latitude.toFixed(6)}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-md border border-emerald-300">
                    Lng: {formData.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all"
              >
                <MapPin className="w-4 h-4" />
                เปิดแผนที่ปักหมุด GPS
              </button>

              <a
                href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors"
                title="เปิดใน Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Section 4: รายการป้าย (บุคคลหนึ่งสามารถมีได้หลายป้าย และอัปโหลดภาพได้ทุกป้าย) */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-5 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  แจกแจงรายละเอียดของป้ายและคำนวณภาษี
                </h2>
                <p className="text-xs text-slate-500">
                  บุคคลหนึ่งสามารถมีได้หลายป้าย และสามารถอัปโหลดภาพถ่ายได้ทุกป้าย
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSignboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการป้าย
            </button>
          </div>

          <div className="space-y-6">
            {formData.signboards.map((sign, index) => {
              const signTypeObj = SIGN_TYPE_INFO[sign.signType];
              const isMinTax = sign.taxAmount === 200 * (sign.quantity || 1) && sign.calculatedUnits * sign.ratePer500SqCm < 200;

              return (
                <div
                  key={sign.id || index}
                  className="border border-slate-200 rounded-2xl p-4 md:p-5 bg-slate-50/50 hover:border-emerald-300 transition-colors"
                >
                  {/* Sign Card Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold font-mono">
                        ป้ายที่ {index + 1}
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        รหัส: {sign.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block leading-tight">ภาษีป้ายนี้</span>
                        <span className="text-base font-bold text-emerald-700 font-mono">
                          ฿{sign.taxAmount.toLocaleString()}
                        </span>
                      </div>

                      {formData.signboards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSignboard(index)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="ลบป้ายนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form fields for this signboard */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Sign Type */}
                    <div className="md:col-span-2">
                      <label className="block font-medium text-slate-700 mb-1">
                        ประเภทป้ายตามกฎหมาย <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={sign.signType}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            signType: e.target.value as SignboardTypeCategory,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      >
                        <option value="type1_static">
                          ประเภท 1 (ข) ป้ายอักษรไทยล้วน - ป้ายนิ่ง (5 บาท/500 ตร.ซม.)
                        </option>
                        <option value="type1_dynamic">
                          ประเภท 1 (ก) ป้ายอักษรไทยล้วน - เคลื่อนไหว/เปลี่ยนได้ (10 บาท/500 ตร.ซม.)
                        </option>
                        <option value="type2_static">
                          ประเภท 2 (ข) อักษรไทยปนต่างประเทศหรือภาพ - ป้ายนิ่ง (26 บาท/500 ตร.ซม.)
                        </option>
                        <option value="type2_dynamic">
                          ประเภท 2 (ก) อักษรไทยปนต่างประเทศหรือภาพ - เคลื่อนไหว (52 บาท/500 ตร.ซม.)
                        </option>
                        <option value="type3_static">
                          ประเภท 3 (ข) ไม่มีอักษรไทย หรือไทยต่ำกว่าต่างประเทศ - ป้ายนิ่ง (50 บาท/500 ตร.ซม.)
                        </option>
                        <option value="type3_dynamic">
                          ประเภท 3 (ก) ไม่มีอักษรไทย หรือไทยต่ำกว่าต่างประเทศ - เคลื่อนไหว (52 บาท/500 ตร.ซม.)
                        </option>
                      </select>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        อัตรา: {signTypeObj?.rate} บาท / 500 ตารางเซนติเมตร
                      </p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        จำนวนป้าย (ป้าย) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={sign.quantity}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    {/* Width & Length */}
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        ความกว้าง (ซม.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="กว้าง (ซม.)"
                        value={sign.widthCm || ''}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            widthCm: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        ความยาว/ความสูง (ซม.) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="ยาว (ซม.)"
                        value={sign.lengthCm || ''}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            lengthCm: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-mono font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    {/* Calculated area summary badge */}
                    <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-200 flex flex-col justify-center">
                      <span className="text-[11px] text-emerald-800 font-medium">
                        เนื้อที่ป้าย: <strong className="font-mono text-emerald-900">{sign.areaSqCm?.toLocaleString()} ตร.ซม.</strong>
                      </span>
                      <span className="text-[11px] text-emerald-700">
                        คำนวณได้: {sign.calculatedUnits} หน่วย (500 ตร.ซม.)
                        {isMinTax && ' • ปรับเป็นขั้นต่ำ 200 บ.'}
                      </span>
                    </div>

                    {/* Sign text & preview */}
                    <div className="md:col-span-2">
                      <label className="block font-medium text-slate-700 mb-1">
                        ข้อความหรือภาพหรือเครื่องหมายที่ปรากฎในป้ายโดยย่อ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ร้านสมศักดิ์การเกษตร ปุ๋ย ยา เมล็ดพันธุ์คุณภาพดี (Somsak Agri)"
                        value={sign.messagePreview}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            messagePreview: e.target.value,
                          })
                        }
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    {/* Installation date */}
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        วันติดตั้งป้าย (แสดงป้าย)
                      </label>
                      <input
                        type="date"
                        value={sign.installDate}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            installDate: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>

                    {/* Installation detailed location */}
                    <div className="md:col-span-3">
                      <label className="block font-medium text-slate-700 mb-1">
                        สถานที่ติดตั้งป้าย (ถนน, ตรอก, ซอย, สถานที่ใกล้เคียง หรือระหว่าง ก.ม.ที่)
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ริมถนนสาย 223 ทางเข้าเทศบาล ระหว่าง กม.18-19 หน้าร้านค้า"
                        value={sign.installLocation}
                        onChange={(e) =>
                          handleUpdateSignboard(index, {
                            installLocation: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Multi-Photo Upload for this specific Signboard */}
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        รูปถ่ายป้ายที่ {index + 1} (สามารถอัปโหลดได้หลายภาพ)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {sign.photos?.length || 0} ภาพ
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {sign.photos?.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300 shadow-2xs"
                        >
                          <img
                            src={photo}
                            alt={`ป้ายที่ ${index + 1} ภาพที่ ${pIdx + 1}`}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                            onClick={() => setActivePhotoModal(photo)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = sign.photos.filter((_, i) => i !== pIdx);
                              handleUpdateSignboard(index, { photos: updated });
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Upload Button */}
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-emerald-700">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">+ เพิ่มรูป</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleSignPhotoUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Tax Summary Box */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="text-xs text-emerald-200">
                รวมภาษีป้ายประเมินทั้งสิ้น ({formData.signboards.length} รายการป้าย)
              </div>
              <div className="text-sm font-semibold text-emerald-100 mt-0.5">
                ({thaiBahtText(formData.totalEstimatedTax)})
              </div>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-white">
              ฿{formData.totalEstimatedTax.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Section 5: เอกสารหลักฐานประกอบ (บัตร ปชช., ทะเบียนบ้าน, ใบอนุญาต) */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h2 className="text-base font-bold text-slate-800">
                อัปโหลดเอกสารหลักฐานประกอบผ่านระบบออนไลน์
              </h2>
            </div>
            <span className="text-xs text-slate-400">สำเนาบัตร, ทะเบียนบ้าน, ใบอนุญาตก่อสร้าง</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                1. สำเนาบัตรประจำตัวประชาชน
              </span>
              <p className="text-slate-400 text-[11px] mb-2">เจ้าของป้ายหรือผู้รับมอบอำนาจ</p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-700 font-medium">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                แนบไฟล์สำเนาบัตร
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleDocUpload(e, 'สำเนาบัตรประชาชน')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                2. สำเนาทะเบียนบ้าน / ทะเบียนพาณิชย์
              </span>
              <p className="text-slate-400 text-[11px] mb-2">สถานที่ตั้งป้ายหรือสำนักงาน</p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-700 font-medium">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                แนบไฟล์ทะเบียนบ้าน
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleDocUpload(e, 'สำเนาทะเบียนบ้าน/พาณิชย์')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 block mb-1">
                3. ใบอนุญาตก่อสร้างหรือติดตั้งป้าย
              </span>
              <p className="text-slate-400 text-[11px] mb-2">(ถ้ามี ตาม พ.ร.บ.ควบคุมอาคาร)</p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-700 font-medium">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                แนบใบอนุญาต
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleDocUpload(e, 'ใบอนุญาตติดตั้งป้าย')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Uploaded Documents List */}
          {formData.documents && formData.documents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-600">เอกสารที่อัปโหลดแล้ว:</span>
              <div className="flex flex-wrap gap-2">
                {formData.documents.map((doc, dIdx) => (
                  <div
                    key={dIdx}
                    className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.documents?.filter((_, i) => i !== dIdx);
                        updateField('documents', updated);
                      }}
                      className="text-slate-400 hover:text-red-500 font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 6: ข้อมูลผู้สำรวจและผู้ตรวจ */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                6
              </span>
              <h2 className="text-base font-bold text-slate-800">
                ข้อมูลผู้สำรวจและผู้ตรวจการประเมินภาษี
              </h2>
            </div>
            <span className="text-xs text-slate-400">เจ้าหน้าที่เทศบาลตำบลพระซอง</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ชื่อผู้สำรวจ
              </label>
              <input
                type="text"
                value={formData.surveyorName}
                onChange={(e) => updateField('surveyorName', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ตำแหน่งผู้สำรวจ
              </label>
              <input
                type="text"
                value={formData.surveyorPosition}
                onChange={(e) => updateField('surveyorPosition', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                วันที่สำรวจ
              </label>
              <input
                type="date"
                value={formData.surveyDate}
                onChange={(e) => updateField('surveyDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ชื่อผู้ตรวจ
              </label>
              <input
                type="text"
                value={formData.inspectorName}
                onChange={(e) => updateField('inspectorName', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                ตำแหน่งผู้ตรวจ
              </label>
              <input
                type="text"
                value={formData.inspectorPosition}
                onChange={(e) => updateField('inspectorPosition', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                วันที่ตรวจ
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => updateField('inspectionDate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
            >
              ยกเลิก
            </button>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'อัปเดตข้อมูลสำรวจ' : 'บันทึกข้อมูลแบบสำรวจภาษีป้าย'}
          </button>
        </div>
      </form>

      {/* GPS Picker Modal */}
      <GPSPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLat={formData.latitude}
        initialLng={formData.longitude}
        villageNo={formData.signVillageNo}
        onSelectCoordinates={(lat, lng) => {
          updateField('latitude', lat);
          updateField('longitude', lng);
        }}
      />

      {/* Lightbox Photo Preview */}
      {activePhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setActivePhotoModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
            <img
              src={activePhotoModal}
              alt="ภาพขยายป้าย"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-3 right-3 text-white bg-black/50 p-2 rounded-full hover:bg-black/80"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
