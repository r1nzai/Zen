import { cva, VariantProps } from 'class-variance-authority'

import { BaseProps } from '../HTML/HTML.types'
import { Size } from '../utils/Commons'
import { ColorGenerator } from 'components/utils/ColorGenerator'
export const ButtonStyles = cva('button rounded py-2 px-4 transition-all', {
    variants: {
        textColor: ColorGenerator('btn-text'),
        background: ColorGenerator('btn'),
        hoverBG: ColorGenerator('btn-bg-hover'),
        hoverTextColor: ColorGenerator('btn-text-hover'),
    },
})
export interface IButtonProps extends BaseProps<'button'>, VariantProps<typeof ButtonStyles> {
    width?: Size
    height?: Size
}
