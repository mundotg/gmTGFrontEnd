/* ---------- Formulários simples usados pelos modais ---------- */

import { useState } from "react";

export const CreateTableForm: React.FC<{ onCreate: (name: string, schema?: string) => void; 
    onCancel: () => void; schemas: string[] }> = ({ onCreate, onCancel, schemas }) => {
  const [name, setName] = useState("");
  const [schema, setSchema] = useState<string | undefined>(schemas?.[0]);
  return (
    <div>
      <label className="block text-sm mb-1">Nome da tabela</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded border mb-3" />
      <label className="block text-sm mb-1">Schema (opcional)</label>
      <select value={schema} onChange={(e) => setSchema(e.target.value)} className="w-full p-2 rounded mb-4">
        <option value="">(padrão)</option>
        {schemas.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1">Cancelar</button>
        <button onClick={() => onCreate(name, schema)} className="px-3 py-1 bg-blue-500 text-white rounded">Criar</button>
      </div>
    </div>
  );
};
