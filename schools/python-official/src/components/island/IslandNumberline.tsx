import { useState, useRef, useEffect } from "react";
import IslandAskTeacher, { t } from "./IslandAskTeacher";
import type { NumberlineBlock, NumberlinePoint } from "../../lib/predict-block.mjs";

export interface IslandNumberlineProps {
	block: NumberlineBlock;
}

const POINT_COLORS = [
	{ main: "#2563eb", light: "#dbeafe", dark: "#1d4ed8" }, // Blue
	{ main: "#d97706", light: "#fef3c7", dark: "#b45309" }, // Amber
	{ main: "#059669", light: "#d1fae5", dark: "#047857" }, // Emerald
];

function formatNumber(n: number): string {
	const rounded = Math.round(n * 100) / 100;
	const s = String(Object.is(rounded, -0) ? 0 : rounded);
	return s.replace(/-/g, "−");
}

export default function IslandNumberline({ block }: IslandNumberlineProps) {
	const [points, setPoints] = useState<NumberlinePoint[]>(() =>
		block.points.map((p) => ({ ...p })),
	);
	const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
	const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

	const svgRef = useRef<SVGSVGElement | null>(null);

	const [min, max] = block.range;
	const span = max - min;
	const step = block.step;
	const showOpposite = block.show.includes("opposite");
	const showAbs = block.show.includes("abs");
	const showDistance = block.show.includes("distance") && points.length === 2;

	const viewBoxWidth = 600;
	const paddingX = 40;
	const axisWidth = viewBoxWidth - paddingX * 2;

	const axisY = showOpposite ? 74 : 46;
	let bottomSpace = 34;
	if (showAbs) bottomSpace += points.length * 18;
	if (showDistance) bottomSpace += 20;
	const viewBoxHeight = axisY + bottomSpace;

	const toSvgX = (val: number): number => {
		return paddingX + ((val - min) / span) * axisWidth;
	};

	const updatePointValue = (index: number, newVal: number) => {
		const precision = step === 0.1 ? 1 : step === 0.5 ? 1 : 0;
		const clamped = Math.max(min, Math.min(max, newVal));
		const snapped = Number(
			(Math.round((clamped - min) / step) * step + min).toFixed(precision),
		);
		setPoints((prev) =>
			prev.map((p, i) => (i === index ? { ...p, value: snapped } : p)),
		);
	};

	const handlePointerDown = (index: number, e: React.PointerEvent) => {
		e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		setActiveDragIndex(index);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (activeDragIndex === null) return;
		const svg = svgRef.current;
		if (!svg) return;
		const rect = svg.getBoundingClientRect();
		const clientX = e.clientX;
		const svgX = ((clientX - rect.left) / rect.width) * viewBoxWidth;
		const rawVal = min + ((svgX - paddingX) / axisWidth) * span;
		updatePointValue(activeDragIndex, rawVal);
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (activeDragIndex !== null) {
			try {
				(e.currentTarget as Element).releasePointerCapture(e.pointerId);
			} catch {}
			setActiveDragIndex(null);
		}
	};

	const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
		let delta = 0;
		if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
			delta = -step;
		} else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
			delta = step;
		} else if (e.key === "Home") {
			e.preventDefault();
			updatePointValue(index, min);
			return;
		} else if (e.key === "End") {
			e.preventDefault();
			updatePointValue(index, max);
			return;
		}

		if (delta !== 0) {
			e.preventDefault();
			updatePointValue(index, points[index].value + delta);
		}
	};

	const handleReset = () => {
		setPoints(block.points.map((p) => ({ ...p })));
	};

	const isModified = points.some(
		(p, idx) => p.value !== block.points[idx]?.value,
	);

	// Tick marks
	const ticks: number[] = [];
	for (let v = min; v <= max; v++) {
		ticks.push(v);
	}

	const halfTicks: number[] = [];
	if (step === 0.5) {
		for (let v = min; v < max; v++) {
			halfTicks.push(v + 0.5);
		}
	}

	// Readout strings
	const readouts = points.map((p) => {
		const parts = [`${p.label} = ${formatNumber(p.value)}`];
		if (showOpposite) {
			parts.push(`相反数 ${formatNumber(-p.value)}`);
		}
		if (showAbs) {
			parts.push(`|${p.label}| = ${formatNumber(Math.abs(p.value))}`);
		}
		return parts.join("，");
	});

	let distanceReadout: string | null = null;
	if (showDistance && points.length === 2) {
		const dist = Math.abs(points[0].value - points[1].value);
		distanceReadout = `两点距离 |${points[0].label} − ${points[1].label}| = ${formatNumber(dist)}`;
	}

	const describeNumberline = (): string => {
		const lines: string[] = [
			t("askTeacherNumberlineRange", {
				min: formatNumber(min),
				max: formatNumber(max),
			}),
		];
		if (block.caption) {
			lines.push(
				t("askTeacherNumberlineCaption", {
					caption: block.caption,
				}),
			);
		}
		lines.push(...readouts);
		if (distanceReadout) {
			lines.push(distanceReadout);
		}
		return lines.join("\n");
	};

	return (
		<div className="island-predict-card island-numberline-card">
			<div className="island-predict-badge">
				<span className="island-predict-badge-icon" aria-hidden="true">
					📏
				</span>
				<span>数轴探索</span>
			</div>

			{block.caption && (
				<div className="island-numberline-caption">{block.caption}</div>
			)}

			<div className="island-numberline-svg-wrap">
				<svg
					ref={svgRef}
					className="island-numberline-svg"
					viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
					width="100%"
					preserveAspectRatio="xMidYMid meet"
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
				>
					{/* Axis line */}
					<line
						x1={paddingX - 16}
						y1={axisY}
						x2={viewBoxWidth - paddingX + 16}
						y2={axisY}
						stroke="#725d42"
						strokeWidth={2}
						strokeLinecap="round"
					/>
					{/* Positive direction arrow */}
					<polygon
						points={`${viewBoxWidth - paddingX + 22},${axisY} ${viewBoxWidth - paddingX + 13},${axisY - 5} ${viewBoxWidth - paddingX + 13},${axisY + 5}`}
						fill="#725d42"
					/>

					{/* Half step minor ticks */}
					{halfTicks.map((v) => (
						<line
							key={`half-${v}`}
							x1={toSvgX(v)}
							y1={axisY - 3}
							x2={toSvgX(v)}
							y2={axisY + 3}
							stroke="#dfcfad"
							strokeWidth={1}
						/>
					))}

					{/* Integer ticks */}
					{ticks.map((v) => {
						const isOrigin = v === 0;
						const x = toSvgX(v);
						return (
							<g key={`tick-${v}`}>
								<line
									x1={x}
									y1={isOrigin ? axisY - 7 : axisY - 4}
									x2={x}
									y2={isOrigin ? axisY + 7 : axisY + 4}
									stroke={isOrigin ? "#543d22" : "#a39073"}
									strokeWidth={isOrigin ? 2.5 : 1.5}
								/>
								<text
									x={x}
									y={axisY + 18}
									textAnchor="middle"
									className="island-numberline-tick-label"
									style={{
										fontWeight: isOrigin ? "bold" : "normal",
										fill: isOrigin ? "#543d22" : "#8a6d4b",
									}}
								>
									{formatNumber(v)}
								</text>
							</g>
						);
					})}

					{/* Opposite numbers: symmetric arcs and dashed dots */}
					{showOpposite &&
						points.map((p, idx) => {
							if (p.value === 0) return null;
							const color = POINT_COLORS[idx % POINT_COLORS.length].main;
							const xCur = toSvgX(p.value);
							const xOpp = toSvgX(-p.value);
							const xOrigin = toSvgX(0);
							const arcH = Math.min(
								46,
								14 + (Math.abs(p.value) / span) * 40,
							);

							return (
								<g key={`opp-${p.label}`}>
									{/* Symmetric arc */}
									<path
										d={`M ${xCur} ${axisY - 9} Q ${xOrigin} ${axisY - 9 - arcH * 2} ${xOpp} ${axisY - 9}`}
										fill="none"
										stroke={color}
										strokeWidth={1.5}
										strokeDasharray="4 3"
										opacity={0.85}
									/>
									{/* Dashed dot at opposite position */}
									<circle
										cx={xOpp}
										cy={axisY}
										r={7}
										fill="#fffdf8"
										stroke={color}
										strokeWidth={2}
										strokeDasharray="3 3"
									/>
									<text
										x={xOpp}
										y={axisY - 12}
										textAnchor="middle"
										fill={color}
										fontSize="12"
										fontWeight="600"
									>
										{`−${p.label}`}
									</text>
								</g>
							);
						})}

					{/* Absolute value bars */}
					{showAbs &&
						points.map((p, idx) => {
							const color = POINT_COLORS[idx % POINT_COLORS.length].main;
							const x1 = Math.min(toSvgX(0), toSvgX(p.value));
							const x2 = Math.max(toSvgX(0), toSvgX(p.value));
							const y = axisY + 28 + idx * 16;
							return (
								<g key={`abs-${p.label}`}>
									<line
										x1={x1}
										y1={y}
										x2={x2}
										y2={y}
										stroke={color}
										strokeWidth={2}
										strokeLinecap="round"
									/>
									<line
										x1={x1}
										y1={y - 3}
										x2={x1}
										y2={y + 3}
										stroke={color}
										strokeWidth={2}
									/>
									<line
										x1={x2}
										y1={y - 3}
										x2={x2}
										y2={y + 3}
										stroke={color}
										strokeWidth={2}
									/>
									<text
										x={(x1 + x2) / 2}
										y={y + 11}
										textAnchor="middle"
										fill={color}
										fontSize="11"
										fontWeight="600"
									>
										{`|${p.label}| = ${formatNumber(Math.abs(p.value))}`}
									</text>
								</g>
							);
						})}

					{/* Distance bar between two points */}
					{showDistance && points.length === 2 && (
						<g key="distance-bar">
							{(() => {
								const x1 = Math.min(toSvgX(points[0].value), toSvgX(points[1].value));
								const x2 = Math.max(toSvgX(points[0].value), toSvgX(points[1].value));
								const y = axisY + 28 + (showAbs ? points.length * 16 : 0);
								const dist = Math.abs(points[0].value - points[1].value);
								return (
									<>
										<line
											x1={x1}
											y1={y}
											x2={x2}
											y2={y}
											stroke="#794f27"
											strokeWidth={2}
											strokeLinecap="round"
										/>
										<line
											x1={x1}
											y1={y - 3}
											x2={x1}
											y2={y + 3}
											stroke="#794f27"
											strokeWidth={2}
										/>
										<line
											x1={x2}
											y1={y - 3}
											x2={x2}
											y2={y + 3}
											stroke="#794f27"
											strokeWidth={2}
										/>
										<text
											x={(x1 + x2) / 2}
											y={y + 11}
											textAnchor="middle"
											fill="#794f27"
											fontSize="11"
											fontWeight="600"
										>
											{`|${points[0].label} − ${points[1].label}| = ${formatNumber(dist)}`}
										</text>
									</>
								);
							})()}
						</g>
					)}

					{/* Draggable point handles */}
					{points.map((p, idx) => {
						const color = POINT_COLORS[idx % POINT_COLORS.length];
						const cx = toSvgX(p.value);
						const isFocused = focusedIndex === idx;
						const isDragging = activeDragIndex === idx;

						return (
							<g
								key={`point-${p.label}`}
								className="island-numberline-handle"
								tabIndex={0}
								role="slider"
								aria-label={`点 ${p.label}，数值 ${formatNumber(p.value)}`}
								aria-valuemin={min}
								aria-valuemax={max}
								aria-valuenow={p.value}
								style={{ cursor: isDragging ? "grabbing" : "grab", outline: "none" }}
								onPointerDown={(e) => handlePointerDown(idx, e)}
								onPointerUp={handlePointerUp}
								onFocus={() => setFocusedIndex(idx)}
								onBlur={() => setFocusedIndex(null)}
								onKeyDown={(e) => handleKeyDown(idx, e)}
							>
								{/* Focus / hover halo */}
								{(isFocused || isDragging) && (
									<circle
										cx={cx}
										cy={axisY}
										r={15}
										fill="none"
										stroke="#19c8b9"
										strokeWidth={2.5}
										opacity={0.8}
									/>
								)}
								{/* Outer handle */}
								<circle
									cx={cx}
									cy={axisY}
									r={9}
									fill={color.main}
									stroke="#ffffff"
									strokeWidth={2}
									style={{
										filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
										transition: isDragging ? "none" : "cx 0.05s ease-out",
									}}
								/>
								{/* Inner center dot */}
								<circle cx={cx} cy={axisY} r={3} fill="#ffffff" />
								{/* Point label above handle */}
								<text
									x={cx}
									y={axisY - 14}
									textAnchor="middle"
									fill={color.dark}
									fontSize="13"
									fontWeight="bold"
								>
									{p.label}
								</text>
							</g>
						);
					})}
				</svg>
			</div>

			<div className="island-numberline-readout" aria-live="polite">
				{readouts.map((r, i) => (
					<div key={i} className="island-numberline-readout-item">
						{r}
					</div>
				))}
				{distanceReadout && (
					<div className="island-numberline-readout-item distance">
						{distanceReadout}
					</div>
				)}
			</div>

			<div className="island-numberline-footer">
				<IslandAskTeacher kind="numberline" describe={describeNumberline} />
				{isModified && (
					<button
						type="button"
						className="island-numberline-reset-btn"
						onClick={handleReset}
					>
						复位
					</button>
				)}
			</div>
		</div>
	);
}
