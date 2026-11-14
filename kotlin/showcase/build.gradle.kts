plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.compose)
    alias(libs.plugins.android.kmp.library)
}

kotlin {
    jvmToolchain(17)
    jvm("desktop")
    android {
        namespace = "dev.rinzai.zen.showcase"
        compileSdk = 37
        minSdk = 28
        androidResources { enable = true }
    }
    iosArm64()
    iosSimulatorArm64()
    @OptIn(org.jetbrains.kotlin.gradle.ExperimentalWasmDsl::class)
    wasmJs { browser() }

    sourceSets {
        commonMain.dependencies {
            api(project(":zen"))
            implementation(libs.compose.resources)
        }
    }
}

compose.resources { packageOfResClass = "dev.rinzai.zen.showcase.resources" }
