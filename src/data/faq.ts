export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: 'Is it legal to test a website with Pentor?',
    answer:
      'You must own the target or have explicit authorization to test it. Unauthorized security testing of systems you do not own or control is illegal in most jurisdictions. Pentor requires email verification before any testing begins, and you must confirm authorization in our Terms and Responsible Use Policy.',
  },
  {
    question: 'How do I verify that I am authorized?',
    answer:
      'When you enter a domain, Pentor sends a verification link to an administrative email address associated with that domain (such as admin@, security@, or webmaster@). Clicking that link confirms you control the domain or are authorized to test it.',
  },
  {
    question: 'Will the test affect my website?',
    answer:
      'Pentor uses controlled checks designed to minimize impact on your website. Our automated checks avoid aggressive or destructive techniques. That said, no testing is completely without load — if you operate a high-traffic or sensitive production environment, let us know in advance.',
  },
  {
    question: 'What is the difference between automated and human testing?',
    answer:
      'Automated tests run predefined checks quickly and at scale, giving you a fast security snapshot. A human pentest is a manual assessment by a vetted white-hat specialist who thinks like an attacker, validates findings, and maps attack paths. Automated testing is great for ongoing coverage; human testing goes deeper.',
  },
  {
    question: 'Do I need technical knowledge?',
    answer:
      'No. Pentor is built for small-business owners, founders, and developers. Every finding includes a plain-language explanation of what was observed, why it matters to your business, and a recommended fix. You can share reports with a developer or use our human pentest service for guided remediation.',
  },
  {
    question: 'What happens after Pentor finds a vulnerability?',
    answer:
      'Your report lists each finding with a severity, business impact, and recommended action, sorted by priority. You can acknowledge, fix, or accept the risk for each finding, then run the test again to confirm the issue is resolved. For deeper help, you can request a human review.',
  },
  {
    question: 'Does Pentor guarantee that my website is secure?',
    answer:
      'No security assessment can prove the absence of every vulnerability. Pentor gives you a clear picture of the issues we can detect and helps you prioritize fixes, but security is an ongoing process. We recommend continuous monitoring and periodic human testing for the strongest posture.',
  },
];
