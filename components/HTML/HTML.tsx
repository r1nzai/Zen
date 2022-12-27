import './HTML.scss'

import { forwardRef } from 'react'

import { BaseProps, BaseRef, BaseType } from './HTML.types'
const HTML: BaseType = forwardRef(
    <Tag extends React.ElementType = 'div'>(
        { tag, children, visible = true, ...rest }: BaseProps<Tag>,
        ref: BaseRef<Tag>,
    ) => {
        const Tag = tag || 'div'
        if (!visible) {
            return <></>
        }
        return (
            <Tag ref={ref} {...rest}>
                {children}
            </Tag>
        )
    },
)
export default HTML
