import HTML from 'components/HTML'

import { ButtonStyles, IButtonProps } from './Button.types'

const Button = (props: IButtonProps) => {
    let { children, className, variant } = props
    variant ??= 'primary'
    className ??= ''
    return (
        <HTML tag="button" className={ButtonStyles({ variant, className })}>
            {children}
        </HTML>
    )
}

export default Button
