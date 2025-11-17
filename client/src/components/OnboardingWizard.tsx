import React, { useEffect, useMemo, useState } from "react";
import { useStore, Profile } from "../state/store";
import { subscribeToWizardOpen } from "../lib/wizardSignals";

const incomeRanges = ["< $50k", "$50k-$100k", "$100k-$200k", "$200k+"];
const goals = ["Pay off debt", "Save an emergency fund", "Invest for growth", "Plan for retirement"];
const riskLevels = ["Conservative", "Balanced", "Aggressive"];
const experienceLevels = ["Beginner", "Intermediate", "Advanced"];

type Phase = "hidden" | "enter" | "exit";
type PortalPhase = "idle" | "charge" | "warp";

export function OnboardingWizard() {
  const { state, updateProfile } = useStore();
  const baseProfile = useMemo<Profile>(
    () =>
      state.profile || {
        incomeRange: "$50k-$100k",
        goalFocus: "Save an emergency fund",
        riskComfort: "Balanced",
        experience: "Beginner",
        onboardingComplete: false,
      },
    [state.profile]
  );

  const [form, setForm] = useState<Profile>(baseProfile);
  const [renderWizard, setRenderWizard] = useState(!state.profile?.onboardingComplete);
  const [phase, setPhase] = useState<Phase>(!state.profile?.onboardingComplete ? "enter" : "hidden");
  const [portalPhase, setPortalPhase] = useState<PortalPhase>("idle");
  const [step, setStep] = useState(0);

  const stages = [
    {
      id: "intent",
      title: "Shape the mission",
      subtitle: "Tell us how bold InvestMate should be when it nudges you.",
      chips: ["Goal-led", "Tone controls", "AI prompt"],
      content: (
        <>
          <label>
            Primary goal
            <select value={form.goalFocus} onChange={(e) => setForm({ ...form, goalFocus: e.target.value })}>
              {goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </label>
          <label>
            Risk comfort
            <select value={form.riskComfort} onChange={(e) => setForm({ ...form, riskComfort: e.target.value })}>
              {riskLevels.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </label>
        </>
      ),
    },
    {
      id: "context",
      title: "Add some context",
      subtitle: "We scale the suggested budgets and AI tone to your background.",
      chips: ["Income lens", "Experience-aware"],
      content: (
        <>
          <label>
            Income range
            <select value={form.incomeRange} onChange={(e) => setForm({ ...form, incomeRange: e.target.value })}>
              {incomeRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </label>
          <label>
            Investing experience
            <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </label>
        </>
      ),
    },
  ];

  const totalSteps = stages.length;
  const isLastStep = step === totalSteps - 1;

  useEffect(() => {
    setForm(baseProfile);
  }, [baseProfile]);

  useEffect(() => {
    if (!state.profile?.onboardingComplete) {
      openWizard();
    }
  }, [state.profile]);

  useEffect(() => subscribeToWizardOpen(() => openWizard()), [baseProfile]);

  useEffect(() => {
    if (!renderWizard) return;
    const id = requestAnimationFrame(() => setPhase("enter"));
    return () => cancelAnimationFrame(id);
  }, [renderWizard]);

  useEffect(() => {
    if (phase === "hidden") {
      document.body.classList.remove("wizard-active");
    } else {
      document.body.classList.add("wizard-active");
    }
    return () => document.body.classList.remove("wizard-active");
  }, [phase]);

  if (!renderWizard && phase === "hidden") return null;

  function openWizard() {
    setForm(baseProfile);
    setStep(0);
    setPortalPhase("idle");
    setRenderWizard(true);
    requestAnimationFrame(() => setPhase("enter"));
  }

  function finalizeClose() {
    setRenderWizard(false);
    setPhase("hidden");
    setPortalPhase("idle");
  }

  function closeWizard(throughPortal = false) {
    setPhase("exit");
    if (throughPortal) {
      setPortalPhase("warp");
      window.setTimeout(finalizeClose, 1000);
    } else {
      window.setTimeout(finalizeClose, 600);
    }
  }

  async function save() {
    setPortalPhase("charge");
    await updateProfile({ ...form, onboardingComplete: true });
    setTimeout(() => closeWizard(true), 240);
  }

  return (
    <div className={`wizard-overlay ${phase !== "hidden" ? "show" : ""} ${phase === "exit" ? "exit" : ""}`}>
      <div className={`wizard-portal ${portalPhase}`}></div>
      <div className="wizard-aurora">
        <span />
        <span />
        <span />
      </div>
      <div className={`wizard-card ${phase}`}>
        <div className="wizard-orbit">
          <span />
          <span />
        </div>
        <div className="wizard-constellation">
          <span />
          <span />
          <span />
        </div>

        <div className="wizard-headline">
          <div>
            <p className="eyebrow">Personalize AI InvestMate</p>
            <h3>Step {step + 1} of {totalSteps}</h3>
            <p className="muted">
              These preferences fuel the budgeting heuristics and AI tone. You can revisit them from the profile tab anytime.
            </p>
          </div>
          <div className="wizard-stepper">
            {stages.map((stageDef, idx) => (
              <span key={stageDef.id} className={`${idx === step ? "active" : idx < step ? "done" : ""}`}></span>
            ))}
          </div>
        </div>

        <div className="wizard-stage-shell">
          <div className="wizard-stage-track" style={{ transform: `translateX(-${step * 100}%)` }}>
            {stages.map((stageDef) => (
              <div className="wizard-stage" key={stageDef.id}>
                <div>
                  <small className="muted tiny">{stageDef.id}</small>
                  <h4>{stageDef.title}</h4>
                  <p className="muted">{stageDef.subtitle}</p>
                  <div className="wizard-chips">
                    {stageDef.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                </div>
                <div className="wizard-stage-fields">{stageDef.content}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="wizard-actions">
          <button className="ghost" onClick={() => closeWizard(false)}>
            Maybe later
          </button>
          {step > 0 && (
            <button className="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Back
            </button>
          )}
          {!isLastStep && (
            <button className="btn" onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}>
              Next
            </button>
          )}
          {isLastStep && (
            <button className="btn" onClick={save}>
              Save & launch dashboard
            </button>
          )}
        </div>
        <p className="muted tiny">Need to tweak later? Head to Profile → "Edit personalization".</p>
      </div>
    </div>
  );
}
