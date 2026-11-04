import { useState } from "react";
import IslandAskTeacher, { t } from "./IslandAskTeacher";

export interface IslandPredictProps {
	block: {
		question: string;
		choices: string[] | null;
		answer: string;
		explain: string;
	};
}

function renderInline(text: string) {
	if (!text) return null;
	const parts = text.split(/(`[^`]+`)/g);
	return parts.map((part, index) => {
		if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
			return (
				<code key={index} className="island-predict-code">
					{part.slice(1, -1)}
				</code>
			);
		}
		return part;
	});
}

export default function IslandPredict({ block }: IslandPredictProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const [revealed, setRevealed] = useState(false);

	const hasChoices = Array.isArray(block.choices) && block.choices.length > 0;
	const isCorrect = selected !== null && selected === block.answer;

	const handleSelect = (choice: string) => {
		if (revealed) return;
		setSelected(choice);
		setRevealed(true);
	};

	const handleReveal = () => {
		setRevealed(true);
	};

	const handleReset = () => {
		setSelected(null);
		setRevealed(false);
	};

	const describePredict = (): string => {
		if (hasChoices) {
			const result = isCorrect
				? t("askTeacherPredictCorrect")
				: t("askTeacherPredictWrong");
			return t("askTeacherPredictChoice", {
				question: block.question,
				prediction: selected ?? "",
				answer: block.answer,
				result,
			});
		}
		return t("askTeacherPredictOpen", {
			question: block.question,
			answer: block.answer,
		});
	};

	return (
		<div className="island-predict-card" data-revealed={revealed ? "1" : "0"}>
			<div className="island-predict-badge">
				<span>{t("predictBadge")}</span>
			</div>

			<div className="island-predict-question">
				{renderInline(block.question)}
			</div>

			{hasChoices ? (
				<div
					className="island-predict-choices"
					role="group"
					aria-label={t("predictChoicesAria")}
				>
					{block.choices!.map((choice, index) => {
						let stateClass = "island-predict-choice";
						if (revealed) {
							if (choice === block.answer) {
								stateClass += " is-answer";
							} else if (choice === selected) {
								stateClass += " is-wrong";
							} else {
								stateClass += " is-dimmed";
							}
						}

						return (
							<button
								key={index}
								type="button"
								className={stateClass}
								onClick={() => handleSelect(choice)}
								disabled={revealed}
								aria-pressed={selected === choice}
							>
								<span className="island-predict-choice-dot" aria-hidden="true" />
								<span className="island-predict-choice-text">
									{renderInline(choice)}
								</span>
								{revealed && choice === block.answer && (
									<span className="island-predict-choice-tag correct">
										{t("predictTagCorrect")}
									</span>
								)}
								{revealed && choice === selected && choice !== block.answer && (
									<span className="island-predict-choice-tag wrong">
										{t("predictTagYourGuess")}
									</span>
								)}
							</button>
						);
					})}
				</div>
			) : !revealed ? (
				<div className="island-predict-action">
					<button
						type="button"
						className="island-predict-submit-btn"
						onClick={handleReveal}
					>
						{t("predictRevealBtn")}
					</button>
				</div>
			) : null}

			<div className="island-predict-reveal-wrap" aria-live="polite">
				{revealed && (
					<div className="island-predict-reveal">
						<div
							className={`island-predict-feedback ${
								hasChoices
									? isCorrect
										? "feedback-correct"
										: "feedback-wrong"
									: "feedback-info"
							}`}
						>
							{hasChoices ? (
								isCorrect ? (
									<span>{t("predictFeedbackCorrect")}</span>
								) : (
									<span>
										{t("predictFeedbackWrong")}{" "}
										<strong>{renderInline(block.answer)}</strong>
									</span>
								)
							) : (
								<span>
									{t("predictFeedbackOpen")}{" "}
									<strong>{renderInline(block.answer)}</strong>
								</span>
							)}
						</div>

						<div className="island-predict-explain">
							<div className="island-predict-explain-label">
								{t("predictExplainLabel")}
							</div>
							<div className="island-predict-explain-body">
								{renderInline(block.explain)}
							</div>
						</div>

						<div className="island-predict-footer">
							<IslandAskTeacher kind="predict" describe={describePredict} />
							<button
								type="button"
								className="island-predict-reset-btn"
								onClick={handleReset}
							>
								{t("predictResetBtn")}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
