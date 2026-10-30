import type { Metadata } from "next"
import Link from "next/link"

import { LegalDocument, type LegalSection } from "@/features/marketing/legal-document"
import { CONTACT_EMAIL } from "@/features/marketing/site-chrome"

export const metadata: Metadata = {
  title: { absolute: "Terms & conditions · IamCandidate" },
  description: "The rules for using IamCandidate, its browser extension and API.",
}

const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement",
    body: (
      <>
        <p>
          These terms are an agreement between you and the developer of IamCandidate (&ldquo;we&rdquo;, &ldquo;us&rdquo;)
          covering the IamCandidate web app, API and browser extension (the &ldquo;Service&rdquo;). By using the Service you
          accept these terms and our <Link href="/privacy">privacy policy</Link>. If you don&apos;t agree, please
          don&apos;t use the Service.
        </p>
        <p>You must be at least 18 years old, or the age of majority where you live, to use the Service.</p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    body: (
      <ul>
        <li>Accounts are created by an administrator; there is no public sign-up.</li>
        <li>Keep your password confidential. You are responsible for activity under your account.</li>
        <li>Tell us promptly at {mail} if you suspect unauthorised access.</li>
        <li>
          Administrators can create, disable and delete accounts. Demo credentials shown in the app are for trying the
          Service only.
        </li>
      </ul>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <>
        <p>
          You own everything you add to IamCandidate — applications, resumes, documents, notes, contacts and the rest
          (&ldquo;Your Content&rdquo;). You give us a limited permission to store, process, display and transmit Your
          Content only as needed to run the Service for you, for example to compile your resume or send an email you
          wrote.
        </p>
        <p>You are responsible for Your Content and confirm that:</p>
        <ul>
          <li>you have the right to upload it, and it doesn&apos;t infringe anyone&apos;s rights;</li>
          <li>
            information you record about other people (contacts, referrers, interviewers) is collected and used
            lawfully, and kept accurate;
          </li>
          <li>it is not illegal, harmful, or malicious (for example, malware).</li>
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>Please don&apos;t:</p>
        <ul>
          <li>send spam, bulk unsolicited email, or deceptive messages through the email features;</li>
          <li>use the Service to harass, scrape at scale, or track people;</li>
          <li>try to access other users&apos; data, probe or bypass security, or overload the Service;</li>
          <li>submit LaTeX or files designed to escape the compiler sandbox or attack our systems;</li>
          <li>reverse-engineer the Service except where the law allows it;</li>
          <li>resell or provide the Service to others without our permission.</li>
        </ul>
        <p>
          When you use the extension on third-party sites such as LinkedIn or job boards, you are also responsible for
          following those sites&apos; terms.
        </p>
      </>
    ),
  },
  {
    id: "connected-services",
    title: "Connected services",
    body: (
      <>
        <p>
          IamCandidate can work with services you connect, such as your SMTP mailbox and Google Drive. Your use of those
          services is governed by their own terms. Emails are sent from your mailbox, so you are the sender and are
          responsible for their content and for your provider&apos;s sending limits.
        </p>
        <p>
          We are not responsible for third-party services, their availability, or changes they make that affect IamCandidate
          — for example, a job site changing its layout so a field is no longer detected.
        </p>
      </>
    ),
  },
  {
    id: "extension",
    title: "The browser extension",
    body: (
      <p>
        The extension is provided for saving job postings and referrals to your own IamCandidate account. It reads a page only
        when you open it and shows you what it found before anything is saved. Detected details may be incomplete or
        wrong; please check them before saving.
      </p>
    ),
  },
  {
    id: "our-property",
    title: "Our intellectual property",
    body: (
      <p>
        The Service — its software, design, name and logo — belongs to us and is protected by law. These terms give you
        a personal, non-exclusive, non-transferable right to use it; they don&apos;t transfer any ownership. Feedback you
        send us may be used to improve the Service without obligation to you.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <>
        <p>
          We work to keep IamCandidate available and your data safe, but the Service may be interrupted for maintenance, by
          failures, or by events outside our control. Features may be added, changed or removed.
        </p>
        <p>
          <strong>Keep your own copies</strong> of important documents. IamCandidate is a workspace, not a guaranteed backup
          service.
        </p>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <p>
        The Service is currently provided free of charge. If we introduce paid features, we will tell you about the
        price and terms in advance, and you will never be charged without agreeing first.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          You may stop using IamCandidate at any time and ask us to delete your account at {mail}. We may suspend or close an
          account that breaches these terms or puts the Service or other users at risk, and, where reasonable, we will
          tell you why first.
        </p>
        <p>
          When an account is closed, its content is deleted as described in the{" "}
          <Link href="/privacy#retention">privacy policy</Link>. Sections that by their nature should survive — such
          as ownership, disclaimers and limitation of liability — continue to apply.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The Service is provided <strong>&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>, without warranties
        of any kind, whether express or implied, including merchantability, fitness for a particular purpose and
        non-infringement. IamCandidate helps you organise your job search; it does not guarantee interviews, offers or any
        employment outcome, and it is not career, legal or financial advice.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential
        or punitive damages, or for lost profits, opportunities, data or goodwill, arising from your use of the
        Service. Our total liability for any claim relating to the Service is limited to the greater of the amount you
        paid us in the 12 months before the claim or INR 1,000. Nothing in these terms limits liability that cannot be
        limited by law.
      </p>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to compensate us for claims, losses and reasonable costs arising from Your Content or from your
        breach of these terms or of the law, including claims by people whose information you recorded.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of India. Courts in India have exclusive jurisdiction over disputes,
        unless the consumer-protection law of your country gives you the right to bring proceedings where you live. We
        encourage you to contact us first — most issues can be resolved quickly by email.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. We will change the date at the top of this page and, for material changes, notify
        you in the app or by email before they take effect. Continuing to use the Service after that means you accept
        the updated terms. If any part of these terms is unenforceable, the rest still applies.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions about these terms: {mail}.</p>,
  },
]

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms & conditions"
      updated="October 21, 2026"
      intro={
        <p>
          The ground rules for using IamCandidate, written to be read. In short: your content is yours, use the Service fairly,
          and keep copies of anything you can&apos;t afford to lose.
        </p>
      }
      highlights={[
        "You own everything you add to IamCandidate.",
        "We use your content only to run the Service for you.",
        "No spam, scraping at scale, or attempts to access others' data.",
        "Emails go out from your own mailbox, so you're the sender.",
        "IamCandidate is free today; any paid feature would need your agreement first.",
        "Provided as is — keep your own copies of important files.",
      ]}
      sections={SECTIONS}
      related={{ href: "/privacy", label: "Privacy policy" }}
    />
  )
}
