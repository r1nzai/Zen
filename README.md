# Zen

Dark glass for every platform: translucent surfaces, hairline borders that catch a pointer light, and one accent colour carrying the UI. One design, built natively for each platform, looking and working the same on all of them.

**[Documentation](https://zen.rinzai.dev)** · **[Showcase app](https://zen.rinzai.dev/showcase/)** · **[Storybook](https://zen.rinzai.dev/storybook/)**

| | Library | Platforms |
| --- | --- | --- |
| [`web/`](web) | [`@rinzai/zen`](https://www.npmjs.com/package/@rinzai/zen), React 19 and Tailwind v4 | Browsers |
| [`kotlin/`](kotlin) | `dev.rinzai.zen`, Compose Multiplatform | Android, iOS, Windows, macOS, Linux |

## Layout

```
tokens/    the design: colours, glow, radii, motion (DTCG JSON), the icon set, shared art
web/       the React library, its Storybook and tests
kotlin/    the Compose library, its showcase, and the desktop and Android apps
docs/      the site, for both
scripts/   generators: tokens and icons into each library
```

Neither library owns the design. `tokens/` is the one place a colour, a duration or an icon is defined; `pnpm generate` writes it into both libraries, and CI fails if either has drifted from it (`pnpm generate:check`).

## Development

```sh
pnpm install
pnpm generate          # after changing tokens/
pnpm docs:dev          # the docs site

cd web && pnpm dev     # Storybook
cd kotlin && ./gradlew :desktopApp:run    # the showcase on the desktop
cd kotlin && ./gradlew :androidApp:installDebug
```

## License

[MIT](LICENSE)
