export type CSSDefault = `inherit` | `initial` | `unset` | `revert`
export type TextSize = `${number}px` | `${number}%` | `${number}rem` | `${number}em` | CSSDefault
export type ViewportSize = `${number}vw` | `${number}vh` | `${number}vmin` | `${number}vmax` | CSSDefault
export type Size = TextSize | ViewportSize | CSSDefault
export type FontWeight = 400 | 500 | 600 | 700 | 800 | 900 | CSSDefault
export type LineHeight = TextSize | number | CSSDefault
export type Color =
    | `#${string}`
    | `rgb(${number}, ${number}, ${number})`
    | `rgba(${number}, ${number}, ${number}, ${number}) | ${string}`
    | `hsl(${number}, ${number}%, ${number}%)`
    | `hsla(${number}, ${number}%, ${number}%, ${number})`
    | `transparent`
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
