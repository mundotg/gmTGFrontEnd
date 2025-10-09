'use client';
import React, {  Suspense } from 'react';
import { ReferencePopup } from './component/ReferencePopup';


export default function ReferencePopupWrapper() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Carregando parâmetros...</span>
        </div>
      </div>
    }>
      <ReferencePopup />
    </Suspense>
  );
}