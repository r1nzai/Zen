import {
    createColumnHelper,
    ExpandedState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    TableOptions,
    useReactTable,
} from '@tanstack/react-table'
import { useState } from 'react'

import HTML from '../HTML'
import ITableProps from './Table.types'
export default function Table<TableType, ValueType>(props: ITableProps<TableType, ValueType>) {
    let { columns, data, isTree, subRowsKey } = props
    isTree ??= false
    columns ??= []
    data ??= []
    subRowsKey ??= 'subRows' as keyof TableType
    const tableConfig: TableOptions<TableType> = {
        data: data,
        columns: columns,
        getCoreRowModel: getCoreRowModel(),
        getSubRows: (originalRow: TableType) => originalRow[subRowsKey!] as TableType[],
    }
    const [expanded, setExpanded] = useState<ExpandedState>({})
    if (isTree) {
        tableConfig.state = {}
        tableConfig.state.expanded = expanded
        tableConfig.onExpandedChange = setExpanded
        tableConfig.getSubRows = (originalRow: TableType) => originalRow[subRowsKey!] as TableType[]
        tableConfig.getExpandedRowModel = getExpandedRowModel()
        tableConfig.columns = [
            {
                id: 'expander',
                accessorKey: '.',
                header: '',
                cell: ({ row }) => {
                    if (!row.original?.[subRowsKey!] || (row.original?.[subRowsKey!] as TableType[])?.length === 0) {
                        return null
                    }
                    return (
                        <HTML
                            tag="button"
                            onClick={() => {
                                row.toggleExpanded()
                            }}
                        >
                            {row.getIsExpanded() ? '👇' : '👉'}
                        </HTML>
                    )
                },
            },
            ...columns,
        ]
    }
    const tableInstance = useReactTable<TableType>(tableConfig)
    return (
        <HTML tag="table">
            <HTML tag="thead">
                {tableInstance.getHeaderGroups().map((headerGroup) => (
                    <HTML tag="tr" key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <HTML tag="th" key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
                            </HTML>
                        ))}
                    </HTML>
                ))}
            </HTML>
            <HTML tag="tbody">
                {tableInstance.getRowModel().rows.map((row) => (
                    <HTML tag="tr" key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <HTML tag="td" key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </HTML>
                        ))}
                    </HTML>
                ))}
            </HTML>
            <HTML tag="tfoot">
                {tableInstance.getFooterGroups().map((footerGroup) => (
                    <HTML tag="tr" key={footerGroup.id}>
                        {footerGroup.headers.map((header) => (
                            <HTML tag="th" key={header.id}>
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.footer, header.getContext())}
                            </HTML>
                        ))}
                    </HTML>
                ))}
            </HTML>
        </HTML>
    )
}
export { createColumnHelper }
