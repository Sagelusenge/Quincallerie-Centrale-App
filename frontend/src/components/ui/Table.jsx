export function Table({ columns, data, emptyText = 'Aucune donnee', renderActions }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              {columns.map((column) => <th key={column.key} className="px-4 py-3">{column.header}</th>)}
              {renderActions ? <th className="px-4 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data?.length ? data.map((row, index) => (
              <tr key={row.id || row.id_produit || row.id_client || row.id_utilisateur || row.id_categorie || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-200">
                    {column.render ? column.render(row) : row[column.key] ?? '-'}
                  </td>
                ))}
                {renderActions ? <td className="px-4 py-3 text-right">{renderActions(row)}</td> : null}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-10 text-center text-slate-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
