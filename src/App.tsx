/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  TaxpayerSurveyRecord,
  PaymentStatus,
} from './types/tax';
import {
  fetchServerRecords,
  getStoredRecords,
  addOrUpdateRecord,
  deleteRecord,
  exportToExcel,
  saveRecordsToLocal,
} from './services/storageService';
import { Header, AppTab } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TaxSurveyForm } from './components/TaxSurveyForm';
import { SignboardList } from './components/SignboardList';
import { FormPrintView } from './components/FormPrintView';
import { NotificationManager } from './components/NotificationManager';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [records, setRecords] = useState<TaxpayerSurveyRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<TaxpayerSurveyRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<TaxpayerSurveyRecord | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize records from server database (Zero Login required)
  useEffect(() => {
    async function loadData() {
      const serverData = await fetchServerRecords();
      setRecords(serverData);
    }
    loadData();
  }, []);

  // Handler to add or save survey record
  const handleSaveRecord = async (record: TaxpayerSurveyRecord) => {
    const updated = await addOrUpdateRecord(record);
    setRecords(updated);
    setEditingRecord(null);
    setActiveTab('records');
  };

  // Handler to delete record
  const handleDeleteRecord = async (id: string) => {
    const updated = await deleteRecord(id);
    setRecords(updated);
  };

  // Handler to import records from CSV/backup
  const handleImportRecords = async (newRecords: TaxpayerSurveyRecord[]) => {
    const map = new Map<string, TaxpayerSurveyRecord>();
    // Prioritize imported records
    newRecords.forEach((r) => map.set(r.id, r));
    records.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    const merged = Array.from(map.values());
    setRecords(merged);
    saveRecordsToLocal(merged);

    try {
      await fetch('/api/records/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: merged, mode: 'replace' }),
      });
    } catch (e) {
      console.warn('Batch server save warning:', e);
    }
  };

  // Handler to update payment status
  const handleUpdateStatus = async (id: string, newStatus: PaymentStatus) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;
    const updatedRecord: TaxpayerSurveyRecord = {
      ...target,
      paymentStatus: newStatus,
      paidDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : target.paidDate,
    };
    const updatedList = await addOrUpdateRecord(updatedRecord);
    setRecords(updatedList);
  };

  const overdueCount = records.filter((r) => r.paymentStatus === 'overdue').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setPrintingRecord(null);
          setEditingRecord(null);
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onOpenGoogleSheets={() => setIsGoogleModalOpen(true)}
        onExportExcel={() => exportToExcel(records)}
        overdueCount={overdueCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {printingRecord ? (
          <FormPrintView
            record={printingRecord}
            onBack={() => setPrintingRecord(null)}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            records={records}
            onAddNew={() => {
              setEditingRecord(null);
              setActiveTab('survey');
            }}
            onGoToList={() => setActiveTab('records')}
            onOpenGoogleSheets={() => setIsGoogleModalOpen(true)}
            onExportExcel={() => exportToExcel(records)}
          />
        ) : activeTab === 'survey' ? (
          <TaxSurveyForm
            initialData={editingRecord}
            onSave={handleSaveRecord}
            onCancel={() => {
              setEditingRecord(null);
              setActiveTab('records');
            }}
          />
        ) : activeTab === 'records' ? (
          <SignboardList
            records={records}
            onAddNew={() => {
              setEditingRecord(null);
              setActiveTab('survey');
            }}
            onEdit={(rec) => {
              setEditingRecord(rec);
              setActiveTab('survey');
            }}
            onDelete={handleDeleteRecord}
            onPrint={(rec) => setPrintingRecord(rec)}
            onOpenGoogleSheetsModal={() => setIsGoogleModalOpen(true)}
          />
        ) : activeTab === 'notifications' ? (
          <NotificationManager
            records={records}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : null}
      </main>

      {/* Database & Sync Modal (Zero Login Required) */}
      <GoogleSheetsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        records={records}
        onImportRecords={handleImportRecords}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
      />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ระบบสำรวจภาษีป้าย เทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม ๔๘๑๓๐
          </span>
          <span className="text-[11px] text-slate-400">
            พ.ร.บ.ภาษีป้าย พ.ศ. ๒๕๑๐ • กฎกระทรวงกำหนดอัตราภาษีป้าย พ.ศ. ๒๕๖๓
          </span>
        </div>
      </footer>
    </div>
  );
}
