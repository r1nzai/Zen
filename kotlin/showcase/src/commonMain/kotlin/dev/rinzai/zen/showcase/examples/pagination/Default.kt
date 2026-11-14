package dev.rinzai.zen.showcase.examples.pagination

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.pagination.Pagination

@Composable
fun Default() {
    var page by remember { mutableIntStateOf(6) }
    Pagination(page, 12, { page = it })
}
