"use client";
import { ExportType } from "@/app/services/relatorio";
import { Download } from "lucide-react";

interface ExportButtonProps {
  isExporting: boolean;
  isDeleting: boolean;
  exportProgress: number;
  showExportOptions: boolean;
  setShowExportOptions: (value: boolean) => void;
  handleExport: (format: ExportType) => void;
  exportDropdownRef: React.RefObject<HTMLDivElement | null>;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  isExporting,
  isDeleting,
  exportProgress,
  showExportOptions,
  setShowExportOptions,
  handleExport,
  exportDropdownRef,
}) => {
  return (
    <div className="relative" ref={exportDropdownRef}>
      {/* Botão principal */}
      <button
        onClick={() => setShowExportOptions(!showExportOptions)}
        disabled={isExporting || isDeleting}
        className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed 
                   text-gray-800 text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        {isExporting ? `Exportando... ${exportProgress}%` : "Exportar"}
      </button>

      {/* Dropdown com opções */}
      {showExportOptions && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <button
            onClick={() => {
              handleExport("basic");
              setShowExportOptions(false);
            }}
            disabled={isExporting || isDeleting}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm disabled:text-gray-400"
          >
            Exportar basico
          </button>
          <button
            onClick={() => {
              handleExport("excel");
              setShowExportOptions(false);
            }}
            disabled={isExporting || isDeleting}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm disabled:text-gray-400"
          >
            Exportar excel
          </button>
          <button
            onClick={() => {
              handleExport("advanced");
              setShowExportOptions(false);
            }}
            disabled={isExporting || isDeleting}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm disabled:text-gray-400"
          >
            Exportar avançado
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
