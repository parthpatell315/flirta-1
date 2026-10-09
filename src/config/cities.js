// Permitted Cities for Flirta: Gujarat Cities, Mumbai, and Indore only
const ALLOWED_CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Gandhinagar',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Anand',
  'Navsari',
  'Morbi',
  'Bharuch',
  'Mehsana',
  'Bhuj',
  'Porbandar',
  'Valsad',
  'Vapi',
  'Mumbai',
  'Indore'
];

function sanitizeCity(inputCity) {
  if (!inputCity) return 'Ahmedabad';
  const clean = String(inputCity).trim();
  const match = ALLOWED_CITIES.find(c => c.toLowerCase() === clean.toLowerCase());
  return match || 'Ahmedabad';
}

module.exports = {
  ALLOWED_CITIES,
  sanitizeCity
};
