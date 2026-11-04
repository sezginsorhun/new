"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type ActionState } from "@/actions/newsletter";

export default function NewsletterForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    subscribeNewsletter,
    null,
  );

  return (
    <form action={action} className="md:justify-self-end md:w-full md:max-w-[420px]">
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="E-posta adresin"
          aria-label="E-posta adresin"
          className="field"
        />
        <button type="submit" disabled={pending} className="btn-primary shrink-0">
          {pending ? "..." : "Katıl"}
        </button>
      </div>
      {state && (
        <p
          role="status"
          className={`mt-2 text-[12px] ${
            state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
