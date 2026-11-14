plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "dev.rinzai.zen.android"
    compileSdk = 37
    defaultConfig {
        applicationId = "dev.rinzai.zen.music"
        minSdk = 28
        targetSdk = 37
        versionCode = 1
        versionName = "0.1"
    }
}

kotlin { jvmToolchain(17) }

dependencies {
    implementation(project(":showcase"))
    implementation(libs.activity.compose)
}
