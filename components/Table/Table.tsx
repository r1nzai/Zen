import { css } from '@emotion/css'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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

import Button from '../Button'
import Container from '../Container'
import HTML from '../HTML'
import ITableProps from './Table.types'
export default function Table<RowType, ValueType>(props: ITableProps<RowType, ValueType>) {
    let { columns, data, isTree, subRowsKey, onRowClick } = props
    isTree ??= false
    columns ??= []
    data ??= []
    subRowsKey ??= 'subRows' as keyof RowType
    const tableConfig: TableOptions<RowType> = {
        data: data,
        columns: columns,
        getCoreRowModel: getCoreRowModel(),
        getSubRows: (originalRow: RowType) => originalRow[subRowsKey!] as RowType[],
    }
    const [expanded, setExpanded] = useState<ExpandedState>({})
    if (isTree) {
        tableConfig.state = {}
        tableConfig.state.expanded = expanded
        tableConfig.onExpandedChange = setExpanded
        tableConfig.getSubRows = (originalRow: RowType) => originalRow[subRowsKey!] as RowType[]
        tableConfig.getExpandedRowModel = getExpandedRowModel()
        tableConfig.columns = [
            {
                id: 'expander',
                accessorKey: '.',
                header: '',
                cell: ({ row }) => (
                    <Container>
                        {row.original?.[subRowsKey!] && (row.original?.[subRowsKey!] as RowType[])?.length > 0 && (
                            <Button
                                onClick={() => {
                                    let expander = row.getToggleExpandedHandler()
                                    expander()
                                }}
                            >
                                <FontAwesomeIcon
                                    className={`${css`
                                        transition: rotate 1s ease;
                                    `}`}
                                    icon={faChevronRight}
                                    rotation={row.getIsExpanded() ? 90 : undefined}
                                />
                            </Button>
                        )}
                    </Container>
                ),
            },
            ...columns,
        ]
    }
    const tableInstance = useReactTable<RowType>(tableConfig)
    return (
        <HTML
            tag="table"
            className={`${css`
                background-color: white;
                text-indent: 0px;
            `}`}
        >
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
                    <HTML
                        tag="tr"
                        key={row.id}
                        onClick={() => onRowClick?.(row)}
                        className={css`
                            cursor: ${onRowClick ? 'pointer' : 'default'};
                            &:hover {
                                background-color: ${onRowClick ? '#f5f5f5' : 'white'};
                            }
                        `}
                    >
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
