import type { Metadata } from "next"
import Link from "next/link"

import { LegalDocument, type LegalSection } from "@/features/marketing/legal-document"
import { CONTACT_EMAIL } from "@/features/marketing/site-chrome"

export const metadata: Metadata = {
  title: { absolute: "Privacy policy · iamcandidate" },
  description: "What iamcandidate collects, why, where it is stored and the choices you have.",
}

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          iamcandidate is a personal workspace for managing a job search:
          applications, companies, contacts, referrals, interviews, resumes, documents, email, notes, skills,
          certifications and links. It consists of the iamcandidate web app, the iamcandidate server (API) and the optional iamcandidate
          browser extension, together &ldquo;the Service&rdquo;.
        </p>
        <p>
          The Service is operated by its independent developer (&ldquo;we&rdquo;, &ldquo;us&rdquo;). For anything in
          this policy, contact {mail}.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "Information we collect",
    body: (
      <>
        <h3>Account information</h3>
        <p>
          Your name, email address, role (user or admin) and password. Passwords are stored only as a salted{" "}
          <code>scrypt</code> hash — we never store or see the plain password.
        </p>
        <h3>Content you add</h3>
        <p>Everything you enter or upload into your workspace, for example:</p>
        <ul>
          <li>Job applications, companies, interviews and their notes, statuses and dates.</li>
          <li>
            Contacts and referrals — names, job titles, companies, email addresses, phone numbers and LinkedIn URLs of
            people you choose to record.
          </li>
          <li>Resumes (including LaTeX source), documents and files you upload, such as certificates or offer letters.</li>
          <li>Notes, tasks, projects, skills, certifications, bookmarks and email templates.</li>
        </ul>
        <h3>Email (SMTP) settings</h3>
        <p>
          If you connect your own mailbox, we store its SMTP host, port, username, sender name and address, and
          password. The password is encrypted with AES-256-GCM and is never returned to the browser. Emails you send
          and drafts you save are stored in your workspace.
        </p>
        <h3>Google Drive</h3>
        <p>
          If you connect Google Drive, we request the <code>drive.readonly</code>, <code>openid</code> and{" "}
          <code>email</code> scopes. We store an encrypted refresh token and your Google email address, list files
          only when you browse them in iamcandidate, and copy a file into iamcandidate only when you choose to import it. We never
          write to, modify or delete anything in your Drive.
        </p>
        <h3>Browser extension</h3>
        <p>
          Only when you open the extension (its toolbar icon or Alt+K) does it read the current tab — job posting
          details on job pages, or a person&apos;s name, headline, location, current company and profile URL on
          LinkedIn profile pages. Nothing is sent until you click save. The extension does not run in the background
          or read your browsing history.
        </p>
        <h3>Technical data</h3>
        <p>
          Our servers keep standard request logs (such as time, route, status code and IP address) to operate and
          secure the Service, and an activity history of changes in your workspace that you can see in the app.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use information",
    body: (
      <>
        <p>We use your information only to provide the Service to you:</p>
        <ul>
          <li>to sign you in and keep your account secure;</li>
          <li>to store, display, search and sync the content in your workspace;</li>
          <li>to send email through your own SMTP server when you ask us to;</li>
          <li>to import files from Google Drive and compile LaTeX resumes when you ask us to;</li>
          <li>to show your dashboard, notifications and activity history;</li>
          <li>to diagnose problems, prevent abuse and keep the Service running.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your data, use it for advertising, build marketing profiles, or use it to
          train machine-learning models. The Service contains no third-party analytics or advertising trackers.
        </p>
        <p>
          Use of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , including its Limited Use requirements.
        </p>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "Legal bases",
    body: (
      <p>
        Where data-protection laws such as India&apos;s Digital Personal Data Protection Act, 2023 or the GDPR apply, we
        process account data and workspace content to perform our agreement with you, connected-service data (SMTP,
        Google Drive) on your consent — which you can withdraw by disconnecting the service — and logs on our
        legitimate interest in operating a secure Service.
      </p>
    ),
  },
  {
    id: "storage-security",
    title: "Where data is stored and how it is protected",
    body: (
      <>
        <p>
          The Service runs on Amazon Web Services in the Asia Pacific (Mumbai) region, <code>ap-south-1</code>.
          Structured data is stored in Amazon DynamoDB and files in a private Amazon S3 bucket.
        </p>
        <ul>
          <li>All traffic is encrypted in transit with TLS; S3 rejects non-TLS requests.</li>
          <li>Files are encrypted at rest and reached only through signed links that expire within minutes.</li>
          <li>Every record is partitioned by your user ID, so one account cannot read another&apos;s data.</li>
          <li>SMTP passwords and Google tokens are encrypted with AES-256-GCM.</li>
          <li>Each server function has only the minimum cloud permissions it needs.</li>
          <li>LaTeX is compiled in an isolated function that has no access to secrets.</li>
        </ul>
        <p>
          No system is perfectly secure. If we become aware of a breach affecting your data, we will notify you as
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Sharing",
    body: (
      <>
        <p>We share data only in these cases:</p>
        <ul>
          <li>
            <strong>Infrastructure providers.</strong> Amazon Web Services hosts and processes data on our behalf.
          </li>
          <li>
            <strong>Services you connect.</strong> Your SMTP provider receives the emails you send; Google receives the
            requests needed to list and download the Drive files you pick.
          </li>
          <li>
            <strong>Workspace administrators.</strong> Admin accounts can create, disable and delete user accounts.
          </li>
          <li>
            <strong>Legal reasons.</strong> When required by law, or to protect the rights and safety of users or the
            Service.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "browser-storage",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>
          iamcandidate does not use advertising or tracking cookies. The web app uses your browser&apos;s local storage for
          your session token, theme and layout preferences. The extension stores its session token, server settings
          and an unsaved draft in the browser&apos;s extension storage. Sessions expire after 12 hours, and signing out
          removes them.
        </p>
        <p>
          In demo mode, all workspace data lives only in your browser&apos;s local storage and never reaches our
          servers.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "Retention",
    body: (
      <ul>
        <li>Workspace content is kept until you delete it or your account is deleted.</li>
        <li>Activity history is deleted automatically after 365 days.</li>
        <li>Server logs are kept for 30 days.</li>
        <li>
          Deleting an account removes its data and stored files. Encrypted backups used for disaster recovery expire
          on their own within 35 days.
        </li>
      </ul>
    ),
  },
  {
    id: "your-rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>You can, at any time:</p>
        <ul>
          <li>view, edit and delete your content directly in the app;</li>
          <li>download your documents;</li>
          <li>disconnect Google Drive or remove your SMTP settings;</li>
          <li>change your password;</li>
          <li>ask us for a copy of your data, a correction, or deletion of your account by writing to {mail}.</li>
        </ul>
        <p>
          You can also revoke iamcandidate&apos;s access to Google at{" "}
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            myaccount.google.com/permissions
          </a>
          . We respond to requests within 30 days. If you are unhappy with our answer, you may complain to your local
          data-protection authority.
        </p>
      </>
    ),
  },
  {
    id: "other-people",
    title: "Information about other people",
    body: (
      <p>
        When you add contacts or referrals, you are responsible for having a legitimate reason to record that
        information, and for keeping it accurate. We process it only on your behalf, to show it back to you. If you
        believe your information was added to someone&apos;s workspace and want it removed, contact {mail}.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>The Service is not intended for anyone under 18, and we do not knowingly collect their data.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy, we will update the date at the top of this page, and for significant changes we will
        let you know in the app or by email before they take effect. See also our{" "}
        <Link href="/terms">terms and conditions</Link>.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions, requests or concerns about privacy: {mail}.</p>,
  },
]

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy policy"
      updated="October 21, 2026"
      intro={
        <p>
          Your workspace holds personal things — your resume, your contacts, your plans. This policy explains what
          iamcandidate collects, why, where it is kept and how you stay in control.
        </p>
      }
      highlights={[
        "We collect only what you put in iamcandidate, plus what's needed to run it.",
        "We never sell your data, show you ads or use third-party trackers.",
        "Files are private and encrypted; secrets are encrypted with AES-256-GCM.",
        "Google Drive access is read-only, and the extension reads a page only when you open it.",
        "Data is hosted on AWS in Mumbai, India (ap-south-1).",
        "You can export, correct or delete your data at any time.",
      ]}
      sections={SECTIONS}
      related={{ href: "/terms", label: "Terms & conditions" }}
    />
  )
}
