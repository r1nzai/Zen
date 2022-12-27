import React, { FC } from 'react'
import IContainerProps from './Container.types'
import HTML from '../HTML'
const Container: FC<IContainerProps> = ({ ...props }) => {
    let { children, ...rest } = props
    return (
        <HTML tag="div" {...rest}>
            {children}
        </HTML>
    )
}

export default Container
