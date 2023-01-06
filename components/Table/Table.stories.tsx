import { Meta, StoryFn } from '@storybook/react'
import React, { useEffect } from 'react'

import Table, { createColumnHelper } from './Table'
type TestData = {
    subRows: TestData[]
    gender: string
    name: { title: string; first: string; last: string }
    location: {
        street: { number: number; name: string }
        city: string
        state: string
        country: string
        postcode: string
        coordinates: { latitude: string; longitude: string }
        timezone: { offset: string; description: string }
    }
    email: string
    login: {
        uuid: string
        username: string
        password: string
        salt: string
        md5: string
        sha1: string
        sha256: string
    }
    dob: { date: string; age: number }
    registered: { date: string; age: number }
    phone: string
    cell: string
    id: { name: string; value: string }
    picture: {
        large: string
        medium: string
        thumbnail: string
    }
    nat: string
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: Table,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Table>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Table> = (args) => {
    const [tableData, setTableData] = React.useState<TestData[]>([])
    useEffect(() => {
        fetch('https://randomuser.me/api/?results=10')
            .then((response) => response.json())
            .then((json) => {
                let data = json.results as TestData[]
                data = data.map((item) => {
                    return {
                        ...item,
                        subRows: [...data],
                    }
                })
                setTableData(data)
            })
    }, [])
    const columnHelper = createColumnHelper<TestData>()
    return (
        <Table
            {...args}
            columns={[
                columnHelper.accessor('name.first', {
                    header: 'First Name',
                }),
                columnHelper.accessor('name.last', {
                    header: 'Last Name',
                }),
                columnHelper.accessor('dob.date', {
                    header: 'Date of Birth',
                    cell: (instance) => new Date(instance.getValue()).toLocaleDateString(),
                }),
            ]}
            isTree
            subRowsKey="subRows"
            data={tableData}
        />
    )
}

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {}
