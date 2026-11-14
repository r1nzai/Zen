package dev.rinzai.zen.showcase.examples.field

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.alert.AlertTone
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.field.FormMessage
import dev.rinzai.zen.input.Input

/** Field links the label, hint and error to its control; FormMessage speaks for the whole form. */
@Composable
fun Default() {
    var email by remember { mutableStateOf("") }
    var submitted by remember { mutableStateOf(false) }
    val invalid = submitted && '@' !in email
    Column(Modifier.width(320.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Field(
            "Email",
            hint = "We'll send a sign-in link.",
            error = if (invalid) "Enter an email address." else null,
        ) {
            Input(email, { email = it }, placeholder = "you@example.com")
        }
        if (submitted && !invalid) FormMessage(tone = AlertTone.Positive) { Text("Check your inbox for the link.") }
        Button({ submitted = true }) { Text("Send link") }
    }
}
