import {BaseProps} from '@zen/component/component.types'
import React from 'react'

import HTML from '../component'

const Container = (props: BaseProps<'div'>) => {
    return (
        <HTML tag="div" {...props}/>
    )
}
export default Container