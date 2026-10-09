// Flirta Legal, Safety & Statutory Grievance Redressal System (IT Act 2000, IT Rules 2021, DPDP Act 2023)

const Legal = {
  activeTab: 'terms',

  open(tab = 'terms') {
    this.activeTab = tab;
    let modal = document.getElementById('legal-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'legal-modal';
      modal.className = 'modal-overlay';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      document.body.appendChild(modal);
    }

    this.renderModalContent(modal);
    modal.classList.add('open');
  },

  close() {
    const modal = document.getElementById('legal-modal');
    if (modal) modal.classList.remove('open');
  },

  switchTab(tab) {
    this.activeTab = tab;
    const modal = document.getElementById('legal-modal');
    if (modal) this.renderModalContent(modal);
  },

  renderModalContent(modal) {
    modal.innerHTML = `
      <div class="modal-box" style="max-width: 820px; max-height: 88vh; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
        <!-- Header -->
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: #FFFFFF;">
          <div>
            <div style="font-size: 0.76rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.08em; color: var(--color-primary);">Trust, Safety & Legal Governance</div>
            <h2 style="font-size: 1.4rem; margin: 2px 0 0 0; color: var(--color-text-primary);">Flirta Compliance Center</h2>
          </div>
          <button class="close-btn" onclick="Legal.close()" style="background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--color-text-muted);">×</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 4px; padding: 10px 20px; background: #F8F9FA; border-bottom: 1px solid var(--color-border); overflow-x: auto;">
          <button class="btn btn-sm ${this.activeTab === 'terms' ? 'btn-primary' : 'btn-secondary'}" onclick="Legal.switchTab('terms')">Terms of Service</button>
          <button class="btn btn-sm ${this.activeTab === 'anti-escort' ? 'btn-primary' : 'btn-secondary'}" onclick="Legal.switchTab('anti-escort')">Anti-Escort Policy</button>
          <button class="btn btn-sm ${this.activeTab === 'privacy' ? 'btn-primary' : 'btn-secondary'}" onclick="Legal.switchTab('privacy')">Privacy Policy</button>
          <button class="btn btn-sm ${this.activeTab === 'safety' ? 'btn-primary' : 'btn-secondary'}" onclick="Legal.switchTab('safety')">Offline Safety</button>
          <button class="btn btn-sm ${this.activeTab === 'grievance' ? 'btn-primary' : 'btn-secondary'}" onclick="Legal.switchTab('grievance')">Grievance Redressal</button>
        </div>

        <!-- Scrollable Content Area -->
        <div style="padding: 26px; overflow-y: auto; font-size: 0.92rem; line-height: 1.65; color: #333333; flex: 1;">
          ${this.getTabContent(this.activeTab)}
        </div>

        <!-- Footer -->
        <div style="padding: 14px 24px; border-top: 1px solid var(--color-border); background: #F8F9FA; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #666666;">
          <span>Governed under Information Technology Act, 2000 & IT Rules 2021</span>
          <button class="btn btn-secondary btn-sm" onclick="Legal.close()">Close</button>
        </div>
      </div>
    `;
  },

  getTabContent(tab) {
    switch (tab) {
      case 'terms':
        return `
          <h3 style="margin-top: 0; color: var(--color-text-primary);">Terms of Service & User Agreement</h3>
          <p style="color: #666; font-size: 0.85rem;">Effective Date: Navratri Season 2026 | Jurisdiction: Ahmedabad, Gujarat, India</p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">1. Status as an Intermediary (Safe Harbour Protection)</h4>
          <p>
            Flirta operates strictly as an "Intermediary" as defined under <strong>Section 2(1)(w) of the Information Technology Act, 2000</strong>.
            Under <strong>Section 79 of the IT Act, 2000</strong>, Flirta and its operators do not initiate the transmission, do not select the receiver of the transmission, and do not modify the content contained in any transmission. Flirta exercises no editorial control over user-generated profiles or chat communications.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">2. Strict 18+ Age Eligibility & POCSO Compliance</h4>
          <p>
            This platform is strictly restricted to consenting adults aged <strong>18 years or older</strong>. Creating an account, posing as an adult, or facilitating access for minors is strictly unlawful under the <strong>Protection of Children from Sexual Offences (POCSO) Act, 2012</strong> and the <strong>Indian Contract Act, 1872</strong>. Any suspected underage account will be permanently terminated without notice.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">3. Absolute Disclaimer of Offline Liability</h4>
          <p>
            Flirta is an online cultural social discovery and dance networking tool. <strong>Flirta does not conduct background checks, criminal vetting, or physical verification of users</strong>.
            Any meeting, interaction, date, attendance at Garba grounds, travel, or engagement that takes place outside the digital application is conducted entirely at the user's sole risk and discretion.
            Under no circumstances shall Flirta, its founders, directors, employees, or contractors be liable for any physical harm, injury, assault, property damage, dispute, financial loss, or psychological distress resulting from offline meetings.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">4. Digital Subscription & No-Guarantee Policy</h4>
          <p>
            Subscription passes (Spark, Chemistry, Attraction, Dream Match) grant digital algorithm access, daily interest allowances, and visibility tools for the 9 nights of Navratri 2026.
            <strong>Flirta does NOT guarantee:</strong> (a) that you will find a dance partner, (b) that other users will respond or match with you, (c) that offline meetings will materialize, or (d) any romantic outcome.
            All purchases are single-payment, non-recurring, and <strong>strictly non-refundable</strong> once service access is unlocked.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">5. User Indemnification</h4>
          <p>
            You agree to defend, indemnify, and hold harmless Flirta and its operators from and against any claims, liabilities, damages, losses, costs, or expenses (including legal fees and police complaints) arising from or relating to your violation of these Terms, misrepresentation of identity, or your offline conduct.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">6. Governing Law & Exclusive Jurisdiction</h4>
          <p>
            These Terms are governed exclusively by the laws of India. Any legal dispute, arbitration, or proceeding shall be subject to the exclusive jurisdiction of the competent courts in <strong>Ahmedabad, Gujarat, India</strong>.
          </p>
        `;

      case 'anti-escort':
        return `
          <h3 style="margin-top: 0; color: var(--color-danger);">Zero-Tolerance Anti-Escort & Non-Commercial Policy</h3>
          <div style="background: rgba(236,29,36,0.06); border-left: 4px solid var(--color-primary); padding: 14px; margin-bottom: 20px; border-radius: 4px;">
            <strong>Important Legal Warning:</strong> Flirta is exclusively a cultural dance partner discovery platform. Any solicitation, commercial companion arrangement, or sex work is strictly illegal and will result in an immediate permanent ban and referral to law enforcement.
          </div>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">1. Strict Compliance with Immoral Traffic (Prevention) Act (ITPA)</h4>
          <p>
            Under the <strong>Immoral Traffic (Prevention) Act, 1956</strong> and the <strong>Bharatiya Nyaya Sanhita, 2023 (BNS)</strong>, using any digital medium to solicit, recruit, facilitate, or offer paid companion services, prostitution, or transactional intimacy is a cognizable criminal offense.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">2. Expressly Prohibited Conduct</h4>
          <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li>Offering or asking for money, gift cards, luxury items, or financial consideration in exchange for attending Garba, dates, or companionship.</li>
            <li>Operating escort services, call services, massage services, or paid accompaniment.</li>
            <li>Posting external links, WhatsApp numbers, Telegram handles, or payment links for transactional arrangements.</li>
            <li>Blackmail, sextortion, or threats to leak private photos or chats (strictly punishable under Section 66E and Section 67A of the IT Act).</li>
          </ul>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">3. Cooperation with Cyber Crime Authorities</h4>
          <p>
            Flirta cooperates proactively with the <strong>National Cyber Crime Reporting Portal (cybercrime.gov.in)</strong> and state police cyber cells in Gujarat, Maharashtra, and Madhya Pradesh. Suspicious activity logs, IP addresses, and communication logs will be surrendered to authorized investigating officers under Section 91 of the CrPC / Section 94 of BNSS.
          </p>
        `;

      case 'privacy':
        return `
          <h3 style="margin-top: 0; color: var(--color-text-primary);">Privacy Policy & DPDP Act 2023 Compliance</h3>
          <p style="color: #666; font-size: 0.85rem;">Compliance with Digital Personal Data Protection Act, 2023 (DPDP Act)</p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">1. Data We Collect</h4>
          <p>
            We collect only the minimum necessary data to provide partner discovery: email address, display name, age, city, dance experience level, bio, and optional profile photos.
            <strong>We NEVER publish your email address or private phone number on your public profile.</strong>
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">2. Purpose Limitation</h4>
          <p>
            Your information is processed strictly for algorithmic matching, age verification (18+), fraud prevention, and session management. We do not sell, rent, or trade your personal data to third-party data brokers.
          </p>

          <h4 style="margin: 18px 0 6px 0; color: var(--color-text-primary);">3. Right to Erasure & Account Deletion</h4>
          <p>
            Under Section 12 of the DPDP Act 2023, you have the statutory right to withdraw consent and request immediate erasure of your personal data.
            You can delete your account at any time through your Profile Settings. Upon deletion, your photos, chat history, likes, and profile are immediately and permanently purged from active databases.
          </p>
        `;

      case 'safety':
        return `
          <h3 style="margin-top: 0; color: var(--color-text-primary);">Community Safety & Offline Meeting Advisory</h3>
          <p style="color: #666; font-size: 0.85rem;">Practical guidance for safe festive partner discovery during Navratri 2026</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 18px 0;">
            <div style="background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 16px;">
              <strong style="color: #059669; display: block; margin-bottom: 8px;">What You SHOULD Do:</strong>
              <ul style="padding-left: 18px; margin: 0; font-size: 0.88rem; display: flex; flex-direction: column; gap: 6px;">
                <li>Meet strictly inside public, well-lit, authorized Navratri festival grounds.</li>
                <li>Arrive with your own transportation and arrange your own return ride.</li>
                <li>Inform a trusted friend or family member of your whereabouts.</li>
                <li>Keep your mobile phone charged and carry emergency contact numbers.</li>
              </ul>
            </div>

            <div style="background: rgba(236,29,36,0.06); border: 1px solid rgba(236,29,36,0.3); border-radius: 8px; padding: 16px;">
              <strong style="color: var(--color-primary); display: block; margin-bottom: 8px;">What You MUST NOT Do:</strong>
              <ul style="padding-left: 18px; margin: 0; font-size: 0.88rem; display: flex; flex-direction: column; gap: 6px;">
                <li>NEVER send money, UPI transfers, or cash to anyone you met on the platform.</li>
                <li>NEVER buy passes or tickets on behalf of a stranger promising to reimburse you.</li>
                <li>NEVER agree to meet in isolated, secluded, or private hotel locations.</li>
                <li>NEVER share bank details, OTPs, or government identity documents in chat.</li>
              </ul>
            </div>
          </div>
        `;

      case 'grievance':
        return `
          <h3 style="margin-top: 0; color: var(--color-text-primary);">Statutory Grievance Redressal Mechanism</h3>
          <p style="color: #666; font-size: 0.85rem;">In compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines) Rules, 2021</p>

          <div style="background: #F8F9FA; border: 1px solid var(--color-border); border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 0.88rem;">
            <strong style="display: block; margin-bottom: 4px; color: var(--color-text-primary);">Designated Grievance & Compliance Officer:</strong>
            <div>Name: Compliance & Grievance Redressal Team</div>
            <div>Designation: Chief Compliance & Grievance Officer</div>
            <div>Corporate Address: Navrangpura, S.G. Highway, Ahmedabad, Gujarat 380009, India</div>
            <div>Email: <a href="mailto:compliance@flirta.in" style="color: var(--color-primary);">compliance@flirta.in</a> / <a href="mailto:grievance@flirta.in" style="color: var(--color-primary);">grievance@flirta.in</a></div>
            <div style="margin-top: 8px; color: #555;">Statutory Turnaround: Acknowledgment within <strong>24 hours</strong>; Redressal within <strong>15 days</strong>. Non-consensual imagery or impersonation complaints are reviewed within <strong>24 hours</strong>.</div>
          </div>

          <h4 style="margin: 0 0 12px 0; color: var(--color-text-primary);">Submit an Official Statutory Grievance Ticket</h4>
          <form onsubmit="Legal.handleGrievanceSubmit(event)" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" style="font-size: 0.82rem;">Your Legal Name *</label>
                <input type="text" id="grv-name" class="form-control" required placeholder="Full Name">
              </div>
              <div>
                <label class="form-label" style="font-size: 0.82rem;">Your Email Address *</label>
                <input type="email" id="grv-email" class="form-control" required placeholder="email@domain.com">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label class="form-label" style="font-size: 0.82rem;">Phone Number (Optional)</label>
                <input type="tel" id="grv-phone" class="form-control" placeholder="+91 98765 43210">
              </div>
              <div>
                <label class="form-label" style="font-size: 0.82rem;">Grievance Category *</label>
                <select id="grv-category" class="form-control" required>
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

            <div>
              <label class="form-label" style="font-size: 0.82rem;">Subject *</label>
              <input type="text" id="grv-subject" class="form-control" required placeholder="Brief summary of statutory complaint">
            </div>

            <div>
              <label class="form-label" style="font-size: 0.82rem;">Reported User Profile or Identifier (Optional)</label>
              <input type="text" id="grv-target" class="form-control" placeholder="User Name / Email / Profile details">
            </div>

            <div>
              <label class="form-label" style="font-size: 0.82rem;">Detailed Description & Evidence *</label>
              <textarea id="grv-desc" class="form-control" rows="4" required placeholder="Provide full details of the incident or grievance..."></textarea>
            </div>

            <button type="submit" id="grv-submit-btn" class="btn btn-primary" style="align-self: flex-start; padding: 10px 24px;">
              Register Official Grievance Ticket
            </button>
          </form>
          <div id="grv-response-msg" style="margin-top: 14px;"></div>
        `;
    }
  },

  async handleGrievanceSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('grv-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Registering Ticket...';

    const payload = {
      name: document.getElementById('grv-name').value,
      email: document.getElementById('grv-email').value,
      phone: document.getElementById('grv-phone').value,
      category: document.getElementById('grv-category').value,
      subject: document.getElementById('grv-subject').value,
      reportedTarget: document.getElementById('grv-target').value,
      description: document.getElementById('grv-desc').value
    };

    try {
      const res = await API.post('/api/safety/grievance', payload);
      const msgDiv = document.getElementById('grv-response-msg');
      msgDiv.innerHTML = `
        <div style="background: rgba(16,185,129,0.1); border: 1px solid #10B981; padding: 14px; border-radius: 6px; color: #065F46; font-size: 0.88rem;">
          <strong style="display: block; margin-bottom: 4px;">Grievance Successfully Registered</strong>
          <div>Ticket Reference ID: <strong>${res.ticketId}</strong></div>
          <div style="margin-top: 4px;">${res.acknowledgment}</div>
        </div>
      `;
      btn.style.display = 'none';
      showToast(`Grievance ticket ${res.ticketId} registered.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Register Official Grievance Ticket';
    }
  }
};

window.Legal = Legal;
