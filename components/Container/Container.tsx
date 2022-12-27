import React, { FC } from 'react'
import IContainerProps from './Container.types'

const Container: FC<IContainerProps> = ({ ...props }) => {
    let { children, testProp, ...rest } = props
    return (
        <div data-test={testProp} {...rest}>
            {children}
        </div>
    )
}

export default Container
