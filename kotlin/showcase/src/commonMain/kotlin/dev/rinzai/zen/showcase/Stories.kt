package dev.rinzai.zen.showcase

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Embed
import dev.rinzai.zen.HostWindow
import dev.rinzai.zen.ZenTheme
import dev.rinzai.zen.backdrop.Backdrop
import dev.rinzai.zen.backdrop.Contours
import dev.rinzai.zen.showcase.resources.Res
import dev.rinzai.zen.toast.ToastProvider

/** The topographic lines the showcase's backdrops draw. */
val Topo = Contours { Res.readBytes("files/topo.svg").decodeToString() }

/** Each web Storybook story's example, by the story's id, for the parity check. */
val Stories: Map<String, @Composable () -> Unit> = mapOf(
    "components-liveactivity--delivery" to { dev.rinzai.zen.showcase.examples.liveactivity.Delivery() },
    "showcase--budget" to { dev.rinzai.zen.showcase.budget.BudgetApp() },
    "showcase--music" to { MusicApp() },
    "components-dialog--confirm" to { dev.rinzai.zen.showcase.examples.dialog.Confirm() },
    "components-dialog--form" to { dev.rinzai.zen.showcase.examples.dialog.Form() },
    "components-dialog--sheets" to { dev.rinzai.zen.showcase.examples.dialog.Sheets() },
    "components-dialog--pickers" to { dev.rinzai.zen.showcase.examples.dialog.Pickers() },
    "components-carousel--default" to { dev.rinzai.zen.showcase.examples.carousel.Default() },
    "components-carousel--several" to { dev.rinzai.zen.showcase.examples.carousel.Several() },
    "components-playerbar--default" to { dev.rinzai.zen.showcase.examples.playerbar.Default() },
    "components-playerbar--on-tab-bar" to { dev.rinzai.zen.showcase.examples.playerbar.OnTabBar() },
    "components-tabbar--default" to { dev.rinzai.zen.showcase.examples.tabbar.Default() },
    "components-sortablelist--default" to { dev.rinzai.zen.showcase.examples.sortable.Default() },
    "components-sortablelist--virtual" to { dev.rinzai.zen.showcase.examples.sortable.Virtual() },
    "components-sortable--groups" to { dev.rinzai.zen.showcase.examples.sortable.Groups() },
    "components-table--detail" to { dev.rinzai.zen.showcase.examples.table.Detail() },
    "components-table--reorder" to { dev.rinzai.zen.showcase.examples.table.Reorder() },
    "components-table--default" to { dev.rinzai.zen.showcase.examples.table.Default() },
    "components-table--sortable" to { dev.rinzai.zen.showcase.examples.table.Sortable() },
    "components-table--selectable" to { dev.rinzai.zen.showcase.examples.table.Selectable() },
    "components-table--swipe" to { dev.rinzai.zen.showcase.examples.table.Swipe() },
    "components-table--virtual" to { dev.rinzai.zen.showcase.examples.table.Virtual() },
    "components-field--default" to { dev.rinzai.zen.showcase.examples.field.Default() },
    "components-select--default" to { dev.rinzai.zen.showcase.examples.select.Default() },
    "components-select--custom-options" to { dev.rinzai.zen.showcase.examples.select.CustomOptions() },
    "components-timefield--default" to { dev.rinzai.zen.showcase.examples.timefield.Default() },
    "components-chart--balance" to { dev.rinzai.zen.showcase.examples.chart.Balance() },
    "components-chart--cashflow" to { dev.rinzai.zen.showcase.examples.chart.Cashflow() },
    "components-chart--lines" to { dev.rinzai.zen.showcase.examples.chart.Lines() },
    "components-chart--donut" to { dev.rinzai.zen.showcase.examples.chart.Donut() },
    "components-chart--allocation" to { dev.rinzai.zen.showcase.examples.chart.Allocation() },
    "components-canvas--dashboard" to { dev.rinzai.zen.showcase.examples.canvas.Dashboard() },
    "components-canvas--designer" to { dev.rinzai.zen.showcase.examples.canvas.Designer() },
    "components-canvas--notes" to { dev.rinzai.zen.showcase.examples.canvas.Notes() },
    "components-canvas--snapping" to { dev.rinzai.zen.showcase.examples.canvas.Snapping() },
    "components-colorpicker--accent" to { dev.rinzai.zen.showcase.examples.colorpicker.Accent() },
    "components-colorpicker--default" to { dev.rinzai.zen.showcase.examples.colorpicker.Default() },
    "components-colorpicker--inline" to { dev.rinzai.zen.showcase.examples.colorpicker.Inline() },
    "components-colorpicker--swatches" to { dev.rinzai.zen.showcase.examples.colorpicker.Swatches() },
    "components-resizable--default" to { dev.rinzai.zen.showcase.examples.resizable.Default() },
    "components-resizable--stacked" to { dev.rinzai.zen.showcase.examples.resizable.Stacked() },
    "components-navigationmenu--default" to { dev.rinzai.zen.showcase.examples.navigationmenu.Default() },
    "components-navigationmenu--router" to { dev.rinzai.zen.showcase.examples.navigationmenu.Router() },
    "components-treetable--basic" to { dev.rinzai.zen.showcase.examples.treetable.Basic() },
    "components-treetable--planner" to { dev.rinzai.zen.showcase.examples.treetable.Planner() },
    "components-monthpicker--default" to { dev.rinzai.zen.showcase.examples.monthpicker.Default() },
    "components-monthpicker--range" to { dev.rinzai.zen.showcase.examples.monthpicker.Range() },
    "components-calendar--default" to { dev.rinzai.zen.showcase.examples.calendar.Default() },
    "components-calendar--limits" to { dev.rinzai.zen.showcase.examples.calendar.Limits() },
    "components-calendar--range" to { dev.rinzai.zen.showcase.examples.calendar.Range() },
    "components-timefield--with-date" to { dev.rinzai.zen.showcase.examples.timefield.WithDate() },
    "components-datepicker--default" to { dev.rinzai.zen.showcase.examples.datepicker.Default() },
    "components-datepicker--in-field" to { dev.rinzai.zen.showcase.examples.datepicker.InField() },
    "components-datepicker--presets" to { dev.rinzai.zen.showcase.examples.datepicker.Presets() },
    "components-datepicker--range" to { dev.rinzai.zen.showcase.examples.datepicker.Range() },
    "components-rangeslider--default" to { dev.rinzai.zen.showcase.examples.rangeslider.Default() },
    "components-taginput--default" to { dev.rinzai.zen.showcase.examples.taginput.Default() },
    "components-commandpalette--default" to { dev.rinzai.zen.showcase.examples.commandpalette.Default() },
    "components-editablecell--default" to { dev.rinzai.zen.showcase.examples.editablecell.Default() },
    "components-filterbar--default" to { dev.rinzai.zen.showcase.examples.filterbar.Default() },
    "components-codeblock--highlighted" to { dev.rinzai.zen.showcase.examples.codeblock.Highlighted() },
    "components-codeblock--plain" to { dev.rinzai.zen.showcase.examples.codeblock.Plain() },
    "components-codeblock--in-card" to { dev.rinzai.zen.showcase.examples.codeblock.InCard() },
    "components-codeblock--copy-button" to { dev.rinzai.zen.showcase.examples.codeblock.CopyButton() },
    "components-codeinput--default" to { dev.rinzai.zen.showcase.examples.codeinput.Default() },
    "components-calendarheatmap--default" to { dev.rinzai.zen.showcase.examples.calendarheatmap.Default() },
    "components-avatar--default" to { dev.rinzai.zen.showcase.examples.avatar.Default() },
    "components-avatar--upload" to { dev.rinzai.zen.showcase.examples.avatar.Upload() },
    "components-slider--default" to { dev.rinzai.zen.showcase.examples.slider.Default() },
    "components-slider--hue" to { dev.rinzai.zen.showcase.examples.slider.Hue() },
    "components-slider--small" to { dev.rinzai.zen.showcase.examples.slider.Small() },
    "components-seekbar--default" to { dev.rinzai.zen.showcase.examples.seekbar.Default() },
    "components-seekbar--times-below" to { dev.rinzai.zen.showcase.examples.seekbar.TimesBelow() },
    "components-toast--tones" to { dev.rinzai.zen.showcase.examples.toast.Tones() },
    "components-backdrop--contours" to { dev.rinzai.zen.showcase.examples.backdrop.Contours() },
    "components-backdrop--dots" to { dev.rinzai.zen.showcase.examples.backdrop.Dots() },
    "components-backdrop--ambient" to { dev.rinzai.zen.showcase.examples.backdrop.Ambient() },
    "components-themetoggle--default" to { dev.rinzai.zen.showcase.examples.themetoggle.Default() },
    "components-themetoggle--your-state" to { dev.rinzai.zen.showcase.examples.themetoggle.YourState() },
    "components-marquee--default" to { dev.rinzai.zen.showcase.examples.marquee.Default() },
    "components-marquee--always" to { dev.rinzai.zen.showcase.examples.marquee.Always() },
    "components-tooltip--default" to { dev.rinzai.zen.showcase.examples.tooltip.Default() },
    "components-tooltip--beside" to { dev.rinzai.zen.showcase.examples.tooltip.Beside() },
    "components-header--default" to { dev.rinzai.zen.showcase.examples.header.Default() },
    "components-badge--primary" to { dev.rinzai.zen.showcase.examples.badge.Primary() },
    "components-emptystate--default" to { dev.rinzai.zen.showcase.examples.emptystate.Default() },
    "components-inputgroup--default" to { dev.rinzai.zen.showcase.examples.inputgroup.Default() },
    "components-inputgroup--with-button" to { dev.rinzai.zen.showcase.examples.inputgroup.WithButton() },
    "components-input--primary" to { dev.rinzai.zen.showcase.examples.input.Primary() },
    "components-input--states" to { dev.rinzai.zen.showcase.examples.input.States() },
    "components-button--primary" to { dev.rinzai.zen.showcase.examples.button.Primary() },
    "components-button--variants" to { dev.rinzai.zen.showcase.examples.button.Variants() },
    "components-button--sizes" to { dev.rinzai.zen.showcase.examples.button.Sizes() },
    "components-button--loading" to { dev.rinzai.zen.showcase.examples.button.Loading() },
    "components-button--tones" to { dev.rinzai.zen.showcase.examples.button.Tones() },
    "components-button--as-link" to { dev.rinzai.zen.showcase.examples.button.AsLink() },
    "components-menu--account" to { dev.rinzai.zen.showcase.examples.menu.Account() },
    "components-menu--options" to { dev.rinzai.zen.showcase.examples.menu.Options() },
    "components-menu--bar" to { dev.rinzai.zen.showcase.examples.menu.Bar() },
    "components-menu--sheet" to { dev.rinzai.zen.showcase.examples.menu.Sheet() },
    "components-menu--actions" to { dev.rinzai.zen.showcase.examples.menu.Actions() },
    "components-menu--context" to { dev.rinzai.zen.showcase.examples.menu.Context() },
    "components-popover--profile-card" to { dev.rinzai.zen.showcase.examples.popover.ProfileCard() },
    "components-popover--feedback-form" to { dev.rinzai.zen.showcase.examples.popover.FeedbackForm() },
    "components-popover--settings" to { dev.rinzai.zen.showcase.examples.popover.Settings() },
    "components-popover--controlled" to { dev.rinzai.zen.showcase.examples.popover.Controlled() },
    "components-combobox--accounts" to { dev.rinzai.zen.showcase.examples.combobox.Accounts() },
    "components-combobox--tags" to { dev.rinzai.zen.showcase.examples.combobox.Tags() },
    "components-combobox--many-items" to { dev.rinzai.zen.showcase.examples.combobox.ManyItems() },
    "components-numberfield--default" to { dev.rinzai.zen.showcase.examples.numberfield.Default() },
    "components-numberfield--formats" to { dev.rinzai.zen.showcase.examples.numberfield.Formats() },
    "components-moneyinput--default" to { dev.rinzai.zen.showcase.examples.moneyinput.Default() },
    "components-moneyinput--dollars" to { dev.rinzai.zen.showcase.examples.moneyinput.Dollars() },
    "components-moneyinput--convert" to { dev.rinzai.zen.showcase.examples.moneyinput.Convert() },
    "components-moneyinput--compact" to { dev.rinzai.zen.showcase.examples.moneyinput.Compact() },
    "components-badge--variants" to { dev.rinzai.zen.showcase.examples.badge.Variants() },
    "components-breadcrumbs--default" to { dev.rinzai.zen.showcase.examples.breadcrumbs.Default() },
    "components-buttongroup--default" to { dev.rinzai.zen.showcase.examples.buttongroup.Default() },
    "components-buttongroup--split" to { dev.rinzai.zen.showcase.examples.buttongroup.Split() },
    "components-inset--default" to { dev.rinzai.zen.showcase.examples.inset.Default() },
    "components-textarea--primary" to { dev.rinzai.zen.showcase.examples.textarea.Primary() },
    "components-textarea--example" to { dev.rinzai.zen.showcase.examples.textarea.Default() },
    "components-timeline--default" to { dev.rinzai.zen.showcase.examples.timeline.Default() },
    "components-toggle--primary" to { dev.rinzai.zen.showcase.examples.toggle.Primary() },
    "components-toggle--example" to { dev.rinzai.zen.showcase.examples.toggle.Default() },
    "components-trend--default" to { dev.rinzai.zen.showcase.examples.trend.Default() },
    "components-card--stats" to { dev.rinzai.zen.showcase.examples.card.Stats() },
    "components-card--goal" to { dev.rinzai.zen.showcase.examples.card.Goal() },
    "components-card--morph" to { dev.rinzai.zen.showcase.examples.card.Morph() },
    "components-checkbox--default" to { dev.rinzai.zen.showcase.examples.checkbox.Default() },
    "components-checkbox--select-all" to { dev.rinzai.zen.showcase.examples.checkbox.SelectAll() },
    "components-radiogroup--default" to { dev.rinzai.zen.showcase.examples.radiogroup.Default() },
    "components-radiogroup--horizontal" to { dev.rinzai.zen.showcase.examples.radiogroup.Horizontal() },
    "components-disclosure--default" to { dev.rinzai.zen.showcase.examples.disclosure.Default() },
    "components-accordion--default" to { dev.rinzai.zen.showcase.examples.accordion.Default() },
    "components-accordion--multiple" to { dev.rinzai.zen.showcase.examples.accordion.Multiple() },
    "components-keypad--default" to { dev.rinzai.zen.showcase.examples.keypad.Default() },
    "components-sparkline--default" to { dev.rinzai.zen.showcase.examples.sparkline.Default() },
    "components-stepper--default" to { dev.rinzai.zen.showcase.examples.stepper.Default() },
    "components-tableofcontents--default" to { dev.rinzai.zen.showcase.examples.tableofcontents.Default() },
    "components-loadmore--default" to { dev.rinzai.zen.showcase.examples.loadmore.Default() },
    "components-sidenav--default" to { dev.rinzai.zen.showcase.examples.sidenav.Default() },
    "components-togglegroup--default" to { dev.rinzai.zen.showcase.examples.togglegroup.Default() },
    "components-togglegroup--single" to { dev.rinzai.zen.showcase.examples.togglegroup.Single() },
    "components-toolbar--default" to { dev.rinzai.zen.showcase.examples.toolbar.Default() },
    "components-toolbar--vertical" to { dev.rinzai.zen.showcase.examples.toolbar.Vertical() },
    "components-radiocards--default" to { dev.rinzai.zen.showcase.examples.radiocards.Default() },
    "components-animatednumber--default" to { dev.rinzai.zen.showcase.examples.animatednumber.Default() },
    "components-collapse--default" to { dev.rinzai.zen.showcase.examples.collapse.Default() },
    "components-pagination--default" to { dev.rinzai.zen.showcase.examples.pagination.Default() },
    "components-pills--navigation" to { dev.rinzai.zen.showcase.examples.pills.Navigation() },
    "components-repeatpicker--default" to { dev.rinzai.zen.showcase.examples.repeatpicker.Default() },
    "components-filedrop--default" to { dev.rinzai.zen.showcase.examples.filedrop.Default() },
    "components-iconpicker--default" to { dev.rinzai.zen.showcase.examples.iconpicker.Default() },
    "components-localeprovider--french" to { dev.rinzai.zen.showcase.examples.localeprovider.French() },
    "components-localeprovider--right-to-left" to { dev.rinzai.zen.showcase.examples.localeprovider.RightToLeft() },
    "components-pagetransition--default" to { dev.rinzai.zen.showcase.examples.pagetransition.Default() },
    "components-segmented--primary" to { dev.rinzai.zen.showcase.examples.segmented.Default() },
    "components-segmented--example" to { dev.rinzai.zen.showcase.examples.segmented.Default() },
    "components-tabs--underline" to { dev.rinzai.zen.showcase.examples.tabs.Underline() },
    "components-tabs--pills" to { dev.rinzai.zen.showcase.examples.tabs.Pills() },
    "components-hovercard--default" to { dev.rinzai.zen.showcase.examples.hovercard.Default() },
    "components-hovercard--trend" to { dev.rinzai.zen.showcase.examples.hovercard.Trend() },
    "components-alert--default" to { dev.rinzai.zen.showcase.examples.alert.Default() },
    "components-alert--plain" to { dev.rinzai.zen.showcase.examples.alert.Plain() },
    "components-meter--budget" to { dev.rinzai.zen.showcase.examples.meter.Budget() },
    "components-progressring--primary" to { dev.rinzai.zen.showcase.examples.progressring.Primary() },
    "components-progressring--example" to { dev.rinzai.zen.showcase.examples.progressring.Default() },
    "components-chip--default" to { dev.rinzai.zen.showcase.examples.chip.Default() },
    "components-kbd--default" to { dev.rinzai.zen.showcase.examples.kbd.Default() },
    "components-pageheader--default" to { dev.rinzai.zen.showcase.examples.pageheader.Default() },
    "components-separator--default" to { dev.rinzai.zen.showcase.examples.separator.Default() },
    "components-separator--stats" to { dev.rinzai.zen.showcase.examples.separator.Stats() },
    "components-skeleton--loading-card" to { dev.rinzai.zen.showcase.examples.skeleton.LoadingCard() },
    "components-skeleton--with-spinner" to { dev.rinzai.zen.showcase.examples.skeleton.WithSpinner() },
    "components-skeleton--reveal" to { dev.rinzai.zen.showcase.examples.skeleton.Reveal() },
    "components-spinner--default" to { dev.rinzai.zen.spinner.Spinner() },
    "components-spinner--sizes" to { dev.rinzai.zen.showcase.examples.spinner.Default() },
    "components-spinner--loading" to { dev.rinzai.zen.showcase.examples.spinner.Loading() },
    "components-statuspill--save" to { dev.rinzai.zen.showcase.examples.statuspill.Save() },
)

private val OwnBackdrop = setOf("components-backdrop--contours", "components-backdrop--dots")

/** The backdrop a story is shown on, unless it brings its own (the Backdrop's stories). */
@Composable
fun StoryBackdrop(id: String) {
    if (id !in OwnBackdrop) Backdrop(Topo)
}

/** Storybook's `layout` parameter: where a story sits in its frame. */
enum class StoryLayout {
    Centered,
    Padded,
    Fullscreen,

    /** As a docs page shows an example: centred in its preview, padded by `padding`, free to fill the width. */
    Docs,
}

/**
 * A story as Storybook shows it: laid out by `layout`, on the backdrop, in a ToastProvider.
 * `onHeight` hears how tall the example is with its padding, for a frame sized to fit it.
 */
@Composable
fun Story(
    id: String,
    appearance: Appearance = Appearance.Dark,
    layout: StoryLayout = StoryLayout.Centered,
    padding: Dp = 16.dp,
    embed: Embed? = null,
    host: HostWindow? = null,
    onHeight: (Dp) -> Unit = {},
) {
    val example = Stories.getValue(id)
    ZenTheme(appearance, embed, host) {
        // The Backdrop's own stories bring theirs (backdrop: false).
        StoryBackdrop(id)
        val density = LocalDensity.current
        val tell = { px: Int, pad: Dp -> onHeight(with(density) { px.toDp() } + pad) }
        ToastProvider {
            when (layout) {
                StoryLayout.Centered -> Box(Modifier.fillMaxWidth().heightIn(min = LocalPage.current.viewport.height).padding(padding), contentAlignment = Alignment.Center) {
                    // The root shrinks to fit (margin: auto in a flex box): a full-width example is as wide as its content.
                    Box(Modifier.width(IntrinsicSize.Max).onSizeChanged { tell(it.height, padding * 2) }) { example() }
                }
                StoryLayout.Padded -> Box(Modifier.fillMaxWidth().padding(padding).onSizeChanged { tell(it.height, padding * 2) }) { example() }
                StoryLayout.Fullscreen -> Column(Modifier.onSizeChanged { tell(it.height, 0.dp) }) { example() }
                StoryLayout.Docs -> Box(Modifier.fillMaxWidth().heightIn(min = LocalPage.current.viewport.height).padding(padding), contentAlignment = Alignment.Center) {
                    Box(Modifier.onSizeChanged { tell(it.height, padding * 2) }) { example() }
                }
            }
        }
    }
}
