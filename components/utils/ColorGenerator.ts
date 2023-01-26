import { TailwindColorVariant } from './Commons'

export const ColorGenerator = (prefix: string) => {
    let colors = [
        'slate',
        'gray',
        'zinc',
        'neutral',
        'stone',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
        'white',
        'black',
        'transparent',
    ] as const
    let sizes = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
    return colors.reduce(
        (out, color) => {
            sizes.forEach((size) => {
                out[`${color}-${size}`] = [`${prefix}-${color}-${size}`]
            })
            return out
        },
        {} as {
            [Color in TailwindColorVariant]: string[]
        },
    )
}
