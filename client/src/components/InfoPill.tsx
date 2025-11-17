import React from "react";
import { concepts } from "@shared/concepts";

type Props = { term: string };

export function InfoPill({ term }: Props) {
  const concept = concepts.find((c) => c.term === term || c.aliases?.includes(term));
  if (!concept) return null;
  return (
    <span className="info-pill" title={concept.description}>
      {concept.term}
    </span>
  );
}
