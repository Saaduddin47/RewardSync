import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

const DataTable = ({
  columns,
  data,
  searchPlaceholder = "Search...",
  isLoading = false,
  error = "",
  emptyMessage = "No records found",
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const table = useReactTable({
    data: safeData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue) => {
      const needle = String(filterValue || "").toLowerCase();
      if (!needle) return true;
      return JSON.stringify(row.original).toLowerCase().includes(needle);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <Input
        placeholder={searchPlaceholder}
        className="border-border bg-background text-foreground"
        value={globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
      />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground/70">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === "asc"
                            ? <ArrowUp size={13} />
                            : header.column.getIsSorted() === "desc"
                              ? <ArrowDown size={13} />
                              : <ArrowUpDown size={13} className="text-foreground/50" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-foreground/70" colSpan={columns.length || 1}>
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-6 text-sm text-red-500" colSpan={columns.length || 1}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-foreground/70" colSpan={columns.length || 1}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm text-foreground/90">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm text-foreground/70">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            Previous
          </Button>
          <Button variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
