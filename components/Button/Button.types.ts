import { cva, VariantProps } from 'class-variance-authority'

import { BaseProps } from '../HTML/HTML.types'
import { Size } from '../utils/Commons'
export const ButtonStyles = cva('button rounded py-2 px-4', {
    variants: {
        variant: {
            primary: ['bg-blue-500 hover:bg-blue-700 text-white'],
            secondary: ['bg-gray-500 hover:bg-gray-700 text-white'],
            success: ['bg-green-500 hover:bg-green-700 text-white'],
            danger: ['bg-red-500 hover:bg-red-700 text-white'],
            warning: ['bg-yellow-500 hover:bg-yellow-700 text-white'],
            info: ['bg-blue-500 hover:bg-blue-700 text-white'],
            light: ['bg-gray-200 hover:bg-gray-300 text-gray-800'],
            dark: ['bg-gray-800 hover:bg-gray-900 text-white'],
        },
    },
    defaultVariants: {
        variant: 'primary',
    },
})
export interface IButtonProps extends BaseProps<'button'>, VariantProps<typeof ButtonStyles> {
    className?: string
    width?: Size
    height?: Size
}
