import { ColumnDef } from '@tanstack/react-table'

interface ITableProps<RowType = unknown, ValueType = unknown> {
    className?: string
    columns: ColumnDef<RowType, ValueType>[]
    data: Array<RowType>
    isTree?: boolean
    subRowsKey?: keyof RowType
}
export default ITableProps
