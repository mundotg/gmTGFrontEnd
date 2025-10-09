export interface ConfirmDeleteModalType {
  isOpen: boolean;
  type: "single" | "all" | "select";
  total?: number;
  lista: {
    row?: Record<string, string>;
    index?: number;
    table?: string[];
  }[]
}