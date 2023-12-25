import Component, { BaseProps } from '@zen/component';
import React, { forwardRef } from 'react';

const Container = forwardRef<HTMLDivElement, BaseProps<'div'>>((props, ref) => {
    return <Component tag="div" {...props} ref={ref} />;
});
export default Container;
