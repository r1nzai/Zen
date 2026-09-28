import preview from '../../.storybook/preview';
import HighlightedExample from './examples/Highlighted';
import PlainExample from './examples/Plain';
import CodeBlock from './index';

const meta = preview.meta({
    title: 'Components/CodeBlock',
    component: CodeBlock,
});

export const Highlighted = meta.story({ render: () => <HighlightedExample /> });

export const Plain = meta.story({ render: () => <PlainExample /> });
