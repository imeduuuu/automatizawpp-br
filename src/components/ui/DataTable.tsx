import type { ReactNode } from 'react';

type DataTableColumn = {
  key: string;
  label: string;
  width?: string;
};

type DataTableRow = Record<string, ReactNode> & { id?: string };

type DataTableProps = {
  columns: DataTableColumn[];
  data: DataTableRow[];
  onRowClick?: (row: DataTableRow) => void;
};

export function DataTable({ columns, data, onRowClick }: DataTableProps) {
  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width }}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const key = row.id ?? String(index);
            const clickable = Boolean(onRowClick);
            return (
              <tr
                key={key}
                onClick={
                  clickable
                    ? () => {
                        onRowClick?.(row);
                      }
                    : undefined
                }
                style={clickable ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{row[column.key] ?? '-'}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export type { DataTableColumn, DataTableRow };
