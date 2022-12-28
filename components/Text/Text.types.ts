import { BaseProps } from '../HTML/HTML.types'
import {
    Color,
    FontFamily,
    FontWeight,
    LineHeight,
    TextAlign,
    TextDecoration,
    TextOverflow,
    TextSize,
    TextTransform,
    WhiteSpace,
    WordBreak,
    WordWrap,
} from '../utils/Commons'
export type Tags = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'label'
export default interface ITextProps extends BaseProps<Tags> {
    as?: Tags
    children?: string
    weight?: FontWeight
    size?: TextSize
    lineHeight?: LineHeight
    color?: Color
    textAlign?: TextAlign
    textTransform?: TextTransform
    textDecoration?: TextDecoration
    textOverflow?: TextOverflow
    whiteSpace?: WhiteSpace
    wordBreak?: WordBreak
    wordWrap?: WordWrap
    fontFamily?: FontFamily
}
