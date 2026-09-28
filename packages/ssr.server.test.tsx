// @vitest-environment node
import { renderToString } from 'react-dom/server';

import {
    ActionsMenu,
    Backdrop,
    Badge,
    Button,
    Card,
    CodeBlock,
    Collapse,
    ConfirmDialog,
    Dialog,
    Dropdown,
    Header,
    Input,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    MoneyInput,
    NavPill,
    NavPillIndicator,
    NavPills,
    PageHeader,
    Popover,
    ProgressRing,
    Segmented,
    SideNav,
    SideNavGroup,
    SideNavLink,
    Skeleton,
    Spinner,
    Stat,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableOfContents,
    TableRow,
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
        <Table>
            <TableBody>
                <TableRow>
                    <TableCell>cell</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    ),
    TableOfContents: <TableOfContents items={[{ id: 'a', label: 'A' }]} />,
    ThemeScript: <ThemeScript />,
    ThemeToggle: <ThemeToggle />,
};

describe('server rendering', () => {
    it('runs without browser globals', () => {
        expect(typeof window).toBe('undefined');
        expect(typeof document).toBe('undefined');
    });

    it.each(Object.entries(components))('%s renders to a string', (_, element) => {
        expect(() => renderToString(element)).not.toThrow();
    });
});
