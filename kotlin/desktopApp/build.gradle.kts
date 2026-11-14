plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.compose)
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation(project(":showcase"))
    implementation(compose.desktop.currentOs)
    implementation(libs.coroutines.swing)
}

// The docs site's Kotlin pages as Kotlin, for the docs window (Docs.kt): docs/scripts/desktop-pages.ts reads them.
val repo = rootDir.parentFile
val docPages = tasks.register<Exec>("docPages") {
    val script = repo.resolve("docs/scripts/desktop-pages.ts")
    val out = layout.buildDirectory.file("generated/docs/DocPages.kt")
    inputs.files(script, repo.resolve("docs/app/pages.ts"), repo.resolve("docs/app/example-source.ts"))
    inputs.files(fileTree(repo.resolve("web/packages")) { include("*/examples/*.tsx") })
    inputs.dir(project(":showcase").file("src/commonMain/kotlin/dev/rinzai/zen/showcase"))
    outputs.file(out)
    commandLine("node", script.path, out.get().asFile.path)
}
kotlin.sourceSets.main { kotlin.srcDir(files(layout.buildDirectory.dir("generated/docs")).builtBy(docPages)) }

compose.desktop {
    application {
        mainClass = "dev.rinzai.zen.desktop.MainKt"
        jvmArgs += "-Dzen.at=${project.findProperty("at") ?: ""}"
        jvmArgs += "-Dzen.story=${project.findProperty("story") ?: ""}"
        nativeDistributions { packageName = "Zen" }
    }
}

// The showcase rendered off screen to a PNG (scripts/parity.mjs compares it with the web's).
tasks.register<JavaExec>("snapshot") {
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = project.findProperty("entry") as String? ?: "dev.rinzai.zen.desktop.SnapshotKt"
    jvmArgs("-Dzen.reducedMotion=${project.findProperty("reducedMotion") ?: true}", "-Djava.awt.headless=true", "-Dzen.story=${project.findProperty("story") ?: ""}", "-Dzen.docs=${project.findProperty("docs") ?: ""}", "-Dzen.layout=${project.findProperty("storyLayout") ?: "centered"}")
    args = (project.findProperty("shot") as String? ?: "1280 800 build/snapshot.png").split(" ")
}

// The showcase in a real window on the second display, driven by OS key presses and captured from the screen.
tasks.register<JavaExec>("windowShot") {
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass = "dev.rinzai.zen.desktop.WindowShotKt"
    jvmArgs("-Dzen.reducedMotion=${project.findProperty("reducedMotion") ?: true}")
    args = (project.findProperty("shot") as String? ?: "1280 800 dark").split(" ")
}

// The app with Windows' native libraries instead of this machine's, staged to run on Windows' own
// Java from WSL: there it draws on the GPU (Direct3D) rather than in software through WSLg.
val windows by configurations.creating
dependencies { windows(compose.desktop.windows_x64) }

tasks.register<Sync>("stageWindows") {
    from(tasks.jar, configurations.runtimeClasspath.map { c -> c.filterNot { "-linux-" in it.name } }, windows)
    into(layout.buildDirectory.dir("windows"))
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}
