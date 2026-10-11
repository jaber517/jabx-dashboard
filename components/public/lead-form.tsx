"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { leadPackages, leadSectors, leadTimings } from "@/lib/services";

// Posts a quote request as JSON to the lead Worker (see its README for the contract).
// The rules mirror the Worker's validateLead so visitors see problems before sending.
type Field = "name" | "company" | "sector" | "email" | "phone" | "package" | "problem" | "timing";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9\s\-()]{7,20}$/;
const empty: Values = { name: "", company: "", sector: "", email: "", phone: "", package: "", problem: "", timing: "" };
const order: Field[] = ["name", "company", "sector", "email", "phone", "package", "problem", "timing"];

function check(field: Field, raw: string): string | undefined {
  const value = raw.trim();
  switch (field) {
    case "name": return value.length < 2 ? "Please enter your name." : value.length > 100 ? "Please keep this under 100 characters." : undefined;
    case "company": return value.length < 2 ? "Please enter your company's name." : value.length > 150 ? "Please keep this under 150 characters." : undefined;
    case "email": return !EMAIL.test(value) || value.length > 254 ? "Please enter a valid email address." : undefined;
    case "phone": return value && !PHONE.test(value) ? "Please enter a valid phone number, or leave it empty." : undefined;
    case "problem": return value.length < 20 ? "Please write at least 20 characters so we understand the problem." : value.length > 4000 ? "Please keep this under 4,000 characters." : undefined;
    case "sector": return leadSectors.includes(value) ? undefined : "Please choose a sector.";
    case "package": return leadPackages.some((item) => item.value === value) ? undefined : "Please choose a package.";
    case "timing": return leadTimings.includes(value) ? undefined : "Please choose a timing.";
  }
}

export function LeadForm({ action }: { action: string }) {
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [failure, setFailure] = useState<"" | "busy" | "failed">("");
  const formRef = useRef<HTMLFormElement>(null);
  const thanksRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  // Links from /services carry the chosen package.
  useEffect(() => {
    const chosen = new URLSearchParams(window.location.search).get("package");
    if (chosen && leadPackages.some((item) => item.value === chosen)) setValues((current) => ({ ...current, package: chosen }));
  }, []);

  useEffect(() => { if (status === "sent") thanksRef.current?.focus(); }, [status]);

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (touched[field]) setErrors((current) => ({ ...current, [field]: check(field, value) }));
  }

  function leave(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: check(field, values[field]) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Errors = {};
    for (const field of order) found[field] = check(field, values[field]);
    setErrors(found);
    setTouched(Object.fromEntries(order.map((field) => [field, true])));
    const firstInvalid = order.find((field) => found[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("sending");
    setFailure("");
    const website = (formRef.current?.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    const lead = Object.fromEntries(order.map((field) => [field, values[field].trim()]));
    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, website })
      });
      if (!response.ok) {
        // Field errors from the Worker, in case its rules ever move ahead of these.
        if (response.status === 400) {
          const body = await response.json().catch(() => null) as { fields?: Errors } | null;
          if (body?.fields) setErrors(body.fields);
        }
        throw new Error(response.status === 429 ? "busy" : "failed");
      }
      setStatus("sent");
    } catch (error) {
      setFailure(error instanceof Error && error.message === "busy" ? "busy" : "failed");
      setStatus("idle");
      requestAnimationFrame(() => summaryRef.current?.focus());
    }
  }

  function reset() {
    setValues(empty);
    setErrors({});
    setTouched({});
    setFailure("");
    setStatus("idle");
  }

  if (status === "sent") {
    return <div className="public-form-thanks" role="status">
      <h3 ref={thanksRef} tabIndex={-1}>Thank you. Your request is in.</h3>
      <p>Jaber reads every request and will get back to you by email or phone to talk it through.</p>
      <button type="button" className="public-button-secondary" onClick={reset}>Send another request</button>
    </div>;
  }

  const describe = (field: Field) => errors[field] ? `lead-${field}-error` : undefined;
  const error = (field: Field) => errors[field] ? <p id={`lead-${field}-error`} className="public-field-error">{errors[field]}</p> : null;
  const input = (field: Field, label: string, type = "text", autoComplete?: string, optional = false) => <div className="public-field">
    <label htmlFor={`lead-${field}`}>{label}{optional ? <span> (optional)</span> : null}</label>
    <input id={`lead-${field}`} name={field} type={type} autoComplete={autoComplete} value={values[field]} required={!optional} aria-invalid={errors[field] ? true : undefined} aria-describedby={describe(field)} onChange={(event) => update(field, event.target.value)} onBlur={() => leave(field)} />
    {error(field)}
  </div>;
  const select = (field: Field, label: string, options: { value: string; label: string }[]) => <div className="public-field">
    <label htmlFor={`lead-${field}`}>{label}</label>
    <select id={`lead-${field}`} name={field} value={values[field]} required aria-invalid={errors[field] ? true : undefined} aria-describedby={describe(field)} onChange={(event) => update(field, event.target.value)} onBlur={() => leave(field)}>
      <option value="" disabled>Choose one</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {error(field)}
  </div>;
  const asOptions = (list: string[]) => list.map((value) => ({ value, label: value }));

  return <form ref={formRef} className="public-form" onSubmit={submit} noValidate aria-label="Request a quote">
    {failure ? <p ref={summaryRef} tabIndex={-1} className="public-form-alert" role="alert">
      {failure === "busy" ? "We've had a lot of requests from your connection in the last hour. " : "We couldn't send your request just now. "}
      Please try again later, or email <a href="mailto:contact@jabx.me">contact@jabx.me</a>.
    </p> : null}
    {/* Left empty by people; bots that fill every field are dropped by the Worker. */}
    <div className="public-honeypot" aria-hidden="true">
      <label htmlFor="lead-website">Leave this field blank</label>
      <input id="lead-website" name="website" type="text" autoComplete="off" tabIndex={-1} defaultValue="" />
    </div>
    <div className="public-form-grid">
      {input("name", "Your name", "text", "name")}
      {input("company", "Company", "text", "organization")}
      {select("sector", "Sector", asOptions(leadSectors))}
      {select("package", "Which package?", leadPackages)}
      {input("email", "Email", "email", "email")}
      {input("phone", "Phone", "tel", "tel", true)}
      <div className="public-field public-field-wide">
        <label htmlFor="lead-problem">What problem do you want to solve?</label>
        <textarea id="lead-problem" name="problem" rows={5} value={values.problem} required placeholder="A few sentences is enough. What happens today, and what should change?" aria-invalid={errors.problem ? true : undefined} aria-describedby={describe("problem")} onChange={(event) => update("problem", event.target.value)} onBlur={() => leave("problem")} />
        {error("problem")}
      </div>
      {select("timing", "Timing", asOptions(leadTimings))}
    </div>
    <div className="public-form-actions">
      <button type="submit" className="public-button" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send request"}</button>
      <p>Jaber reads every request and replies personally.</p>
    </div>
  </form>;
}
