
//   const getInputType = (columnType: string): string => {
//     if (!columnType) return 'text'
//     switch (columnType.toLowerCase()) {
//       case 'int':
//       case 'bigint':
//       case 'smallint':
//       case 'tinyint':
//         return 'number';
//       case 'decimal':
//       case 'float':
//       case 'money':
//         return 'number';
//       case 'datetime':
//       case 'date':
//         return 'datetime-local';
//       case 'bit':
//         return 'checkbox';
//       default:
//         return 'text';
//     }
//   };

//   const getColumnIcon = (column: CampoDetalhado) => {
//     if (column.is_primary_key) return <Key className="w-4 h-4 text-yellow-500" />;

//     switch (column.tipo.toLowerCase()) {
//       case 'int':
//       case 'bigint':
//       case 'smallint':
//       case 'tinyint':
//         return <Hash className="w-4 h-4 text-blue-500" />;
//       case 'datetime':
//       case 'date':
//         return <Calendar className="w-4 h-4 text-green-500" />;
//       case 'bit':
//         return <ToggleLeft className="w-4 h-4 text-purple-500" />;
//       case 'text':
//         return <FileText className="w-4 h-4 text-gray-500" />;
//       default:
//         return <Type className="w-4 h-4 text-gray-500" />;
//     }
//   };