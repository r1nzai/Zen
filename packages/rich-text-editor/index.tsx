import { EditorComponent, Remirror, ThemeProvider, useRemirror } from '@remirror/react';
import 'remirror/styles/all.css';
import { VideoExtension } from './components/VideoExtension';

const RichTextEditor = () => {
    const { manager, state, setState, getContext } = useRemirror({
        extensions: () => [new VideoExtension({ enableResizing: true })],
        content: '',
        selection: 'start',
        stringHandler: 'html',
    });
    return (
        <ThemeProvider
            theme={{
                color: {
                    primary: 'rgb(var(--secondary-100))',
                    outline: 'rgb(var(--secondary-75))',
                },
            }}
        >
            <Remirror
                manager={manager}
                state={state}
                onChange={(parameter) => {
                    setState(parameter.state);
                }}
            >
                <EditorComponent />
            </Remirror>
        </ThemeProvider>
    );
};

export default RichTextEditor;

import { ReactExtensions, ReactFrameworkOutput } from '@remirror/react';

export type TEditor = ReactFrameworkOutput<ReactExtensions<VideoExtension>> | undefined;
