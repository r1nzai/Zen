type TagProp<Tag extends React.ElementType> = {
    tag?: Tag
}

type PropsToOmit<Tag extends React.ElementType, P> = keyof (TagProp<Tag> & P)

type PolyMorphicProps<Tag extends React.ElementType, Props = object> = React.PropsWithChildren<Props & TagProp<Tag>> &
    Omit<React.ComponentPropsWithoutRef<Tag>, PropsToOmit<Tag, Props>>

type BasePropWithRef<Tag extends React.ElementType, Props = object> = PolyMorphicProps<Tag, Props> & {
    ref?: BaseRef<Tag>
}

export type BaseRef<Tag extends React.ElementType> = React.ComponentPropsWithRef<Tag>['ref']

export type BaseProps<Tag extends React.ElementType> = BasePropWithRef<Tag, { visible?: boolean }>

export type BaseType = <Tag extends React.ElementType = 'div'>(props: BaseProps<Tag>) => React.ReactElement | null
