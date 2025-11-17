import React, { useEffect, useMemo, useState } from "react";
import { useStore, Profile } from "../state/store";
import { subscribeToWizardOpen } from "../lib/wizardSignals";

const incomeRanges = ["< $50k", "$50k-$100k", "$100k-$200k", "$200k+"];
const goals = ["Pay off debt", "Save an emergency fund", "Invest for growth", "Plan for retirement"];
const riskLevels = ["Conservative", "Balanced", "Aggressive"];
const experienceLevels = ["Beginner", "Intermediate", "Advanced"];

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
  const [phase, setPhase] = useState<'hidden' | 'enter' | 'exit'>(!state.profile?.onboardingComplete ? 'enter' : 'hidden');

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
    const id = requestAnimationFrame(() => setPhase('enter'));
    return () => cancelAnimationFrame(id);
  }, [renderWizard]);

  if (!renderWizard && phase === 'hidden') return null;

  function openWizard() {
    setForm(baseProfile);
    setRenderWizard(true);
    requestAnimationFrame(() => setPhase('enter'));
  }

  function closeWizard() {
    setPhase('exit');
    window.setTimeout(() => {
      setRenderWizard(false);
      setPhase('hidden');
    }, 600);
  }

  async function save() {
    await updateProfile({ ...form, onboardingComplete: true });
    closeWizard();
  }

  return (
    <div className={`wizard-overlay ${phase !== 'hidden' ? 'show' : ''} ${phase === 'exit' ? 'exit' : ''}`}>
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
        <h3>Welcome! Let’s personalize InvestMate</h3>
        <p className="muted">
          These answers tune your budgets, default goals, and the AI system prompt. You can edit them anytime from your profile.
        </p>
        <p className="muted tiny">Tap “Edit personalization” in your profile to revisit this flow.</p>
        <div className="wizard-grid">
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
        </div>
        <div className="wizard-actions">
          <button className="ghost" onClick={closeWizard}>
            Maybe later
          </button>
          <button className="btn" onClick={save}>
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
