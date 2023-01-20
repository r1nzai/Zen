export type CSSDefault = `inherit` | `initial` | `unset` | `revert`
export type TextSize = `${number}px` | `${number}%` | `${number}rem` | `${number}em` | CSSDefault
export type ViewportSize = `${number}vw` | `${number}vh` | `${number}vmin` | `${number}vmax` | CSSDefault
export type Size = TextSize | ViewportSize | CSSDefault | 'auto'
export type FontWeight = '400' | '500' | '600' | '700' | '800' | '900' | CSSDefault
export type LineHeight = TextSize | number | CSSDefault
export type LetterSpacing = TextSize | number | CSSDefault
export type FontSize = TextSize | number | CSSDefault
export type BorderStyle =
    | `solid`
    | `dashed`
    | `dotted`
    | `double`
    | `groove`
    | `ridge`
    | `inset`
    | `outset`
    | `none`
    | `hidden`
    | CSSDefault
export type BorderWidth = TextSize
export type BorderRadius = TextSize
// export type HexColor = `[#${string}]`
export type TailwindColor =
    | 'slate'
    | 'gray'
    | 'zinc'
    | 'neutral'
    | 'stone'
    | 'red'
    | 'orange'
    | 'amber'
    | 'yellow'
    | 'lime'
    | 'green'
    | 'emerald'
    | 'teal'
    | 'cyan'
    | 'sky'
    | 'blue'
    | 'indigo'
    | 'violet'
    | 'purple'
    | 'fuchsia'
    | 'pink'
    | 'rose'
    | 'white'
    | 'black'
    | 'transparent'
export type TailwindVariants = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
export type TailwindColorVariant = `${TailwindColor}-${TailwindVariants}`
export type Color =
    | `rgb(${number}, ${number}, ${number})`
    | `rgba(${number}, ${number}, ${number}, ${number}) | ${string}`
    | `hsl(${number}, ${number}%, ${number}%)`
    | `hsla(${number}, ${number}%, ${number}%, ${number})`
    | `transparent`
    | TailwindColorVariant
    | string
    | CSSDefault
export type TextAlign = `left` | `right` | `center` | `justify` | `start` | `end` | CSSDefault
export type TextTransform = `uppercase` | `lowercase` | `capitalize` | `none` | CSSDefault
export type TextDecoration = `underline` | `line-through` | `overline` | `none` | CSSDefault
export type TextOverflow = `clip` | `ellipsis` | CSSDefault
export type WhiteSpace = `normal` | `nowrap` | `pre` | `pre-line` | `pre-wrap` | CSSDefault
export type WordBreak = `normal` | `break-all` | `keep-all` | `break-word` | CSSDefault
export type WordWrap = `normal` | `break-word` | CSSDefault
export type FontFamily = `inherit` | `initial` | `unset` | `revert` | string | CSSDefault
