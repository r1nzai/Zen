import { BaseProps } from '../HTML/HTML.types'
import { HexColor, Size } from '../utils/Commons'

export default interface IButtonProps extends BaseProps<'button'> {
    width?: Size
    height?: Size
    color?: HexColor
}
