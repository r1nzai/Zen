package dev.rinzai.zen

import kotlin.test.Test
import kotlin.test.assertEquals

/** The springs are theme.css's: the same curve at each of its linear() points. */
class SpringTest {
    private fun matches(spring: Spring, css: List<Float>) = css.forEachIndexed { i, v ->
        assertEquals(v, spring.transform(i / (css.size - 1f)), 0.0002f, "point $i")
    }

    @Test
    fun shape() = matches(Spring.Shape, listOf(0f, 0.0212f, 0.0746f, 0.1478f, 0.2317f, 0.3196f, 0.4065f, 0.4895f, 0.5664f, 0.6361f, 0.6982f, 0.7525f, 0.7994f, 0.8394f, 0.8731f, 0.9011f, 0.9242f, 0.9429f, 0.958f, 0.9699f, 0.9793f, 0.9865f, 0.9919f, 0.996f, 0.9989f, 1.0009f, 1.0023f, 1.0031f, 1.0035f, 1.0037f, 1.0037f, 1.0035f, 1.0032f, 1.0029f, 1.0026f, 1.0023f, 1.002f, 1.0017f, 1.0014f, 1.0012f, 1f))

    @Test
    fun pop() = matches(Spring.Pop, listOf(0f, 0.0816f, 0.2809f, 0.5327f, 0.7828f, 0.9932f, 1.143f, 1.2269f, 1.2512f, 1.2297f, 1.1791f, 1.1156f, 1.053f, 1.0005f, 0.9633f, 0.9426f, 0.9369f, 0.9426f, 0.9554f, 0.9714f, 0.9871f, 1.0002f, 1.0094f, 1.0145f, 1.0159f, 1.0144f, 1.0111f, 1.0071f, 1.0031f, 0.9999f, 0.9976f, 0.9963f, 0.996f, 0.9964f, 0.9972f, 0.9982f, 0.9992f, 1.0001f, 1.0006f, 1.0009f, 1f))

    @Test
    fun stack() = matches(Spring.Stack, listOf(0f, 0.0212f, 0.0751f, 0.1494f, 0.235f, 0.3248f, 0.414f, 0.4993f, 0.5783f, 0.65f, 0.7136f, 0.7691f, 0.8168f, 0.8571f, 0.8908f, 0.9185f, 0.9409f, 0.9588f, 0.9728f, 0.9836f, 0.9918f, 0.9978f, 1.002f, 1.0048f, 1.0066f, 1.0076f, 1.0079f, 1.0079f, 1.0075f, 1.007f, 1.0063f, 1.0056f, 1.0049f, 1.0042f, 1.0035f, 1.003f, 1.0024f, 1.002f, 1.0016f, 1.0012f, 1f))
}
