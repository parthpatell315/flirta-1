const { getDb } = require('./database');
const path = require('path');
const fs = require('fs');

const cleanFemale = JSON.parse(fs.readFileSync(path.join(__dirname, '../../clean_female_urls.json'), 'utf-8'));
const cleanMale = JSON.parse(fs.readFileSync(path.join(__dirname, '../../clean_male_urls.json'), 'utf-8'));

// Also add our confirmed high-res festive portraits
const FEATURED_INDIAN_FEMALE = [
  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb', // Traditional bridal/garba saree with bindi
  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b', // Twirling lehenga with dupatta
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c', // Purple & gold silk saree with jewelry
  ...cleanFemale
];

const FEATURED_INDIAN_MALE = [
  ...cleanMale
];

const FEMALE_NAMES = new Set([
  'diya', 'ananya', 'priya', 'riya', 'pooja', 'tanvi', 'kruti', 'dhwani', 'janki', 'nidhi',
  'hetal', 'forum', 'kinjal', 'mansi', 'khushi', 'shreya', 'isha', 'urvashi', 'riddhi', 'siddhi',
  'aayushi', 'bhoomi', 'charmi', 'drashti', 'esha', 'falguni', 'grishma', 'hiral', 'ishani', 'jinal',
  'komal', 'maitri', 'neha', 'payal', 'radhika', 'sneha', 'twinkle', 'vidhi', 'yashvi', 'zeel',
  'krupali', 'bansi', 'disha', 'foram', 'gopi', 'heli', 'jagruti', 'khyati', 'mona', 'nirali',
  'prachi', 'roshni', 'swati', 'tejal', 'urja', 'vaishali', 'yami', 'avani', 'binita', 'chandni',
  'devanshi', 'hemali', 'janvi', 'kajal', 'labdhi', 'meera', 'namrata', 'palak', 'rutu', 'shruti',
  'trisha', 'unnati', 'vanshika', 'vrinda', 'archana', 'barkha', 'chetna', 'deepa', 'garima', 'harsha',
  'ishita', 'juhi', 'kashish', 'leena', 'muskan', 'nupur', 'pinal', 'reena', 'shivani', 'tina',
  'upasana', 'vandana', 'yukti', 'ami', 'bhavna', 'charmy', 'darshana', 'ekta', 'fenil', 'geeta',
  'heena', 'ila', 'jayshree', 'kavita', 'kavya', 'laxmi', 'madhuri', 'nisha', 'parul', 'rekha', 'sangeeta',
  'trupti', 'varsha', 'zalak', 'dhara', 'khushboo', 'kinari', 'minal', 'pratibha', 'sapna', 'sonal'
]);

function buildPhotoUrl(baseUrl, index) {
  const crops = ['crop=faces,top', 'crop=faces', 'crop=top', 'crop=faces,center'];
  const crop = crops[index % crops.length];
  const q = 80 + (index % 5);
  return `${baseUrl}?auto=format&fit=crop&${crop}&w=640&h=800&q=${q}`;
}

async function migrateAllPhotosToRealIndian() {
  const db = getDb();
  console.log('Migrating all database photos to 100% verified real Indian human photos...');

  const profiles = db.prepare(`
    SELECT p.id, p.user_id, p.display_name, u.email
    FROM profiles p
    JOIN users u ON u.id = p.user_id
  `).all();

  console.log(`Found ${profiles.length} profiles to update.`);

  const updatePhoto = db.prepare(`
    UPDATE profile_photos
    SET photo_url = ?
    WHERE id = ?
  `);

  const getProfilePhotos = db.prepare(`
    SELECT id, is_primary
    FROM profile_photos
    WHERE profile_id = ?
    ORDER BY is_primary DESC, id ASC
  `);

  db.exec('BEGIN IMMEDIATE');

  try {
    let femaleCount = 0;
    let maleCount = 0;
    let totalPhotosUpdated = 0;

    for (let i = 0; i < profiles.length; i++) {
      const prof = profiles[i];
      const firstName = (prof.display_name.split(' ')[0] || '').toLowerCase();
      const isFemale = prof.email.includes('dancer_f_') || FEMALE_NAMES.has(firstName);

      const photoList = isFemale ? FEATURED_INDIAN_FEMALE : FEATURED_INDIAN_MALE;
      const baseIdx = isFemale ? (femaleCount++) : (maleCount++);

      const photos = getProfilePhotos.all(prof.id);
      for (let pIdx = 0; pIdx < photos.length; pIdx++) {
        const photoRow = photos[pIdx];
        const selectedBase = photoList[(baseIdx + pIdx * 7) % photoList.length];
        const newUrl = buildPhotoUrl(selectedBase, baseIdx + pIdx);

        updatePhoto.run(newUrl, photoRow.id);
        totalPhotosUpdated++;
      }
    }

    db.exec('COMMIT');
    console.log(`Successfully migrated ${totalPhotosUpdated} photos!`);
    console.log(`Female profiles processed: ${femaleCount}, Male profiles processed: ${maleCount}`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateAllPhotosToRealIndian().then(() => {
    console.log('Migration completed.');
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  migrateAllPhotosToRealIndian,
  FEATURED_INDIAN_FEMALE,
  FEATURED_INDIAN_MALE
};
