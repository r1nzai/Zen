import {
    ApplySchemaAttributes,
    CommandFunction,
    DelayedPromiseCreator,
    EditorView,
    ErrorConstant,
    ExtensionTag,
    NodeExtension,
    NodeExtensionSpec,
    NodeSpecOverride,
    NodeView,
    NodeViewMethod,
    PrimitiveSelection,
    ProsemirrorAttributes,
    ProsemirrorNode,
    command,
    extension,
    getTextSelection,
    invariant,
    isElementDomNode,
    isNumber,
    omitExtraAttributes,
} from "@remirror/core";
import { PasteRule } from "@remirror/pm/paste-rules";
import { insertPoint } from "@remirror/pm/transform";
import { ExtensionImageTheme } from "@remirror/theme";

import { setStyle } from "@remirror/core";
import { ResizableNodeView, ResizableRatioType } from "prosemirror-resizable-view";

class ResizableVideoView extends ResizableNodeView implements NodeView {
    constructor(node: ProsemirrorNode, view: EditorView, getPos: () => number) {
        super({ node, view, getPos, aspectRatio: ResizableRatioType.Fixed });
    }

    createElement({ node }: { node: ProsemirrorNode }): HTMLVideoElement {
        const inner = document.createElement("video");

        inner.setAttribute("src", node.attrs.src);
        inner.setAttribute("controls", node.attrs.controls ? "true" : "false");
        setStyle(inner, {
            width: "100%",
            minWidth: "50px",
            objectFit: "contain",
        });

        return inner;
    }
}

type DelayedVideo = DelayedPromiseCreator<VideoAttributes>;
interface VideoOptions {
    createPlaceholder?: (view: EditorView, pos: number) => HTMLElement;
    updatePlaceholder?: (view: EditorView, pos: number, element: HTMLElement, progress: number) => void;
    destroyPlaceholder?: (view: EditorView, element: HTMLElement) => void;

    uploadHandler?: (files: FileWithProgress[]) => DelayedVideo[];

    enableResizing?: boolean;

    preferPastedTextContent?: boolean;
}

interface FileWithProgress {
    file: File;
    progress: SetProgress;
}

type SetProgress = (progress: number) => void;

@extension<VideoOptions>({
    defaultOptions: {
        createPlaceholder,
        updatePlaceholder: () => {},
        destroyPlaceholder: () => {},
        uploadHandler,
        enableResizing: false,
        preferPastedTextContent: true,
    },
})
class VideoExtension extends NodeExtension<VideoOptions> {
    get name() {
        return "video" as const;
    }

    createTags() {
        return [ExtensionTag.InlineNode, ExtensionTag.Media];
    }

    createNodeSpec(extra: ApplySchemaAttributes, override: NodeSpecOverride): NodeExtensionSpec {
        const { preferPastedTextContent } = this.options;
        return {
            inline: true,
            draggable: true,
            selectable: false,
            ...override,
            attrs: {
                ...extra.defaults(),
                crop: { default: null },
                height: { default: null },
                width: { default: null },
                rotate: { default: null },
                src: { default: null },
                title: { default: "" },
                fileName: { default: null },
                controls: { default: true },
                resizable: { default: false },
            },
            parseDOM: [
                {
                    tag: "video[src][controls]",
                    getAttrs: (element) => {
                        if (isElementDomNode(element)) {
                            const attrs = getVideoAttributes({ element, parse: extra.parse });

                            if (preferPastedTextContent && attrs.src?.startsWith("file:///")) {
                                return false;
                            }

                            return attrs;
                        }

                        return {};
                    },
                },
                ...(override.parseDOM ?? []),
            ],
            toDOM: (node) => {
                const attrs = omitExtraAttributes(node.attrs, extra);
                return ["video", { ...extra.dom(node), ...attrs }];
            },
        };
    }

    @command()
    insertVideo(attributes: VideoAttributes, selection?: PrimitiveSelection): CommandFunction {
        return ({ tr, dispatch }) => {
            const { from, to } = getTextSelection(selection ?? tr.selection, tr.doc);
            const node = this.type.create(attributes);

            dispatch?.(tr.replaceRangeWith(from, to, node));

            return true;
        };
    }
    @command()
    uploadVideo(
        value: DelayedPromiseCreator<VideoAttributes>,
        onElement?: (element: HTMLElement) => void,
    ): CommandFunction {
        const { updatePlaceholder, destroyPlaceholder, createPlaceholder } = this.options;
        return (props) => {
            const { tr } = props;
            let pos = tr.selection.from;
            return this.store
                .createPlaceholderCommand({
                    promise: value,
                    placeholder: {
                        type: "widget",
                        get pos() {
                            return pos;
                        },
                        createElement: (view, pos) => {
                            const element = createPlaceholder(view, pos);
                            onElement?.(element);
                            return element;
                        },
                        onUpdate: (view, pos, element, data) => {
                            updatePlaceholder(view, pos, element, data);
                        },
                        onDestroy: (view, element) => {
                            destroyPlaceholder(view, element);
                        },
                    },
                    onSuccess: (value, range, commandProps) => this.insertVideo(value, range)(commandProps),
                })
                .validate(({ tr, dispatch }) => {
                    const insertPos = insertPoint(tr.doc, pos, this.type);

                    if (insertPos == null) {
                        return false;
                    }

                    pos = insertPos;

                    if (!tr.selection.empty) {
                        dispatch?.(tr.deleteSelection());
                    }

                    return true;
                }, "unshift")

                .generateCommand()(props);
        };
    }

    private fileUploadFileHandler(files: File[], event: ClipboardEvent | DragEvent, pos?: number) {
        const { preferPastedTextContent, uploadHandler } = this.options;

        if (preferPastedTextContent && isClipboardEvent(event) && event.clipboardData?.getData("text/plain")) {
            return false;
        }

        const { commands, chain } = this.store;
        const filesWithProgress: FileWithProgress[] = files.map((file, index) => ({
            file,
            progress: (progress) => {
                commands.updatePlaceholder(uploads[index], progress);
            },
        }));

        const uploads = uploadHandler(filesWithProgress);

        if (isNumber(pos)) {
            chain.selectText(pos);
        }

        for (const upload of uploads) {
            chain.uploadVideo(upload);
        }

        chain.run();

        return true;
    }

    createPasteRules(): PasteRule[] {
        return [
            {
                type: "file",
                regexp: /video/i,
                fileHandler: (props): boolean => {
                    const pos = props.type === "drop" ? props.pos : undefined;
                    return this.fileUploadFileHandler(props.files, props.event, pos);
                },
            },
        ];
    }

    createNodeViews(): NodeViewMethod | Record<string, NodeViewMethod> {
        if (this.options.enableResizing) {
            return (node: ProsemirrorNode, view: EditorView, getPos: () => number | undefined) =>
                new ResizableVideoView(node, view, getPos as () => number);
        }

        return {};
    }
}

type VideoAttributes = ProsemirrorAttributes<VideoExtensionAttributes>;

interface VideoExtensionAttributes {
    align?: "center" | "end" | "justify" | "left" | "match-parent" | "right" | "start";
    height?: string | number;
    width?: string | number;
    rotate?: string;
    src: string;
    title?: string;
    controls?: boolean;
    fileName?: string;
}

const VIDEO_FILES_TYPES = new Set(["video/mp4", "video/ogg", "video/webm"]);

function isVideoFileType(file: File): boolean {
    return VIDEO_FILES_TYPES.has(file.type);
}

function getDimensions(element: HTMLElement) {
    let { width, height } = element.style;
    width = width || element.getAttribute("width") || "";
    height = height || element.getAttribute("height") || "";

    return { width, height };
}

function getVideoAttributes({ element, parse }: { element: HTMLElement; parse: ApplySchemaAttributes["parse"] }) {
    const { width, height } = getDimensions(element);

    return {
        ...parse(element),
        height: Number.parseInt(height || "0", 10) || null,
        src: element.getAttribute("src") ?? null,
        title: element.getAttribute("title") ?? "",
        width: Number.parseInt(width || "0", 10) || null,
        controls: element.getAttribute("controls") ?? true,
    };
}

function createPlaceholder(_: EditorView, __: number): HTMLElement {
    const element = document.createElement("div");
    element.classList.add(ExtensionImageTheme.IMAGE_LOADER);

    return element;
}

function uploadHandler(files: FileWithProgress[]): DelayedVideo[] {
    invariant(files.length > 0, {
        code: ErrorConstant.EXTENSION,
        message: "The upload handler was applied for the video extension without any valid files",
    });

    let completed = 0;
    const promises: Array<DelayedPromiseCreator<VideoAttributes>> = [];

    for (const { file, progress } of files) {
        const bytesperMb = 1048576;
        if (file.size > 25 * bytesperMb) {
            continue;
        }
        promises.push(
            () =>
                new Promise<VideoAttributes>((resolve) => {
                    const reader = new FileReader();

                    reader.addEventListener(
                        "load",
                        (readerEvent) => {
                            completed += 1;
                            progress(completed / files.length);
                            resolve({ src: readerEvent.target?.result as string, fileName: file.name });
                        },
                        { once: true },
                    );

                    reader.readAsDataURL(file);
                }),
        );
    }

    return promises;
}

function isClipboardEvent(event: ClipboardEvent | DragEvent): event is ClipboardEvent {
    return (event as ClipboardEvent).clipboardData !== undefined;
}

declare global {
    namespace Remirror {
        interface AllExtensions {
            video: VideoExtension;
        }
    }
}
export { VideoExtension, isVideoFileType, type VideoAttributes, type VideoExtensionAttributes, type VideoOptions };
