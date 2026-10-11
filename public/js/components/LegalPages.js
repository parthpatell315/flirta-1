// Flirta Compliance, Trust, Safety & Legal Pages
// Indian Regulatory Alignment: IT Act 2000 (Section 79 Intermediary), IT Rules 2021 (Rule 3(2)), DPDP Act 2023, ITPA 1956

const LegalPages = {
  routesMeta: {
    '/terms': { title: 'Terms of Service', tag: 'User Agreement & Disclaimers' },
    '/privacy': { title: 'Privacy Policy', tag: 'DPDP Act 2023 Compliance' },
    '/anti-escort-policy': { title: 'Anti-Escort Policy', tag: 'Zero-Tolerance Solicitation Ban' },
    '/safety': { title: 'Community Safety', tag: 'Navratri Ground & Meeting Advisory' },
    '/refund-policy': { title: 'Refund Policy', tag: '7-Day No-Match Guarantee' },
    '/contact': { title: 'Contact & Support', tag: 'Helpdesk & Official Channels' },
    '/grievance': { title: 'Grievance Redressal', tag: 'Rule 3(2) IT Rules 2021' }
  },

  render() {
    const path = window.location.pathname || '/terms';
    const activeRoute = this.normalizeRoute(path);
    const meta = this.routesMeta[activeRoute] || this.routesMeta['/terms'];

    const container = document.getElementById('main-content');
    if (!container) return;

    container.innerHTML = `
      <div class="legal-page-container" style="max-width: 960px; margin: 0 auto; padding: 32px 18px 80px;">
        <!-- Breadcrumb / Header -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.82rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">
            <span>Flirta Legal & Trust Center</span>
            <span>·</span>
            <span>${meta.tag}</span>
          </div>
          <h1 style="font-size: clamp(1.6rem, 4vw, 2.3rem); margin: 0 0 10px 0; color: var(--color-text-primary); font-family: 'Outfit', sans-serif;">
            ${meta.title}
          </h1>
          <p style="color: var(--color-text-secondary); font-size: 0.88rem; margin: 0;">
            Navratri Season 2026 Edition | Jurisdiction: Ahmedabad, Gujarat, India
          </p>
        </div>

        <!-- Horizontal Tab Navigation Bar -->
        <nav class="legal-nav-tabs" style="display: flex; gap: 8px; margin-bottom: 28px; overflow-x: auto; padding-bottom: 6px; -webkit-overflow-scrolling: touch; border-bottom: 1px solid var(--color-border);" aria-label="Legal document navigation">
          <a href="/terms" data-link class="btn btn-sm ${activeRoute === '/terms' ? 'btn-primary' : 'btn-secondary'}">Terms of Service</a>
          <a href="/privacy" data-link class="btn btn-sm ${activeRoute === '/privacy' ? 'btn-primary' : 'btn-secondary'}">Privacy Policy</a>
          <a href="/anti-escort-policy" data-link class="btn btn-sm ${activeRoute === '/anti-escort-policy' ? 'btn-primary' : 'btn-secondary'}">Anti-Escort Policy</a>
          <a href="/safety" data-link class="btn btn-sm ${activeRoute === '/safety' ? 'btn-primary' : 'btn-secondary'}">Safety Advisory</a>
          <a href="/refund-policy" data-link class="btn btn-sm ${activeRoute === '/refund-policy' ? 'btn-primary' : 'btn-secondary'}">Refund Guarantee</a>
          <a href="/contact" data-link class="btn btn-sm ${activeRoute === '/contact' ? 'btn-primary' : 'btn-secondary'}">Contact Us</a>
          <a href="/grievance" data-link class="btn btn-sm ${activeRoute === '/grievance' ? 'btn-primary' : 'btn-secondary'}">Grievance Officer</a>
        </nav>

        <!-- Document Card -->
        <article class="card legal-document-card" style="padding: clamp(20px, 4vw, 36px); line-height: 1.7; font-size: 0.95rem; color: #2D3748; background: #FFFFFF; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          ${this.getContent(activeRoute)}
        </article>

        <!-- Document Footer Assurance -->
        <div style="margin-top: 24px; padding: 18px 22px; background: rgba(255, 46, 126, 0.04); border: 1px solid rgba(255, 46, 126, 0.18); border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; font-size: 0.84rem;">
          <div>
            <strong style="color: var(--color-text-primary); display: block;">Questions regarding our legal standards or safety?</strong>
            <span style="color: var(--color-text-secondary);">Direct inquiries to our grievance and legal desk: <a href="mailto:[EMAIL]" style="color: var(--color-primary); font-weight: 600;">[EMAIL]</a></span>
          </div>
          <a href="/grievance" data-link class="btn btn-secondary btn-sm">Submit Statutory Grievance</a>
        </div>
      </div>
    `;

    window.scrollTo(0, 0);
  },

  normalizeRoute(path) {
    if (path.startsWith('/terms')) return '/terms';
    if (path.startsWith('/privacy')) return '/privacy';
    if (path.startsWith('/anti-escort-policy') || path.startsWith('/anti-escort')) return '/anti-escort-policy';
    if (path.startsWith('/safety')) return '/safety';
    if (path.startsWith('/refund-policy') || path.startsWith('/refund')) return '/refund-policy';
    if (path.startsWith('/contact')) return '/contact';
    if (path.startsWith('/grievance')) return '/grievance';
    return '/terms';
  },

  getContent(route) {
    switch (route) {
      case '/terms':
        return `
          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">1. Agreement to Terms & Identity of Platform</h2>
          <p>
            Welcome to <strong>Flirta</strong> (flirta.network), operated by <strong>[COMPANY NAME]</strong> ("we", "us", or "our"), having its registered address at <strong>[ADDRESS]</strong>.
            Flirta is a specialized social discovery and cultural networking platform designed to help consenting adults connect with compatible dance partners for the Navratri 2026 festival season in Gujarat and select cities across India.
          </p>
          <p>
            By creating an account, browsing profiles, or purchasing digital passes on Flirta, you expressly agree to be bound by these Terms of Service, our Privacy Policy, and our Zero-Tolerance Anti-Escort Policy. If you do not agree to every clause herein, you must immediately cease using the platform.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">2. Intermediary Status & Safe Harbour Protection (IT Act 2000)</h2>
          <p>
            Flirta operates strictly as an <strong>"Intermediary"</strong> under <strong>Section 2(1)(w) of the Information Technology Act, 2000</strong>. Pursuant to <strong>Section 79 of the IT Act, 2000</strong>:
          </p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li>Flirta does not initiate the transmission, select the receiver of any transmission, or select or modify the user content contained in any transmission.</li>
            <li>All profiles, photos, text descriptions, and chat messages are user-generated content (UGC). Flirta does not endorse, verify the truthfulness of, or assume liability for UGC.</li>
            <li>Flirta complies expeditiously with lawful takedown notices and requests from authorized law enforcement authorities under Rule 3 of the IT (Intermediary Guidelines) Rules, 2021.</li>
          </ul>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">3. Strict 18+ Age Eligibility & POCSO Act Compliance</h2>
          <p>
            Participation on Flirta is restricted exclusively to individuals who are <strong>18 years of age or older</strong>. Under the <strong>Indian Contract Act, 1872</strong> and the <strong>Protection of Children from Sexual Offences (POCSO) Act, 2012</strong>, minors are strictly forbidden from creating accounts or interacting on this platform.
          </p>
          <p>
            Users are required to submit an accurate Date of Birth during registration. Any profile found to be created by, on behalf of, or depicting an individual under 18 years of age will be permanently terminated immediately without prior notice, and pertinent logs will be reported to competent child safety authorities.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">4. Absolute Disclaimer of Offline Liability & Meeting Risks</h2>
          <div style="background: rgba(245, 166, 35, 0.08); border-left: 4px solid var(--color-gold); padding: 16px; border-radius: 6px; margin: 18px 0;">
            <strong style="color: #B45309;">CRITICAL NOTICE REGARDING OFFLINE MEETINGS:</strong>
            <p style="margin: 6px 0 0; font-size: 0.92rem;">
              Flirta does NOT perform criminal background checks, police vetting, or in-person verification of registered members. While we verify email credentials, Google authentication, and profile authenticity, digital verification does not guarantee personal character, physical safety, or behavioral intentions.
            </p>
          </div>
          <p>
            Any decision to communicate outside the application, exchange social handles, travel, or meet any person in the physical world (including at public Garba grounds, pandals, clubs, or venues) is undertaken <strong>at your own sole risk, volition, and responsibility</strong>.
          </p>
          <p>
            Under no circumstances shall <strong>[COMPANY NAME]</strong>, its directors, founders, employees, or affiliates be liable for any physical injury, harassment, assault, financial fraud, theft, property loss, or emotional distress arising directly or indirectly from offline meetings or interactions initiated on Flirta.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">5. Account Safety, Reporting & Immediate Blocking</h2>
          <p>
            Flirta empowers users with real-time safety controls:
          </p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>1-Tap Instant Block:</strong> Blocking a user instantly severs all contact, hides your profile from their view, and deletes the active chat history.</li>
            <li><strong>1-Tap Safety Report:</strong> Report any inappropriate language, abusive conduct, solicitation, or suspicious identity directly to our 24/7 moderation queue.</li>
            <li>Users are strictly prohibited from impersonating any real individual or sharing non-consensual imagery.</li>
          </ul>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">6. Digital Purchases, Passes & Non-Romantic Guarantee</h2>
          <p>
            Flirta offers optional digital season passes (e.g. Spark, Chemistry, Attraction, Dream Match) that grant enhanced digital algorithm access, daily interest allowances, and visibility tools for the Navratri season.
          </p>
          <p>
            <strong>No Guarantee of Romantic Outcome:</strong> Flirta is a digital partner-finding tool. We do NOT guarantee that you will receive matches, that other members will accept your dance invitations, or that any romantic or social outcome will occur. Purchases are digital service fees governed by our <a href="/refund-policy" data-link style="color: var(--color-primary); font-weight: 700;">Refund Policy</a>.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">7. Governing Law & Exclusive Jurisdiction</h2>
          <p>
            These Terms and any dispute arising out of or related to Flirta shall be governed by and construed in accordance with the substantive laws of the Republic of India.
            You agree that any legal suit, action, or proceeding shall be instituted exclusively in the competent civil courts of <strong>Ahmedabad, Gujarat, India</strong>.
          </p>
        `;

      case '/privacy':
        return `
          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">1. Commitment to Privacy & DPDP Act 2023</h2>
          <p>
            <strong>[COMPANY NAME]</strong> ("Flirta", "we", "us") values your privacy and is dedicated to handling your personal data responsibly in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act 2023)</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">2. Notice of Personal Data Collected (Data Minimization)</h2>
          <p>We collect only the essential personal data necessary to facilitate dance partner discovery:</p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>Account Identity:</strong> Display name, email address, password hash (encrypted with industry-standard bcrypt/argon2), and verified Date of Birth for 18+ eligibility.</li>
            <li><strong>Google & Email Authentication:</strong> Single Sign-On authentication via Google Identity Services or encrypted email/password. Your private credentials are <strong>NEVER displayed publicly</strong> or shared with other users or your matches.</li>
            <li><strong>Profile & Cultural Preferences:</strong> City of residence, Garba dancing experience level (Beginner/Intermediate/Advanced), preferred dance styles, languages, and optional bio.</li>
            <li><strong>Photos:</strong> Up to 3 photos showcasing your festive attire. Photos are stored securely in protected storage and served over encrypted HTTPS.</li>
            <li><strong>Technical Telemetry:</strong> IP address, device user-agent, and session cookies strictly for security logging, fraud prevention, and session continuity.</li>
          </ul>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">3. Purpose Specification & Lawful Processing</h2>
          <p>Your data is processed strictly for the following specified purposes:</p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li>Matching you with local Garba partners in your designated city during Navratri 2026.</li>
            <li>Verifying 18+ adult age eligibility and guarding against underage entry.</li>
            <li>Preventing spam, bot fraud, commercial harassment, and unlawful solicitation.</li>
            <li>Facilitating secure UPI and digital subscription payments through RBI-licensed gateways (PayU / Razorpay). Flirta never stores your credit card numbers, CVVs, or UPI PINs.</li>
          </ul>
          <p>
            <strong>WE DO NOT SELL, RENT, OR TRADE YOUR PERSONAL DATA</strong> to third-party advertising brokers or commercial data vendors.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">4. User Rights under DPDP Act 2023 (Right to Erasure & Deletion)</h2>
          <p>Under Section 12 of the DPDP Act 2023, you hold enforceable statutory rights over your personal data:</p>
          <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 16px; margin: 16px 0;">
            <strong style="color: #059669; display: block; margin-bottom: 6px;">Right to Immediate Erasure (Self-Service 1-Tap Deletion):</strong>
            <p style="margin: 0; font-size: 0.92rem; color: #1F2937;">
              You can permanently delete your entire Flirta account at any time from your <strong>Profile Settings > Delete Account</strong>.
              Upon triggering deletion, your profile, photos, chat history, likes, and account data are immediately and irreversibly purged from our active production database.
            </p>
          </div>
          <p>
            You may also request a formal copy of your data or correction of inaccurate information by writing to our designated Data Protection desk at <strong>[EMAIL]</strong>.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">5. Data Security & Storage</h2>
          <p>
            We implement reasonable security practices including TLS 1.3 encryption in transit, strict httpOnly cookie flags, origin-based CSRF defenses, and localized database protection hosted within secure data centers.
          </p>
        `;

      case '/anti-escort-policy':
        return `
          <div style="background: rgba(239, 68, 68, 0.08); border-left: 5px solid var(--color-danger); padding: 18px; border-radius: 8px; margin-bottom: 24px;">
            <strong style="color: var(--color-danger); font-size: 1.05rem; display: block; margin-bottom: 4px;">
              STATUTORY WARNING: COMMERCIAL SOLICITATION STRICTLY PROHIBITED
            </strong>
            <span style="font-size: 0.92rem; color: #7F1D1D;">
              Flirta is exclusively a cultural dance partner discovery platform for the traditional festival of Navratri. Any escort services, paid companion arrangements, or commercial exploitation will result in immediate police referral.
            </span>
          </div>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">1. Statutory Framework & Prohibited Activities</h2>
          <p>
            In strict compliance with the <strong>Immoral Traffic (Prevention) Act, 1956 (ITPA)</strong>, the <strong>Bharatiya Nyaya Sanhita, 2023 (BNS)</strong>, and <strong>Sections 66E, 67, and 67A of the Information Technology Act, 2000</strong>, the following activities are strictly unlawful and barred on Flirta:
          </p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 10px;">
            <li><strong>Commercial Solicitation:</strong> Requesting, demanding, offering, or accepting monetary consideration, gifts, hotel bookings, or financial transfers in exchange for Garba attendance, dates, companionship, or physical meetings.</li>
            <li><strong>Escort & Call Services:</strong> Advertising, promoting, or operating escort agencies, massage services, commercial call services, or transactional companion services.</li>
            <li><strong>External Payment & Solicitation Handles:</strong> Posting or transmitting external WhatsApp links, Telegram usernames, escort aggregator links, or UPI payment IDs in public profiles or chat rooms for commercial purposes.</li>
            <li><strong>Extortion & Cyber Blackmail:</strong> Sextortion, coercion, threats to leak private conversations, or non-consensual image sharing.</li>
          </ul>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">2. Automated Keyword Filtering & Moderation Queue</h2>
          <p>
            Flirta operates server-side automated safety filters that detect keywords and phrases associated with commercial solicitation, monetary exchange, and adult services.
            Flagged messages are instantly withheld, and offending accounts are routed directly to our priority moderation queue for human administrative inspection.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">3. Enforcement Protocol & Referral to Law Enforcement</h2>
          <p>
            Any user found violating this Anti-Escort Policy will be subjected to the following mandatory enforcement actions:
          </p>
          <ol style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>Immediate Permanent Termination:</strong> Complete account termination with forfeiture of any active passes, with zero entitlement to refund.</li>
            <li><strong>Device & Telecom Blacklisting:</strong> Hardware fingerprints, email addresses, and phone numbers are permanently blacklisted from re-registration.</li>
            <li><strong>Surrender to Cyber Crime Units:</strong> In cases involving commercial syndicates, underage exploitation, or extortion, communication logs and IP telemetry will be formally submitted to the <strong>National Cyber Crime Reporting Portal (cybercrime.gov.in)</strong> and the Gujarat State Cyber Police without requirement of prior notification.</li>
          </ol>
        `;

      case '/safety':
        return `
          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">Festive Safety Advisory for Navratri 2026</h2>
          <p>
            Navratri is Gujarat's most vibrant celebration of devotion, dance, and culture. Flirta is engineered with safety-first principles, especially to create a secure, respectful environment for women.
            Follow these practical safety protocols before, during, and after meeting any dance partner.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin: 24px 0;">
            <div style="background: rgba(16, 185, 129, 0.05); border: 1.5px solid #10B981; border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="background: #10B981; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">✓</span>
                <strong style="color: #065F46; font-size: 1.05rem;">Recommended Safety Practices</strong>
              </div>
              <ul style="padding-left: 18px; margin: 0; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px; color: #1F2937;">
                <li><strong>Public Garba Grounds Only:</strong> Meet strictly inside well-known, crowded, illuminated public venues (e.g. GMDC Ground, United Way, YMCA, Rajpath Club).</li>
                <li><strong>Arrange Independent Travel:</strong> Arrive in your own vehicle, metro, or auto. Never rely on a stranger for transportation on your first meeting.</li>
                <li><strong>Share Live Location:</strong> Inform a trusted friend or family member about the venue and who you are meeting. Keep WhatsApp live location active.</li>
                <li><strong>Verify Badges:</strong> Prioritize connecting with members displaying the green <strong>"✓ Verified"</strong> badge.</li>
              </ul>
            </div>

            <div style="background: rgba(239, 68, 68, 0.05); border: 1.5px solid #EF4444; border-radius: 12px; padding: 20px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                <span style="background: #EF4444; color: #fff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800;">✕</span>
                <strong style="color: #991B1B; font-size: 1.05rem;">Critical Warning Signs & Don'ts</strong>
              </div>
              <ul style="padding-left: 18px; margin: 0; font-size: 0.9rem; display: flex; flex-direction: column; gap: 8px; color: #1F2937;">
                <li><strong>NEVER Send Money or UPI:</strong> Anyone requesting money for entry passes, cab emergencies, or family distress is attempting fraud. Report them immediately.</li>
                <li><strong>No Private or Secluded Spots:</strong> Refuse any requests to meet in hotel rooms, private apartments, or isolated parking areas.</li>
                <li><strong>Do Not Share Sensitive Documents:</strong> Never send copies of Aadhaar, PAN card, banking details, or OTPs in private chat.</li>
                <li><strong>Report Pressure Tactics:</strong> If anyone pressures you to meet immediately or cross personal boundaries, use 1-Tap Block.</li>
              </ul>
            </div>
          </div>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">Women-Centric Privacy Controls on Flirta</h2>
          <p>
            Flirta incorporates purpose-built features for women:
          </p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>Mutual Match Required:</strong> No user can message you without you and your match expressing mutual interest.</li>
            <li><strong>Contact Info Masking:</strong> External phone numbers, payment links, and handles in initial messages are automatically masked to safeguard privacy.</li>
            <li><strong>Discoverability Toggle:</strong> You can toggle your profile off from the public discovery pool anytime while keeping existing matches active.</li>
            <li><strong>Emergency Helplines:</strong> Gujarat Women Helpline: <strong>181</strong> | Police Emergency: <strong>112</strong> | National Cyber Helpline: <strong>1930</strong>.</li>
          </ul>
        `;

      case '/refund-policy':
        return `
          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">1. Digital Passes & Consumer Transparency</h2>
          <p>
            At <strong>[COMPANY NAME]</strong>, we are committed to complete transparency regarding digital purchases on Flirta. All pricing tiers (e.g. Spark, Chemistry, Attraction, Dream Match) are displayed with clear INR amounts prior to payment, without hidden fees or automatic recurring rebills.
          </p>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">2. 7-Day No-Match Refund Guarantee</h2>
          <div style="background: rgba(245, 166, 35, 0.08); border-left: 4px solid var(--color-gold); padding: 18px; border-radius: 8px; margin: 18px 0;">
            <strong style="color: #B45309; font-size: 1.05rem; display: block; margin-bottom: 6px;">Our 7-Day Match Commitment:</strong>
            <p style="margin: 0; font-size: 0.92rem; color: #1F2937;">
              If you purchase a paid Season Pass on Flirta and receive <strong>zero mutual matches within 7 calendar days</strong> of activation, you are entitled to request a <strong>100% full refund</strong> of your purchase price.
            </p>
          </div>

          <h3 style="font-size: 1.15rem; color: var(--color-text-primary); margin-top: 20px;">Eligibility Criteria for the 7-Day Guarantee:</h3>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li>Your profile must have been fully completed with an accurate display name, city, and garba experience level.</li>
            <li>Your account must contain at least one clear primary profile photo showing your face/garba attire.</li>
            <li>You must have actively utilized the platform by sending at least 15 likes/interests across the 7-day period.</li>
            <li>Your account must not have violated the Community Guidelines or Anti-Escort Policy.</li>
          </ul>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">3. Refund Processing & Timelines</h2>
          <p>
            Refund requests can be initiated directly by emailing <strong>[EMAIL]</strong> or messaging our official WhatsApp support at <strong>[WHATSAPP]</strong> with your registered email and transaction reference ID.
          </p>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li><strong>Review Time:</strong> Our customer success desk reviews refund claims within <strong>24 business hours</strong>.</li>
            <li><strong>Reversal Method:</strong> Approved refunds are credited directly back to the original source account (UPI, Netbanking, or Debit/Credit Card) via our authorized payment gateway (PayU / Razorpay).</li>
            <li><strong>Bank Settlement:</strong> Funds typically reflect in your account within <strong>5 to 7 working days</strong>, subject to your issuing bank's clearing cycle.</li>
          </ul>

          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 28px;">4. Ineligible Scenarios</h2>
          <p>
            Refunds are not granted in situations where: (a) a user has successfully formed mutual matches and engaged in chat, (b) the account was terminated for commercial solicitation, fake profile impersonation, or harassment, or (c) the request is submitted after the 7-day warranty window.
          </p>
        `;

      case '/contact':
        return `
          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">Official Support & Helpdesk Channels</h2>
          <p>
            We are here to support your festive experience during Navratri 2026. Reach out directly through any of our official channels:
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 24px 0;">
            <div style="background: #F8F9FA; border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">Direct WhatsApp Support</div>
              <h3 style="font-size: 1.2rem; margin: 0 0 8px 0; color: var(--color-text-primary);">WhatsApp Helpline</h3>
              <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin: 0 0 14px;">Instant queries regarding profile setup, passes, and venue matching.</p>
              <a href="https://wa.me/[WHATSAPP]" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                Chat on WhatsApp: [WHATSAPP]
              </a>
            </div>

            <div style="background: #F8F9FA; border: 1px solid var(--color-border); border-radius: 12px; padding: 20px;">
              <div style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: var(--color-primary); margin-bottom: 4px;">Email Support Desk</div>
              <h3 style="font-size: 1.2rem; margin: 0 0 8px 0; color: var(--color-text-primary);">Official Email</h3>
              <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin: 0 0 14px;">Billing inquiries, verification reviews, and technical assistance.</p>
              <a href="mailto:[EMAIL]" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px;">
                Email: [EMAIL]
              </a>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 12px; padding: 22px; margin-bottom: 24px;">
            <h3 style="font-size: 1.15rem; margin: 0 0 10px 0; color: var(--color-text-primary);">Corporate & Legal Information</h3>
            <div style="font-size: 0.92rem; display: flex; flex-direction: column; gap: 6px; color: #4B5563;">
              <div><strong>Operating Company:</strong> [COMPANY NAME]</div>
              <div><strong>Registered Address:</strong> [ADDRESS]</div>
              <div><strong>Operational Hours:</strong> 10:00 AM – 7:00 PM IST (Mon–Sat)</div>
              <div><strong>Support Turnaround:</strong> Responses dispatched within 12 to 24 hours.</div>
            </div>
          </div>
        `;

      case '/grievance':
        return `
          <h2 style="font-size: 1.4rem; color: var(--color-text-primary); margin-top: 0;">Statutory Grievance Redressal Mechanism</h2>
          <p>
            In compliance with <strong>Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>,
            <strong>[COMPANY NAME]</strong> has designated a dedicated Grievance Officer to acknowledge, investigate, and redress consumer grievances regarding user safety, privacy, and unauthorized content.
          </p>

          <div style="background: #F8F9FA; border: 1.5px solid var(--color-border); border-radius: 12px; padding: 22px; margin: 20px 0;">
            <div style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; color: var(--color-primary); letter-spacing: 0.08em; margin-bottom: 6px;">
              Designated Grievance & Compliance Officer
            </div>
            <h3 style="font-size: 1.25rem; margin: 0 0 12px 0; color: var(--color-text-primary);">[GRIEVANCE OFFICER NAME]</h3>
            <div style="font-size: 0.92rem; display: flex; flex-direction: column; gap: 6px; color: #374151;">
              <div><strong>Designation:</strong> Chief Grievance Officer & Legal Counsel</div>
              <div><strong>Company Entity:</strong> [COMPANY NAME]</div>
              <div><strong>Physical Address:</strong> [ADDRESS]</div>
              <div><strong>Official Email:</strong> <a href="mailto:[EMAIL]" style="color: var(--color-primary); font-weight: 700;">[EMAIL]</a></div>
              <div><strong>Working Hours:</strong> Monday through Friday, 10:00 AM to 6:00 PM IST</div>
            </div>
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--color-border); font-size: 0.85rem; color: #6B7280;">
              <strong>Statutory Turnaround Timelines:</strong> Formal acknowledgment within <strong>24 hours</strong>; ticket investigation and final redressal within <strong>15 days</strong>. Any complaints concerning impersonation, non-consensual sexual imagery, or child protection are actioned within <strong>24 hours</strong>.
            </div>
          </div>

          <h3 style="font-size: 1.2rem; color: var(--color-text-primary); margin-top: 28px; margin-bottom: 12px;">
            Submit an Official Statutory Grievance Ticket
          </h3>
          <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin-bottom: 18px;">
            Fill out the form below. An official reference ticket will be automatically generated and dispatched to our compliance team.
          </p>

          <form onsubmit="LegalPages.handleGrievanceSubmit(event)" style="display: flex; flex-direction: column; gap: 14px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Your Legal Name *</label>
                <input type="text" id="grv-page-name" class="form-control" required placeholder="Full Name">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Your Email Address *</label>
                <input type="email" id="grv-page-email" class="form-control" required placeholder="email@domain.com">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Phone Number (Optional)</label>
                <input type="tel" id="grv-page-phone" class="form-control" placeholder="+91 98765 43210">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Grievance Category *</label>
                <select id="grv-page-category" class="form-control" required>
                  <option value="Impersonation or Fake Profile">Impersonation or Fake Profile</option>
                  <option value="Commercial Solicitation / Escort Services">Commercial Solicitation / Escort Services</option>
                  <option value="Underage Account Violation">Underage Account Violation</option>
                  <option value="Harassment or Threatening Conduct">Harassment or Threatening Conduct</option>
                  <option value="Non-Consensual Photo / Privacy Breach">Non-Consensual Photo / Privacy Breach</option>
                  <option value="Financial Fraud or Payment Grievance">Financial Fraud or Payment Grievance</option>
                  <option value="Other Statutory Grievance">Other Statutory Grievance</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Subject *</label>
              <input type="text" id="grv-page-subject" class="form-control" required placeholder="Concise summary of your complaint">
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Reported User Profile or Identifier (Optional)</label>
              <input type="text" id="grv-page-target" class="form-control" placeholder="User Name / Email / Profile details">
            </div>

            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 700; font-size: 0.84rem;">Detailed Description & Evidence *</label>
              <textarea id="grv-page-desc" class="form-control" rows="4" required placeholder="Provide all relevant details, times, dates, and evidence to assist the Grievance Officer..."></textarea>
            </div>

            <button type="submit" id="grv-page-submit-btn" class="btn btn-primary" style="align-self: flex-start; padding: 12px 28px; margin-top: 4px;">
              Register Official Grievance Ticket
            </button>
          </form>
          <div id="grv-page-response" style="margin-top: 16px;"></div>
        `;

      default:
        return `<p>Content not found.</p>`;
    }
  },

  async handleGrievanceSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('grv-page-submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Registering Ticket...';
    }

    const payload = {
      name: document.getElementById('grv-page-name').value,
      email: document.getElementById('grv-page-email').value,
      phone: document.getElementById('grv-page-phone').value,
      category: document.getElementById('grv-page-category').value,
      subject: document.getElementById('grv-page-subject').value,
      reportedTarget: document.getElementById('grv-page-target').value,
      description: document.getElementById('grv-page-desc').value
    };

    try {
      const res = await API.post('/api/safety/grievance', payload);
      const msgDiv = document.getElementById('grv-page-response');
      if (msgDiv) {
        msgDiv.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10B981; padding: 16px; border-radius: 8px; color: #065F46; font-size: 0.92rem;">
            <strong style="display: block; margin-bottom: 4px; font-size: 1.05rem;">Statutory Grievance Registered Successfully</strong>
            <div>Ticket Reference ID: <strong>${res.ticketId}</strong></div>
            <div style="margin-top: 6px;">${res.acknowledgment}</div>
          </div>
        `;
      }
      if (btn) btn.style.display = 'none';
      if (typeof showToast === 'function') {
        showToast(`Grievance ticket ${res.ticketId} registered.`, 'success');
      }
    } catch (err) {
      if (typeof showToast === 'function') {
        showToast(err.message || 'Failed to submit grievance.', 'error');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Register Official Grievance Ticket';
      }
    }
  }
};

window.LegalPages = LegalPages;
