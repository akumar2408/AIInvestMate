import React, { useEffect, useState } from "react";
import { useStore, Profile } from "../state/store";

const incomeRanges = ["< $50k", "$50k-$100k", "$100k-$200k", "$200k+"];
const goals = ["Pay off debt", "Save an emergency fund", "Invest for growth", "Plan for retirement"];
const riskLevels = ["Conservative", "Balanced", "Aggressive"];
const experienceLevels = ["Beginner", "Intermediate", "Advanced"];

export function OnboardingWizard() {
  const { state, updateProfile } = useStore();
  const [open, setOpen] = useState(!state.profile?.onboardingComplete);
  const [form, setForm] = useState<Profile>(() =>
    state.profile || {
      incomeRange: "$50k-$100k",
      goalFocus: "Save an emergency fund",
      riskComfort: "Balanced",
      experience: "Beginner",
      onboardingComplete: false,
    }
  );

  useEffect(() => {
    if (!state.profile?.onboardingComplete) {
      setOpen(true);
    }
  }, [state.profile]);

  if (!open) return null;

  function save() {
    updateProfile({ ...form, onboardingComplete: true });
    setOpen(false);
  }

  return (
    <div className="wizard-overlay">
      <div className="wizard-card">
        <h3>Welcome! Let’s personalize InvestMate</h3>
        <p className="muted">
          These answers tune your budgets, default goals, and the AI system prompt. You can edit them anytime from your profile.
        </p>
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
          <button className="ghost" onClick={() => setOpen(false)}>
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
