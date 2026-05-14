import { BSDatePicker } from "@pt/ui";
import type { Project } from "@pt/db";

import { MoneyInput } from "./money-input";

interface EngineerOption {
  id: string;
  name: string;
}

export function ProjectForm({
  mode,
  action,
  project,
  isPM,
  engineers,
}: {
  mode: "create" | "edit";
  action: (formData: FormData) => Promise<void>;
  project?: Project;
  isPM: boolean;
  engineers?: EngineerOption[];
}) {
  const isEdit = mode === "edit";
  const submitLabel = isEdit ? "Save changes" : "Create project";

  return (
    <form action={action} className="flex flex-col gap-6">
      {isEdit && project && <input type="hidden" name="id" value={project.id} />}

      <Section
        n={1}
        title="Identifiers"
        description="What is this project called and what type of work is it?"
      >
        <Field label="Project name">
          <input
            type="text"
            name="projectName"
            required
            defaultValue={project?.projectName ?? ""}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </Field>
        <Field label="Infrastructure">
          <select
            name="infrastructureType"
            required
            defaultValue={project?.infrastructureType ?? "ROAD"}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          >
            <option value="ROAD">Road</option>
            <option value="BRIDGE">Bridge</option>
          </select>
        </Field>
        <Field label="Project type">
          <select
            name="projectType"
            required
            defaultValue={project?.projectType ?? "YEARLY_TENDERED"}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          >
            <option value="MULTIYEAR">Multiyear</option>
            <option value="SOURCE_APPROVED">Source Approved</option>
            <option value="YEARLY_TENDERED">Yearly Tendered</option>
          </select>
        </Field>
      </Section>

      <Section n={2} title="Cost" description="Original contract figures.">
        <Field label="Original contract price">
          <MoneyInput
            name="originalContractPrice"
            defaultValue={project?.originalContractPrice as unknown as string}
            required
          />
        </Field>
        <Field label="Price escalation (optional)">
          <MoneyInput
            name="priceEscalation"
            defaultValue={project?.priceEscalation as unknown as string}
          />
        </Field>
        <Field label="Contingencies (optional)">
          <MoneyInput
            name="contingencies"
            defaultValue={project?.contingencies as unknown as string}
          />
        </Field>
      </Section>

      <Section n={3} title="Time">
        <Field label="Contract date (BS)">
          <BSDatePicker
            name="contractDate"
            defaultValue={project?.contractDate}
            required
          />
        </Field>
        <Field label="Intended completion date (BS)">
          <BSDatePicker
            name="intendedCompletionDate"
            defaultValue={project?.intendedCompletionDate}
            required
          />
        </Field>
      </Section>

      <Section n={4} title="Payment">
        <Field label="Payment till last FY">
          <MoneyInput
            name="paymentTillLastFY"
            defaultValue={project?.paymentTillLastFY as unknown as string}
          />
        </Field>
        <Field label="Payment till date">
          <MoneyInput
            name="paymentTillDate"
            defaultValue={project?.paymentTillDate as unknown as string}
          />
        </Field>
      </Section>

      <Section n={5} title="Advance Payment">
        <Field label="Total advance payment">
          <MoneyInput
            name="totalAdvancePayment"
            defaultValue={project?.totalAdvancePayment as unknown as string}
          />
        </Field>
        <Field label="Outstanding advance till last FY">
          <MoneyInput
            name="outstandingAdvanceTillLastFY"
            defaultValue={project?.outstandingAdvanceTillLastFY as unknown as string}
          />
        </Field>
        <Field label="Outstanding advance till date">
          <MoneyInput
            name="outstandingAdvanceTillDate"
            defaultValue={project?.outstandingAdvanceTillDate as unknown as string}
          />
        </Field>
      </Section>

      <Section n={6} title="Budget">
        <Field label="Current FY budget">
          <MoneyInput
            name="currentFYBudget"
            defaultValue={project?.currentFYBudget as unknown as string}
          />
        </Field>
      </Section>

      <Section
        n={7}
        title="Budget Planning"
        description="Forecasts for the current and next fiscal year. Cleared on FY rollover."
      >
        <Field label="Expected payment till FY end">
          <MoneyInput
            name="expectedPaymentTillFYEnd"
            defaultValue={project?.expectedPaymentTillFYEnd as unknown as string}
          />
        </Field>
        <Field label="Expected outstanding advance at FY end">
          <MoneyInput
            name="expectedOutstandingAdvanceFYEnd"
            defaultValue={project?.expectedOutstandingAdvanceFYEnd as unknown as string}
          />
        </Field>
        <Field label="Next FY budget requirement">
          <MoneyInput
            name="nextFYBudgetRequirement"
            defaultValue={project?.nextFYBudgetRequirement as unknown as string}
          />
        </Field>
      </Section>

      <Section n={8} title="Progress">
        <Field label="Physical progress %">
          <input
            type="number"
            name="physicalProgress"
            min={0}
            max={100}
            step="0.01"
            defaultValue={(project?.physicalProgress as unknown as string) ?? "0"}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
        </Field>
      </Section>

      {isPM && engineers && (
        <Section
          n={9}
          title="Owner"
          description="Project manager only. The selected engineer owns this project."
        >
          <Field label="Engineer">
            <select
              name="engineerId"
              required
              defaultValue={project?.engineerId ?? ""}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
            >
              <option value="" disabled>
                Select engineer…
              </option>
              {engineers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
        </Section>
      )}

      {isEdit && (
        <Section n={isPM ? 10 : 9} title="Status">
          <Field label="Status">
            <select
              name="status"
              required
              defaultValue={project?.status ?? "RUNNING"}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
            >
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </Field>
        </Section>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({
  n,
  title,
  description,
  children,
}: {
  n: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wider text-white/40">Section {n}</p>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-white/70">{label}</span>
      {children}
    </label>
  );
}
