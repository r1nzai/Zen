// @vitest-environment node
import { renderToString } from 'react-dom/server';

import {
    ActionsMenu,
    AnimatedNumber,
    Avatar,
    Backdrop,
    Badge,
    Button,
    Card,
    CodeBlock,
    Collapse,
    ConfirmDialog,
    Dialog,
    Dropdown,
    EditableCell,
    Field,
    Header,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    Meter,
    MoneyInput,
    MonthPicker,
    NavPill,
    NavPillIndicator,
    NavPills,
    PageHeader,
    Popover,
    ProgressRing,
    Segmented,
    Select,
    SideNav,
    Slider,
    SideNavGroup,
    SideNavLink,
    Skeleton,
    Spinner,
    Stat,
    Tab,
    TabBar,
    TabBarItem,
    Table,
    TableBody,
    TableCell,
    TableOfContents,
    TableContainer,
    TableRow,
    TreeCell,
    TreeLabel,
    TreeRow,
    useTree,
    TabList,
    TabPanel,
    Tabs,
    TextArea,
    ThemeScript,
    ThemeToggle,
    ToastProvider,
    Toggle,
} from '.';

const items = [
    { key: '1', text: 'One' },
    { key: '2', text: 'Two' },
];

const components = {
    Badge: <Badge>badge</Badge>,
    Button: <Button>button</Button>,
    Collapse: <Collapse items={['a', 'b']}>{(item) => <span key={item}>{item}</span>}</Collapse>,
    'Dropdown (single)': <Dropdown items={items} selected={items[0]} onChange={() => {}} />,
    'Dropdown (multiple)': <Dropdown multiple items={items} selected={items} onChange={() => {}} />,
    Input: <Input />,
    Popover: <Popover content={<span>content</span>}>trigger</Popover>,
    TextArea: <TextArea />,
    Toggle: <Toggle />,
    ActionsMenu: <ActionsMenu label="Actions" actions={[{ label: 'Edit', onClick: () => {} }]} />,
    Backdrop: <Backdrop />,
    NavPills: (
        <NavPills aria-label="Main">
            <NavPillIndicator />
            <NavPill href="/" active>
                Home
            </NavPill>
        </NavPills>
    ),
    Card: <Card title="Title">body</Card>,
    ConfirmDialog: <ConfirmDialog open onOpenChange={() => {}} title="Sure?" confirmLabel="Yes" onConfirm={() => {}} />,
    Dialog: <Dialog open title="Title" />,
    ProgressRing: <ProgressRing value={0.5} label="Progress" />,
    Segmented: <Segmented label="Pick" value="a" options={[{ value: 'a', label: 'A' }]} onChange={() => {}} />,
    Skeleton: <Skeleton />,
    Spinner: <Spinner />,
    Stat: <Stat label="Net" value="1" />,
    Tabs: (
        <Tabs defaultValue="a">
            <TabList>
                <Tab value="a">A</Tab>
            </TabList>
            <TabPanel value="a">panel</TabPanel>
        </Tabs>
    ),
    ToastProvider: <ToastProvider>app</ToastProvider>,
    Select: <Select aria-label="x" value="a" options={[{ value: 'a', label: 'A' }]} onChange={() => {}} />,
    MonthPicker: <MonthPicker aria-label="x" value="2026-09" onChange={() => {}} locale="en-US" />,
    AnimatedNumber: <AnimatedNumber value={42} />,
    Avatar: <Avatar name="Rin" />,
    Field: (
        <Field label="Name" hint="Hint">
            <input />
        </Field>
    ),
    Meter: <Meter value={5} max={10} label="Meter" />,
    Slider: <Slider aria-label="x" value={5} onValueChange={() => {}} />,
    TabBar: (
        <TabBar>
            <TabBarItem href="/" active>
                Home
            </TabBarItem>
        </TabBar>
    ),
    CodeBlock: <CodeBlock code="const a = 1;" />,
    InputGroup: (
        <InputGroup>
            <InputGroupAddon>$</InputGroupAddon>
            <InputGroupInput />
        </InputGroup>
    ),
    MoneyInput: <MoneyInput value={15200000} onChange={() => {}} currency="INR" locale="en-IN" />,
    Header: <Header>Zen</Header>,
    PageHeader: <PageHeader title="Title" lead="Lead" />,
    SideNav: (
        <SideNav aria-label="Docs">
            <SideNavGroup title="Group">
                <SideNavLink href="/" active>
                    Home
                </SideNavLink>
            </SideNavGroup>
        </SideNav>
    ),
    Table: (
        <TableContainer label="Table">
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>cell</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    ),
    TreeTable: <TreeTable />,
    EditableCell: <EditableCell editor={() => null}>₹1</EditableCell>,
    TableOfContents: <TableOfContents items={[{ id: 'a', label: 'A' }]} />,
    ThemeScript: <ThemeScript />,
    ThemeToggle: <ThemeToggle />,
};

function TreeTable() {
    const tree = useTree({
        items: [{ id: 'a', children: [{ id: 'b' }] }],
        getKey: (n) => n.id,
        getChildren: (n: { id: string; children?: { id: string }[] }) => n.children,
    });
    return (
        <Table>
            <TableBody>
                {tree.rows.map((row) => (
                    <TreeRow key={row.key} row={row} tree={tree}>
                        <TreeCell>
                            <TreeLabel row={row} tree={tree}>
                                {row.key}
                            </TreeLabel>
                        </TreeCell>
                    </TreeRow>
                ))}
            </TableBody>
        </Table>
    );
}

describe('server rendering', () => {
    it('runs without browser globals', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');
    });

    it.each(Object.entries(components))('%s renders to a string', (_, element) => {
        expect(() => renderToString(element)).not.toThrow();
    });
});
