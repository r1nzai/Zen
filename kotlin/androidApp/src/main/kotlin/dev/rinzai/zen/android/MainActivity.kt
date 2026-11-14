package dev.rinzai.zen.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import dev.rinzai.zen.showcase.MusicShowcase
import dev.rinzai.zen.showcase.Story

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // `adb shell am start -n dev.rinzai.zen.android/.MainActivity --es story <id>` opens one story, as the docs' frames do.
        val story = intent.getStringExtra("story")
        setContent { if (story == null) MusicShowcase() else Story(story) }
    }
}
