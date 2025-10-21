export interface ConfirmDeleteModalType {
  isOpen: boolean;
  type: "single" | "all" | "select";
  total?: number;
  lista: ListaDelete[]
}

export interface ListaDelete {
    row?: Record<string, string>;
    index?: number;
    table?: string[];
  }