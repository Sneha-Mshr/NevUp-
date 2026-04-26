"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SessionSummary, EmotionalState, DebriefInput } from "@/types";
import CoachingStream from "./CoachingStream";
import styles from "./DebriefFlow.module.css";

interface Props {
  session: SessionSummary;
  onComplete: () => void;
}

const EMOTIONS: EmotionalState[] = ["calm", "anxious", "greedy", "fearful", "neutral"];
const STEPS = ["Trade Replay", "Emotional Tagging", "Plan Adherence", "AI Coaching", "Key Takeaway"];

export default function DebriefFlow({ session, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [emotionalTags, setEmotionalTags] = useState<Record<string, EmotionalState>>({});
  const [adherenceRating, setAdherenceRating] = useState(3);
  const [takeaway, setTakeaway] = useState("");
  const [coachingDone, setCoachingDone] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepRef.current?.focus();
  }, [step]);

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0: return true; // trade replay — just review
      case 1: return Object.keys(emotionalTags).length === session.trades.length;
      case 2: return true;
      case 3: return coachingDone;
      case 4: return takeaway.trim().length > 0;
      default: return false;
    }
  }, [step, emotionalTags, session.trades.length, coachingDone, takeaway]);

  function handleNext() {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleSubmit() {
    // POST to /sessions/:id/debrief per OpenAPI DebriefInput schema
    const dominantMood = Object.values(emotionalTags).reduce(
      (acc, emo) => {
        acc[emo] = (acc[emo] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const overallMood = (Object.entries(dominantMood).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral") as EmotionalState;

    const payload: DebriefInput = {
      overallMood,
      keyMistake: null,
      keyLesson: takeaway || null,
      planAdherenceRating: adherenceRating,
      willReviewTomorrow: true,
    };

    console.log("Debrief submitted:", { sessionId: session.sessionId, payload });
    onComplete();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && canAdvance() && step < 4) {
      e.preventDefault();
      handleNext();
    }
  }

  return (
    <div className={styles.container} onKeyDown={handleKeyDown}>
      {/* Progress bar */}
      <div className={styles.progress} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={5}>
        {STEPS.map((label, i) => (
          <div key={i} className={`${styles.progressStep} ${i <= step ? styles.progressActive : ""}`}>
            <div className={styles.progressDot}>{i < step ? "✓" : i + 1}</div>
            <span className={styles.progressLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div ref={stepRef} tabIndex={-1} className={`${styles.stepContent} step-enter`} key={step}>
        {step === 0 && (
          <StepTradeReplay session={session} />
        )}
        {step === 1 && (
          <StepEmotionalTagging
            session={session}
            tags={emotionalTags}
            onTag={(tradeId, emotion) =>
              setEmotionalTags((prev) => ({ ...prev, [tradeId]: emotion }))
            }
          />
        )}
        {step === 2 && (
          <StepPlanAdherence
            rating={adherenceRating}
            onRate={setAdherenceRating}
          />
        )}
        {step === 3 && (
          <StepCoaching
            sessionId={session.sessionId}
            onDone={() => setCoachingDone(true)}
          />
        )}
        {step === 4 && (
          <StepTakeaway
            value={takeaway}
            onChange={setTakeaway}
          />
        )}
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          onClick={handleBack}
          disabled={step === 0}
          aria-label="Previous step"
        >
          ← Back
        </button>
        <span className={styles.stepIndicator}>
          Step {step + 1} of 5
        </span>
        <button
          className={`${styles.navBtn} ${styles.navBtnPrimary}`}
          onClick={handleNext}
          disabled={!canAdvance()}
          aria-label={step === 4 ? "Submit debrief" : "Next step"}
        >
          {step === 4 ? "Submit ✓" : "Next →"}
        </button>
      </div>
    </div>
  );
}

/* Step 1: Trade Replay */
function StepTradeReplay({ session }: { session: SessionSummary }) {
  return (
    <div>
      <h2 className={styles.stepTitle}>Trade Replay</h2>
      <p className={styles.stepDesc}>Review your trades from this session</p>
      <div className={styles.tradeList}>
        {session.trades.map((trade) => (
          <div key={trade.tradeId} className={styles.tradeItem}>
            <div className={styles.tradeTop}>
              <span className={styles.tradeAsset}>{trade.asset}</span>
              <span className={`${styles.tradeDir} ${trade.direction === "long" ? styles.long : styles.short}`}>
                {trade.direction.toUpperCase()}
              </span>
              <span className={`${styles.tradePnl} ${(trade.pnl || 0) >= 0 ? styles.pnlPos : styles.pnlNeg}`}>
                {(trade.pnl || 0) >= 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.tradeBottom}>
              <span>Entry: ${trade.entryPrice}</span>
              <span>Exit: {trade.exitPrice ? `$${trade.exitPrice}` : "—"}</span>
              <span>Qty: {trade.quantity}</span>
            </div>
            {trade.entryRationale && (
              <p className={styles.tradeRationale}>"{trade.entryRationale}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* Step 2: Emotional Tagging */
function StepEmotionalTagging({
  session,
  tags,
  onTag,
}: {
  session: SessionSummary;
  tags: Record<string, EmotionalState>;
  onTag: (tradeId: string, emotion: EmotionalState) => void;
}) {
  return (
    <div>
      <h2 className={styles.stepTitle}>Emotional Tagging</h2>
      <p className={styles.stepDesc}>Tag how you felt during each trade</p>
      <div className={styles.tagList}>
        {session.trades.map((trade) => (
          <div key={trade.tradeId} className={styles.tagItem}>
            <div className={styles.tagTradeInfo}>
              <span className={styles.tradeAsset}>{trade.asset}</span>
              <span className={`${styles.tradePnl} ${(trade.pnl || 0) >= 0 ? styles.pnlPos : styles.pnlNeg}`}>
                {(trade.pnl || 0) >= 0 ? "+" : ""}${(trade.pnl || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.emotionBtns} role="radiogroup" aria-label={`Emotion for ${trade.asset} trade`}>
              {EMOTIONS.map((emo) => (
                <button
                  key={emo}
                  role="radio"
                  aria-checked={tags[trade.tradeId] === emo}
                  className={`${styles.emotionBtn} ${tags[trade.tradeId] === emo ? styles.emotionBtnActive : ""}`}
                  style={tags[trade.tradeId] === emo ? { borderColor: `var(--${emo})`, color: `var(--${emo})` } : {}}
                  onClick={() => onTag(trade.tradeId, emo)}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Step 3: Plan Adherence */
function StepPlanAdherence({
  rating,
  onRate,
}: {
  rating: number;
  onRate: (r: number) => void;
}) {
  return (
    <div className={styles.centered}>
      <h2 className={styles.stepTitle}>Plan Adherence</h2>
      <p className={styles.stepDesc}>How well did you stick to your trading plan?</p>
      <div className={styles.ratingGroup} role="radiogroup" aria-label="Plan adherence rating">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            role="radio"
            aria-checked={rating === val}
            className={`${styles.ratingBtn} ${rating === val ? styles.ratingBtnActive : ""}`}
            onClick={() => onRate(val)}
          >
            <span className={styles.ratingNum}>{val}</span>
            <span className={styles.ratingLabel}>
              {val === 1 ? "Poor" : val === 2 ? "Below" : val === 3 ? "Average" : val === 4 ? "Good" : "Excellent"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Step 4: AI Coaching */
function StepCoaching({
  sessionId,
  onDone,
}: {
  sessionId: string;
  onDone: () => void;
}) {
  return (
    <div>
      <h2 className={styles.stepTitle}>AI Coaching</h2>
      <p className={styles.stepDesc}>Your personalized coaching insight</p>
      <CoachingStream sessionId={sessionId} onDone={onDone} />
    </div>
  );
}

/* Step 5: Key Takeaway */
function StepTakeaway({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.centered}>
      <h2 className={styles.stepTitle}>Key Takeaway</h2>
      <p className={styles.stepDesc}>What's the one thing you'll remember from this session?</p>
      <textarea
        className={styles.takeawayInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your key takeaway..."
        maxLength={500}
        rows={4}
        aria-label="Key takeaway from this session"
        autoFocus
      />
      <span className={styles.charCount}>{value.length}/500</span>
    </div>
  );
}
