import Component, {BaseProps} from '@zen/component'
import React from 'react'

const Container = (props: BaseProps<'div'>) => {
    return (
        <Component tag="div" {...props}/>
    )
}
export default Container