import type { Metadata } from "next";
import { ScoutForm } from "./scout-form";

export const metadata: Metadata = { title: "pre-shoot intel" };

export default function ScoutPage() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="max-w-[780px] mx-auto px-8 py-16">
      <h1 className="font-display-ornate text-3xl text-zora-amber mb-2">
        pre-shoot intelligence
      </h1>
      <p className="text-mist-dim mb-8">
        Enter a location and date to get AI scouting intel for your next expedition.
      </p>
      {hasApiKey ? (
        <ScoutForm />
      ) : (
        <p className="text-mist-dim">
          Set ANTHROPIC_API_KEY to enable AI scouting.
        </p>
      )}
    </div>
  );
}
