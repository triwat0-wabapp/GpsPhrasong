/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface MunicipalEmblemProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

// Official emblem image attached by the user
export const PHRA_SONG_LOGO_URL = '/assets/aistudio/yyyyyyyyyyyyyyyy_338747c7.png';

export const MunicipalEmblem: React.FC<MunicipalEmblemProps> = ({
  className = '',
  size = 56,
  showText = false,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {!imgError ? (
        <img
          src={PHRA_SONG_LOGO_URL}
          alt="ตราสัญลักษณ์เทศบาลตำบลพระซอง อำเภอนาแก จังหวัดนครพนม"
          style={{ width: size, height: size }}
          className="rounded-full object-contain shrink-0 drop-shadow-sm select-none"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="rounded-full bg-amber-500 border-2 border-slate-800 flex items-center justify-center font-bold text-white text-xs select-none"
        >
          ทต.พระซอง
        </div>
      )}

      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-base md:text-lg leading-tight tracking-tight">
            เทศบาลตำบลพระซอง
          </span>
          <span className="text-xs text-emerald-800 font-semibold">
            อำเภอนาแก จังหวัดนครพนม
          </span>
        </div>
      )}
    </div>
  );
};
