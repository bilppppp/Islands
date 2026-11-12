import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorView as EditorViewType } from "@codemirror/view";
import type { Compartment as CompartmentType, Extension } from "@codemirror/state";
import { resolveEditorLanguage } from "../../lib/run-block.mjs";
import { t } from "./IslandAskTeacher";

export interface IslandCodeEditorProps {
	value: string;
	onChange: (value: string) => void;
	lang: string;
	ariaLabel?: string;
	minHeight?: string | number;
	maxHeight?: string | number;
	className?: string;
	inModal?: boolean;
	isWrapOff?: boolean;
}

interface CmModules {
	EditorView: typeof import("@codemirror/view").EditorView;
	keymap: typeof import("@codemirror/view").keymap;
	lineNumbers: typeof import("@codemirror/view").lineNumbers;
	highlightActiveLine: typeof import("@codemirror/view").highlightActiveLine;
	EditorState: typeof import("@codemirror/state").EditorState;
	Compartment: typeof import("@codemirror/state").Compartment;
	bracketMatching: typeof import("@codemirror/language").bracketMatching;
	indentUnit: typeof import("@codemirror/language").indentUnit;
	syntaxHighlighting: typeof import("@codemirror/language").syntaxHighlighting;
	HighlightStyle: typeof import("@codemirror/language").HighlightStyle;
	history: typeof import("@codemirror/commands").history;
	historyKeymap: typeof import("@codemirror/commands").historyKeymap;
	defaultKeymap: typeof import("@codemirror/commands").defaultKeymap;
	indentWithTab: typeof import("@codemirror/commands").indentWithTab;
	closeBrackets: typeof import("@codemirror/autocomplete").closeBrackets;
	closeBracketsKeymap: typeof import("@codemirror/autocomplete").closeBracketsKeymap;
	python: typeof import("@codemirror/lang-python").python;
	javascript: typeof import("@codemirror/lang-javascript").javascript;
	html: typeof import("@codemirror/lang-html").html;
	tags: typeof import("@lezer/highlight").tags;
	indentationMarkers: typeof import("@replit/codemirror-indentation-markers").indentationMarkers;
}

let cmModulesPromise: Promise<CmModules> | null = null;
let cmModulesLoaded: CmModules | null = null;

async function loadCmModules(): Promise<CmModules> {
	if (cmModulesLoaded) return cmModulesLoaded;
	if (!cmModulesPromise) {
		cmModulesPromise = (async () => {
			const [
				viewMod,
				stateMod,
				langMod,
				commandsMod,
				autocompleteMod,
				pyMod,
				jsMod,
				htmlMod,
				highlightMod,
				indentMarkersMod,
			] = await Promise.all([
				import("@codemirror/view"),
				import("@codemirror/state"),
				import("@codemirror/language"),
				import("@codemirror/commands"),
				import("@codemirror/autocomplete"),
				import("@codemirror/lang-python"),
				import("@codemirror/lang-javascript"),
				import("@codemirror/lang-html"),
				import("@lezer/highlight"),
				import("@replit/codemirror-indentation-markers"),
			]);
			cmModulesLoaded = {
				EditorView: viewMod.EditorView,
				keymap: viewMod.keymap,
				lineNumbers: viewMod.lineNumbers,
				highlightActiveLine: viewMod.highlightActiveLine,
				EditorState: stateMod.EditorState,
				Compartment: stateMod.Compartment,
				bracketMatching: langMod.bracketMatching,
				indentUnit: langMod.indentUnit,
				syntaxHighlighting: langMod.syntaxHighlighting,
				HighlightStyle: langMod.HighlightStyle,
				history: commandsMod.history,
				historyKeymap: commandsMod.historyKeymap,
				defaultKeymap: commandsMod.defaultKeymap,
				indentWithTab: commandsMod.indentWithTab,
				closeBrackets: autocompleteMod.closeBrackets,
				closeBracketsKeymap: autocompleteMod.closeBracketsKeymap,
				python: pyMod.python,
				javascript: jsMod.javascript,
				html: htmlMod.html,
				tags: highlightMod.tags,
				indentationMarkers: indentMarkersMod.indentationMarkers,
			};
			return cmModulesLoaded;
		})();
	}
	return cmModulesPromise;
}

function getLanguageExtension(lang: string, modules: CmModules): Extension {
	const config = resolveEditorLanguage(lang);
	if (config.name === "python") {
		return modules.python();
	}
	if (config.name === "html") {
		return modules.html();
	}
	return modules.javascript({
		typescript: Boolean(config.typescript),
		jsx: Boolean(config.jsx),
	});
}

function createIslandHighlightStyle(modules: CmModules) {
	const { HighlightStyle, tags } = modules;
	return HighlightStyle.define([
		{ tag: [tags.keyword, tags.definitionKeyword, tags.modifier], color: "#d4a0e0" },
		{ tag: [tags.name, tags.deleted, tags.character, tags.macroName], color: "#e8d5bc" },
		{ tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.labelName], color: "#61afef" },
		{ tag: [tags.color, tags.constant(tags.name), tags.standard(tags.name)], color: "#a8d4a0" },
		{ tag: [tags.definition(tags.name), tags.separator], color: "#e8d5bc" },
		{ tag: [tags.typeName, tags.className, tags.changed, tags.annotation, tags.self, tags.namespace], color: "#80c0e0" },
		{ tag: [tags.number, tags.integer, tags.float], color: "#a8d4a0" },
		{ tag: [tags.operator, tags.operatorKeyword, tags.punctuation, tags.bracket], color: "#d4b896" },
		{ tag: [tags.tagName, tags.angleBracket], color: "#e06c75" },
		{ tag: [tags.attributeName], color: "#e8c87a" },
		{ tag: [tags.attributeValue, tags.string, tags.special(tags.string)], color: "#a8d4a0" },
		{ tag: [tags.meta, tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: "#6b5e50", fontStyle: "italic" },
		{ tag: [tags.bool, tags.null, tags.atom], color: "#ff9966" },
		{ tag: tags.invalid, color: "#ff5555" },
	]);
}

export default function IslandCodeEditor({
	value,
	onChange,
	lang,
	ariaLabel,
	minHeight,
	maxHeight,
	className,
	inModal = false,
	isWrapOff = false,
}: IslandCodeEditorProps) {
	const [cmLoaded, setCmLoaded] = useState(() => cmModulesLoaded !== null);
	const [cmFailed, setCmFailed] = useState(false);

	const containerRef = useRef<HTMLDivElement | null>(null);
	const viewRef = useRef<EditorViewType | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const languageCompartmentRef = useRef<CompartmentType | null>(null);
	const lastDispatchedValueRef = useRef<string>(value);
	const tabEscapedRef = useRef<boolean>(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		if (cmLoaded || cmFailed) return;
		let mounted = true;
		loadCmModules()
			.then(() => {
				if (mounted) setCmLoaded(true);
			})
			.catch((err) => {
				console.warn("Failed to load CodeMirror, falling back to textarea:", err);
				if (mounted) setCmFailed(true);
			});
		return () => {
			mounted = false;
		};
	}, [cmLoaded, cmFailed]);

	// Textarea fallback helpers
	const adjustTextareaHeight = useCallback(() => {
		const el = textareaRef.current;
		if (el) {
			el.style.height = "auto";
			el.style.height = `${Math.max(72, el.scrollHeight)}px`;
		}
	}, []);

	useEffect(() => {
		if (!cmLoaded || cmFailed) {
			adjustTextareaHeight();
		}
	}, [value, cmLoaded, cmFailed, adjustTextareaHeight]);

	const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Tab") {
			e.preventDefault();
			const target = e.currentTarget;
			const start = target.selectionStart;
			const end = target.selectionEnd;
			const val = target.value;
			const nextVal = `${val.substring(0, start)}    ${val.substring(end)}`;
			onChange(nextVal);
			requestAnimationFrame(() => {
				target.selectionStart = target.selectionEnd = start + 4;
				adjustTextareaHeight();
			});
		}
	};

	// CodeMirror 6 mount & initialization
	useEffect(() => {
		if (!cmLoaded || cmFailed || !containerRef.current) return;
		const modules = cmModulesLoaded;
		if (!modules) return;

		const langCompartment = new modules.Compartment();
		languageCompartmentRef.current = langCompartment;

		const islandHighlightStyle = createIslandHighlightStyle(modules);

		const islandTheme = modules.EditorView.theme({
			"&": {
				backgroundColor: "#2b2118",
				color: "#e8d5bc",
				fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, 'DejaVu Sans Mono', Menlo, monospace",
				fontSize: "13.5px",
				lineHeight: "1.65",
			},
			"&.cm-focused": {
				outline: "none",
			},
			".cm-content": {
				padding: "14px 16px 14px 8px",
				caretColor: "#19c8b9",
				fontFamily: "inherit",
				fontSize: "inherit",
				lineHeight: "inherit",
			},
			".cm-line": {
				padding: "0",
			},
			".cm-gutters": {
				backgroundColor: "#2b2118",
				color: "#6b5e50",
				border: "none",
				borderRight: "1px solid #3d3028",
				paddingLeft: "8px",
				paddingRight: "6px",
				userSelect: "none",
			},
			".cm-lineNumbers .cm-gutterElement": {
				minWidth: "24px",
				padding: "0 4px 0 0",
				textAlign: "right",
				color: "#6b5e50",
			},
			".cm-activeLine": {
				backgroundColor: "rgba(255, 255, 255, 0.04)",
			},
			".cm-activeLineGutter": {
				backgroundColor: "rgba(255, 255, 255, 0.04)",
				color: "#e8d5bc",
			},
			"&.cm-focused .cm-cursor": {
				borderLeftColor: "#19c8b9",
				borderLeftWidth: "2px",
			},
			"&.cm-focused .cm-selectionBackground, ::selection": {
				backgroundColor: "rgba(25, 200, 185, 0.25) !important",
			},
			".cm-selectionMatch": {
				backgroundColor: "rgba(25, 200, 185, 0.15)",
			},
			".cm-indent-markers": {
				"--indent-marker-active-bg-color": "rgba(232, 213, 188, 0.25)",
				"--indent-marker-bg-color": "rgba(232, 213, 188, 0.08)",
			},
			".cm-scroller": {
				scrollbarWidth: "thin",
				scrollbarColor: "#5a4632 #221a13",
			},
			".cm-scroller::-webkit-scrollbar": {
				width: "8px",
				height: "8px",
			},
			".cm-scroller::-webkit-scrollbar-track": {
				background: "#221a13",
				borderRadius: "4px",
			},
			".cm-scroller::-webkit-scrollbar-thumb": {
				background: "#5a4632",
				borderRadius: "4px",
			},
			".cm-scroller::-webkit-scrollbar-thumb:hover": {
				background: "#785e44",
			},
		});

		const escapeKeymap = modules.keymap.of([
			{
				key: "Escape",
				run: () => {
					tabEscapedRef.current = true;
					return true;
				},
			},
			{
				key: "Tab",
				run: (view) => {
					if (tabEscapedRef.current) {
						tabEscapedRef.current = false;
						return false;
					}
					return modules.indentWithTab.run ? modules.indentWithTab.run(view) : false;
				},
				shift: (view) => {
					if (tabEscapedRef.current) {
						tabEscapedRef.current = false;
						return false;
					}
					return modules.indentWithTab.shift ? modules.indentWithTab.shift(view) : false;
				},
			},
		]);

		const state = modules.EditorState.create({
			doc: value,
			extensions: [
				modules.lineNumbers(),
				modules.highlightActiveLine(),
				modules.bracketMatching(),
				modules.closeBrackets(),
				modules.history(),
				modules.indentationMarkers(),
				modules.indentUnit.of("    "),
				islandTheme,
				modules.syntaxHighlighting(islandHighlightStyle),
				langCompartment.of(getLanguageExtension(lang, modules)),
				modules.EditorView.contentAttributes.of({
					"aria-label": ariaLabel || t("codeEditor"),
				}),
				modules.EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						const nextVal = update.state.doc.toString();
						lastDispatchedValueRef.current = nextVal;
						onChangeRef.current(nextVal);
					}
				}),
				escapeKeymap,
				modules.keymap.of([
					...modules.closeBracketsKeymap,
					...modules.defaultKeymap,
					...modules.historyKeymap,
				]),
				modules.EditorView.domEventHandlers({
					blur: () => {
						tabEscapedRef.current = false;
					},
					keydown: (event) => {
						if (event.key !== "Escape" && event.key !== "Tab" && event.key !== "Shift") {
							tabEscapedRef.current = false;
						}
					},
				}),
			],
		});

		lastDispatchedValueRef.current = value;
		const view = new modules.EditorView({
			state,
			parent: containerRef.current,
		});
		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [cmLoaded, cmFailed]);

	// Reconfigure language when lang changes
	useEffect(() => {
		const view = viewRef.current;
		const compartment = languageCompartmentRef.current;
		const modules = cmModulesLoaded;
		if (view && compartment && modules) {
			view.dispatch({
				effects: compartment.reconfigure(getLanguageExtension(lang, modules)),
			});
		}
	}, [lang]);

	// Sync external value changes (e.g. reset) without feedback loop
	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;
		if (value === lastDispatchedValueRef.current) return;
		const currentVal = view.state.doc.toString();
		if (currentVal !== value) {
			lastDispatchedValueRef.current = value;
			view.dispatch({
				changes: { from: 0, to: currentVal.length, insert: value },
			});
		}
	}, [value]);

	const inlineStyle: React.CSSProperties = {};
	if (minHeight !== undefined) inlineStyle.minHeight = minHeight;
	if (maxHeight !== undefined) inlineStyle.maxHeight = maxHeight;

	return (
		<div
			className={`island-run-editor-wrap${inModal ? " island-run-editor-modal" : ""}${className ? ` ${className}` : ""}`}
		>
			{cmLoaded && !cmFailed ? (
				<>
					<div
						ref={containerRef}
						className="island-code-editor"
						style={inlineStyle}
					/>
					<div className="island-editor-hint">{t("editorKeyboardHint")}</div>
				</>
			) : (
				<textarea
					ref={textareaRef}
					className="island-run-textarea"
					value={value}
					spellCheck={false}
					autoCapitalize="off"
					autoComplete="off"
					autoCorrect="off"
					wrap={isWrapOff ? "off" : undefined}
					onChange={(e) => onChange(e.target.value)}
					onFocus={adjustTextareaHeight}
					onKeyDown={handleTextareaKeyDown}
					aria-label={ariaLabel}
					style={inlineStyle}
				/>
			)}
		</div>
	);
}
