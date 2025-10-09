import { useCallback, useState } from 'react';
import { MetadataTableResponse } from '@/types';
import { findIdentifierField } from '@/util/func';

interface UseRowDeleteProps {
  row: any;
  selectedTables: MetadataTableResponse[];
  onDelete?: (tableName: string, primaryKey: string, primaryKeyValue: string, rowIndex: number, keyType: string) => Promise<void>;
  onClose: () => void;
}

interface UseRowDeleteReturn {
  handleDelete: () => Promise<void>;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  isDeleting: boolean;
}

export const useRowDelete = ({
  row,
  selectedTables,
  onDelete,
  onClose
}: UseRowDeleteProps): UseRowDeleteReturn => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função auxiliar para extrair a chave primária do registro
  const getPrimaryKeyInfo = useCallback(() => {
    if (!row || selectedTables.length === 0) {
      throw new Error("Dados insuficientes para identificar o registro");
    }

    // Tenta encontrar a chave primária em todas as tabelas selecionadas
    for (const table of selectedTables) {
      const primaryKeyField = findIdentifierField(table.table_name, selectedTables);
      if (primaryKeyField) {
        // Tenta diferentes formas de acessar o valor da chave primária
        const qualifiedPrimaryKey = `${table.table_name}.${primaryKeyField.nome}`;
        const primaryKeyValue = row.row?.[qualifiedPrimaryKey] ?? row.row?.[primaryKeyField.nome] ?? row.row?.['id'] ?? row.row?.['ID'];
        
        if (primaryKeyValue) {
          return {
            tableName: table.table_name,
            primaryKey: primaryKeyField.nome,
            primaryKeyValue: String(primaryKeyValue),
            keyType: primaryKeyField.tipo
          };
        }
      }
    }

    // Fallback: tenta usar o primeiro campo único ou qualquer campo como identificador
    const firstTable = selectedTables[0];
    const firstColumn = firstTable.colunas[0];
    
    if (firstColumn) {
      const qualifiedKey = `${firstTable.table_name}.${firstColumn.nome}`;
      const keyValue = row.row?.[qualifiedKey] ?? row.row?.[firstColumn.nome] ?? Object.values(row.row || {})[0];
      
      if (keyValue) {
        return {
          tableName: firstTable.table_name,
          primaryKey: firstColumn.nome,
          primaryKeyValue: String(keyValue),
          keyType: firstColumn.tipo
        };
      }
    }

    throw new Error("Não foi possível identificar uma chave única para eliminação");
  }, [row, selectedTables]);

  // Handler para deletar registro
  const handleDelete = useCallback(async () => {
    if (!onDelete || !row) {
      console.warn("Função onDelete não disponível");
      return;
    }

    // Confirmação adicional
    if (!window.confirm("Tens a certeza que queres ELIMINAR este registro? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDeleting(true);

    try {
      const primaryKeyInfo = getPrimaryKeyInfo();
      
      await onDelete(
        primaryKeyInfo.tableName,
        primaryKeyInfo.primaryKey,
        primaryKeyInfo.primaryKeyValue,
        row.index ?? -1,
        primaryKeyInfo.keyType
      );
      
      onClose();
    } catch (error) {
      console.error("Erro ao eliminar registro:", error);
      
      // Mensagens de erro mais específicas
      let errorMessage = "Erro desconhecido ao eliminar registro";
      if (error instanceof Error) {
        if (error.message.includes("chave única")) {
          errorMessage = "Não foi possível identificar unicamente este registro para eliminação. O registro pode ter campos insuficientes para identificação única.";
        } else if (error.message.includes("Dados insuficientes")) {
          errorMessage = "Dados insuficientes para realizar a eliminação. Verifique se o registro está completo.";
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Erro ao eliminar registro: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [onDelete, row, getPrimaryKeyInfo, onClose]);

  return {
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isDeleting
  };
};