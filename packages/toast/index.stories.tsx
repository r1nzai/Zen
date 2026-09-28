import preview from '../../.storybook/preview';
import TonesExample from './examples/Tones';
import ToastProvider from './index';

const meta = preview.meta({
    title: 'Components/Toast',
    component: ToastProvider,
    decorators: [
        (Story) => (
            <ToastProvider>
                <Story />
            </ToastProvider>
        ),
    ],
});

export const Tones = meta.story({ args: { children: null }, render: () => <TonesExample /> });
