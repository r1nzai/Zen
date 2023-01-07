import { css } from '@emotion/css'

import { ColorContrast, DarkenColor } from '../utils/ColorHelper'
import IButtonProps from './Button.types'
const Button = (props: IButtonProps) => {
    let { children, className, color, width, height, ...rest } = props
    color ??= '#4CAF50'
    height ??= 'auto'
    width ??= 'auto'
    className ??= ''
    return (
        <button
            className={`${className} ${css`
                background-color: ${color};
                border: none;
                color: ${ColorContrast(color)};
                padding: 15px 32px;
                text-align: center;
                text-decoration: none;
                display: block;
                font-size: inherit;
                margin: 4px 2px;
                cursor: pointer;
                width: ${width};
                height: ${height};
                &:hover {
                    background-color: ${DarkenColor(color, 10)};
                }
            `}`}
            {...rest}
        >
            {children}
        </button>
    )
}

export default Button
