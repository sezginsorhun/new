"use client";

import { useActionState } from "react";
import { sendContactMessage, type ActionState } from "@/actions/newsletter";

export default function ContactForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    sendContactMessage,
    null,
  );

  return (
    <form action={action} className="card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="contact-name">Ad Soyad *</label>
          <input id="contact-name" name="name" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="contact-email">E-posta *</label>
          <input id="contact-email" name="email" type="email" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="contact-phone">Telefon</label>
          <input id="contact-phone" name="phone" type="tel" className="field" placeholder="05XXXXXXXXX" />
        </div>
        <div>
          <label className="label" htmlFor="contact-subject">Konu *</label>
          <input id="contact-subject" name="subject" required className="field" />
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="contact-message">Mesajın *</label>
        <textarea id="contact-message" name="message" rows={6} required className="field" />
      </div>

      <button type="submit" disabled={pending} className="btn-primary mt-5">
        {pending ? "Gönderiliyor..." : "Mesajı Gönder"}
      </button>

      {state && (
        <p
          role="status"
          className={`mt-3 text-[13px] ${
            state.ok ? "text-[color:var(--color-success)]" : "text-[color:var(--color-sale)]"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
