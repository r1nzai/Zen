import { HexColor } from './Commons'

const LightenColor = (color: HexColor, amount: number) => {
    const num = parseInt(color.slice(1), 16)
    let r = (num >> 16) + amount
    if (r > 255) r = 255
    else if (r < 0) r = 0
    let b = ((num >> 8) & 0x00ff) + amount
    if (b > 255) b = 255
    else if (b < 0) b = 0
    let g = (num & 0x0000ff) + amount
    if (g > 255) g = 255
    else if (g < 0) g = 0
    return `#${(g | (b << 8) | (r << 16)).toString(16)}`
}
const DarkenColor = (color: HexColor, amount: number) => {
    return LightenColor(color, -amount)
}
const ShadeColor = (color: HexColor, percent: number) => {
    let f = parseInt(color.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = percent < 0 ? percent * -1 : percent,
        R = f >> 16,
        G = (f >> 8) & 0x00ff,
        B = f & 0x0000ff
    return (
        '#' +
        (
            0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B)
        )
            .toString(16)
            .slice(1)
    )
}
const TintColor = (color: HexColor, percent: number) => {
    return ShadeColor(color, -percent)
}
const MixColors = (color1: HexColor, color2: HexColor, weight: number) => {
    let d2h = (d: number) => d.toString(16)
    let h2d = (h: string) => parseInt(h, 16)
    weight = typeof weight !== 'undefined' ? weight : 50
    let color = '#'
    for (let i = 0; i <= 5; i += 2) {
        let v1 = h2d(color1.slice(i, 2))
        let v2 = h2d(color2.slice(i, 2))
        let val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)))
        while (val.length < 2) {
            val = '0' + val
        }
        color += val
    }
    return color
}
const ColorContrast = (color: HexColor) => {
    let r = parseInt(color.slice(1, 3), 16)
    let g = parseInt(color.slice(3, 5), 16)
    let b = parseInt(color.slice(5, 7), 16)
    let yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#000000' : '#ffffff'
}
export { ColorContrast, DarkenColor, LightenColor, MixColors, ShadeColor, TintColor }
