// GarbaJodi Safety Modals & Toast Utilities

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function openReportModal(targetType, targetId, targetName = 'Content') {
  const modal = document.getElementById('report-modal');
  if (!modal) return;

  document.getElementById('report-target-type').value = targetType;
  document.getElementById('report-target-id').value = targetId;
  document.getElementById('report-target-name').textContent = `Reporting ${targetType}: "${targetName}"`;
  document.getElementById('report-reason').value = '';
  document.getElementById('report-details').value = '';

  modal.classList.add('open');
}

function closeReportModal() {
  const modal = document.getElementById('report-modal');
  if (modal) modal.classList.remove('open');
}

async function handleReportSubmit(e) {
  e.preventDefault();
  const targetType = document.getElementById('report-target-type').value;
  const targetId = document.getElementById('report-target-id').value;
  const reason = document.getElementById('report-reason').value;
  const details = document.getElementById('report-details').value;

  if (!reason.trim()) {
    showToast('Please select or specify a reason.', 'error');
    return;
  }

  try {
    await API.post('/api/safety/report', {
      targetType,
      targetId,
      reason,
      details
    });
    showToast('Report submitted. Our moderation team will investigate.', 'success');
    closeReportModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function promptBlockUser(userId, userName) {
  if (!confirm(`Are you sure you want to block ${userName}? They will no longer be able to message you, match with you, or see your profile.`)) {
    return;
  }

  try {
    const res = await API.post('/api/safety/block', { targetUserId: userId });
    showToast(res.message || 'User blocked.', 'success');
    // Refresh view
    if (window.Router) {
      window.Router.renderCurrentRoute();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.showToast = showToast;
window.openReportModal = openReportModal;
window.closeReportModal = closeReportModal;
window.handleReportSubmit = handleReportSubmit;
window.promptBlockUser = promptBlockUser;
