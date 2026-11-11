/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Crosshair, Check, X, Search } from 'lucide-react';
import { PHRA_SONG_VILLAGES } from '../types/tax';

interface GPSPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  villageNo?: string;
  onSelectCoordinates: (lat: number, lng: number) => void;
}

// Center coordinates of Tambon Phra Song, Na Kae, Nakhon Phanom
const PHRA_SONG_CENTER = { lat: 16.9452, lng: 104.5025 };

declare global {
  interface Window {
    L?: any;
  }
}

export const GPSPickerModal: React.FC<GPSPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  villageNo,
  onSelectCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [lat, setLat] = useState<number>(initialLat || PHRA_SONG_CENTER.lat);
  const [lng, setLng] = useState<number>(initialLng || PHRA_SONG_CENTER.lng);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Sync when opening
  useEffect(() => {
    if (isOpen) {
      const targetLat = initialLat && initialLat !== 0 ? initialLat : PHRA_SONG_CENTER.lat;
      const targetLng = initialLng && initialLng !== 0 ? initialLng : PHRA_SONG_CENTER.lng;
      setLat(targetLat);
      setLng(targetLng);
    }
  }, [isOpen, initialLat, initialLng]);

  // Initialize or update Leaflet map
  useEffect(() => {
    if (!isOpen) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const L = window.L;
      if (!L) {
        console.warn('Leaflet not loaded yet');
        return;
      }

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }

      const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
      leafletMapRef.current = map;

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | เทศบาลตำบลพระซอง',
        maxZoom: 19,
      }).addTo(map);

      // Create Custom Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-gps-pin',
        html: `
          <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
            <div style="background:#059669; color:white; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold; box-shadow:0 2px 6px rgba(0,0,0,0.3); white-space:nowrap; border:1.5px solid white;">
              📍 จุดติดตั้งป้าย
            </div>
            <div style="width:14px; height:14px; background:#059669; border:2.5px solid white; border-radius:50%; margin-top:-2px; box-shadow:0 2px 4px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(Number(position.lat.toFixed(6)));
        setLng(Number(position.lng.toFixed(6)));
      });

      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const roundLat = Number(clickLat.toFixed(6));
        const roundLng = Number(clickLng.toFixed(6));
        setLat(roundLat);
        setLng(roundLng);
        marker.setLatLng([roundLat, roundLng]);
      });

      // Force resize calculation
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const curLat = Number(pos.coords.latitude.toFixed(6));
        const curLng = Number(pos.coords.longitude.toFixed(6));
        setLat(curLat);
        setLng(curLng);
        setIsLocating(false);

        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.setView([curLat, curLng], 17);
          markerRef.current.setLatLng([curLat, curLng]);
        }
      },
      (err) => {
        console.error('GPS error:', err);
        setIsLocating(false);
        setGpsError('ไม่สามารถดึงตำแหน่งพิกัดได้ โปรดเปิดสิทธิ์ Location หรือคลิกปักหมุดบนแผนที่');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleVillageSelect = (vNo: string) => {
    // Village approximate offsets around Phra Song
    const vIndex = parseInt(vNo, 10) || 1;
    const angle = (vIndex / 16) * 2 * Math.PI;
    const offsetLat = Math.sin(angle) * 0.012;
    const offsetLng = Math.cos(angle) * 0.015;
    const targetLat = Number((PHRA_SONG_CENTER.lat + offsetLat).toFixed(6));
    const targetLng = Number((PHRA_SONG_CENTER.lng + offsetLng).toFixed(6));

    setLat(targetLat);
    setLng(targetLng);

    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.setView([targetLat, targetLng], 16);
      markerRef.current.setLatLng([targetLat, targetLng]);
    }
  };

  const handleConfirm = () => {
    onSelectCoordinates(lat, lng);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 to-teal-700 text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <MapPin className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">
                ปักหมุดพิกัด GPS ตำแหน่งติดตั้งป้าย
              </h3>
              <p className="text-xs text-emerald-100">
                คลิกบนแผนที่หรือลากหมุดไปยังจุดติดตั้งป้ายในเขต ทต.พระซอง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Fast Village Selector */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-medium shadow-xs transition-all disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'กำลังค้นหาตำแหน่ง...' : 'พิกัด GPS ปัจจุบัน'}
            </button>

            <button
              type="button"
              onClick={() => {
                setLat(PHRA_SONG_CENTER.lat);
                setLng(PHRA_SONG_CENTER.lng);
                if (leafletMapRef.current && markerRef.current) {
                  leafletMapRef.current.setView([PHRA_SONG_CENTER.lat, PHRA_SONG_CENTER.lng], 15);
                  markerRef.current.setLatLng([PHRA_SONG_CENTER.lat, PHRA_SONG_CENTER.lng]);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
              จุดศูนย์กลาง ทต.พระซอง
            </button>
          </div>

          {/* Quick Village Preset */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              เลือกหมู่บ้าน:
            </span>
            <select
              value={villageNo || ''}
              onChange={(e) => handleVillageSelect(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="">-- ไปยังหมู่ (1-16) --</option>
              {PHRA_SONG_VILLAGES.map((v) => (
                <option key={v.no} value={v.no}>
                  หมู่ {v.no}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error notification */}
        {gpsError && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <span>{gpsError}</span>
            <button
              onClick={() => setGpsError(null)}
              className="text-amber-600 hover:text-amber-900 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Map Container */}
        <div className="relative flex-1 min-h-[380px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

          {/* Floating Instructions */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs text-slate-700 pointer-events-none hidden sm:block">
            📍 แตะหรือคลิกบนแผนที่เพื่อย้ายหมุดตำแหน่งป้าย
          </div>
        </div>

        {/* Bottom Coordinates & Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial">
              <span className="text-slate-500 block">ละติจูด (Latitude):</span>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLat(val);
                  if (markerRef.current) markerRef.current.setLatLng([val, lng]);
                }}
                className="font-mono font-semibold text-emerald-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 w-full sm:w-28 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex-1 sm:flex-initial">
              <span className="text-slate-500 block">ลองจิจูด (Longitude):</span>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLng(val);
                  if (markerRef.current) markerRef.current.setLatLng([lat, val]);
                }}
                className="font-mono font-semibold text-emerald-800 bg-slate-50 border border-slate-300 rounded px-2 py-1 w-full sm:w-28 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <Check className="w-4 h-4" />
              ยืนยันตำแหน่งนี้
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
