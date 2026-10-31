"use client"

import { useMemo, useState } from "react"
import { Controller, useFieldArray, useForm, useWatch, type FieldErrors, type UseFormRegister } from "react-hook-form"
import { FileTextIcon, Loader2Icon, PlusIcon, SaveIcon, SearchIcon, Trash2Icon, WandSparklesIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Field, SimpleSelect } from "@/components/shared/form"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { detailsFromResume, EMPTY_AUTOFILL, type AutofillTextField } from "@/lib/autofill"
import { settingsService } from "@/lib/services"
import { QK, useAutofill, useResumes } from "@/lib/store/queries"
import { setQueryData, useMutation } from "@/lib/store/query"
import type { AutofillProfile } from "@/lib/types"
import { zodResolver } from "@/lib/utils/zod-resolver"

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), "Enter a full link starting with https://")

const yesNo = z.enum(["yes", "no", ""])

const schema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  preferredName: z.string().trim(),
  email: z.union([z.literal(""), z.email("Enter a valid email")]),
  phone: z.string().trim(),
  pronouns: z.string().trim(),
  addressLine: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  postalCode: z.string().trim(),
  country: z.string().trim(),
  linkedin: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
  currentTitle: z.string().trim(),
  currentCompany: z.string().trim(),
  experienceYears: z.string().trim(),
  noticePeriod: z.string().trim(),
  currentSalary: z.string().trim(),
  expectedSalary: z.string().trim(),
  workAuthorization: yesNo,
  needsSponsorship: yesNo,
  willingToRelocate: yesNo,
  school: z.string().trim(),
  degree: z.string().trim(),
  fieldOfStudy: z.string().trim(),
  graduationYear: z.string().trim(),
  gender: z.string().trim(),
  ethnicity: z.string().trim(),
  disability: z.string().trim(),
  veteran: z.string().trim(),
  summary: z.string().max(5000, "Keep it under 5,000 characters"),
  coverLetter: z.string().max(20_000, "Keep it under 20,000 characters"),
  answers: z.array(
    z.object({
      id: z.string().optional(),
      question: z.string().trim().min(1, "Write the question"),
      answer: z.string().max(5000),
    }),
  ),
})
type Values = z.infer<typeof schema>

const YES_NO = [
  { value: "", label: "Not set — answer on the form" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
]

/** Suggestions; any other answer can be typed. */
const SUGGESTIONS = {
  pronouns: ["He/him", "She/her", "They/them", "Prefer not to say"],
  gender: ["Male", "Female", "Non-binary", "Prefer not to say"],
  ethnicity: ["Asian", "Black or African American", "Hispanic or Latino", "White", "Two or more races", "Prefer not to say"],
  disability: ["No, I do not have a disability", "Yes, I have a disability", "Prefer not to say"],
  veteran: ["I am not a protected veteran", "I am a protected veteran", "Prefer not to say"],
} as const

/** Counted towards "how complete": the details most forms ask for. */
const CORE_FIELDS: AutofillTextField[] = [
  "firstName", "lastName", "email", "phone", "city", "country", "linkedin",
  "currentTitle", "currentCompany", "experienceYears", "noticePeriod", "expectedSalary",
  "workAuthorization", "school", "degree",
]

function toValues(profile: AutofillProfile): Values {
  return {
    ...EMPTY_AUTOFILL,
    ...profile,
    answers: profile.answers.map(({ id, question, answer }) => ({ id, question, answer })),
  }
}

export function AutofillView() {
  const { data: profile } = useAutofill()
  return (
    <div>
      <PageHeader
        title="Autofill"
        description="What the IamCandidate browser extension types into job application forms. Fill it once; every application uses it."
      />
      {profile ? (
        <AutofillForm key={profile.updatedAt ?? "new"} profile={profile} />
      ) : (
        <Skeleton className="h-[32rem] max-w-3xl rounded-xl" />
      )}
    </div>
  )
}

function AutofillForm({ profile }: { profile: AutofillProfile }) {
  const save = useMutation((next: AutofillProfile) => settingsService.updateAutofill(next), {
    onSuccess: (next) => setQueryData<AutofillProfile>(QK.autofill, () => next),
    success: "Autofill details saved",
    error: "Couldn't save your autofill details",
  })
  const { register, control, handleSubmit, formState, reset, getValues, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toValues(profile),
  })
  const answers = useFieldArray({ control, name: "answers" })
  const errors = formState.errors
  const values = useWatch({ control }) as Values
  const filled = CORE_FIELDS.filter((key) => String(values[key] ?? "").trim()).length

  const onSubmit = handleSubmit(async (next) => {
    const result = await save.mutate({ ...EMPTY_AUTOFILL, ...next })
    if (result) reset(toValues(result))
  })

  /** Copies what the resume says into fields that are still empty. */
  const fillFrom = (details: Partial<Record<AutofillTextField, string>>, title: string) => {
    const current = getValues()
    const changed = Object.entries(details).filter(
      ([key, value]) => value?.trim() && !String(current[key as AutofillTextField] ?? "").trim(),
    )
    for (const [key, value] of changed) {
      setValue(key as AutofillTextField, value as never, { shouldDirty: true })
    }
    if (changed.length) {
      toast.success(`Filled ${changed.length} field${changed.length === 1 ? "" : "s"} from “${title}”`, {
        description: "Check them, then save.",
      })
    } else {
      toast.info(`“${title}” has nothing for your empty fields`)
    }
  }

  const text = (name: AutofillTextField, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Field label={label} htmlFor={`af-${name}`} error={errors[name]?.message}>
      <Input id={`af-${name}`} aria-invalid={!!errors[name]} {...props} {...register(name)} />
    </Field>
  )

  const choice = (name: "workAuthorization" | "needsSponsorship" | "willingToRelocate", label: string) => (
    <Field label={label} htmlFor={`af-${name}`}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <SimpleSelect id={`af-${name}`} value={field.value} onValueChange={field.onChange} options={YES_NO} />
        )}
      />
    </Field>
  )

  const suggested = (name: keyof typeof SUGGESTIONS, label: string) => (
    <Field label={label} htmlFor={`af-${name}`}>
      <Input id={`af-${name}`} list={`af-${name}-options`} placeholder="Leave blank to answer on the form" {...register(name)} />
      <datalist id={`af-${name}-options`}>
        {SUGGESTIONS[name].map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </Field>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
      <Panel>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">
              {filled} of {CORE_FIELDS.length} key details filled
            </p>
            <Progress value={(filled / CORE_FIELDS.length) * 100} />
            <p className="text-xs text-muted-foreground">
              Forms ask for these most. Anything left blank is listed in the extension for you to answer on the form.
            </p>
          </div>
          <ResumeFill onFill={fillFrom} />
        </div>
      </Panel>

      <Panel title="Contact" description="Who you are and how recruiters reach you.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {text("firstName", "First name", { autoComplete: "given-name" })}
          {text("lastName", "Last name", { autoComplete: "family-name" })}
          {text("preferredName", "Preferred name")}
          {suggested("pronouns", "Pronouns")}
          {text("email", "Email", { type: "email", autoComplete: "email" })}
          {text("phone", "Phone", { type: "tel", autoComplete: "tel", placeholder: "+91 90000 00000" })}
        </div>
      </Panel>

      <Panel title="Address" description="Location questions and address fields.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("addressLine", "Street address", { autoComplete: "street-address" })}</div>
          {text("city", "City", { autoComplete: "address-level2" })}
          {text("state", "State / province", { autoComplete: "address-level1" })}
          {text("postalCode", "Postal code", { autoComplete: "postal-code" })}
          {text("country", "Country", { autoComplete: "country-name" })}
        </div>
      </Panel>

      <Panel title="Links">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("linkedin", "LinkedIn", { type: "url", placeholder: "https://www.linkedin.com/in/…" })}</div>
          {text("github", "GitHub", { type: "url", placeholder: "https://github.com/…" })}
          {text("portfolio", "Portfolio / website", { type: "url" })}
        </div>
      </Panel>

      <Panel title="Work" description="Your current job, experience and pay.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {text("currentTitle", "Current title")}
          {text("currentCompany", "Current company")}
          {text("experienceYears", "Years of experience", { inputMode: "decimal", placeholder: "e.g. 3.5" })}
          {text("noticePeriod", "Notice period", { placeholder: "e.g. 30 days" })}
          {text("currentSalary", "Current salary", { placeholder: "e.g. 12 LPA" })}
          {text("expectedSalary", "Expected salary", { placeholder: "e.g. 18 LPA" })}
        </div>
      </Panel>

      <Panel title="Work eligibility" description="Answers to the yes/no questions most applications ask.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {choice("workAuthorization", "Authorized to work where you're applying?")}
          {choice("needsSponsorship", "Need visa sponsorship?")}
          {choice("willingToRelocate", "Willing to relocate?")}
        </div>
      </Panel>

      <Panel title="Education" description="Your highest or most recent degree.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{text("school", "School / university")}</div>
          {text("degree", "Degree", { placeholder: "e.g. B.E." })}
          {text("fieldOfStudy", "Field of study", { placeholder: "e.g. Computer Science" })}
          {text("graduationYear", "Graduation year", { inputMode: "numeric", placeholder: "e.g. 2022" })}
        </div>
      </Panel>

      <Panel
        title="Voluntary self-identification"
        description="Optional. Some forms ask these; leave any blank and the extension leaves that question for you."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {suggested("gender", "Gender")}
          {suggested("ethnicity", "Race / ethnicity")}
          {suggested("disability", "Disability status")}
          {suggested("veteran", "Veteran status")}
        </div>
      </Panel>

      <Panel title="Summary & cover letter" description="For “Tell us about yourself” boxes and cover letter fields.">
        <div className="space-y-4">
          <Field label="Summary / about you" htmlFor="af-summary" error={errors.summary?.message}>
            <Textarea id="af-summary" rows={4} {...register("summary")} />
          </Field>
          <Field label="Cover letter" htmlFor="af-coverLetter" error={errors.coverLetter?.message}>
            <Textarea id="af-coverLetter" rows={8} {...register("coverLetter")} />
          </Field>
        </div>
      </Panel>

      <AnswersPanel
        fields={answers.fields}
        register={register}
        errors={errors.answers}
        values={values.answers}
        onAdd={() => answers.prepend({ question: "", answer: "" })}
        onRemove={answers.remove}
      />

      <div className="sticky bottom-[var(--bottom-nav,0px)] z-20 -mx-4 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-end gap-3 px-4 py-3">
          <p className="mr-auto text-xs text-muted-foreground">
            {formState.isDirty ? "You have unsaved changes." : "The extension picks up changes the next time it fills a form."}
          </p>
          <Button type="button" variant="ghost" disabled={!formState.isDirty || save.isPending} onClick={() => reset()}>
            Discard
          </Button>
          <Button type="submit" disabled={!formState.isDirty || save.isPending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            Save
          </Button>
        </div>
      </div>
    </form>
  )
}

/** Picks a resume and copies its role, experience, education and summary into empty fields. */
function ResumeFill({ onFill }: { onFill: (details: Partial<Record<AutofillTextField, string>>, title: string) => void }) {
  const { data: resumes } = useResumes()
  const usable = useMemo(
    () => (resumes ?? []).filter((r) => r.experience.length || r.education.length || r.summary.trim()),
    [resumes],
  )
  const [picked, setPicked] = useState<string>()
  const resume = usable.find((r) => r.id === picked) ?? usable.find((r) => r.isDefault) ?? usable[0]
  if (!resume) {
    return (
      <p className="max-w-56 text-xs text-muted-foreground">
        <FileTextIcon className="mr-1 inline size-3.5" />
        Build a resume in Resumes to fill these details from it.
      </p>
    )
  }
  return (
    <div className="flex w-full flex-col gap-2 sm:w-64">
      {usable.length > 1 && (
        <SimpleSelect
          size="sm"
          value={resume.id}
          onValueChange={setPicked}
          options={usable.map((r) => ({ value: r.id, label: r.title }))}
        />
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => onFill(detailsFromResume(resume), resume.title)}>
        <WandSparklesIcon /> Fill empty fields from resume
      </Button>
    </div>
  )
}

function AnswersPanel({
  fields,
  register,
  errors,
  values,
  onAdd,
  onRemove,
}: {
  fields: Array<{ id: string }>
  register: UseFormRegister<Values>
  errors: FieldErrors<Values>["answers"]
  values: Values["answers"]
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const shown = fields
    .map((field, index) => ({ field, index }))
    .filter(({ index }) => {
      if (!needle) return true
      const answer = values[index]
      return `${answer?.question ?? ""} ${answer?.answer ?? ""}`.toLowerCase().includes(needle)
    })

  return (
    <Panel
      title={`Saved answers${fields.length ? ` · ${fields.length}` : ""}`}
      description="Other questions, matched to a form by their wording. The extension also adds the answers you type on forms."
      action={
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <PlusIcon /> Add
        </Button>
      }
    >
      {fields.length > 4 && (
        <div className="relative mb-4">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions and answers"
            className="pl-8"
            aria-label="Search saved answers"
          />
        </div>
      )}
      {!fields.length ? (
        <p className="text-sm text-muted-foreground">
          No saved answers yet. Add one, like “How did you hear about us?”, or let the extension learn them as you apply.
        </p>
      ) : !shown.length ? (
        <p className="text-sm text-muted-foreground">No saved answers match “{query}”.</p>
      ) : (
        <ul className="divide-y">
          {shown.map(({ field, index }) => (
            <li key={field.id} className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-2 py-3 first:pt-0 last:pb-0">
              <Field label="Question" htmlFor={`af-q-${field.id}`} error={errors?.[index]?.question?.message}>
                <Input id={`af-q-${field.id}`} aria-invalid={!!errors?.[index]?.question} {...register(`answers.${index}.question`)} />
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-6 text-muted-foreground"
                aria-label="Delete this answer"
                onClick={() => onRemove(index)}
              >
                <Trash2Icon />
              </Button>
              <Field label="Answer" htmlFor={`af-a-${field.id}`} className="col-span-1">
                <Textarea id={`af-a-${field.id}`} rows={2} {...register(`answers.${index}.answer`)} />
              </Field>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
