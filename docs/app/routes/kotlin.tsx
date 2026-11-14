import { buttonVariants, Card } from '@rinzai/zen';
import { Link } from 'react-router';

import { CodeCard } from '../components/code-block';
import { DocsLayout } from '../components/docs-layout';
import { KOTLIN_API } from '../kotlin';
import { componentPath, componentsFor, showcasePath } from '../pages';
import { seo } from '../seo';

export const meta = () =>
    seo({
        title: 'Zen for Kotlin · Compose Multiplatform components in dark glass',
        description:
            'Zen as a Compose Multiplatform library: the same dark-glass components as the React one, looking and behaving the same, on Android, iOS, desktop and the web.',
        path: '/kotlin/',
    });

const TOC = [
    { id: 'installation', label: 'Installation' },
    { id: 'usage', label: 'Usage' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'live-activities', label: 'Live activities' },
    { id: 'components', label: 'Components' },
];

const COMPONENTS = componentsFor('kotlin');

export default function Kotlin() {
    return (
        <DocsLayout toc={TOC}>
            <header className="mb-16 flex flex-col gap-5">
                <h1 className="text-aurora text-5xl lg:text-6xl">Zen for Kotlin</h1>
                <p className="text-muted-foreground mt-0! max-w-2xl text-lg leading-relaxed">
                    The same components in Compose Multiplatform: {COMPONENTS.length} of them, built to look and
                    behave exactly as the React library does, on Android, iOS, the desktop and the web. What the OS
                    does better (number and date formats, the file picker, media controls) comes from the OS.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Link to={componentPath(COMPONENTS[0].slug, 'kotlin')} className={buttonVariants()}>
                        Browse components
                    </Link>
                    <Link to={showcasePath('', 'kotlin')} className={buttonVariants({ variant: 'outline' })}>
                        Run the showcase
                    </Link>
                    {/* A full page load: Dokka's reference is its own site. */}
                    <a href={KOTLIN_API} className={buttonVariants({ variant: 'ghost' })}>
                        API reference
                    </a>
                </div>
            </header>

            <div className="flex flex-col gap-14">
                <section className="flex flex-col gap-4">
                    <h2 id="installation">Installation</h2>
                    <p>
                        Zen for Kotlin isn&rsquo;t on Maven Central yet. Until it is, build it from the repository:
                        include its build in your settings, and depend on it as you will on the release.
                    </p>
                    <CodeCard
                        lang="kotlin"
                        code={`
// settings.gradle.kts
includeBuild("../Zen/kotlin")

// build.gradle.kts, in commonMain
dependencies {
    implementation("dev.rinzai:zen")
}`}
                    />
                    <p>
                        It brings Geist with it. There&rsquo;s nothing else to add: no other library, and no setup
                        beyond the root below.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="usage">Usage</h2>
                    <p>
                        <code>ZenTheme</code> is the root, as <code>{'<html>'}</code> with Zen&rsquo;s stylesheet is on
                        the web: the theme, a scrolling page, and the layers that glass, the backdrop and popups draw
                        in.
                    </p>
                    <CodeCard
                        lang="kotlin"
                        code={`
@Composable
fun App() {
    ZenTheme {
        Backdrop()
        Card {
            CardHeader { CardTitle("Budget") }
            Button(onClick = {}) { Text("Save changes") }
        }
    }
}`}
                    />
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="platforms">Platforms</h2>
                    <ul className="text-muted-foreground flex list-disc flex-col gap-2 pl-5">
                        <li>Android 9 (API 28) and later.</li>
                        <li>iOS, on devices and the simulator.</li>
                        <li>The desktop: Windows, macOS and Linux, on the JVM.</li>
                        <li>
                            The web, compiled to WebAssembly: the live examples on these pages run that way, in the
                            browser you&rsquo;re reading them in.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="live-activities">Live activities</h2>
                    <p>
                        On phones, something under way (a delivery, a ride, a timer) can stay in view outside the
                        app: as a Live Update on Android 16, in the status bar chip and at the top of the lock screen
                        (Live Alerts on ColorOS and OxygenOS), and as a Live Activity on iOS, in the Dynamic Island.{' '}
                        <code>LiveActivity</code> shows one while it&rsquo;s composed, updated as its content changes;{' '}
                        <code>rememberLiveActivities()</code> starts one that outlives the screen. On the desktop and
                        the web, <code>supported</code> is false and nothing shows.
                    </p>
                    <CodeCard
                        lang="kotlin"
                        code={`
LiveActivity(
    LiveActivityContent(
        title = "On the way",
        text = "Sam is 2 km away",
        progress = 0.6f,
        stops = listOf(0.25f, 0.5f, 0.75f),
        chip = "6 min",
    ),
)`}
                    />
                    <p>
                        On Android, the app&rsquo;s manifest declares <code>POST_NOTIFICATIONS</code> and{' '}
                        <code>POST_PROMOTED_NOTIFICATIONS</code>, and asks for the first with{' '}
                        <code>requestPermission()</code>. On iOS, ActivityKit can only be used from Swift: the
                        app&rsquo;s widget extension draws the activity, and the app hands Zen a{' '}
                        <code>LiveActivityProvider</code> that starts, updates and ends it.
                    </p>
                    <CodeCard
                        lang="swift"
                        code={`
import ActivityKit
import Zen

struct DeliveryAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var title: String, text: String?, progress: Float?, chip: String?
    }
}

final class Activities: LiveActivityProvider {
    var enabled: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

    func start(content: LiveActivityContent) -> String {
        let activity = try? Activity.request(attributes: DeliveryAttributes(), content: .init(state: state(content), staleDate: nil))
        return activity?.id ?? ""
    }

    func update(id: String, content: LiveActivityContent) {
        Task { await activity(id)?.update(.init(state: state(content), staleDate: nil)) }
    }

    func end(id: String) {
        Task { await activity(id)?.end(nil, dismissalPolicy: .immediate) }
    }

    private func activity(_ id: String) -> Activity<DeliveryAttributes>? {
        Activity<DeliveryAttributes>.activities.first { $0.id == id }
    }

    private func state(_ c: LiveActivityContent) -> DeliveryAttributes.ContentState {
        .init(title: c.title, text: c.text, progress: c.progress?.floatValue, chip: c.chip)
    }
}

// At launch:
LiveActivityKt.liveActivityProvider = Activities()`}
                    />
                </section>

                <section className="flex flex-col gap-4">
                    <h2 id="components">Components</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {COMPONENTS.map((c) => (
                            <Link
                                key={c.slug}
                                to={componentPath(c.slug, 'kotlin')}
                                className="group focus-visible:ring-glow/50 rounded-xl outline-hidden focus-visible:ring-2"
                            >
                                <Card className="group-hover:bg-card/90 h-full transition-colors">
                                    <p className="mt-0! font-semibold tracking-tight">{c.title}</p>
                                    <p className="text-muted-foreground mt-1! text-sm leading-6">{c.description}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </DocsLayout>
    );
}
