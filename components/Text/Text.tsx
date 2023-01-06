import { css } from '@emotion/css'
import React, { FC } from 'react'

import HTML from '../HTML'
import ITextProps from './Text.types'
const Text: FC<ITextProps> = ({ ...props }) => {
    let {
        children,
        as,
        size,
        weight,
        className,
        lineHeight,
        color,
        textAlign,
        textDecoration,
        textOverflow,
        textTransform,
        whiteSpace,
        wordBreak,
        wordWrap,
        fontFamily,
        ...rest
    } = props
    className ??= ''
    as ??= 'p'
    size ??= '1rem'
    weight ??= 400
    lineHeight ??= 1.5
    color ??= 'black'
    textAlign ??= 'left'
    textDecoration ??= 'none'
    textOverflow ??= 'clip'
    textTransform ??= 'none'
    whiteSpace ??= 'normal'
    wordBreak ??= 'normal'
    wordWrap ??= 'normal'
    fontFamily ??= 'inherit'
    return (
        <HTML
            tag={as}
            className={`${className} ${css`
                font-size: ${size};
                font-weight: ${weight};
                line-height: ${lineHeight};
                color: ${color};
                text-align: ${textAlign};
                text-decoration: ${textDecoration};
                text-overflow: ${textOverflow};
                text-transform: ${textTransform};
                white-space: ${whiteSpace};
                word-break: ${wordBreak};
                word-wrap: ${wordWrap};
                font-family: ${fontFamily};
            `}`}
            {...rest}
        >
            {children}
        </HTML>
    )
}

export default Text
