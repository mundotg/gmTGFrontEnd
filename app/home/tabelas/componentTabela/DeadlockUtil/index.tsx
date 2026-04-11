import {  AlertTriangle, Skull,  X } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ActionButton = ({ icon, text, action, className = "" }: any) => (
  <button
    onClick={action}
    className={`
      px-3 py-2 rounded-lg font-medium transition-all
      flex items-center gap-2 text-sm
      ${className || 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'}
      shadow-sm hover:shadow-md
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    `}
  >
    {icon}
    <span className="hidden sm:inline">{text}</span>
  </button>
);

export const EmptyState = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className={`
    text-center py-12 px-4 rounded-lg border-2 border-dashed
    ${isDarkMode
      ? 'bg-gray-800/50 border-gray-700 text-gray-300'
      : 'bg-gray-50 border-gray-300 text-gray-600'}
  `}>
    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p className="text-lg font-medium mb-1">Nenhum deadlock detectado</p>
    <p className="text-sm opacity-75">O sistema está monitorando em tempo real</p>
  </div>
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DeadlockTable = ({ viewData, isDarkMode, killProcess }: any) => (
  <div className="overflow-x-auto rounded-lg border shadow-sm">
    <table className={`
      w-full text-sm
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
    `}>
      <thead className={`
        ${isDarkMode
          ? 'bg-gray-900 text-gray-100 border-gray-700'
          : 'bg-gray-100 text-gray-800 border-gray-200'}
        border-b-2
      `}>
        <tr>
          <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
          <th className="px-4 py-3 text-center font-semibold">Count</th>
          <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Detalhes</th>
          <th className="px-4 py-3 text-center font-semibold">Ações</th>
        </tr>
      </thead>
      <tbody>
        
        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
          viewData.slice(0, 20).map((row: any, idx: number) => (
          <tr key={idx} className={`
            border-b transition-colors
            ${isDarkMode
              ? 'border-gray-700 hover:bg-gray-750 text-gray-100'
              : 'border-gray-200 hover:bg-gray-50 text-gray-900'}
          `}>
            <td className="px-4 py-3 font-mono text-xs sm:text-sm">
              {new Date(row.timestamp).toLocaleString('pt-BR')}
            </td>
            <td className="px-4 py-3 text-center">
              <span className={`
                inline-flex items-center justify-center
                w-8 h-8 rounded-full font-bold text-sm
                ${row.count > 0
                  ? 'bg-red-500 text-white'
                  : isDarkMode
                    ? 'bg-green-900 text-green-200'
                    : 'bg-green-100 text-green-800'}
              `}>
                {row.count}
              </span>
            </td>
            <td className="px-4 py-3 hidden md:table-cell">
              {row.items?.length > 0 && (
                <div className="space-y-1 text-xs">
                  {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                  row.items.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className={`
                      ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                    `}>
                      PID: <span className="font-mono font-semibold">{item.pid}</span>
                      {' → '}
                      <span className="font-mono font-semibold">{item.blocking_pid}</span>
                      {' '}({item.wait_time})
                    </div>
                  ))}
                  {row.items.length > 2 && (
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      +{row.items.length - 2} mais...
                    </div>
                  )}
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-center">
              {row.items?.length > 0 && (
                <button
                  onClick={() => killProcess(row.items[0].pid)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium
                    transition-colors inline-flex items-center gap-1.5
                    ${isDarkMode
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'}
                    shadow-sm hover:shadow
                  `}
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kill</span>
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ModalDeadlock = ({ type, data, loading, onClose }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 sm:p-6 border-b dark:border-gray-700">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white capitalize">
          {type}
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      <div className="p-4 sm:p-6 overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <pre className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-gray-800 dark:text-gray-200">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  </div>
);

