import Component, { ComponentProps } from '@zen/component';
import React, { forwardRef } from 'react';

const Container = forwardRef<HTMLDivElement, ComponentProps<'div'>>((props, ref) => {
    return <Component tag="div" {...props} ref={ref} />;
});
export default Container;
