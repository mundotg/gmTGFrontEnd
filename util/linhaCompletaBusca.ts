import api from "@/context/axioCuston";
import { LinhaCompletaResponse, SelectedRow } from "@/types";

export const fetchRowData = async (
  row: SelectedRow,
  tableName: string,
  primaryKeyField: string,
  col_type?: string,
  primaryKeyValue?: string 
): Promise<Record<string, any> | null> => {
  if (row.index === undefined || row.index === null) {
    console.warn("⚠️ Índice da linha não informado");
    return null;
  }

  try {
    const response = await api.get<LinhaCompletaResponse>(
      `/consu/linha-completa/${encodeURIComponent(row.index)}`,
      {
        params: {
          primary_key_field: primaryKeyField,
          col_type: col_type?? "",
          primary_key_value: primaryKeyValue ?? "",
          order_by: row.orderBy ? JSON.stringify(row.orderBy) : "[]", // 👈 serializa o array
          table_name: tableName,
        },
        withCredentials: true,
      }
    );

    return response.data?.data?.__root__ ?? null;
  } catch (error) {
    console.error("❌ Erro ao buscar linha completa:", error);
    return null;
  }
};
