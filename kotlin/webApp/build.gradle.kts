plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.compose)
}

// The showcase in a browser: the docs' live Kotlin examples, one story a page (?story=id), or the music showcase.
kotlin {
    @OptIn(org.jetbrains.kotlin.gradle.ExperimentalWasmDsl::class)
    wasmJs {
        browser { commonWebpackConfig { outputFileName = "zen.js" } }
        binaries.executable()
    }
    sourceSets {
        wasmJsMain.dependencies { implementation(project(":showcase")) }
    }
}
