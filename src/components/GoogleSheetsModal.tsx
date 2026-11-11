/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Upload,
  Copy,
  Code,
  Sparkles,
  X,
  FileCheck,
  Send,
  Download,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { TaxpayerSurveyRecord } from '../types/tax';
import {
  getSavedWebhookUrl,
  saveWebhookUrl,
  syncToWebhookNoLogin,
  parseThaiTaxCSV,
  exportToExcel,
} from '../services/storageService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: TaxpayerSurveyRecord[];
  onImportRecords: (newRecords: TaxpayerSurveyRecord[]) => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  records,
  onImportRecords,
}) => {
  const [webhookUrl, setWebhookUrl] = useState<string>(() => getSavedWebhookUrl());
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copyScriptSuccess, setCopyScriptSuccess] = useState(false);

  if (!isOpen) return null;

  // Google Apps Script sample code for 100% zero-login Google Sheet sync
  const appsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Check if sheet is empty, write 30 headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'รหัสอ้างอิง (ID)','วันที่บันทึก','รหัสชื่อ','รหัสแปลงที่ดิน','แผ่นที่','ในแผ่น',
        'ชื่อ-สกุล เจ้าของป้าย','เลขบัตรประชาชน','เบอร์โทรศัพท์','รูปถ่ายป้าย',
        'บ้านเลขที่','หมู่ที่ (ที่อยู่)','ถนน','ซอย','ตำบล','อำเภอ','จังหวัด',
        'ป้ายตั้งอยู่ถนน','ป้ายตั้งอยู่ซอย','หมู่บ้านที่ตั้งป้าย (1-16)','พิกัด Latitude','พิกัด Longitude',
        'รายการป้ายและใบอนุญาต (JSON)','รวมภาษีป้ายประเมิน (บาท)','ชื่อผู้สำรวจ','ตำแหน่งผู้สำรวจ',
        'วันที่สำรวจ','ชื่อผู้ตรวจ','ตำแหน่งผู้ตรวจ','วันที่ตรวจ'
      ]);
    }
    
    // Clear and write all records
    sheet.getRange(2, 1, sheet.getLastRow(), 30).clearContent();
    var rows = [];
    data.records.forEach(function(r) {
      rows.push([
        r.id, r.recordDate, r.nameCode, r.landPlotCode, r.mapSheet, r.inSheet,
        r.taxpayerName, r.citizenId, r.phone, (r.photos || []).join(' ; '),
        r.houseNo, r.villageNo, r.street, r.soi, r.subdistrict, r.district, r.province,
        r.signStreet, r.signSoi, r.signVillageNo, r.latitude, r.longitude,
        JSON.stringify(r.signboards || []), r.totalEstimatedTax,
        r.surveyorName, r.surveyorPosition, r.surveyDate,
        r.inspectorName, r.inspectorPosition, r.inspectionDate
      ]);
    });
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 30).setValues(rows);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleSyncWebhook = async () => {
    if (!webhookUrl.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'กรุณาระบุ URL ของ Webhook หรือ Google Apps Script',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await syncToWebhookNoLogin(webhookUrl.trim(), records);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `ซิงค์ข้อมูล ${records.length} รายการไปยัง Google Sheets โดยไม่ต้องล็อกอินสำเร็จ!`,
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'การซิงค์ล้มเหลว' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopyScriptSuccess(true);
    setTimeout(() => setCopyScriptSuccess(false), 2500);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseThaiTaxCSV(content);
        if (parsed.length > 0) {
          onImportRecords(parsed);
          setStatusMessage({
            type: 'success',
            text: `นำเข้าข้อมูลจากไฟล์ CSV สำเร็จจำนวน ${parsed.length} รายการ!`,
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: 'ไม่สามารถอ่านข้อมูลจากไฟล์ CSV ได้ กรุณาตรวจสอบรูปแบบไฟล์',
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleImportSampleData = async () => {
    try {
      const res = await fetch(
        '/assets/aistudio/___________________________________._.1____.__9027715e.3__-_________________'
      );
      if (res.ok) {
        const text = await res.text();
        const parsed = parseThaiTaxCSV(text);
        if (parsed.length > 0) {
          onImportRecords(parsed);
          setStatusMessage({
            type: 'success',
            text: `นำเข้าข้อมูลตัวอย่าง ทต.พระซอง (${parsed[0].taxpayerName}) สำเร็จแล้ว!`,
          });
          return;
        }
      }
    } catch (e) {
      console.warn(e);
    }
    setStatusMessage({
      type: 'error',
      text: 'ไม่สามารถโหลดไฟล์ตัวอย่างได้',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                เชื่อมต่อฐานข้อมูลโดยไม่ต้องล็อกอิน
              </h3>
              <p className="text-xs text-emerald-100">
                ระบบฐานข้อมูลเซิร์ฟเวอร์ ทต.พระซอง • บันทึกอัตโนมัติ Real-Time พร้อมซิงค์ Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: Server Database Status (Active & Zero Login) */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-950">
                  ฐานข้อมูลเซิร์ฟเวอร์เทศบาลตำบลพระซอง (ไม่ต้องล็อกอิน)
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                ออนไลน์ • พร้อมใช้งาน
              </span>
            </div>

            <p className="text-xs text-emerald-800 leading-relaxed">
              ระบบเชื่อมต่อกับฐานข้อมูลหลักโดยอัตโนมัติ ไม่จำเป็นต้องลงชื่อเข้าใช้ (Login) ทุกครั้งที่บันทึก สำรวจ หรือแก้ไขข้อมูล จะถูกบันทึกลงฐานข้อมูลอย่างถาวรทันที
            </p>

            <div className="flex items-center justify-between pt-1 text-xs text-emerald-900 font-medium">
              <span>ข้อมูลในระบบปัจจุบัน: <strong>{records.length} รายการ</strong></span>
              <button
                type="button"
                onClick={() => exportToExcel(records)}
                className="text-emerald-700 hover:text-emerald-900 underline inline-flex items-center gap-1 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                ดาวน์โหลดสำรอง Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Section 2: One-Click Import CSV / Sample data */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 block">
              ๑. นำเข้าข้อมูลสำรวจภาษีป้าย (Import CSV / ฐานข้อมูลเดิม):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl cursor-pointer text-xs font-semibold text-slate-700 transition-colors shadow-2xs">
                <Upload className="w-4 h-4 text-emerald-600" />
                เลือกไฟล์ CSV นำเข้าสู่ระบบ
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleImportSampleData}
                className="inline-flex items-center justify-center gap-2 p-3 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                ดึงข้อมูลตัวอย่างตามเอกสารแนบ
              </button>
            </div>
          </div>

          {/* Section 3: Webhook / Google Sheets Zero Login Sync */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                ๒. ซิงค์ส่งข้อมูลไปยัง Google Sheets อัตโนมัติ (ผ่าน Webhook):
              </span>
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1"
              >
                <Code className="w-3.5 h-3.5" />
                {showScriptCode ? 'ซ่อนโค้ดสคริปต์' : 'วิธีรับ Webhook URL (ฟรี)'}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              วาง Google Apps Script Web App URL ของ Google Sheet เพื่อส่งข้อมูล 30 คอลัมน์ตรงเข้าตารางโดยไม่ต้องล็อกอิน
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={webhookUrl}
                onChange={(e) => {
                  setWebhookUrl(e.target.value);
                  saveWebhookUrl(e.target.value);
                }}
                className="w-full flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />

              <button
                type="button"
                onClick={handleSyncWebhook}
                disabled={isSyncing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {isSyncing ? 'กำลังส่งข้อมูล...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}
              </button>
            </div>

            {/* Script Instruction Modal Toggle */}
            {showScriptCode && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    ขั้นตอนการสร้าง Webhook บน Google Sheets (ทำครั้งเดียว):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copyScriptSuccess ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ด'}
                  </button>
                </div>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-0.5">
                  <li>เปิด Google Sheet ของท่าน ไปที่เมนู <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
                  <li>ลบโค้ดเดิม แล้ววางโค้ดด้านล่างนี้ลงไป</li>
                  <li>กด <strong>ทำให้ใช้งานได้ (Deploy) &gt; รายการทำให้ใช้งานได้ใหม่ (New deployment)</strong></li>
                  <li>เลือกประเภทเป็น <strong>เว็บแอป (Web app)</strong> และตั้งค่า <em>ผู้มีสิทธิ์เข้าถึง (Who has access)</em> เป็น <strong>ทุกคน (Anyone)</strong></li>
                  <li>คัดลอก URL เว็บแอปที่ได้ มาวางในช่องด้านบนนี้</li>
                </ol>

                <pre className="bg-slate-900 text-emerald-300 p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto max-h-32">
                  {appsScriptCode}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ระบบจัดเก็บภาษีป้าย เทศบาลตำบลพระซอง
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
