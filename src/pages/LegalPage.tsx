import { ShieldCheck, FileText, Lock, Mail, Activity, Scale, AlertTriangle } from 'lucide-react';
import { site } from '@/data/site';

export function LegalPage({ type }: { type: 'terms' | 'privacy' | 'responsible-use' | 'contact' | 'status' }) {
  const content = legalContent[type];
  const Icon = content.icon;
  return (
    <div className={`py-16 px-4 sm:px-6 lg:px-8 mx-auto ${type === 'terms' ? 'max-w-4xl' : 'max-w-3xl'}`}>
      <div className="inline-flex w-12 h-12 rounded-lg bg-accent-500/15 border border-accent-500/30 items-center justify-center mb-6">
        <Icon className="w-6 h-6 text-accent-400" />
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-accent-400 uppercase tracking-wider mb-3">
        <Scale className="w-3.5 h-3.5" /> Legal agreement
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-50 mb-2">{content.title}</h1>
      <p className="text-sm text-gray-500 mb-8">Effective: August 2, 2026 · Version 1.0</p>
      {type === 'terms' && (
        <div className="rounded-xl border border-warn-500/25 bg-warn-500/5 p-5 flex items-start gap-3 mb-10">
          <AlertTriangle className="w-5 h-5 text-warn-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed">
            Security testing can affect availability, performance, data, logs, and third-party services. By authorizing a scan, you make legally binding representations about your authority and accept the testing risks described below.
          </p>
        </div>
      )}
      <div className="space-y-8">
        {content.sections.map((section, i) => (
          <div key={i} className="scroll-mt-24">
            <h2 className="text-lg font-semibold text-gray-100 mb-2.5">{type === 'terms' ? `${i + 1}. ` : ''}{section.heading}</h2>
            <div className="space-y-3">
              {(typeof section.text === 'string' ? [section.text] : section.text).map((paragraph, j) => (
                <p key={j} className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-lg border border-accent-500/20 bg-accent-500/5 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-accent-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-400">
          Pentor is a service of {site.company}, a Delaware corporation founded in {site.founded}. Registered business address: {site.address}. Telephone: {site.phone}. Questions about these terms may be sent to {site.legalEmail}.
        </p>
      </div>
    </div>
  );
}

const legalContent = {
  terms: {
    icon: FileText,
    title: 'Terms of Service',
    sections: [
      {
        heading: 'Agreement and eligibility',
        text: [
          'These Terms of Service (the “Terms”) are a binding agreement between VPNMaster, Inc., a Delaware corporation (“Pentor,” “we,” “us,” or “our”), and the person or entity accessing or using Pentor (“Customer,” “you,” or “your”). These Terms incorporate the Responsible Use Policy and Privacy Policy.',
          'By creating an account, requesting verification, purchasing a service, clicking an acceptance box, or using Pentor, you accept these Terms. If you use Pentor for an organization, you represent that you have authority to bind that organization. You must be at least 18 years old and legally capable of entering this agreement.',
        ],
      },
      {
        heading: 'The services',
        text: [
          'Pentor provides automated security observations, vulnerability indicators, monitoring, reports, remediation guidance, and, where separately purchased, human security assessment services (collectively, the “Services”). The scope, depth, methods, limits, timing, and availability of checks vary by plan and may change as the Services evolve.',
          'Automated results are generated from the externally observable target surface and available tools at the time of testing. Human services require a separate written scope and may be subject to additional terms or a statement of work.',
        ],
      },
      {
        heading: 'Your authorization and scope warranty',
        text: [
          'You represent, warrant, and covenant that, before each test and throughout the test, you: (a) own and control every target submitted; or (b) possess current, explicit, legally sufficient permission from its owner to authorize Pentor and its personnel and service providers to perform the selected testing; (c) have authority to bind all affected owners and operators; and (d) have obtained any consent required from hosting providers, cloud platforms, managed service providers, licensors, customers, or other third parties.',
          'Domain or email verification is a safety control, not proof of legal ownership or authority. You remain solely responsible for authorization. Permission for one domain, asset, environment, account, or test does not authorize any other target. You must not submit shared infrastructure, third-party services, customer systems, government systems, critical infrastructure, or assets outside your written authority.',
          'You must immediately stop or cancel testing and notify us at security@pentor.net if authorization is withdrawn, scope changes, a target resolves to unauthorized infrastructure, or testing may affect a third party. We may request written evidence of authority at any time and may refuse, limit, or stop any test in our sole discretion.',
        ],
      },
      {
        heading: 'Informed assumption of testing risk',
        text: [
          'SECURITY TESTING IS INHERENTLY RISKY. Even controlled, rate-limited, or non-destructive checks may trigger alerts, rate limits, account locks, web application firewalls, abuse systems, autoscaling, vendor charges, degraded performance, downtime, failover, log growth, data corruption or loss, or unexpected behavior in software and infrastructure.',
          'You knowingly authorize the selected testing and assume these risks. Before testing, you are responsible for current, tested backups; recovery procedures; monitoring; capacity; maintenance windows; internal approvals; vendor notifications; and qualified personnel able to stop, isolate, restore, or repair affected systems. Production testing is at your risk. If a target is fragile, safety-critical, regulated, or cannot tolerate interruption, do not use automated testing against it.',
        ],
      },
      {
        heading: 'Restrictions and responsible use',
        text: 'You must not use or enable the Services to access or test any asset without authorization; evade access controls or ownership verification; introduce malware; obtain credentials or data beyond the authorized test; conduct denial-of-service, destructive, persistence, phishing, social-engineering, extortion, surveillance, credential-stuffing, spam, or abusive activity; violate law or third-party rights; resell reports deceptively; misrepresent Pentor findings; probe Pentor itself outside an authorized disclosure program; or help another person do any of the foregoing. You must comply with the Responsible Use Policy and all applicable laws, sanctions, export controls, contracts, and provider policies.',
      },
      {
        heading: 'Third-party and shared infrastructure',
        text: 'Targets may depend on CDNs, cloud platforms, APIs, hosting providers, payment processors, identity providers, open-source software, or other third-party systems. Pentor does not control those systems and is not responsible for their acts, omissions, availability, terms, charges, blocking, or data practices. You must not treat control of a domain as authorization to test every underlying or connected third-party asset. Tests may be limited, excluded, or stopped where shared or third-party infrastructure is detected.',
      },
      {
        heading: 'Customer responsibilities and cooperation',
        text: 'You are responsible for the accuracy of all information, scope, contacts, credentials, environment classifications, and instructions supplied to us; for promptly reviewing findings; for independently validating and safely implementing remediation; and for securing reports and scan data. You will provide reasonable cooperation during incidents or authorization reviews. You must not publish sensitive findings in a manner that creates unreasonable risk to affected persons or systems.',
      },
      {
        heading: 'Reports, scores, and remediation guidance',
        text: [
          'Findings, severity ratings, scores, fingerprints, and suggested fixes are informational estimates, may be incomplete or incorrect, and may include false positives, false negatives, duplicate findings, outdated intelligence, or platform misidentification. A pass, high score, clean report, or absence of a finding does not establish that a target is secure, compliant, suitable for any purpose, or free from vulnerabilities.',
          'Pentor is not a substitute for secure development, patching, monitoring, incident response, compliance review, professional judgment, or a full-scope manual penetration test. Remediation can cause outages or security regressions; test changes in a safe environment and use qualified personnel. You remain solely responsible for security and operational decisions.',
        ],
      },
      {
        heading: 'Confidentiality and security information',
        text: 'Each party will use reasonable care to protect non-public information received from the other and use it only to perform or receive the Services, enforce this agreement, or comply with law. Reports may contain sensitive security information and must be stored and shared accordingly. Confidentiality does not cover information already lawfully known, independently developed, publicly available without breach, or lawfully received from another source. We may disclose information when legally required or reasonably necessary to prevent fraud, abuse, imminent harm, or unauthorized testing.',
      },
      {
        heading: 'Service data, privacy, and improvement',
        text: 'We may process account details, authorization records, target metadata, requests and responses needed for testing, scan logs, findings, and support communications to provide, secure, audit, troubleshoot, and improve the Services, as described in the Privacy Policy. We may create and use aggregated or de-identified statistics that do not reasonably identify you or a target. You grant us the limited rights needed to access the authorized target and process submitted data solely for these purposes.',
      },
      {
        heading: 'Fees, renewals, taxes, and refunds',
        text: 'Prices and included usage are shown at purchase. Unless stated otherwise, one-time scans are charged when ordered and subscriptions renew automatically until canceled before renewal. You authorize applicable charges and are responsible for taxes, bank fees, and accurate billing details. Except where required by law or expressly stated in a written refund policy, fees are non-refundable once a scan, reserved human-testing window, or subscription period begins. Chargebacks do not cancel amounts legitimately owed.',
      },
      {
        heading: 'Intellectual property and feedback',
        text: 'Pentor and its licensors retain all rights in the Services, software, testing methods, templates, interfaces, trademarks, and documentation. Subject to payment and these Terms, you receive a limited, non-exclusive, non-transferable right to use reports internally for the authorized target and to share them with your professional advisers, insurers, customers, or vendors who have a legitimate need and confidentiality obligations. You retain rights in your data. Feedback may be used by us without restriction or compensation, provided it does not disclose your confidential information.',
      },
      {
        heading: 'Suspension and termination',
        text: 'We may refuse, throttle, suspend, or terminate access or a test immediately if we reasonably suspect unauthorized scope, abuse, legal or safety risk, nonpayment, false information, third-party impact, or a violation of these Terms. You may stop using the Services at any time; subscription cancellation takes effect at the end of the paid term unless law requires otherwise. Sections that by their nature should survive—including authorization, payment, confidentiality, disclaimers, liability, indemnity, dispute resolution, and intellectual property—survive termination.',
      },
      {
        heading: 'Disclaimers',
        text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES, REPORTS, SCORES, FINDINGS, AND GUIDANCE ARE PROVIDED “AS IS” AND “AS AVAILABLE.” PENTOR DISCLAIMS ALL EXPRESS, IMPLIED, STATUTORY, AND OTHER WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, COMPLETENESS, SECURITY, QUIET ENJOYMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. WE DO NOT WARRANT THAT THE SERVICES WILL FIND EVERY VULNERABILITY, BE ERROR-FREE OR UNINTERRUPTED, PREVENT AN INCIDENT, SATISFY ANY LAW OR COMPLIANCE STANDARD, OR PRODUCE A PARTICULAR RESULT. SOME JURISDICTIONS DO NOT ALLOW CERTAIN DISCLAIMERS, SO SOME OF THESE LIMITATIONS MAY NOT APPLY TO YOU.',
      },
      {
        heading: 'Limitation of liability',
        text: [
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, PENTOR, VPNMASTER, INC., AND THEIR AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AGENTS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES; LOSS OF PROFITS, REVENUE, BUSINESS, GOODWILL, DATA, OR USE; BUSINESS INTERRUPTION; SECURITY INCIDENTS; THIRD-PARTY CLAIMS; OR COST OF SUBSTITUTE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY.',
          'THEIR TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID PENTOR FOR THE SERVICE GIVING RISE TO THE CLAIM DURING THE SIX MONTHS BEFORE THE EVENT, OR (B) US$100. THESE LIMITS APPLY REGARDLESS OF THEORY AND EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE. Nothing excludes liability that cannot lawfully be excluded.',
        ],
      },
      {
        heading: 'Your indemnification obligation',
        text: 'To the maximum extent permitted by law, you will defend, indemnify, and hold harmless Pentor, VPNMaster, Inc., and their affiliates, personnel, contractors, agents, licensors, and service providers from claims, demands, investigations, losses, liabilities, damages, judgments, penalties, fines, costs, and reasonable attorneys’ fees arising from or related to: your target or data; your lack of authority; testing requested by you; your instructions, configuration, or remediation; your violation of these Terms, law, contract, or third-party rights; or a claim by a target owner, hosting provider, customer, user, regulator, or other third party. We may control the defense and settlement, and you will reasonably cooperate. You may not settle a claim imposing liability or obligations on us without our written consent.',
      },
      {
        heading: 'Governing law and dispute resolution',
        text: [
          'These Terms are governed by Delaware law and applicable U.S. federal law, without regard to conflict-of-law rules. Before filing a claim, the parties will attempt in good faith to resolve it through written notice and 30 days of informal negotiation sent to legal@pentor.net.',
          'Any unresolved dispute will be resolved by binding, individual arbitration administered by the American Arbitration Association under the rules applicable to the dispute, in English, with the seat in Wilmington, Delaware, unless applicable law requires another forum. Either party may bring an eligible individual claim in small-claims court or seek urgent injunctive relief for unauthorized use, security risk, or intellectual-property misuse. TO THE EXTENT PERMITTED BY LAW, EACH PARTY WAIVES A JURY TRIAL AND PARTICIPATION IN CLASS, COLLECTIVE, CONSOLIDATED, OR REPRESENTATIVE PROCEEDINGS. You may opt out of arbitration by emailing legal@pentor.net within 30 days after first accepting these Terms, stating your name, organization, account email, and decision to opt out. If arbitration or a waiver is unenforceable, exclusive jurisdiction lies in the state or federal courts located in New Castle County, Delaware.',
        ],
      },
      {
        heading: 'Changes, notices, and electronic records',
        text: 'We may update these Terms prospectively. Material changes will be posted with a new effective date and, where required, notice or renewed consent. Continued use after the effective date constitutes acceptance where permitted by law. You consent to electronic contracting, signatures, records, and notices. We may send notices to your account email or display them in the Services; notices to us must be sent to legal@pentor.net.',
      },
      {
        heading: 'General terms',
        text: 'Neither party is liable for delay caused by events beyond reasonable control, except payment obligations. You may not assign these Terms without our consent; we may assign them in connection with a reorganization, financing, merger, sale, or transfer of the Services. We may use affiliates and subcontractors while remaining responsible for our contractual obligations. These Terms, incorporated policies, and any applicable order or statement of work are the entire agreement and supersede prior discussions about the Services. If a provision is unenforceable, it will be modified to the minimum extent necessary and the remainder will continue. Failure to enforce is not a waiver. Headings are for convenience only. No third party is a beneficiary.',
      },
      {
        heading: 'Contact',
        text: `Legal notices and questions: ${site.legalEmail}. Security and authorization emergencies: ${site.securityEmail}. Support: ${site.email}. Operator: ${site.company}, ${site.address}. Telephone: ${site.phone}.`,
      },
    ],
  },
  privacy: {
    icon: Lock,
    title: 'Privacy Policy',
    sections: [
      { heading: 'Data we collect', text: 'We collect the email address you use to sign up, the domains you authorize for testing, and the results of those tests.' },
      { heading: 'How we use data', text: 'We use your data to provide security testing, generate reports, and communicate with you about your account and findings.' },
      { heading: 'Data sharing', text: 'We do not sell your data. We share findings with you only. Human pentest findings are shared with you and your assigned specialist.' },
      { heading: 'Data retention', text: 'We retain your account data while your account is active. You can request deletion at any time.' },
    ],
  },
  'responsible-use': {
    icon: ShieldCheck,
    title: 'Responsible Use Policy',
    sections: [
      { heading: 'Authorization first', text: 'Pentor only tests domains after authorization is confirmed. You must own the target or have explicit written authorization to test it.' },
      { heading: 'Controlled checks', text: 'Pentor uses controlled, non-destructive checks designed to minimize impact on the target. We do not use aggressive or destructive techniques.' },
      { heading: 'No weaponized content', text: 'Pentor reports do not include exploit payloads or weaponized instructions. Findings describe what was observed, why it matters, and how to fix it.' },
      { heading: 'Prohibited use', text: 'You may not use Pentor to test systems you do not own or are not authorized to test, or to cause harm, disruption, or data loss.' },
    ],
  },
  contact: {
    icon: Mail,
    title: 'Contact',
    sections: [
      { heading: 'Support', text: 'For questions about your account, tests, or reports, email us at support@pentor.net.' },
      { heading: 'Human pentest inquiries', text: 'For questions about human pentest scheduling or scope, submit a request through the Human Pentest page and our team will reach out.' },
      { heading: 'Security disclosures', text: 'If you have found a security issue with Pentor itself, please email security@pentor.net with details. We appreciate responsible disclosure.' },
      { heading: 'Corporate information', text: `${site.company}\n${site.address}\nTelephone: ${site.phone}\nFounded: ${site.founded} · Delaware corporation` },
    ],
  },
  status: {
    icon: Activity,
    title: 'System Status',
    sections: [
      { heading: 'All systems operational', text: 'All Pentor services are currently operating normally.' },
      { heading: 'Service availability', text: 'This page is a placeholder for the MVP. A live status page with uptime monitoring and incident history will be available before launch.' },
    ],
  },
} as const;
