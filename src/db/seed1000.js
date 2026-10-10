const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

const {
  REAL_INDIAN_FEMALE_PHOTOS: REAL_FEMALE_PHOTOS,
  REAL_INDIAN_MALE_PHOTOS: REAL_MALE_PHOTOS,
  buildIndianPhotoUrl: buildPhotoUrl
} = require('./indianPhotoLibrary');


const FEMALE_FIRST_NAMES = [
  'Diya', 'Ananya', 'Priya', 'Riya', 'Pooja', 'Tanvi', 'Kruti', 'Dhwani', 'Janki', 'Nidhi',
  'Hetal', 'Forum', 'Kinjal', 'Mansi', 'Khushi', 'Shreya', 'Isha', 'Urvashi', 'Riddhi', 'Siddhi',
  'Aayushi', 'Bhoomi', 'Charmi', 'Drashti', 'Esha', 'Falguni', 'Grishma', 'Hiral', 'Ishani', 'Jinal',
  'Komal', 'Maitri', 'Neha', 'Payal', 'Radhika', 'Sneha', 'Twinkle', 'Vidhi', 'Yashvi', 'Zeel',
  'Krupali', 'Bansi', 'Disha', 'Foram', 'Gopi', 'Heli', 'Jagruti', 'Khyati', 'Mona', 'Nirali',
  'Prachi', 'Roshni', 'Swati', 'Tejal', 'Urja', 'Vaishali', 'Yami', 'Avani', 'Binita', 'Chandni',
  'Devanshi', 'Hemali', 'Janvi', 'Kajal', 'Labdhi', 'Meera', 'Namrata', 'Palak', 'Rutu', 'Shruti',
  'Trisha', 'Unnati', 'Vanshika', 'Vrinda', 'Archana', 'Barkha', 'Chetna', 'Deepa', 'Garima', 'Harsha',
  'Ishita', 'Juhi', 'Kashish', 'Leena', 'Muskan', 'Nupur', 'Pinal', 'Reena', 'Shivani', 'Tina',
  'Upasana', 'Vandana', 'Yukti', 'Ami', 'Bhavna', 'Charmy', 'Darshana', 'Ekta', 'Fenil', 'Geeta',
  'Heena', 'Ila', 'Jayshree', 'Kavita', 'Laxmi', 'Madhuri', 'Nisha', 'Parul', 'Rekha', 'Sangeeta',
  'Trupti', 'Varsha', 'Zalak', 'Dhara', 'Khushboo', 'Kinari', 'Minal', 'Pratibha', 'Sapna', 'Sonal'
];

const MALE_FIRST_NAMES = [
  'Rohan', 'Harsh', 'Manav', 'Aakash', 'Jayesh', 'Parth', 'Meet', 'Dev', 'Yash', 'Kevin',
  'Chirag', 'Bhavik', 'Rushabh', 'Tirth', 'Dhyan', 'Kunal', 'Pratik', 'Hardik', 'Nilay', 'Vatsal',
  'Darshan', 'Abhishek', 'Amit', 'Bhavin', 'Chintan', 'Deep', 'Gaurav', 'Hiren', 'Jigar', 'Kalpesh',
  'Mihir', 'Nishant', 'Pranav', 'Rahul', 'Sagar', 'Tapan', 'Umang', 'Vivek', 'Aditya', 'Brijesh',
  'Chetan', 'Dhruv', 'Jay', 'Karan', 'Mayur', 'Nirav', 'Ronak', 'Sanket', 'Tarun', 'Viral'
];

const SURNAMES = [
  'Patel', 'Shah', 'Mehta', 'Desai', 'Joshi', 'Vashi', 'Trivedi', 'Rathod', 'Parikh', 'Dave',
  'Bhatt', 'Pandya', 'Shukla', 'Vyas', 'Raval', 'Solanki', 'Zala', 'Jadeja', 'Vaghela', 'Chudasama',
  'Kothari', 'Sanghavi', 'Gandhi', 'Modi', 'Barot', 'Makwana', 'Dholakia', 'Sompura', 'Majmudar', 'Munshi',
  'Adani', 'Ambani', 'Sarabhai', 'Lalbhai', 'Sheth', 'Dalal', 'Shroff', 'Merchant', 'Kapadia', 'Nanavati',
  'Contractor', 'Mistry', 'Parekh', 'Thakkar', 'Lohana', 'Soni', 'Kansara', 'Panchal', 'Prajapati', 'Sutaria',
  'Vora', 'Chauhan', 'Gohil', 'Parmar', 'Rana', 'Dodia', 'Padhiyar', 'Maru', 'Gadhvi', 'Somani',
  'Agrawal', 'Sharma', 'Verma', 'Gupta', 'Jain', 'Bhandari', 'Shahani', 'Bhatia', 'Malhotra', 'Kapoor'
];

const CITIES = [
  'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar',
  'Bhavnagar', 'Jamnagar', 'Junagadh', 'Anand', 'Navsari',
  'Morbi', 'Bharuch', 'Mehsana', 'Bhuj', 'Porbandar',
  'Valsad', 'Vapi', 'Mumbai', 'Indore'
];

const DANCE_STYLES = [
  'Dodhiya, 3-Taali, Popat',
  'Kathiyawadi Heech, Tran-Taali',
  'Traditional Baroda Style, 3-Taali',
  '2-Taali, Free Style, Heech',
  'Popat, Dodhiya, Dakla',
  'Sanedo, 3-Taali, Heech',
  'Dandiya Raas, Dodhiya',
  'United Way Style, Tran-Taali',
  'Sarsana High-Energy Raas',
  'Kora Kendra Dandiya, 2-Taali',
  'Fast Dodhiya, 3-Taali, Popat',
  'Kathiyawadi Heech & Dholak'
];

const EXPERIENCES = ['beginner', 'intermediate', 'advanced'];

const HOBBIES = [
  'Chaniya Choli Styling, Folk Music',
  'Dandiya Raas, Fitness, Coffee',
  'Traditional Heech, Photography',
  'Bandhani Design, Dhol Beats',
  'Folk Singing, Garba Choreography',
  'Cultural Events, Travel, Badminton',
  'Dodhiya Raas, Street Food, Fashion',
  'Dholak, Live Folk Orchestra, Dance'
];

const BIOS_FEMALE = [
  'Lifelong Garba lover! Looking for an energetic partner to sync Dodhiya steps and celebrate Navratri 2026.',
  'Ready with traditional Chaniya Choli for United Way Vadodara! Looking for a dedicated dance partner for all 9 nights.',
  'Loves fast-paced Heech and Dhol beats. Seeking someone who can match the rhythm and festival enthusiasm.',
  'Passionate about traditional Kathiyawadi Heech and Tran-Taali. Excited to celebrate every night with pure energy!',
  'Navratri is my absolute favorite festival of the year! Excited to find a partner who loves Garba as much as I do.',
  'Surat Garba enthusiast! Love vibrant celebrations, live folk orchestra, and meeting friendly cultural dance lovers.',
  'Mumbai Kora Kendra dancer looking for a synchronized Raas-Garba partner for Navratri 2026.',
  'Indore garba lover! Ready with traditional attire and boundless energy for festive dandiya nights.',
  'Love 3-Taali and Popat steps. Looking for someone friendly, respectful, and energetic to dance together.',
  'GMDC and Rajpath regular. Looking for a synchronized Dodhiya dance partner who doesn’t tire out before midnight!',
  'Can’t wait for Navratri 2026! Love dressing up in authentic Kutch work chaniya cholis and dancing non-stop.',
  'Traditional Baroda style dancer. Respectful, joyful, and looking for great festive memories with a dance partner.',
  'Love Heech, Sanedo, and 2-Taali rhythm. Let’s celebrate the divine 9 nights of Navratri together!',
  'Excited for Raas-Garba 2026! Looking for an enthusiastic companion to enjoy music, dhol, and dance.',
  'Passionate dancer who loves traditional folk tunes and lively Dandiya circles. Let’s connect!'
];

const BIOS_MALE = [
  'Vadodara Garba regular for 6 years. Ready with traditional Kediya. Need a dedicated partner for all 9 nights.',
  'Looking for a fun dance partner to groove together till midnight. Love energetic folk beats and Dodhiya.',
  'High-energy Kathiyawadi Heech specialist. Looking for a partner who loves authentic live Dhol beats.',
  'Regular attendee at Surat Sarsana Ground. Ready for energetic Tran-Taali circles every festive night.',
  'Love traditional Dandiya Raas and folk celebrations. Seeking a respectful and enthusiastic Garba companion.',
  'Mumbai dancer excited for Kora Kendra and Borivali grounds. Let’s sync our steps for Navratri 2026!',
  'Indore dancer ready for 9 nights of non-stop Raas-Garba. Looking for a coordinated dance partner.'
];

async function seed1000Dancers(db, targetCount = 1000) {
  const currentCount = db.prepare('SELECT count(*) as count FROM profiles WHERE is_discoverable = 1').get().count;
  if (currentCount >= targetCount) {
    console.log(`Already have ${currentCount} discoverable dancer profiles. No extra seeding required.`);
    return;
  }

  const needed = targetCount - currentCount;
  console.log(`Seeding ${needed} authentic Indian dancer profiles (mostly girls) with real photography...`);

  // Hash password ONCE for maximum performance (takes ~70ms)
  const passwordHash = await bcrypt.hash('Dancer2026!', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, status)
    VALUES (?, ?, 'user', 'active')
  `);

  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      user_id, display_name, dob, age, city, preferred_language,
      bio, garba_experience, dance_style, hobbies, connection_types,
      is_discoverable, is_adult_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  `);

  const insertPhoto = db.prepare(`
    INSERT INTO profile_photos (profile_id, photo_url, is_primary)
    VALUES (?, ?, ?)
  `);

  const insertAttendance = db.prepare(`
    INSERT INTO event_attendances (user_id, event_id, status)
    VALUES (?, ?, 'attending')
    ON CONFLICT DO NOTHING
  `);

  const events = db.prepare('SELECT id, city FROM events').all();
  const eventCityMap = {};
  for (const ev of events) {
    if (!eventCityMap[ev.city]) eventCityMap[ev.city] = [];
    eventCityMap[ev.city].push(ev.id);
  }

  // Pre-seed in a fast single SQLite transaction
  db.exec('BEGIN IMMEDIATE');

  try {
    for (let i = 0; i < needed; i++) {
      // 76% girls (0-75), 24% boys (76-99)
      const isFemale = (i % 100) < 76;
      const firstName = isFemale
        ? FEMALE_FIRST_NAMES[i % FEMALE_FIRST_NAMES.length]
        : MALE_FIRST_NAMES[i % MALE_FIRST_NAMES.length];
      const surname = SURNAMES[(i * 3 + (isFemale ? 7 : 13)) % SURNAMES.length];
      const displayName = `${firstName} ${surname}`;

      const email = `dancer_${isFemale ? 'f' : 'm'}_${i + 1}_${Date.now().toString(36)}@flirta.in`;
      const userRes = insertUser.run(email, passwordHash);
      const userId = Number(userRes.lastInsertRowid);

      // Random age 19 to 31
      const age = 19 + ((i * 7 + (isFemale ? 3 : 5)) % 13);
      const birthYear = 2026 - age;
      const birthMonth = String(1 + (i % 12)).padStart(2, '0');
      const birthDay = String(1 + ((i * 3) % 28)).padStart(2, '0');
      const dob = `${birthYear}-${birthMonth}-${birthDay}`;

      const city = CITIES[(i * 2 + (isFemale ? 1 : 4)) % CITIES.length];
      const preferredLanguage = city === 'Mumbai'
        ? 'Hindi, Gujarati, English'
        : city === 'Indore'
          ? 'Hindi, Gujarati'
          : 'Gujarati, Hindi, English';

      const experience = EXPERIENCES[i % EXPERIENCES.length];
      const danceStyle = DANCE_STYLES[(i * 3) % DANCE_STYLES.length];
      const hobbies = HOBBIES[i % HOBBIES.length];
      const bioList = isFemale ? BIOS_FEMALE : BIOS_MALE;
      const bio = bioList[(i * 5) % bioList.length];

      const connectionTypes = (i % 3 === 0)
        ? ['partner', 'friendship', 'dating']
        : (i % 2 === 0)
          ? ['partner', 'dating']
          : ['partner', 'friendship'];

      const profRes = insertProfile.run(
        userId, displayName, dob, age, city, preferredLanguage,
        bio, experience, danceStyle, hobbies, JSON.stringify(connectionTypes)
      );
      const profileId = Number(profRes.lastInsertRowid);

      // Pick realistic human photography photo
      const photoList = isFemale ? REAL_FEMALE_PHOTOS : REAL_MALE_PHOTOS;
      const photoId = photoList[i % photoList.length];
      const primaryPhotoUrl = buildPhotoUrl(photoId, i);

      insertPhoto.run(profileId, primaryPhotoUrl, 1);

      // Add secondary photo for ~60% of profiles for multi-photo gallery exploration
      if (i % 5 !== 0) {
        const secondaryPhotoId = photoList[(i + 3) % photoList.length];
        insertPhoto.run(profileId, buildPhotoUrl(secondaryPhotoId, i + 3), 0);
      }
      if (i % 3 === 0) {
        const tertiaryPhotoId = photoList[(i + 7) % photoList.length];
        insertPhoto.run(profileId, buildPhotoUrl(tertiaryPhotoId, i + 7), 0);
      }

      // Link to local city Garba event attendance if exists
      if (eventCityMap[city] && eventCityMap[city].length > 0) {
        const evId = eventCityMap[city][i % eventCityMap[city].length];
        insertAttendance.run(userId, evId);
      }
    }

    db.exec('COMMIT');
    const finalCount = db.prepare('SELECT count(*) as count FROM profiles WHERE is_discoverable = 1').get().count;
    console.log(`Successfully seeded! Total discoverable profiles in database: ${finalCount}`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Failed to seed 1000 dancers:', err);
    throw err;
  }
}

module.exports = {
  seed1000Dancers
};
