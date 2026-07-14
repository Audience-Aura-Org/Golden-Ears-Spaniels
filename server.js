require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Settings Helpers ────────────────────────────────────────────────────────
const SETTINGS_PATH = path.join(__dirname, 'data', 'settings.json');
const ADMIN_PATH    = path.join(__dirname, 'data', 'admin.json');
const PUPPIES_PATH  = path.join(__dirname, 'data', 'puppies.json');

function loadSettings() {
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
}
function saveSettings(s) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2));
}
function loadPuppies() {
  return JSON.parse(fs.readFileSync(PUPPIES_PATH, 'utf8'));
}
function savePuppies(p) {
  fs.writeFileSync(PUPPIES_PATH, JSON.stringify(p, null, 2));
}

// ─── Puppy Data (loaded from data/puppies.json) ────────────────────────────────
// Use loadPuppies() in each route to always get the latest data.

// ─── Image Upload (multer) ─────────────────────────────────────────────────────
const imgStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'image')),
  filename:    (req, file, cb) => cb(null, 'puppy-' + Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage: imgStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

const deliveryOptions = [
  {
    title: 'Road Transport',
    price: '~$170',
    description: 'Safe, regional ground delivery by our trusted transport partners.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>',
  },
  {
    title: 'Air Cargo',
    price: '~$250',
    description: 'Airline-regulated cargo delivery with climate-controlled compartments.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>',
  },
  {
    title: 'Door-to-Door Ground',
    price: '~$320',
    description: 'Personalized door-to-door delivery directly to your home.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>',
  },
  {
    title: 'Flight Nanny',
    price: '~$600',
    description: 'A professional accompanies your puppy in-cabin the entire flight.',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    location: 'New York, NY',
    rating: 5,
    text: 'We brought home Bella (now renamed!) from Golden Ears and she has been an absolute dream. The team was responsive, caring, and made the whole process so smooth. Couldn\'t be happier!',
  },
  {
    name: 'James & Carla T.',
    location: 'Chicago, IL',
    rating: 5,
    text: 'Our boy Cooper arrived healthy, happy, and already socialized. He settled in within hours. The 2-year health guarantee gave us so much peace of mind. Highly recommend!',
  },
  {
    name: 'Priya L.',
    location: 'Toronto, ON',
    rating: 5,
    text: 'The flight nanny service was exceptional — they sent updates with photos the whole trip. Our puppy arrived calm and comfortable. Golden Ears truly cares about these dogs.',
  },
  {
    name: 'Marcus D.',
    location: 'Los Angeles, CA',
    rating: 5,
    text: 'I was nervous about buying a puppy online, but Golden Ears exceeded every expectation. They answered every question quickly and the puppy documentation was thorough and complete.',
  },
  {
    name: 'Emily & Tom R.',
    location: 'Dallas, TX',
    rating: 5,
    text: 'Our family has never had a Cocker Spaniel before and Golden Ears guided us every step of the way. The breeder support after we brought her home was incredibly helpful!',
  },
  {
    name: 'Chen W.',
    location: 'Vancouver, BC',
    rating: 5,
    text: 'Absolutely wonderful experience from start to finish. The puppy was exactly as described, AKC paperwork was ready on arrival, and the team has stayed in touch to check in on her.',
  },
  {
    name: 'Oliver H.',
    location: 'London, UK',
    rating: 5,
    text: 'Ordered our little boy Romeo all the way from London and the experience was seamless. The flight nanny kept us updated with photos the entire journey. He arrived calm, healthy, and ready to play!',
  },
  {
    name: 'Gemma & Paul W.',
    location: 'Manchester, UK',
    rating: 5,
    text: 'We were a little apprehensive ordering from the States but Golden Ears made every step easy. The documentation, health records, and communication were outstanding. Our spaniel is perfect.',
  },
  {
    name: 'Fiona R.',
    location: 'Edinburgh, UK',
    rating: 5,
    text: 'What a wonderful breeder. Joy arrived healthy and full of personality — exactly as described. The team answered every single question I had, no matter how small. Highly recommend!',
  },
  {
    name: 'Diana R.',
    location: 'Miami, FL',
    rating: 5,
    text: 'Received my girl in Miami — she was in perfect health, exactly as described. The team stayed in touch throughout the whole delivery. Best decision we ever made.',
  },
  {
    name: 'Kevin & Lisa M.',
    location: 'Birmingham, UK',
    rating: 5,
    text: 'From first inquiry to puppy arriving at our door, Golden Ears were professional, warm, and incredibly helpful. Our Cocker Spaniel has brought so much joy to the whole family.',
  },
  {
    name: 'Aisha B.',
    location: 'Seattle, WA',
    rating: 5,
    text: 'I did a lot of research before choosing Golden Ears and I\'m so glad I did. The puppy was healthy, happy, and clearly loved before coming to us. The 2-year guarantee gave us real peace of mind.',
  },
  {
    name: 'Robert & Jane K.',
    location: 'Calgary, AB',
    rating: 5,
    text: 'Second time buying from Golden Ears — that says everything. Both puppies arrived perfectly healthy and full of personality. The cross-border documentation was handled flawlessly.',
  },
  {
    name: 'Natalie S.',
    location: 'Houston, TX',
    rating: 5,
    text: 'I was gifted a Golden Ears puppy by my husband and she has been the most joyful addition to our home. The breeder still checks in on us months later. Truly exceptional service.',
  },
  {
    name: 'Tom & Bridget F.',
    location: 'Dublin, Ireland',
    rating: 5,
    text: 'Our little Maple is the star of the neighbourhood! Golden Ears guided us through international delivery step by step. The whole experience was far easier than we expected.',
  },
];

// ─── Payment Methods ────────────────────────────────────────────────────────────
const paymentMethods = [
  { name: 'PayPal', icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>', color: '#003087' },
  { name: 'Zelle', icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.25 16.5h-7.5l4.688-9H7.5V6h7.5l-4.688 9H19.5v1.5z"/></svg>', color: '#6d1ed4' },
  { name: 'CashApp', icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.59 3.48A5 5 0 0020.52.41L14.4 0l-2.85 2.85 2.14 2.14-1.36 1.36L8.5 2.42a1 1 0 00-1.41 0L4.5 5a1 1 0 000 1.41L7.93 9.84l-1.36 1.36L4.43 9.06 1.58 11.91l.41 6.12A5 5 0 005.06 21l6.12.41 2.85-2.85-2.14-2.14 1.36-1.36 3.93 3.93a1 1 0 001.41 0l2.59-2.59a1 1 0 000-1.41l-3.93-3.93 1.36-1.36 2.14 2.14L23.59 9.6l-.41-6.12z"/></svg>', color: '#00D632' },
  { name: 'Venmo', icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19.1 1c.5 1 .7 2 .7 3.4 0 4.2-3.6 9.7-6.5 13.5H7.2L4.5 2.4l5.6-.5 1.4 10.8c1.3-2.1 2.9-5.5 2.9-7.7 0-1.2-.2-2.1-.5-2.9L19.1 1z"/></svg>', color: '#3d95ce' },
  { name: 'Visa / Mastercard', icon: '<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>', color: '#1a1f71' },
  { name: 'Bank Transfer', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11"/></svg>', color: '#5A4634' },
];

// ─── Blog Data ─────────────────────────────────────────────────────────────────
const blogPosts = [
  {
    slug: 'cocker-spaniel-new-owner-guide',
    title: 'The New Owner\'s Complete Guide to American Cocker Spaniels',
    category: 'Care Guide',
    date: 'June 12, 2025',
    readTime: '6 min read',
    excerpt: 'Bringing home a Cocker Spaniel for the first time? Here\'s everything you need to know — from puppy-proofing your home to the first vet visit and beyond.',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy sitting on grass',
    content: [
      { type: 'p', text: 'Bringing a Cocker Spaniel puppy home is one of life\'s greatest joys — but it also comes with responsibilities. The first few weeks set the tone for your dog\'s entire life, so preparation is everything.' },
      { type: 'h2', text: 'Puppy-Proof Your Home First' },
      { type: 'p', text: 'Before your puppy arrives, get down on their level and look for hazards: loose cables, small objects, toxic plants (like lilies, aloe, and sago palm), and gaps behind appliances. Use baby gates to restrict access to stairs until they\'re old enough to navigate them safely.' },
      { type: 'tip', text: '🐾 Tip: Cocker Spaniels have long ears that drag close to the ground — keep cleaning supplies locked away as they love to sniff everything.' },
      { type: 'h2', text: 'The First 48 Hours' },
      { type: 'p', text: 'When your puppy arrives, give them time to explore their new space at their own pace. Don\'t overwhelm them with visitors right away. Set up a crate in a quiet corner of the main living area — this becomes their safe den. Leave a worn piece of your clothing inside so they associate it with your scent.' },
      { type: 'h2', text: 'Feeding Schedule' },
      { type: 'p', text: 'Cocker Spaniel puppies aged 8–12 weeks need three small meals per day of high-quality puppy kibble. Transition to twice daily at 6 months. Always keep fresh water available, and avoid feeding from the bowl at a height that would cause their ears to drag into the food (use a spaniel-specific bowl with ear guards).' },
      { type: 'h2', text: 'Vet Visit Within 3 Days' },
      { type: 'p', text: 'Schedule a vet appointment within 72 hours of bringing your puppy home. Bring all health records we\'ve provided. Your vet will do a full wellness check, confirm vaccinations, and discuss the deworming schedule. This visit also establishes your puppy\'s baseline health record.' },
      { type: 'h2', text: 'Socialization is Critical' },
      { type: 'p', text: 'The socialization window for puppies is 3–16 weeks old. Between 8–16 weeks (when most puppies come home), every new experience becomes a template for how they see the world. Safely expose them to different people, sounds, textures, and vaccinated dogs. Positive early experiences prevent fearfulness and anxiety later in life.' },
      { type: 'tip', text: '💛 Golden Ears Tip: Our puppies are raised in a home environment with children, sounds from TVs and appliances, and regular handling — so they arrive partially socialized. Build on this by continuing exposure.' },
    ],
  },
  {
    slug: 'why-cocker-spaniels-perfect-family-dogs',
    title: '5 Reasons Cocker Spaniels Are Perfect Family Dogs',
    category: 'Breed Info',
    date: 'May 28, 2025',
    readTime: '4 min read',
    excerpt: 'Looking for a dog that loves children, adapts to apartment life, and brings joy every single day? The American Cocker Spaniel checks every box.',
    image: 'https://images.unsplash.com/photo-1591856419156-3979c9edd30f?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Happy Cocker Spaniel with family outdoors',
    content: [
      { type: 'p', text: 'It\'s no accident that the American Cocker Spaniel was the most popular dog breed in the United States for over a decade. Their combination of beauty, intelligence, and affection makes them almost impossible to resist — especially for families.' },
      { type: 'h2', text: '1. They\'re Naturally Gentle with Kids' },
      { type: 'p', text: 'Cocker Spaniels have a reputation for being patient and gentle, even with toddlers. Unlike some breeds that become stressed by unpredictable children, a well-socialized Cocker Spaniel tends to roll with the chaos — and even enjoy it. Their size (20–30 lbs) is also ideal: big enough to play fetch, small enough not to knock children over.' },
      { type: 'h2', text: '2. They Adapt to Any Home' },
      { type: 'p', text: 'Whether you live in a Manhattan apartment or on a rural acreage, Cocker Spaniels adapt remarkably well. They need moderate daily exercise — a 30-minute walk plus playtime is usually enough — but they\'re happy to spend the rest of the day curled up beside you on the sofa.' },
      { type: 'h2', text: '3. They\'re Exceptionally Trainable' },
      { type: 'p', text: 'Ranked 20th most intelligent dog breed by Dr. Stanley Coren, Cocker Spaniels pick up commands quickly and respond beautifully to positive reinforcement. Many excel at obedience, agility, and even therapy dog work. Their eagerness to please makes training a genuinely enjoyable experience.' },
      { type: 'h2', text: '4. They Form Deep, Lasting Bonds' },
      { type: 'p', text: 'Cocker Spaniels are famously devoted to their families. They want to be wherever you are — in the kitchen while you cook, at your feet while you work, on the bed while you sleep. This loyalty makes them exceptional emotional companions, particularly for children who benefit from a consistent furry friend.' },
      { type: 'h2', text: '5. They\'re Low-Aggression Dogs' },
      { type: 'p', text: 'With proper socialization, American Cocker Spaniels score very low on aggression measures compared to other breeds. They typically get on well with other dogs, cats, and strangers — making them ideal in busy social households where the door is always opening.' },
      { type: 'tip', text: '🐾 Looking for your family\'s perfect companion? Browse our available puppies — males and females in multiple beautiful colors, all health-tested and ready to come home.' },
    ],
  },
  {
    slug: 'cocker-spaniel-grooming-tips',
    title: 'Grooming Your Cocker Spaniel: Expert Tips from Our Breeders',
    category: 'Grooming',
    date: 'May 5, 2025',
    readTime: '5 min read',
    excerpt: 'The Cocker Spaniel\'s silky coat is one of its most distinctive features — and with the right routine, it\'s easier to maintain than you might think.',
    image: 'https://images.unsplash.com/photo-1754816969541-d56e7d263dd7?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Golden Cocker Spaniel puppy',
    content: [
      { type: 'p', text: 'One of the first things people notice about a Cocker Spaniel is their stunning, silky coat. Those flowing ears and feathered legs are part of the breed\'s charm — but they do require a consistent grooming routine to stay healthy and tangle-free.' },
      { type: 'h2', text: 'How Often Should You Brush?' },
      { type: 'p', text: 'Aim to brush your Cocker Spaniel at least 3–4 times per week, and daily if they spend a lot of time outdoors. Use a slicker brush for the body coat and a metal comb (with both wide and narrow teeth) to work through the feathering on the ears, legs, and belly. Always brush before bathing — wet tangles become permanent mats.' },
      { type: 'tip', text: '🐾 Tip: Work in sections and hold the coat at the root to avoid pulling on your dog\'s skin. Make grooming sessions short and positive — keep treats nearby.' },
      { type: 'h2', text: 'Professional Grooming Schedule' },
      { type: 'p', text: 'Most Cocker Spaniels need professional grooming every 6–8 weeks. A groomer will trim and shape the coat, clean around the eyes, pluck the ear canal (important for preventing infections in drop-eared breeds), and trim the nails. Ask for a "puppy cut" if you prefer a shorter, lower-maintenance style.' },
      { type: 'h2', text: 'Ear Care is Critical' },
      { type: 'p', text: 'Cocker Spaniels\' long, floppy ears restrict airflow, making them prone to ear infections. Check ears weekly for redness, odor, or dark discharge. Clean with a vet-approved ear cleaner and cotton balls — never cotton swabs inside the canal. If you notice your dog shaking their head frequently or scratching at their ears, see your vet.' },
      { type: 'h2', text: 'Bathing' },
      { type: 'p', text: 'Bathe every 3–4 weeks using a gentle dog shampoo formulated for long coats. Follow with a conditioning rinse to keep the coat soft and manageable. Dry thoroughly with a warm dryer set to low heat, brushing as you go — this prevents the coat from drying wavy or matted.' },
      { type: 'h2', text: 'Starting Young' },
      { type: 'p', text: 'The secret to a well-groomed adult Cocker Spaniel is starting young. Begin handling your puppy\'s paws, ears, and mouth from day one. Introduce the brush gently during play. The earlier grooming becomes a routine, the more cooperative your dog will be throughout their life.' },
    ],
  },
  {
    slug: 'cocker-spaniel-health-guide',
    title: 'Cocker Spaniel Health: What Every Owner Should Know',
    category: 'Health',
    date: 'April 18, 2025',
    readTime: '5 min read',
    excerpt: 'A healthy Cocker Spaniel is a happy one. Learn about common health considerations, what to watch for, and how our 2-year guarantee protects your family.',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel at veterinary checkup',
    content: [
      { type: 'p', text: 'American Cocker Spaniels are generally healthy, long-lived dogs — many reach 14–16 years with proper care. However, like all breeds, they have some health considerations that every responsible owner should understand.' },
      { type: 'h2', text: 'Eye Health' },
      { type: 'p', text: 'Cocker Spaniels are predisposed to certain eye conditions including progressive retinal atrophy (PRA) and cataracts. This is why we require CAER (Companion Animal Eye Registry) eye clearances on all our parent dogs. Annual eye exams by a veterinary ophthalmologist are recommended for breeding dogs and encouraged for pets.' },
      { type: 'h2', text: 'Hip Dysplasia' },
      { type: 'p', text: 'Hip dysplasia can occur in Cockers, though it\'s less prevalent than in larger breeds. Our parent dogs receive OFA hip evaluations before breeding. Keeping your dog at a healthy weight and providing low-impact exercise are the best preventive measures.' },
      { type: 'h2', text: 'Ear Infections' },
      { type: 'p', text: 'The most common health issue in Cocker Spaniels is ear infections, due to the anatomy of their long, floppy ears. Regular ear cleaning, keeping ears dry after bathing, and prompt vet attention at the first sign of infection will keep this manageable.' },
      { type: 'tip', text: '🛡️ All Golden Ears puppies come with a comprehensive 2-year health guarantee covering genetic conditions. Our parent dogs are OFA-certified for hips, heart, and eyes before any breeding takes place.' },
      { type: 'h2', text: 'Vaccination Schedule' },
      { type: 'p', text: 'Your puppy leaves us current on age-appropriate vaccinations. Typically, puppies need booster shots at 12 and 16 weeks for distemper, parvovirus, and adenovirus. Rabies vaccine is given at 16 weeks or per your local requirements. Annual or triennial boosters maintain immunity throughout adulthood.' },
      { type: 'h2', text: 'Preventive Care Saves Money' },
      { type: 'p', text: 'The single best investment in your Cocker Spaniel\'s health is consistent preventive care: annual vet exams, parasite prevention (heartworm, flea, tick), dental cleanings, and maintaining a healthy weight. Dogs who receive regular veterinary care live significantly longer and healthier lives.' },
    ],
  },
];

// ─── Location Data ──────────────────────────────────────────────────────────────
const locations = [
  {
    slug: 'new-york',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    icon: '🗽',
    airports: ['JFK', 'LaGuardia (LGA)', 'Newark (EWR)'],
    description: 'We deliver Cocker Spaniel puppies to New York City and the surrounding area — Manhattan, Brooklyn, Queens, the Bronx, and Long Island.',
    deliveryNote: 'Our flight nannies fly directly into JFK or LaGuardia. You\'ll receive photos and updates throughout the entire journey.',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in New York',
    testimonial: { name: 'Sarah M.', text: 'Golden Ears delivered our puppy right to our Brooklyn apartment. The flight nanny was incredible — she sent photos from the airport!', rating: 5 },
  },
  {
    slug: 'los-angeles',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    icon: '🌴',
    airports: ['LAX', 'Burbank (BUR)', 'Long Beach (LGB)'],
    description: 'Cocker Spaniel puppies available for delivery across the Los Angeles metro — LA, Pasadena, Long Beach, Santa Monica, and the San Fernando Valley.',
    deliveryNote: 'We fly into LAX with our flight nanny service. Road transport is also available for nearby regions in Southern California.',
    image: 'https://images.unsplash.com/photo-1561567066-1c251fb704d1?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Los Angeles',
    testimonial: { name: 'Marcus D.', text: 'Couldn\'t believe how smooth the process was from Georgia to LA. Puppy arrived healthy, happy, and calm. Golden Ears is the real deal.', rating: 5 },
  },
  {
    slug: 'chicago',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    icon: '🏙️',
    airports: ["O'Hare (ORD)", 'Midway (MDW)'],
    description: 'Bringing a Golden Ears Cocker Spaniel to Chicago, Naperville, Evanston, Oak Park, or anywhere in the greater Chicagoland area is easy with our delivery options.',
    deliveryNote: 'We fly into O\'Hare (ORD) and Midway (MDW). Door-to-door ground transport is also available across Illinois.',
    image: 'https://images.unsplash.com/photo-1618772466570-19c26ad88094?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Chicago',
    testimonial: { name: 'James & Carla T.', text: 'Cooper arrived at O\'Hare calm and happy. The whole process — from inquiry to pickup — was professional and caring.', rating: 5 },
  },
  {
    slug: 'dallas',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    icon: '⭐',
    airports: ['Dallas/Fort Worth (DFW)', 'Love Field (DAL)'],
    description: 'We serve Dallas, Fort Worth, Plano, Frisco, Allen, McKinney, and the entire DFW metroplex with safe, reliable Cocker Spaniel puppy delivery.',
    deliveryNote: 'Flight nanny service into DFW and Love Field. Road transport available for families across North Texas.',
    image: 'https://images.unsplash.com/photo-1679519663909-834dbab30563?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Dallas Texas',
    testimonial: { name: 'Emily & Tom R.', text: 'Our first Cocker Spaniel and Golden Ears made it so easy. They guided us every step — and she\'s been perfect with our kids.', rating: 5 },
  },
  {
    slug: 'miami',
    city: 'Miami',
    state: 'FL',
    country: 'USA',
    icon: '🌊',
    airports: ['Miami International (MIA)', 'Fort Lauderdale (FLL)'],
    description: 'Delivering Cocker Spaniel puppies to Miami, Fort Lauderdale, Boca Raton, West Palm Beach, and South Florida families who deserve the best.',
    deliveryNote: 'We offer flight nanny service into MIA and FLL. Air cargo is also available as a cost-effective alternative.',
    image: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Miami Florida',
    testimonial: { name: 'Diana R.', text: 'Received my girl in Miami — she was in perfect health, exactly as described. The team stayed in touch throughout the whole delivery.', rating: 5 },
  },
  {
    slug: 'toronto',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    icon: '🍁',
    airports: ['Pearson International (YYZ)', 'Billy Bishop (YTZ)'],
    description: 'We proudly deliver to families across Toronto, Mississauga, Brampton, Markham, and the Greater Toronto Area. Canadian families love Golden Ears puppies.',
    deliveryNote: 'Our flight nannies fly into Pearson (YYZ). We handle all cross-border documentation and health certificates for Canadian buyers.',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy arriving in Toronto Canada',
    testimonial: { name: 'Priya L.', text: 'The flight nanny sent photos the whole way from Georgia to Toronto Pearson. Our puppy was calm and happy — best experience ever.', rating: 5 },
  },
  {
    slug: 'london',
    city: 'London',
    state: 'England',
    country: 'UK',
    icon: '🎡',
    airports: ['Heathrow (LHR)', 'Gatwick (LGW)', 'Stansted (STN)'],
    description: 'We deliver Cocker Spaniel puppies to London and surrounding areas including Surrey, Kent, Essex, and the Home Counties. Our flight nannies ensure a stress-free journey.',
    deliveryNote: 'We fly into Heathrow (LHR) or Gatwick (LGW) with our professional flight nanny service. All CITES and PETS travel documentation handled for UK buyers.',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in London UK',
    testimonial: { name: 'Oliver H.', text: 'Ordered our little boy all the way from London — the flight nanny kept us updated with photos the entire journey. He arrived calm and healthy!', rating: 5 },
  },
  {
    slug: 'manchester',
    city: 'Manchester',
    state: 'England',
    country: 'UK',
    icon: '🐝',
    airports: ['Manchester Airport (MAN)'],
    description: 'Delivering Cocker Spaniel puppies to Manchester, Salford, Trafford, Stockport, and families across the North West of England.',
    deliveryNote: 'Our flight nannies fly directly into Manchester Airport (MAN). Full international health documentation and veterinary certificates provided.',
    image: 'https://images.unsplash.com/photo-1568684912181-8e2d0a4dcde5?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Manchester UK',
    testimonial: { name: 'Gemma & Paul W.', text: 'We were a little apprehensive ordering from the States but Golden Ears made every step easy. The documentation and communication were outstanding.', rating: 5 },
  },
  {
    slug: 'edinburgh',
    city: 'Edinburgh',
    state: 'Scotland',
    country: 'UK',
    icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    airports: ['Edinburgh Airport (EDI)'],
    description: 'Serving Edinburgh, Glasgow, Dundee, and families across Scotland with safe, professional Cocker Spaniel puppy delivery.',
    deliveryNote: 'Our flight nannies fly into Edinburgh (EDI) or Glasgow (GLA). We handle all UK import documentation including veterinary health certificates.',
    image: 'https://images.unsplash.com/photo-1506377585622-bedcbb5a9d9f?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Edinburgh Scotland',
    testimonial: { name: 'Fiona R.', text: 'Joy arrived healthy and full of personality — exactly as described. The team answered every question I had. Couldn\'t recommend Golden Ears more.', rating: 5 },
  },
  {
    slug: 'birmingham',
    city: 'Birmingham',
    state: 'England',
    country: 'UK',
    icon: '🏭',
    airports: ['Birmingham Airport (BHX)'],
    description: 'Cocker Spaniel puppies delivered to Birmingham, Coventry, Wolverhampton, and families across the West Midlands region.',
    deliveryNote: 'We fly into Birmingham Airport (BHX) with our flight nanny service. All international veterinary health certificates and documentation provided.',
    image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?w=900&auto=format&fit=crop&q=80',
    imageAlt: 'Cocker Spaniel puppy in Birmingham UK',
    testimonial: { name: 'Kevin & Lisa M.', text: 'From first inquiry to puppy arriving at our door, Golden Ears were professional, warm, and incredibly helpful. Our spaniel has brought so much joy.', rating: 5 },
  },
];

// ─── Mailer ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Express Setup ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve the image folder (contains puppy photos)
app.use('/image', express.static(path.join(__dirname, 'image')));

// ─── Session ────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'ges-admin-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true },
}));

// ─── Global Settings Locals ─────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.settings = loadSettings();
  next();
});

// ─── Admin Auth Middleware ───────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/admin/login');
}

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many requests from this IP, please try again in 15 minutes.',
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const p = loadPuppies();
  const featuredFemales = p.american.females.slice(0, 2);
  const featuredMales   = p.american.males.slice(0, 2);
  const featuredEnglish = [...p.english.females.slice(0, 2), ...p.english.males.slice(0, 2)];
  res.render('index', {
    page: 'home',
    title: 'Golden Ears Spaniels | American & English Cocker Spaniel Puppies',
    description: 'Premier breeder of American & English Cocker Spaniel puppies since 2019. AKC & KC registered, home-raised, health-tested. Delivered across the USA, Canada & UK.',
    featuredFemales,
    featuredEnglish,
    featuredMales,
    deliveryOptions,
    testimonials,
    paymentMethods,
  });
});

app.get('/available-puppies', (req, res) => {
  const p = loadPuppies();
  res.render('puppies', {
    page: 'puppies',
    title: 'Available American Cocker Spaniel Puppies | Golden Ears Spaniels',
    description: 'Browse our available AKC American Cocker Spaniel puppies. Males and females, multiple colors, all health-tested with a 2-year guarantee.',
    females: p.american.females,
    males: p.american.males,
  });
});

app.get('/available-puppies/english-cocker-spaniel', (req, res) => {
  const p = loadPuppies();
  res.render('english-puppies', {
    page: 'puppies',
    title: 'Available English Cocker Spaniel Puppies | Golden Ears Spaniels',
    description: 'Browse our available English Cocker Spaniel puppies. Stunning roan and parti-color coats, health-tested and KC registered, delivered across the USA, Canada & UK.',
    females: p.english.females,
    males: p.english.males,
  });
});

app.get('/puppies/:slug', (req, res) => {
  const p = loadPuppies();
  const allAmerican = [...p.american.females, ...p.american.males];
  const allEnglish  = [...p.english.females, ...p.english.males];
  const puppy = allAmerican.find(p => p.slug === req.params.slug)
             || allEnglish.find(p => p.slug === req.params.slug);
  const backUrl = allEnglish.find(p => p.slug === req.params.slug)
    ? '/available-puppies/english-cocker-spaniel'
    : '/available-puppies';
  if (!puppy) return res.redirect('/available-puppies');
  res.render('puppy-detail', {
    page: 'puppies',
    backUrl,
    title: `${puppy.name} – ${puppy.color} Cocker Spaniel Puppy | Golden Ears Spaniels`,
    description: puppy.description,
    puppy,
    deliveryOptions,
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    page: 'about',
    title: 'About Us | Golden Ears Spaniels – AKC Cocker Spaniel Breeders',
    description: 'Learn about Golden Ears Spaniels — a family-owned AKC breeder dedicated to raising healthy, happy Cocker Spaniel puppies since 2019.',
  });
});

app.get('/contact', (req, res) => {
  const p = loadPuppies();
  const allPuppies = [...p.american.females, ...p.american.males, ...p.english.females, ...p.english.males];
  res.render('contact', {
    page: 'contact',
    title: 'Contact Us | Golden Ears Spaniels',
    description: 'Get in touch to reserve a puppy or ask questions. We respond quickly and with care.',
    allPuppies,
    preSelected: req.query.puppy || '',
    success: false,
    error: false,
    paymentMethods,
  });
});

app.post('/contact', contactLimiter, async (req, res) => {
  const p = loadPuppies();
  const allPuppies = [...p.american.females, ...p.american.males, ...p.english.females, ...p.english.males];
  const { firstName, lastName, email, phone, city, state, puppyOfInterest, message, howHeard } = req.body;

  // Basic validation
  if (!firstName || !email || !puppyOfInterest || !message) {
    return res.render('contact', {
      page: 'contact',
      title: 'Contact Us | Golden Ears Spaniels',
      description: 'Get in touch to reserve a puppy or ask questions.',
      allPuppies,
      preSelected: puppyOfInterest || '',
      success: false,
      error: 'Please fill in all required fields.',
      paymentMethods,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@goldenearsspaniels.com';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #2B2B2B; background: #F7F2E9; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 16px rgba(90,70,52,0.15); }
    h1 { color: #5A4634; font-size: 22px; margin-bottom: 8px; }
    .badge { display: inline-block; background: #C9A86A; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    tr:nth-child(even) td { background: #F7F2E9; }
    td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #E8DCC3; }
    td:first-child { font-weight: bold; color: #5A4634; width: 35%; }
    .message-box { background: #F7F2E9; border-left: 4px solid #C9A86A; padding: 14px; border-radius: 6px; margin-top: 20px; font-size: 14px; line-height: 1.6; }
    .footer { text-align: center; font-size: 12px; color: #b08d55; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🐾 New Puppy Inquiry</h1>
    <span class="badge">Golden Ears Spaniels</span>
    <table>
      <tr><td>Name</td><td>${firstName} ${lastName || ''}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td>Phone</td><td>${phone || 'Not provided'}</td></tr>
      <tr><td>Location</td><td>${city || ''}${city && state ? ', ' : ''}${state || ''}</td></tr>
      <tr><td>Puppy of Interest</td><td><strong>${puppyOfInterest}</strong></td></tr>
      <tr><td>How They Heard</td><td>${howHeard || 'Not specified'}</td></tr>
    </table>
    <div class="message-box">
      <strong>Message:</strong><br><br>
      ${message.replace(/\n/g, '<br>')}
    </div>
    <div class="footer">Golden Ears Spaniels — goldenearsspaniels.com</div>
  </div>
</body>
</html>
  `;

  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Golden Ears Spaniels'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: `🐾 New Inquiry: ${puppyOfInterest} — ${firstName} ${lastName || ''}`,
      html: htmlBody,
    });

    // Auto-reply to the sender
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Golden Ears Spaniels'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `We received your inquiry about ${puppyOfInterest} 🐾`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #2B2B2B; background: #F7F2E9; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 16px rgba(90,70,52,0.15); }
    h1 { color: #5A4634; }
    p { line-height: 1.7; }
    .highlight { color: #C9A86A; font-weight: bold; }
    .footer { text-align: center; font-size: 12px; color: #b08d55; margin-top: 24px; border-top: 1px solid #E8DCC3; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Thank you, ${firstName}! 🐾</h1>
    <p>We've received your inquiry about <span class="highlight">${puppyOfInterest}</span> and will get back to you within <strong>24 hours</strong>.</p>
    <p>In the meantime, feel free to browse our <a href="https://goldenearsspaniels.com/available-puppies" style="color:#C9A86A;">available puppies</a> or give us a call if you have urgent questions.</p>
    <p>We look forward to helping you find your perfect companion.</p>
    <p>Warmly,<br><strong>The Golden Ears Spaniels Team</strong></p>
    <div class="footer">Golden Ears Spaniels — AKC Cocker Spaniel Breeders Since 2019</div>
  </div>
</body>
</html>
      `,
    });

    res.render('contact', {
      page: 'contact',
      title: 'Contact Us | Golden Ears Spaniels',
      description: 'Get in touch to reserve a puppy or ask questions.',
      allPuppies,
      preSelected: '',
      success: true,
      error: false,
      paymentMethods,
    });
  } catch (err) {
    console.error('Email error:', err);
    res.render('contact', {
      page: 'contact',
      title: 'Contact Us | Golden Ears Spaniels',
      description: 'Get in touch to reserve a puppy or ask questions.',
      allPuppies,
      preSelected: puppyOfInterest || '',
      success: false,
      error: 'Sorry, something went wrong. Please try again or email us directly.',
      paymentMethods,
    });
  }
});

// ─── Blog Routes ───────────────────────────────────────────────────────────────
app.get('/blog', (req, res) => {
  res.render('blog', {
    page: 'blog',
    title: 'Blog | Golden Ears Spaniels — Cocker Spaniel Tips & Guides',
    description: 'Expert advice on Cocker Spaniel care, grooming, training, and health from the breeders at Golden Ears Spaniels.',
    posts: blogPosts,
  });
});

app.get('/blog/:slug', (req, res) => {
  const post = blogPosts.find(p => p.slug === req.params.slug);
  if (!post) return res.redirect('/blog');
  const others = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  res.render('blog-post', {
    page: 'blog',
    title: `${post.title} | Golden Ears Spaniels`,
    description: post.excerpt,
    post,
    others,
  });
});

// ─── Location Routes ────────────────────────────────────────────────────────────
app.get('/locations', (req, res) => {
  res.render('locations', {
    page: 'locations',
    title: 'Cocker Spaniel Puppies by Location | Golden Ears Spaniels',
    description: 'Golden Ears delivers AKC Cocker Spaniel puppies to New York, Los Angeles, Chicago, Dallas, Miami, Toronto, and across the USA & Canada.',
    locations,
  });
});

app.get('/locations/:slug', (req, res) => {
  const loc = locations.find(l => l.slug === req.params.slug);
  if (!loc) return res.redirect('/locations');
  const others = locations.filter(l => l.slug !== loc.slug);
  const p = loadPuppies();
  const allPuppies = [...p.american.females, ...p.american.males, ...p.english.females, ...p.english.males];
  res.render('location', {
    page: 'locations',
    title: `Cocker Spaniel Puppies in ${loc.city}, ${loc.state} | Golden Ears Spaniels`,
    description: loc.description,
    loc,
    others,
    allPuppies,
    deliveryOptions,
  });
});

app.get('/faq', (req, res) => {
  res.render('faq', {
    page: 'faq',
    title: 'FAQ – Golden Ears Spaniels | Common Questions Answered',
    description: 'Answers to the most common questions about adopting a Golden Ears Cocker Spaniel puppy — deposits, health guarantees, delivery, and more.',
  });
});

app.get('/reviews', (req, res) => {
  res.render('reviews', {
    page: 'reviews',
    title: 'Customer Reviews | Golden Ears Spaniels – 5-Star Verified Families',
    description: 'Read verified 5-star reviews from families across the USA, Canada, and UK who welcomed a Golden Ears Cocker Spaniel puppy into their home.',
    testimonials,
  });
});

// ─── Admin Routes ──────────────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.redirect(req.session.isAdmin ? '/admin/dashboard' : '/admin/login');
});

app.get('/admin/login', (req, res) => {
  if (req.session.isAdmin) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = JSON.parse(fs.readFileSync(ADMIN_PATH, 'utf8'));
    if (email === admin.email && bcrypt.compareSync(password, admin.password_hash)) {
      req.session.isAdmin = true;
      return res.redirect('/admin/dashboard');
    }
  } catch (e) {}
  res.render('admin/login', { error: 'Invalid email or password.' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.render('admin/dashboard', {
    settings: loadSettings(),
    puppies: loadPuppies(),
    saved: req.query.saved || null,
  });
});

// Update contact settings
app.post('/admin/settings/contact', requireAdmin, (req, res) => {
  const s = loadSettings();
  s.contact.email        = req.body.email;
  s.contact.phone_display = req.body.phone_display;
  s.contact.phone_tel    = req.body.phone_tel;
  s.contact.whatsapp     = req.body.whatsapp;
  s.contact.hours        = req.body.hours;
  s.contact.location_text = req.body.location_text;
  saveSettings(s);
  res.redirect('/admin/dashboard?saved=contact');
});

// Update hero settings
app.post('/admin/settings/hero', requireAdmin, (req, res) => {
  const s = loadSettings();
  s.hero.eyebrow       = req.body.eyebrow;
  s.hero.headline      = req.body.headline;
  s.hero.subheadline   = req.body.subheadline;
  s.hero.primary_cta   = req.body.primary_cta;
  s.hero.secondary_cta = req.body.secondary_cta;
  saveSettings(s);
  res.redirect('/admin/dashboard?saved=hero');
});

// Update site info
app.post('/admin/settings/site', requireAdmin, (req, res) => {
  const s = loadSettings();
  s.site.name        = req.body.name;
  s.site.description = req.body.description;
  s.site.tagline     = req.body.tagline;
  saveSettings(s);
  res.redirect('/admin/dashboard?saved=site');
});

// Add new puppy
app.post('/admin/puppies/new', requireAdmin, upload.single('image'), (req, res) => {
  const { name, breedGroup, gender, age, price, color, markings, description, status } = req.body;
  const p = loadPuppies();
  const slug = (breedGroup === 'english' ? 'eng-' : '') +
    name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
    '-' + Date.now();
  const breed      = breedGroup === 'english' ? 'English Cocker Spaniel' : 'American Cocker Spaniel';
  const healthGuar = breedGroup === 'english'
    ? ['2-year health guarantee', 'DNA health tested', 'Eye & hip clearances', 'KC Registration provided', 'Vaccinations & deworming up to date']
    : ['2-year health guarantee', 'Genetic health screening', 'Eye & hip clearances', 'AKC Registration provided', 'Vaccinations & deworming up to date'];
  const newPuppy = {
    name, slug, breed, gender, age,
    price: parseFloat(price) || 0,
    color: color || '',
    markings: markings || '',
    status: status || 'Available',
    description: description || '',
    image: req.file ? '/image/' + req.file.filename : '/image/placeholder.jpg',
    healthGuarantees: healthGuar,
  };
  const gKey = gender === 'Female' ? 'females' : 'males';
  p[breedGroup][gKey].push(newPuppy);
  savePuppies(p);
  res.redirect('/admin/dashboard?saved=puppies');
});

// Delete puppy
app.post('/admin/puppies/:slug/delete', requireAdmin, (req, res) => {
  const p = loadPuppies();
  ['american', 'english'].forEach(breed => {
    ['females', 'males'].forEach(gender => {
      p[breed][gender] = p[breed][gender].filter(x => x.slug !== req.params.slug);
    });
  });
  savePuppies(p);
  res.redirect('/admin/dashboard?saved=puppies');
});

// Update puppy details (with optional image)
app.post('/admin/puppies/:slug', requireAdmin, upload.single('image'), (req, res) => {
  const { name, age, price, status } = req.body;
  const p = loadPuppies();
  ['american', 'english'].forEach(breed => {
    ['females', 'males'].forEach(gender => {
      const idx = p[breed][gender].findIndex(x => x.slug === req.params.slug);
      if (idx !== -1) {
        const cur = p[breed][gender][idx];
        cur.name   = name   || cur.name;
        cur.age    = age    || cur.age;
        cur.price  = parseFloat(price) || cur.price;
        cur.status = status || cur.status || 'Available';
        if (req.file) cur.image = '/image/' + req.file.filename;
      }
    });
  });
  savePuppies(p);
  res.redirect('/admin/dashboard?saved=puppies');
});

// Change admin password
app.post('/admin/settings/password', requireAdmin, (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  try {
    const admin = JSON.parse(fs.readFileSync(ADMIN_PATH, 'utf8'));
    if (!bcrypt.compareSync(current_password, admin.password_hash)) {
      return res.redirect('/admin/dashboard?saved=password_error');
    }
    if (new_password !== confirm_password) {
      return res.redirect('/admin/dashboard?saved=password_mismatch');
    }
    admin.password_hash = bcrypt.hashSync(new_password, 10);
    fs.writeFileSync(ADMIN_PATH, JSON.stringify(admin, null, 2));
    res.redirect('/admin/dashboard?saved=password');
  } catch (e) {
    res.redirect('/admin/dashboard?saved=password_error');
  }
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐾 Golden Ears Spaniels running at http://localhost:${PORT}\n`);
});
