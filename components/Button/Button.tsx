import HTML from 'components/HTML'
import { ButtonStyles, IButtonProps } from './Button.types'
import './Button.scss'
const Button = (props: IButtonProps) => {
    let { children, className, textColor, background, hoverBG, hoverTextColor } = props
    className ??= ''
    return (
        <HTML tag="button" className={ButtonStyles({ textColor, background, hoverBG, hoverTextColor })}>
            {children}
        </HTML>
    )
}

export default Button
