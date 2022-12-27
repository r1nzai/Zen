import { BaseProps } from 'components/HTML/HTML.types'
import React, { FC } from 'react'

import HTML from '../HTML'
const Container: FC<BaseProps<'div'>> = ({ ...props }) => {
    const { children, ...rest } = props
    return (
        <HTML tag="div" {...rest}>
            {children}
        </HTML>
    )
}

export default Container
