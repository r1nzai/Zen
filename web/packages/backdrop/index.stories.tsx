import preview from '../../.storybook/preview';
import ContoursExample from './examples/Contours';
import DotsExample from './examples/Dots';
import Backdrop from './index';

const meta = preview.meta({
    title: 'Components/Backdrop',
    component: Backdrop,
    // These stories draw their own backdrop instead of the global one.
    parameters: { layout: 'padded', backdrop: false },
});

export const Contours = meta.story({ render: () => <ContoursExample /> });

export const Dots = meta.story({ render: () => <DotsExample /> });
