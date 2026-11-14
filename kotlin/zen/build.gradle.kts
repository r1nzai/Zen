plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.compose)
    alias(libs.plugins.android.kmp.library)
    alias(libs.plugins.dokka)
}

// What a build that includes this one (includeBuild) depends on: "dev.rinzai:zen".
group = "dev.rinzai"

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
