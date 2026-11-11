/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Table,
  Bell,
  FileSpreadsheet,
  Download,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { MunicipalEmblem } from './MunicipalEmblem';

export type AppTab = 'dashboard' | 'survey' | 'records' | 'notifications';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  currentUser: User | null;
  onOpenGoogleSheets: () => void;
  onExportExcel: () => void;
  overdueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenGoogleSheets,
  onExportExcel,
  overdueCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onTabChange('dashboard')}
          >
            <MunicipalEmblem size={44} />
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-sm md:text-base leading-tight tracking-tight">
                ระบบสำรวจภาษีป้าย
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                เทศบาลตำบลพระซอง อ.นาแก จ.นครพนม
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600" />
              ภาพรวมสถิติ
            </button>

            <button
              onClick={() => onTabChange('survey')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'survey'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              แบบสำรวจ (ภ.ป.๑)
            </button>

            <button
              onClick={() => onTabChange('records')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'records'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-600" />
              ทะเบียนคุมป้าย
            </button>

            <button
              onClick={() => onTabChange('notifications')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                activeTab === 'notifications'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-600" />
              แจ้งเตือนชำระภาษี
              {overdueCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </nav>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2">
            {/* Database & Sync Trigger (Zero Login) */}
            <button
              type="button"
              onClick={onOpenGoogleSheets}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100 transition-all shadow-2xs"
              title="ฐานข้อมูลเซิร์ฟเวอร์ ทต.พระซอง และการซิงค์ข้อมูล (ไม่ต้องล็อกอิน)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>ฐานข้อมูล & ซิงค์</span>
            </button>

            {/* Quick Export Excel */}
            <button
              type="button"
              onClick={onExportExcel}
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition-colors"
              title="ส่งออกไฟล์ Excel"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'dashboard' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
          >
            ภาพรวม
          </button>
          <button
            onClick={() => onTabChange('survey')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'survey' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
          >
            แบบสำรวจ
          </button>
          <button
            onClick={() => onTabChange('records')}
            className={`py-1 px-2 rounded-lg ${activeTab === 'records' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
          >
            ทะเบียนคุม
          </button>
          <button
            onClick={() => onTabChange('notifications')}
            className={`py-1 px-2 rounded-lg relative ${activeTab === 'notifications' ? 'text-emerald-800 font-bold bg-emerald-50' : ''}`}
          >
            แจ้งเตือน
            {overdueCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-0.5 right-0.5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
