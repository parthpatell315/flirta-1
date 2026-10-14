const LegalPages = {
  render() {
    const path = window.location.pathname;
    const copy = window.COPY || {};
    const rules = window.RULES || { referral: {}, host: {}, plans: {} };
    const pages = {
      '/privacy': {
        title: 'Privacy Policy',
        body: `<p>${copy.privacySummary || ''}</p>
          <p>We store your email or phone, date of birth, city, photos, likes, matches, messages, subscription payments, referral rewards, and host ledger rows. Photo verification selfies are visible to moderators until the request is decided.</p>
          <p>You can delete your account from your profile. That removes your user record and related personal data stored in this app.</p>`
      },
      '/terms': {
        title: 'Terms',
        body: `<p>${copy.termsSummary || ''}</p>
          <p>Free accounts have a limited number of likes per day. Paid plans, boosts, and Super Likes are described on the Plans page with their actual prices. Referral rewards follow the caps shown on your profile and are created only from recorded events.</p>
          <p>${rules.referral.order || ''}</p>
          <p>${rules.host.explanation || ''}</p>`
      },
      '/safety': {
        title: 'Safety',
        body: `<p>${copy.safetyChat || ''}</p>
          <ul>
            <li>You must be 18 or older.</li>
            <li>You can report a profile or message and block someone.</li>
            <li>Photo verification is a selfie review. It is not a criminal background check.</li>
            <li>Meet in a public place if you choose to meet.</li>
          </ul>`
      },
      '/refund-policy': {
        title: 'Refunds',
        body: `<p>Subscription and consumable charges are listed before you pay. Contact support from the Contact page if a captured payment should be reviewed. Host payouts are requests against captured ledger balances and are not automatic income.</p>`
      },
      '/contact': {
        title: 'Contact',
        body: `<p>For account, billing, or safety issues, use the grievance form or email the address published by the operator of this deployment.</p>`
      },
      '/grievance': {
        title: 'Grievance',
        body: `<p>Use this form for a statutory grievance. Submissions are stored and reviewed by an administrator.</p>
          <form onsubmit="LegalPages.submitGrievance(event)" style="display:grid;gap:10px;max-width:520px;">
            <input class="form-control" id="g-name" placeholder="Name" required>
            <input class="form-control" id="g-email" type="email" placeholder="Email" required>
            <input class="form-control" id="g-subject" placeholder="Subject" required>
            <textarea class="form-control" id="g-description" placeholder="What happened" required></textarea>
            <button class="btn btn-primary" type="submit">Submit</button>
            <p id="g-status"></p>
          </form>`
      },
      '/anti-escort-policy': {
        title: 'No paid companionship',
        body: `<p>Flirta is a dating app. Do not offer or request money for dates, companionship, or sexual services. Host gifts and sessions are optional payments inside the app and are recorded on the host ledger. They are not a license to solicit offline.</p>`
      }
    };

    const page = pages[path] || pages['/terms'];
    document.getElementById('main-content').innerHTML = `
      <div class="container" style="max-width: 760px; padding-bottom: 40px;">
        <h1>${page.title}</h1>
        ${page.body}
      </div>
    `;
  },

  async submitGrievance(e) {
    e.preventDefault();
    const status = document.getElementById('g-status');
    try {
      const res = await API.post('/api/safety/grievance', {
        name: document.getElementById('g-name').value.trim(),
        email: document.getElementById('g-email').value.trim(),
        category: 'other',
        subject: document.getElementById('g-subject').value.trim(),
        description: document.getElementById('g-description').value.trim()
      });
      if (status) status.textContent = `Submitted. Ticket ${res.ticketId}.`;
    } catch (err) {
      if (status) status.textContent = err.message;
    }
  }
};

window.LegalPages = LegalPages;
