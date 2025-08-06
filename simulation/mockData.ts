// mockData.ts
export const dbMetadata = {
  tableCount: 5,
  procedureCount: 2,
  triggerCount: 3,
  tables: [
    {
      name: "usuarios",
      columns: [
        { name: "id", type: "number" },
        { name: "nome", type: "text" },
        { name: "email", type: "email" },
      ],
    },
    {
      name: "produtos",
      columns: [
        { name: "id", type: "number" },
        { name: "nome", type: "text" },
        { name: "preco", type: "number" },
      ],
    },
  ],
};
