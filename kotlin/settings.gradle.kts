rootProject.name = "zen"

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}

include(":zen", ":showcase", ":desktopApp", ":androidApp", ":webApp")
