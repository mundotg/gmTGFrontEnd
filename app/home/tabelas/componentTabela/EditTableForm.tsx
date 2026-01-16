import { DBStructure } from "@/types/db-structure";
import { useEffect, useState } from "react";

export const EditTableForm: React.FC<{ tableName: string | null; onSave: (newName: string, newDesc: string) => void; 
    onCancel: () => void; getStructure: (name: string) => DBStructure | undefined }> =
 ({ tableName, onSave, onCancel, getStructure }) => {
  const structure = tableName ? getStructure(tableName) : undefined;
  const [name, setName] = useState(tableName ?? "");
  const [desc, setDesc] = useState(structure?.description ?? "");

  useEffect(() => {
    setName(tableName ?? "");
    setDesc(structure?.description ?? "");
  }, [tableName, structure]);

  return (
    <div>
      <label className="block text-sm mb-1">Nome</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 rounded border mb-3" />
      <label className="block text-sm mb-1">Descrição</label>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-2 rounded border mb-4" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1">Cancelar</button>
        <button onClick={() => onSave(name, desc)} className="px-3 py-1 bg-blue-500 text-white rounded">Salvar</button>
      </div>
    </div>
  );
};
