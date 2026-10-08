plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.ashly.teamsplitter"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.ashly.teamsplitter"
        minSdk = 24
        targetSdk = 36
        versionCode = 4
        versionName = "1.3"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
}

val webRoot = rootProject.projectDir.parentFile
val generatedWebAssets = layout.buildDirectory.dir("generated/webAssets")

val copyWebAssets by tasks.registering(Copy::class) {
    from(webRoot) {
        include("index.html", "styles.css", "app.js", "auth.js")
    }
    from(webRoot.resolve("icons")) {
        into("icons")
    }
    into(generatedWebAssets)
}

android.sourceSets {
    getByName("main").assets.srcDir(generatedWebAssets)
}

tasks.named("preBuild") {
    dependsOn(copyWebAssets)
}
