import React from "react";
import { Sparkles } from "lucide-react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: "solid" | "ghost";
}

export function AskAIButton({ label = "Ask AI", variant = "solid", className = "", ...buttonProps }: Props) {
  return (
    <button
      {...buttonProps}
      className={`ask-ai ${variant === "ghost" ? "ghost" : ""} ${className}`.trim()}
    >
      <Sparkles size={16} aria-hidden style={{ marginRight: 6 }} />
      <span>{label}</span>
    </button>
  );
}
