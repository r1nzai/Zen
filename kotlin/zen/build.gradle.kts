plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.compose)
    alias(libs.plugins.android.kmp.library)
    alias(libs.plugins.dokka)
    alias(libs.plugins.maven.publish)
}

// "dev.rinzai:zen", released with the web package under its version.
group = "dev.rinzai"
version = providers.fileContents(rootProject.layout.projectDirectory.file("../web/package.json")).asText
    .map { Regex("\"version\":\\s*\"([^\"]+)\"").find(it)?.groupValues?.get(1) ?: error("No version in web/package.json") }.get()

kotlin {
    jvmToolchain(17)
    jvm("desktop")
    android {
        namespace = "dev.rinzai.zen"
        compileSdk = 37
        minSdk = 28
        androidResources { enable = true }
    }
    iosArm64()
    iosSimulatorArm64()
    @OptIn(org.jetbrains.kotlin.gradle.ExperimentalWasmDsl::class)
    wasmJs { browser() }

    // cldr: what the platform lacks and Zen formats from CLDR's own data (Android has ICU, a browser Intl).
    // skia: where Compose draws with Skia (all but Android).
    applyDefaultHierarchyTemplate {
        common {
            group("cldr") {
                withJvm()
                withIos()
            }
            group("skia") {
                withJvm()
                withIos()
                withWasmJs()
            }
        }
    }

    sourceSets {
        commonMain.dependencies {
            api(libs.compose.runtime)
            api(libs.compose.foundation)
            api(libs.compose.ui)
            implementation(libs.compose.resources)
            implementation(libs.coroutines.core)
        }
        // The system file picker's results come back through the activity.
        androidMain.dependencies { implementation(libs.activity.core) }
        commonTest.dependencies { implementation(libs.kotlin.test) }
        // Interaction tests drive components headless, with keys and pointers.
        getByName("desktopTest").dependencies {
            implementation(libs.compose.ui.test)
            implementation(compose.desktop.currentOs)
        }
    }
}

compose.resources {
    packageOfResClass = "dev.rinzai.zen.resources"
}

// The API reference the docs site serves at /kotlin/api/.
dokka {
    moduleName = "Zen"
    dokkaSourceSets.configureEach {
        sourceLink {
            localDirectory = file("src")
            remoteUrl("https://github.com/r1nzai/Zen/tree/master/kotlin/zen/src")
        }
    }
}

// Maven Central, with the credentials and signing key from ~/.gradle/gradle.properties:
// mavenCentralUsername, mavenCentralPassword, signingInMemoryKey, signingInMemoryKeyPassword.
mavenPublishing {
    publishToMavenCentral()
    signAllPublications()
    pom {
        name = "Zen"
        description = "Compose Multiplatform components in dark glass, in lockstep with Zen for the web."
        url = "https://zen.rinzai.dev/kotlin"
        inceptionYear = "2026"
        licenses {
            license {
                name = "MIT License"
                url = "https://opensource.org/licenses/MIT"
            }
        }
        developers {
            developer {
                id = "r1nzai"
                name = "rinzai"
                url = "https://github.com/r1nzai"
            }
        }
        scm {
            url = "https://github.com/r1nzai/Zen"
            connection = "scm:git:https://github.com/r1nzai/Zen.git"
            developerConnection = "scm:git:ssh://git@github.com/r1nzai/Zen.git"
        }
    }
}
