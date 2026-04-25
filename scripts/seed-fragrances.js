#!/usr/bin/env node
/**
 * scripts/seed-fragrances.js
 *
 * Parses the top 2024/2025 fragrance list and inserts them into Supabase.
 * Safe to run multiple times — uses ON CONFLICT (slug) DO NOTHING.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   node scripts/seed-fragrances.js
 *
 * Or with a .env.local file:
 *   node -r dotenv/config scripts/seed-fragrances.js dotenv_config_path=.env.local
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// House lookup: [search_name, display_name, category]
// Sorted longest-first so greedy suffix matching works correctly.
// ---------------------------------------------------------------------------
const HOUSES = [
  // 4+ word
  ['Goldfield & Banks Australia', 'Goldfield & Banks Australia', 'niche'],
  ['Better World Fragrance House', 'Better World Fragrance House', 'niche'],
  ['Juliette Has A Gun', 'Juliette Has A Gun', 'niche'],
  ['Van Cleef & Arpels', 'Van Cleef & Arpels', 'niche'],
  ['Etat Libre d\'Orange', 'Etat Libre d\'Orange', 'niche'],
  ['Aromatix X French Avenue', 'Aromatix X French Avenue', 'middle_eastern'],
  ['Bath & Body Works', 'Bath & Body Works', 'designer'],
  ['Abercrombie & Fitch', 'Abercrombie & Fitch', 'designer'],
  ['Stephane Humbert Lucas 777', 'Stéphane Humbert Lucas 777', 'niche'],
  ['House of Atropa', 'House of Atropa', 'niche'],
  ['House of Dastan', 'House of Dastan', 'niche'],
  ['House of Bo', 'House of Bø', 'niche'],
  // 3-word
  ['Yves Saint Laurent', 'Yves Saint Laurent', 'designer'],
  ['Jean Paul Gaultier', 'Jean Paul Gaultier', 'designer'],
  ['Giorgio Armani', 'Giorgio Armani', 'designer'],
  ['Maison Francis Kurkdjian', 'Maison Francis Kurkdjian', 'niche'],
  ['Maison Martin Margiela', 'Maison Martin Margiela', 'designer'],
  ['Al Haramain Perfumes', 'Al Haramain Perfumes', 'middle_eastern'],
  ['Initio Parfums Prives', 'Initio Parfums Prives', 'niche'],
  ['Parfums de Marly', 'Parfums de Marly', 'niche'],
  ['Acqua di Parma', 'Acqua di Parma', 'niche'],
  ['Atelier des Ors', 'Atelier des Ors', 'niche'],
  ['Ahmed Al Maghribi', 'Ahmed Al Maghribi', 'middle_eastern'],
  ['Ibrahim Al Qurashi', 'Ibrahim Al Qurashi', 'middle_eastern'],
  ['Abdul Samad Al Qurashi', 'Abdul Samad Al Qurashi', 'middle_eastern'],
  ['Al Majed Oud', 'Al Majed Oud', 'middle_eastern'],
  ['Al-Jazeera Perfumes', 'Al-Jazeera Perfumes', 'middle_eastern'],
  ['Boadicea the Victorious', 'Boadicea the Victorious', 'niche'],
  ['Aaron Terence Hughes', 'Aaron Terence Hughes', 'niche'],
  ['Jo Malone London', 'Jo Malone London', 'designer'],
  ['Dries Van Noten', 'Dries Van Noten', 'niche'],
  ['Pepe Jeans London', 'Pepe Jeans London', 'designer'],
  ['Zadig & Voltaire', 'Zadig & Voltaire', 'designer'],
  ['Santa Maria Novella', 'Santa Maria Novella', 'niche'],
  ['Zoologist Perfumes', 'Zoologist Perfumes', 'niche'],
  ['Sospiro Perfumes', 'Sospiro Perfumes', 'niche'],
  ['Fragrance Du Bois', 'Fragrance Du Bois', 'niche'],
  ['Fragrance World', 'Fragrance World', 'middle_eastern'],
  ['Maison Alhambra', 'Maison Alhambra', 'middle_eastern'],
  ['MAISON ASRAR', 'MAISON ASRAR', 'middle_eastern'],
  ['Riiffs Perfumes', 'Riiffs Perfumes', 'middle_eastern'],
  ['PARIS CORNER', 'PARIS CORNER', 'middle_eastern'],
  ['Khadlaj Perfumes', 'Khadlaj Perfumes', 'middle_eastern'],
  ['Lattafa Perfumes', 'Lattafa Perfumes', 'middle_eastern'],
  ['Swiss Arabian', 'Swiss Arabian', 'middle_eastern'],
  ['Essential Parfums', 'Essential Parfums', 'niche'],
  ['Matiere Premiere', 'Matiere Premiere', 'niche'],
  ['Maison Crivelli', 'Maison Crivelli', 'niche'],
  ['Escentric Molecules', 'Escentric Molecules', 'niche'],
  ['Marc-Antoine Barrois', 'Marc-Antoine Barrois', 'niche'],
  ['Casamorati 1888', 'Casamorati 1888', 'niche'],
  ['Laboratorio Olfattivo', 'Laboratorio Olfattivo', 'niche'],
  ['Boadicea the Victorious', 'Boadicea the Victorious', 'niche'],
  ['Nicolai Parfumeur Createur', 'Nicolai Parfumeur Createur', 'niche'],
  ['Roja Dove', 'Roja Dove', 'niche'],
  ['Frederic Malle', 'Frederic Malle', 'niche'],
  ['Clive Christian', 'Clive Christian', 'niche'],
  ['Ralph Lauren', 'Ralph Lauren', 'designer'],
  ['Hugo Boss', 'Hugo Boss', 'designer'],
  ['French Avenue', 'French Avenue', 'middle_eastern'],
  ['Louis Vuitton', 'Louis Vuitton', 'niche'],
  ['Ormonde Jayne', 'Ormonde Jayne', 'niche'],
  ['Narciso Rodriguez', 'Narciso Rodriguez', 'designer'],
  ['Carolina Herrera', 'Carolina Herrera', 'designer'],
  ['Serge Lutens', 'Serge Lutens', 'niche'],
  ['Memo Paris', 'Memo Paris', 'niche'],
  ['Meo Fusciuni', 'Meo Fusciuni', 'niche'],
  ['Tiziana Terenzi', 'Tiziana Terenzi', 'niche'],
  ['Thomas Kosmala', 'Thomas Kosmala', 'niche'],
  ['BeauFort London', 'BeauFort London', 'niche'],
  ['Simone Andreoli', 'Simone Andreoli', 'niche'],
  ['Lorenzo Pazzaglia', 'Lorenzo Pazzaglia', 'niche'],
  ['Filippo Sorcinelli', 'Filippo Sorcinelli', 'niche'],
  ['Francesca Bianchi', 'Francesca Bianchi', 'niche'],
  ['Rogue Perfumery', 'Rogue Perfumery', 'niche'],
  ['Tauer Perfumes', 'Tauer Perfumes', 'niche'],
  ['Astrophil & Stella', 'Astrophil & Stella', 'niche'],
  ['Anomalia Paris', 'Anomalia Paris', 'niche'],
  ['Alghabra Parfums', 'Alghabra Parfums', 'niche'],
  ['Areej Le Dore', 'Areej Le Doré', 'niche'],
  ['Jeroboam', 'Jeroboam', 'niche'],
  ['Kajal', 'Kajal', 'niche'],
  ['Lacoste Fragrances', 'Lacoste Fragrances', 'designer'],
  ['Tommy Hilfiger', 'Tommy Hilfiger', 'designer'],
  ['Jimmy Choo', 'Jimmy Choo', 'designer'],
  ['John Varvatos', 'John Varvatos', 'designer'],
  ['David Beckham', 'David Beckham', 'designer'],
  ['Michael Kors', 'Michael Kors', 'designer'],
  ['Mercedes-Benz', 'Mercedes-Benz', 'designer'],
  ['Dolce&Gabbana', 'Dolce&Gabbana', 'designer'],
  ['Dolce and Gabbana', 'Dolce&Gabbana', 'designer'],
  ['Viktor&Rolf', 'Viktor&Rolf', 'designer'],
  ['Viktor and Rolf', 'Viktor&Rolf', 'designer'],
  ['Bon Parfumeur', 'Bon Parfumeur', 'niche'],
  ['BDK Parfums', 'BDK Parfums', 'niche'],
  ['Atelier Cologne', 'Atelier Cologne', 'niche'],
  ['Pana Dora', 'Pana Dora', 'niche'],
  ['Mind Games', 'Mind Games', 'niche'],
  ['Day Three', 'Day Three', 'niche'],
  ['City Rhythm', 'City Rhythm', 'niche'],
  ['Room 1015', 'Room 1015', 'niche'],
  ['Bois 1920', 'Bois 1920', 'niche'],
  ['Profumum Roma', 'Profumum Roma', 'niche'],
  ['Pantheon Roma', 'Pantheon Roma', 'niche'],
  ['Pollini Profumi', 'Pollini Profumi', 'niche'],
  ['Bruno Perrucci Parfums', 'Bruno Perrucci Parfums', 'niche'],
  ['Adolfo Dominguez', 'Adolfo Dominguez', 'designer'],
  ['Hazar Canal', 'Hazar Canal', 'middle_eastern'],
  ['Gulf Orchid', 'Gulf Orchid', 'middle_eastern'],
  ['Elyon Dubai', 'Elyon Dubai', 'middle_eastern'],
  ['Arabiyat Prestige', 'Arabiyat Prestige', 'middle_eastern'],
  ['FOMOWA Paris', 'FOMOWA Paris', 'niche'],
  ['Deraah Private', 'Deraah Private', 'middle_eastern'],
  ['MAISON OLFACTIF', 'MAISON OLFACTIF', 'niche'],
  ['Phenom', 'Phenom', 'niche'],
  ['Soko Parfums', 'Soko Parfums', 'niche'],
  ['Laurent Mazzone Parfums', 'Laurent Mazzone Parfums', 'niche'],
  ['Caeleste Parfums', 'Caeleste Parfums', 'niche'],
  ['Anomalous Parfum', 'Anomalous Parfum', 'niche'],
  ['Vivamor Parfums', 'Vivamor Parfums', 'niche'],
  ['Normal Estate', 'Normal Estate', 'niche'],
  ['Maison Vey', 'Maison Vey', 'niche'],
  ['Statik Olfactive', 'Statik Olfactive', 'niche'],
  ['Seven Gates', 'Seven Gates', 'niche'],
  ['Art Of Scent', 'Art Of Scent', 'niche'],
  ['Corvian Parfums', 'Corvian Parfums', 'niche'],
  ['Caravana Luxury', 'Caravana Luxury', 'niche'],
  ['Alex Perfume', 'Alex Perfume', 'niche'],
  ['Azha Perfumes', 'Azha Perfumes', 'middle_eastern'],
  ['Arabian Oud', 'Arabian Oud', 'middle_eastern'],
  ['In The Box', 'In The Box', 'niche'],
  ['Electimuss', 'Electimuss', 'niche'],
  ['Perris Monte Carlo', 'Perris Monte Carlo', 'niche'],
  ['Le Galion', 'Le Galion', 'niche'],
  ['Albatross', 'Albatross', 'niche'],
  ['Devertere', 'Devertere', 'niche'],
  ['Vivamor Parfums', 'Vivamor Parfums', 'niche'],
  ['d.grayi', 'd.grayi', 'niche'],
  // 2-word
  ['By Kilian', 'By Kilian', 'niche'],
  ['Ex Nihilo', 'Ex Nihilo', 'niche'],
  ['Le Labo', 'Le Labo', 'niche'],
  ['DS&Durga', 'DS&Durga', 'niche'],
  ['Orto Parisi', 'Orto Parisi', 'niche'],
  ['Bohoboco', 'Bohoboco', 'niche'],
  ['Fugazzi', 'Fugazzi', 'niche'],
  ['Kerosene', 'Kerosene', 'niche'],
  ['Spiritica', 'Spiritica', 'niche'],
  ['Coreterno', 'Coreterno', 'niche'],
  ['Atralia', 'Atralia', 'niche'],
  ['Argos', 'Argos', 'niche'],
  ['Zaharoff', 'Zaharoff', 'niche'],
  ['Aesop', 'Aesop', 'niche'],
  ['Floris', 'Floris', 'niche'],
  ['Atkinsons', 'Atkinsons', 'niche'],
  ['Toskovat', 'Toskovat\'', 'niche'],
  ['BLNDRGRPHY', 'BLNDRGRPHY', 'niche'],
  ['Ghalati', 'Ghalati', 'niche'],
  ['Malikhan', 'Malikhan', 'niche'],
  ['Zaraya', 'Zaraya', 'niche'],
  ['Morph', 'Morph', 'niche'],
  ['CZAR', 'CZAR', 'niche'],
  ['Muscent', 'Muscent', 'niche'],
  ['Rolensiya', 'Rolensiya', 'niche'],
  ['Laverne', 'Laverne', 'niche'],
  ['BORNTOSTANDOUT', 'BORNTOSTANDOUT®', 'niche'],
  ['Houbigant', 'Houbigant', 'designer'],
  ['Lalique', 'Lalique', 'designer'],
  ['Aramis', 'Aramis', 'designer'],
  ['Tom Ford', 'Tom Ford', 'designer'],
  ['Amouage', 'Amouage', 'niche'],
  ['Creed', 'Creed', 'niche'],
  ['Xerjoff', 'Xerjoff', 'niche'],
  ['Byredo', 'Byredo', 'niche'],
  ['Diptyque', 'Diptyque', 'niche'],
  ['Mancera', 'Mancera', 'niche'],
  ['Montale', 'Montale', 'niche'],
  ['Nishane', 'Nishane', 'niche'],
  ['Meo Fusciuni', 'Meo Fusciuni', 'niche'],
  ['Fueguia 1833', 'Fueguia 1833', 'niche'],
  ['Boy Smells', 'Boy Smells', 'niche'],
  ['Superz.', 'Superz.', 'niche'],
  ['Marc Gebauer', 'Marc Gebauer', 'niche'],
  ['James Heeley', 'James Heeley', 'niche'],
  ['Deraah', 'Deraah', 'middle_eastern'],
  ['Blackoud', 'Blackoud', 'middle_eastern'],
  ['Loumari', 'Loumari', 'middle_eastern'],
  ['YAFOOOH', 'YAFOOOH', 'middle_eastern'],
  ['WIDIAN', 'WIDIAN', 'middle_eastern'],
  ['Omanluxury', 'Omanluxury', 'middle_eastern'],
  ['Asdaaf', 'Asdaaf', 'middle_eastern'],
  ['Bujairami', 'Bujairami', 'middle_eastern'],
  ['Zimaya', 'Zimaya', 'middle_eastern'],
  ['Nusuk', 'Nusuk', 'middle_eastern'],
  ['MAISON ASRAR', 'MAISON ASRAR', 'middle_eastern'],
  ['Rayhaan', 'Rayhaan', 'middle_eastern'],
  ['Rasasi', 'Rasasi', 'middle_eastern'],
  ['Afnan', 'Afnan', 'middle_eastern'],
  ['Armaf', 'Armaf', 'middle_eastern'],
  ['Ajmal', 'Ajmal', 'middle_eastern'],
  ['Dumont', 'Dumont', 'niche'],
  ['Givenchy', 'Givenchy', 'designer'],
  ['Guerlain', 'Guerlain', 'designer'],
  ['Versace', 'Versace', 'designer'],
  ['Prada', 'Prada', 'designer'],
  ['Chanel', 'Chanel', 'designer'],
  ['Dior', 'Dior', 'designer'],
  ['Hermes', 'Hermès', 'designer'],
  ['Mugler', 'Mugler', 'designer'],
  ['Kenzo', 'Kenzo', 'designer'],
  ['Moschino', 'Moschino', 'designer'],
  ['Azzaro', 'Azzaro', 'designer'],
  ['Rabanne', 'Rabanne', 'designer'],
  ['Montblanc', 'Montblanc', 'designer'],
  ['Cartier', 'Cartier', 'designer'],
  ['Loewe', 'Loewe', 'designer'],
  ['Bvlgari', 'Bvlgari', 'designer'],
  ['Valentino', 'Valentino', 'designer'],
  ['Burberry', 'Burberry', 'designer'],
  ['Brioni', 'Brioni', 'designer'],
  ['Mexx', 'Mexx', 'designer'],
  ['Guess', 'Guess', 'designer'],
  ['Coach', 'Coach', 'designer'],
  ['Police', 'Police', 'designer'],
  ['Nautica', 'Nautica', 'designer'],
  ['Lacoste', 'Lacoste', 'designer'],
  ['Adidas', 'Adidas', 'designer'],
  ['Avon', 'Avon', 'designer'],
  ['Zara', 'Zara', 'designer'],
  ['Chopard', 'Chopard', 'designer'],
  ['Trussardi', 'Trussardi', 'designer'],
  ['Gisada', 'Gisada', 'designer'],
  ['Penhaligon', 'Penhaligon\'s', 'niche'],
  // Missing houses added from skipped entries
  ['Officine Creative Profumi', 'Officine Creative Profumi', 'niche'],
  ['Les Indemodables', 'Les Indemodables', 'niche'],
  ['Le Falcone Perfumes', 'Le Falcone Perfumes', 'middle_eastern'],
  ['Salvatore Ferragamo', 'Salvatore Ferragamo', 'designer'],
  ['The Harmonist', 'The Harmonist', 'niche'],
  ['Issey Miyake', 'Issey Miyake', 'designer'],
  ['Calvin Klein', 'Calvin Klein', 'designer'],
  ['Jacques Bogart', 'Jacques Bogart', 'designer'],
  ['Atelier Materi', 'Atelier Materi', 'niche'],
  ['Guy Laroche', 'Guy Laroche', 'designer'],
  ['M. Micallef', 'M. Micallef', 'niche'],
  ['Gucci', 'Gucci', 'designer'],
  ['Davidoff', 'Davidoff', 'designer'],
  ['Mauboussin', 'Mauboussin', 'designer'],
  ['Gritti', 'Gritti', 'niche'],
  ['Arquiste', 'Arquiste', 'niche'],
  ['Granado', 'Granado', 'designer'],
  ['Natura', 'Natura', 'designer'],
  ['Mallo', 'Mallo', 'niche'],
  ['Areej', 'Areej', 'niche'],
  ['Joop!', 'Joop!', 'designer'],
];

// Sort longest first for greedy matching
HOUSES.sort((a, b) => b[0].length - a[0].length);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(str) {
  return str
    .replace(/Ã©/g, 'e').replace(/Ã¨/g, 'e').replace(/Ã /g, 'a')
    .replace(/Ã¢/g, 'a').replace(/Ã´/g, 'o').replace(/Ã®/g, 'i')
    .replace(/Ã»/g, 'u').replace(/Ã§/g, 'c').replace(/Ã±/g, 'n')
    .replace(/Ã²/g, 'o').replace(/Ã¡/g, 'a').replace(/Ã­/g, 'i')
    .replace(/Ã³/g, 'o').replace(/Ãº/g, 'u').replace(/Ã¼/g, 'u')
    .replace(/Ã/g, 'A').replace(/Â®/g, '').replace(/Â/g, '')
    .replace(/â/g, '\'').replace(/â/g, '\'').replace(/â/g, '-')
    .replace(/[‘’]/g, '\'')
    .toLowerCase()
    .trim();
}

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ýÿ]/g, 'y')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[ß]/g, 'ss')
    .replace(/&/g, 'and')
    .replace(/[''']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function detectConcentration(name) {
  const n = name.toLowerCase();
  if (n.includes('extrait')) return 'Extrait de Parfum';
  if (n.includes('eau de parfum')) return 'Eau de Parfum';
  if (n.includes('eau de toilette')) return 'Eau de Toilette';
  if (n.includes('eau fraiche') || n.includes('eau fraîche')) return 'Eau Fraiche';
  if (n.includes(' parfum') && !n.includes('parfumeur') && !n.includes('parfums')) return 'Parfum';
  if (n.includes('elixir') || n.includes('élixir')) return 'Parfum';
  if (n.includes('absolu')) return 'Parfum';
  return null;
}

function parseEntry(line) {
  // Match: "Name House (male|female|unisex) ~ YYYY"
  const match = line.match(/^(.+?)\s+\((male|female|unisex)\)\s*~\s*(\d{4})\s*$/);
  if (!match) return null;

  const fullName = match[1].trim();
  const year = parseInt(match[3], 10);
  const normalizedFull = normalize(fullName);

  let house = null;
  let displayHouse = null;
  let category = 'niche';
  let fragName = fullName;

  for (const [search, display, cat] of HOUSES) {
    const normalizedSearch = normalize(search);
    if (
      normalizedFull.endsWith(normalizedSearch) &&
      (normalizedFull.length === normalizedSearch.length || normalizedFull[normalizedFull.length - normalizedSearch.length - 1] === ' ')
    ) {
      house = search;
      displayHouse = display;
      category = cat;
      // Extract frag name: original string minus house suffix
      const idx = fullName.toLowerCase().lastIndexOf(search.toLowerCase());
      if (idx === -1) {
        // fallback: strip by char count
        fragName = fullName.slice(0, fullName.length - search.length).trim();
      } else {
        fragName = fullName.slice(0, idx).trim();
      }
      break;
    }
  }

  if (!house) return null;

  const slug = `${toSlug(fragName)}-${toSlug(displayHouse)}-${year}`.slice(0, 100);
  const concentration = detectConcentration(fragName);

  return {
    name: fragName,
    house: displayHouse,
    slug,
    category,
    concentration,
    year_released: year,
    status: 'approved',
  };
}

// ---------------------------------------------------------------------------
// Raw fragrance data (top 2024/2025 releases)
// ---------------------------------------------------------------------------
const RAW_DATA = `Bottled Absolu Hugo Boss (male) ~ 2024
Absolu Aventus Creed (male) ~ 2025
Liquid Brun French Avenue (male) ~ 2024
Dior Homme Intense 2025 Dior (male) ~ 2025
L'Homme Ideal Parfum Guerlain (male) ~ 2024
MYSLF Le Parfum Yves Saint Laurent (male) ~ 2024
Outlands Amouage (unisex) ~ 2024
Supremacy Collector's Edition Pour Homme Afnan (male) ~ 2024
Angels' Share Paradis By Kilian (unisex) ~ 2025
Emporio Armani Stronger With You Parfum Giorgio Armani (male) ~ 2025
Gentleman Society Eau de Parfum Ambree Givenchy (male) ~ 2025
Purpose 50 Amouage (unisex) ~ 2025
Angel's Share On The Rocks By Kilian (unisex) ~ 2025
Terre d'Hermes Intense Hermes (male) ~ 2025
Eau d'Ombre Leather Tom Ford (male) ~ 2024
Blue Talisman Extrait de Parfum Ex Nihilo (unisex) ~ 2025
Habit Rouge Parfum Guerlain (male) ~ 2024
Le Sel d'Issey Issey Miyake (male) ~ 2024
Bleu de Chanel L'Exclusif Chanel (male) ~ 2025
Babycat Raw Bourbon Yves Saint Laurent (unisex) ~ 2025
Le Male Elixir Absolu Jean Paul Gaultier (male) ~ 2025
MYSLF L'Absolu Yves Saint Laurent (male) ~ 2025
Tuxedo Sharp Patchouli Yves Saint Laurent (unisex) ~ 2025
Le Beau Paradise Garden Jean Paul Gaultier (male) ~ 2024
Armani Code Eau de Parfum 2024 Giorgio Armani (male) ~ 2024
Acqua di Gio Profondo Eau de Parfum 2024 Giorgio Armani (male) ~ 2024
Bal d'Afrique Absolu Byredo (unisex) ~ 2025
Virgin Island Water Creed (unisex) ~ 2025
Decision Amouage (unisex) ~ 2025
Born in Roma Extradose Uomo Valentino (male) ~ 2025
Vetiver Parfum Guerlain (male) ~ 2024
Spicebomb Metallic Musk Viktor&Rolf (male) ~ 2025
Gucci Guilty Absolu de Parfum Pour Homme Gucci (male) ~ 2025
Vulcan Feu French Avenue (unisex) ~ 2025
Forever Wanted Elixir Azzaro (male) ~ 2025
Oud Wood Parfum Tom Ford (unisex) ~ 2024
Explorer Extreme Montblanc (male) ~ 2025
Acqua di Gio Elixir Giorgio Armani (male) ~ 2025
Teriaq Intense Lattafa Perfumes (unisex) ~ 2024
Deified Tony Iommi Parfum Xerjoff (unisex) ~ 2024
Club de Nuit Precieux I Armaf (unisex) ~ 2024
Bois Imperial Extrait Essential Parfums (unisex) ~ 2024
Scandal Pour Homme Absolu Jean Paul Gaultier (male) ~ 2024
Polo 67 Eau de Parfum Ralph Lauren (male) ~ 2025
Eros Energy Versace (male) ~ 2024
Buongiorno Acqua di Parma (unisex) ~ 2025
Emporio Armani Stronger With You Sandalwood Giorgio Armani (unisex) ~ 2025
Il Padrino Sospiro Perfumes (unisex) ~ 2025
Le Sel D'Issey Eau de Parfum Issey Miyake (male) ~ 2025
H24 Herbes Vives Hermes (male) ~ 2024
Ralph's Club New York Ralph Lauren (male) ~ 2025
Bvlgari Man In Black Parfum Bvlgari (male) ~ 2024
Boss The Scent Elixir For Him Hugo Boss (male) ~ 2024
Dior Homme Parfum 2025 Dior (male) ~ 2025
Allure Homme Sport Superleggera Chanel (male) ~ 2024
Bois Pacifique Tom Ford (male) ~ 2024
Alexandria II Anniversary Xerjoff (unisex) ~ 2024
Habit Rouge Spirit Guerlain (male) ~ 2025
Fico di Amalfi La Riserva Acqua di Parma (unisex) ~ 2025
Old Fashioned By Kilian (unisex) ~ 2024
Invictus Parfum Rabanne (male) ~ 2024
Paradigme Prada (male) ~ 2025
Marwa Arabiyat Prestige (male) ~ 2025
Amber Oud Aqua Dubai Al Haramain Perfumes (unisex) ~ 2024
Light Blue Pour Homme Eau de Toilette Dolce&Gabbana (male) ~ 2025
L'Eau d'Issey Pour Homme Eau de Parfum Issey Miyake (male) ~ 2025
Gentleman Society Eau de Parfum Extreme Givenchy (male) ~ 2024
Santal Royal Guerlain (unisex) ~ 2024
Oud Zarian Creed (unisex) ~ 2025
Hawas Black Rasasi (male) ~ 2024
Neroli Portofino Parfum Tom Ford (unisex) ~ 2024
Oud Cadenza Maison Crivelli (unisex) ~ 2024
Acqua di Gio Profondo Parfum Giorgio Armani (male) ~ 2024
Falcon Leather Extrait Matiere Premiere (unisex) ~ 2024
Castley Parfums de Marly (male) ~ 2025
Asad Bourbon Lattafa Perfumes (male) ~ 2025
Safran Secret Maison Crivelli (unisex) ~ 2025
Y Le Parfum 2025 Yves Saint Laurent (male) ~ 2025
Light Blue Capri In Love Pour Homme Eau de Parfum Dolce&Gabbana (male) ~ 2025
Cuir InfraRouge Maison Crivelli (unisex) ~ 2024
Caden Omanluxury (unisex) ~ 2025
Oud for Greatness Neo Initio Parfums Prives (unisex) ~ 2024
Centaurus Creed (unisex) ~ 2024
Island Dreams Khadlaj Perfumes (unisex) ~ 2025
Emporio Armani Stronger With You Tobacco Giorgio Armani (male) ~ 2024
Rare Reef Afnan (unisex) ~ 2025
The Hedonist Extrait de Parfum Ex Nihilo (unisex) ~ 2024
Aether French Avenue (unisex) ~ 2024
Club de Nuit Intense Man Limited Edition Parfum 2024 Armaf (male) ~ 2024
Perseus Parfums de Marly (male) ~ 2024
Eros Najim Versace (male) ~ 2024
Mandarino di Sicilia Acqua di Parma (unisex) ~ 2024
Colonia Il Profumo Acqua di Parma (unisex) ~ 2025
Wavechild Room 1015 (unisex) ~ 2024
Mercedes Benz Club Black Eau de Parfum Mercedes-Benz (male) ~ 2025
Bad Boy Cobalt Elixir Carolina Herrera (male) ~ 2024
Hero Parfum Burberry (male) ~ 2024
Hero Parfum Intense Burberry (male) ~ 2025
Luna Rossa Ocean Le Parfum Prada (male) ~ 2024
9PM Elixir Afnan (unisex) ~ 2025
Kenzo Homme Indigo Kenzo (male) ~ 2025
Boss Bottled Beyond Hugo Boss (male) ~ 2025
Risvelium Orto Parisi (unisex) ~ 2025
Gucci Guilty Love Edition Pour Homme 2024 Gucci (male) ~ 2024
Club De Nuit Intense Man Extrait Armaf (male) ~ 2025
Al Nashama Caprice Lattafa Perfumes (unisex) ~ 2024
Y Elixir Yves Saint Laurent (male) ~ 2024
Delphinus Creed (unisex) ~ 2024
Black Lacquer Tom Ford (unisex) ~ 2024
Khamrah Dukhan Lattafa Perfumes (male) ~ 2025
Vanilla Powder Matiere Premiere (unisex) ~ 2025
Spicebomb Dark Leather Viktor&Rolf (male) ~ 2024
Black Orchid Reserve Tom Ford (unisex) ~ 2025
Declaration Eau de Parfum Cartier (male) ~ 2024
Guidance 46 Amouage (unisex) ~ 2024
Neroli Plein Sud Guerlain (unisex) ~ 2024
Valentino Uomo Born in Roma Green Stravaganza Valentino (male) ~ 2024
Encens Suave Extrait Matiere Premiere (unisex) ~ 2024
Tales of Amber Goldfield & Banks Australia (unisex) ~ 2025
Boss Bottled Bold Citrus Hugo Boss (male) ~ 2025
Ambre Nuit Esprit De Parfum Dior (unisex) ~ 2024
The Most Wanted Intense Azzaro (male) ~ 2024
Invictus Victory Absolu Rabanne (male) ~ 2025
Narcotic Delight Initio Parfums Prives (unisex) ~ 2024
Gris Dior Esprit De Parfum Dior (unisex) ~ 2024
9 PM Rebel Afnan (unisex) ~ 2024
Crystal Saffron Extrait Matiere Premiere (unisex) ~ 2024
A*Men Fantasm Mugler (male) ~ 2024
Never-ending Summer Maison Martin Margiela (unisex) ~ 2025
Cuir Intense Guerlain (unisex) ~ 2024
Fortuitous Finley Penhaligon (male) ~ 2025
Verano Ormonde Jayne (unisex) ~ 2025
Lucius Fragrance Du Bois (unisex) ~ 2024
Hawas Fire Rasasi (unisex) ~ 2025
Mashrabya Lattafa Perfumes (unisex) ~ 2024
Invictus Aqua 2024 Rabanne (male) ~ 2024
Intense French Riviera Mancera (unisex) ~ 2025
Terra Rayhaan (male) ~ 2025
Torino24 Xerjoff (unisex) ~ 2024
Fleur de Peau Eau de Toilette Diptyque (unisex) ~ 2025
Art Of Universe Lattafa Perfumes (unisex) ~ 2025
Incense 01 Swiss Arabian (unisex) ~ 2025
Bad Boy Elixir Carolina Herrera (male) ~ 2025
Turathi Electric Afnan (unisex) ~ 2025
Lustre Amouage (unisex) ~ 2024
Platine Blanc Aromatix X French Avenue (unisex) ~ 2025
For Him Vetiver Musc Narciso Rodriguez (male) ~ 2024
Scandal Pour Homme Intense Jean Paul Gaultier (male) ~ 2025
Black Meisterstuck Montblanc (male) ~ 2024
Luna Rossa 2024 Prada (male) ~ 2024
Boss Bottled Triumph Elixir Hugo Boss (male) ~ 2024
Duran Duran Black Moonlight Xerjoff (unisex) ~ 2025
The Kingdom For Men Lattafa Perfumes (male) ~ 2024
Lion Rayhaan (male) ~ 2024
The Cut Penhaligon (male) ~ 2025
Island Vanilla Dunes Khadlaj Perfumes (unisex) ~ 2025
Asad Elixir Lattafa Perfumes (male) ~ 2025
Tobacco 01 Swiss Arabian (unisex) ~ 2024
Island Khadlaj Perfumes (unisex) ~ 2024
Acqua di Gio Profondo Eau de Toilette Giorgio Armani (male) ~ 2025
Coach for Men Eau de Parfum Coach (male) ~ 2025
Original Santal 2024 Creed (unisex) ~ 2024
Amber Empire French Avenue (male) ~ 2025
Million Gold Elixir Rabanne (male) ~ 2025
Legacy MAISON ASRAR (unisex) ~ 2025
Fall of Phaeton Argos (unisex) ~ 2024
Louis XV 1722 Xerjoff (unisex) ~ 2024
Reasons Amouage (unisex) ~ 2024
Kenzo Homme Santal Marin Kenzo (male) ~ 2024
Nitro Red Intensely Dumont (male) ~ 2025
King Cobra Zoologist Perfumes (unisex) ~ 2024
ComÃ¨te Chanel (unisex) ~ 2024
Lune Feline Vintage Atelier des Ors (unisex) ~ 2024
Pacific Rock Flower Goldfield & Banks Australia (unisex) ~ 2025
Sunrise on the Red Sand Dunes Intense Zara (male) ~ 2024
Hawas Tropical Rasasi (male) ~ 2025
Cool Elixir Davidoff (male) ~ 2025
Atlas Lattafa Perfumes (unisex) ~ 2024
Pacific Aura Rayhaan (male) ~ 2025
Oud Voyager Tom Ford (unisex) ~ 2025
Valentino Uomo Born in Roma Ivory Valentino (male) ~ 2025
Amber Oud Dubai Night Al Haramain Perfumes (male) ~ 2024
Armani Code Elixir Giorgio Armani (male) ~ 2025
K by Dolce & Gabbana Eau de Parfum Intense Dolce&Gabbana (male) ~ 2024
Hawas Kobra Rasasi (male) ~ 2025
Amber Oud Gold Edition Al Haramain Perfumes (unisex) ~ 2024
Hinoki & Cedarwood Jo Malone London (unisex) ~ 2024
Le Beau Flower Edition Jean Paul Gaultier (male) ~ 2025
Fabulous Parfum Tom Ford (unisex) ~ 2025
CK One Essence Calvin Klein (unisex) ~ 2024
Opulent Dubai Lattafa Perfumes (unisex) ~ 2025
Toy Boy 2 Moschino (male) ~ 2025
Spectre Wraith French Avenue (male) ~ 2024
His Confession Lattafa Perfumes (male) ~ 2024
Patchouli Paris Guerlain (unisex) ~ 2024
Oceania Parfum Roja Dove (unisex) ~ 2025
Dynasty Lattafa Perfumes (unisex) ~ 2025
Eternal Wood Mancera (unisex) ~ 2024
Faris Al Arab MAISON ASRAR (male) ~ 2025
Mahd Al Dhahab Arabiyat Prestige (unisex) ~ 2025
Hawas Elixir Rasasi (unisex) ~ 2024
Existence Amouage (unisex) ~ 2025
Sindbad Amouage (unisex) ~ 2025
Amberful Mancera (unisex) ~ 2024
Tiger Rayhaan (male) ~ 2025
La Di Da For Him Arabiyat Prestige (male) ~ 2025
Versace Man Eau Fraiche Extreme Versace (male) ~ 2025
Qaed Al Fursan Untamed Lattafa Perfumes (unisex) ~ 2025
Club De Nuit Lionheart Man Armaf (male) ~ 2025
Mango Ice Gulf Orchid (unisex) ~ 2025
Oud Ispahan Esprit De Parfum Dior (unisex) ~ 2024
212 VIP Black Elixir Carolina Herrera (male) ~ 2025
Havana Gold Dries Van Noten (unisex) ~ 2025
Odyssey Limoni Fresh Armaf (unisex) ~ 2024
Intense Instant Crush Mancera (unisex) ~ 2025
The Dandy Penhaligon (unisex) ~ 2024
Muharib MAISON ASRAR (unisex) ~ 2025
Drakkar Bleu Guy Laroche (male) ~ 2025
Polo 67 Ralph Lauren (male) ~ 2024
Notorious XO M. Micallef (male) ~ 2025
Hectic Bujairami (unisex) ~ 2024
Titanium Gisada (male) ~ 2024
Azzure Oud French Avenue (male) ~ 2024
Tabarome Millesime Creed (male) ~ 2025
Vanille Fatale 2024 Tom Ford (unisex) ~ 2024
Eau de Soleil Blanc 2025 Tom Ford (unisex) ~ 2025
Eternity Aromatic Essence for Men Calvin Klein (male) ~ 2024
Bonded Rogue Perfumery (unisex) ~ 2025
Shiyaaka Snow Khadlaj Perfumes (unisex) ~ 2025
Rayhaan Elixir Rayhaan (unisex) ~ 2024
Burgundy Oud Atelier Materi (unisex) ~ 2024
Habik For Men Lattafa Perfumes (male) ~ 2025
Magnetiq Aromatix X French Avenue (unisex) ~ 2025
Ombre Tonka Mancera (unisex) ~ 2025
Nitro Elixir Dumont (male) ~ 2025
Hawas Malibu Rasasi (unisex) ~ 2025
Lacoste Original Parfum Lacoste Fragrances (male) ~ 2025
Club de Nuit Intense Man Extreme Edition Armaf (male) ~ 2025
Meant To Be Seen Nishane (unisex) ~ 2025
Original Vetiver 2024 Creed (unisex) ~ 2024
Emeer Lattafa Perfumes (unisex) ~ 2024
Devotion Pour Homme Parfum Dolce&Gabbana (male) ~ 2025
Shiyaaka Shadow Khadlaj Perfumes (male) ~ 2025
Velvet Iris Essential Parfums (unisex) ~ 2025
Hawas Verde Rasasi (male) ~ 2025
Black Armaf (male) ~ 2024
Vulcan Black Friday French Avenue (male) ~ 2025
Royal Blend Nero French Avenue (unisex) ~ 2024
Royal Blend Sequoia French Avenue (unisex) ~ 2025
Amber Oud Dubai Night Al Haramain Perfumes (male) ~ 2024
Amber Oud Gold 999.9 Dubai Edition Al Haramain Perfumes (unisex) ~ 2024
Nitro White Dumont (male) ~ 2024
Nitro Platinum Dumont (male) ~ 2024
Devotion Pour Homme Dolce&Gabbana (male) ~ 2025
This Is Really Him! Zadig & Voltaire (male) ~ 2024
Le Male Elixir Collector Edition Jean Paul Gaultier (male) ~ 2025
Sun Song 2025 Louis Vuitton (unisex) ~ 2025
LV Lovers Louis Vuitton (male) ~ 2024
Pur Santal Louis Vuitton (unisex) ~ 2024
Hawas Elixir Rasasi (unisex) ~ 2024
Khamrah Areej (unisex) ~ 2025
Sauvage Rare Blend Dior (male) ~ 2025
Sauvage Eau Forte Dior (male) ~ 2024
Sauvage Eau de Toilette Into The Wild Dior (male) ~ 2025
Sauvage Eau de Parfum Into The Wild Dior (male) ~ 2025
Sauvage Parfum Into The Wild Dior (male) ~ 2025
Phantom Elixir Rabanne (male) ~ 2025
Million Gold Rabanne (male) ~ 2024
Eragon Parfums de Marly (unisex) ~ 2025
Valero Parfums de Marly (unisex) ~ 2025
Castley Parfums de Marly (male) ~ 2025
Voyager Intense Parfum Nautica (unisex) ~ 2025
Atlas Lattafa Perfumes (unisex) ~ 2024
Al Noor Arabiyat Prestige (unisex) ~ 2025
Ramad Oriental Arabiyat Prestige (unisex) ~ 2025
Swar Seduire Arabiyat Prestige (unisex) ~ 2025
Fahad Gaze Arabiyat Prestige (male) ~ 2025
Fakhar Platin Lattafa Perfumes (unisex) ~ 2025
His Confession Lattafa Perfumes (male) ~ 2024
Artisan Ethnique Lattafa Perfumes (unisex) ~ 2024
Art Of Universe Lattafa Perfumes (unisex) ~ 2025
Art Of Nature II Lattafa Perfumes (unisex) ~ 2024
Qaa'ed Intense Lattafa Perfumes (male) ~ 2024
Sherif Lattafa Perfumes (male) ~ 2025
Angham Lattafa Perfumes (unisex) ~ 2024
Dynasty Lattafa Perfumes (unisex) ~ 2025
Musamam Black Intense Lattafa Perfumes (unisex) ~ 2025
Kashan Lattafa Perfumes (unisex) ~ 2024
Sheikh Al Shuyukh Supreme Lattafa Perfumes (unisex) ~ 2025
Rave Royal Supreme Conquer Lattafa Perfumes (male) ~ 2024
Najdia Intense Lattafa Perfumes (male) ~ 2024
Pisa Lattafa Perfumes (male) ~ 2024
Incense Ebony Maison Alhambra (unisex) ~ 2024
Baroque Satin Oud Maison Alhambra (male) ~ 2024
Toro Pour Homme Glace Maison Alhambra (male) ~ 2024
Afro Leather Maison Alhambra (unisex) ~ 2024
Odyssey Limoni Fresh Armaf (unisex) ~ 2024
Odyssey Dubai Chocolat Armaf (unisex) ~ 2025
Odyssey Mandarin Sky Elixir Armaf (unisex) ~ 2025
Odyssey Revolution Armaf (unisex) ~ 2025
Odyssey Marshmallow Armaf (unisex) ~ 2025
Odyssey Spectra Armaf (unisex) ~ 2024
Club de Nuit Bling Armaf (unisex) ~ 2025
Ombre d'Or Armaf (unisex) ~ 2025
Feroce Armaf (unisex) ~ 2024
Magnificent Jardin Armaf (unisex) ~ 2025
Rugir Armaf (male) ~ 2024
King Armaf (male) ~ 2024
SHK I Armaf (male) ~ 2024
Art 11 Acqua Tua Profumi d'Art Armaf (unisex) ~ 2024
Art 04 The One And Only Oud Profumi d'Art Armaf (unisex) ~ 2024
The Pride Of Armaf Admiral Armaf (unisex) ~ 2024
Ombre d'Or Armaf (unisex) ~ 2025
Shuhrah Elixir Rasasi (male) ~ 2025
Hawas Tropical Rasasi (male) ~ 2025
Shaghaf Oud Elixir Swiss Arabian (unisex) ~ 2024
Shaghaf Amber Infusion Swiss Arabian (unisex) ~ 2025
Incense 01 Swiss Arabian (unisex) ~ 2025
Tobacco 01 Swiss Arabian (unisex) ~ 2024
Soul of Bali Swiss Arabian (unisex) ~ 2025
Mint and Wood Swiss Arabian (male) ~ 2024
Enigma of Taif Swiss Arabian (unisex) ~ 2025
Island Dreams Khadlaj Perfumes (unisex) ~ 2025
Island Vanilla Dunes Khadlaj Perfumes (unisex) ~ 2025
Island Khadlaj Perfumes (unisex) ~ 2024
Shiyaaka Snow Khadlaj Perfumes (unisex) ~ 2025
Shiyaaka Shadow Khadlaj Perfumes (male) ~ 2025
Zayaan Gold Khadlaj Perfumes (unisex) ~ 2025
Le Prestige Empress Khadlaj Perfumes (unisex) ~ 2025
Ameer Al Arab Imperium Asdaaf (male) ~ 2024
Historic Sahara Afnan (unisex) ~ 2025
Lynked Freedom Afnan (male) ~ 2025
Caden Omanluxury (unisex) ~ 2025
Nasaj Omanluxury (unisex) ~ 2025
Wadi MAISON ASRAR (unisex) ~ 2025
Cascade MAISON ASRAR (unisex) ~ 2025
Leo MAISON ASRAR (unisex) ~ 2024
Hunter MAISON ASRAR (male) ~ 2024
Majesty MAISON ASRAR (unisex) ~ 2025
Vision MAISON ASRAR (unisex) ~ 2025
Rey MAISON ASRAR (unisex) ~ 2024
Faris Al Arab MAISON ASRAR (male) ~ 2025
Muharib MAISON ASRAR (unisex) ~ 2025
Noir Al Majed Oud (unisex) ~ 2024
Aris Al Majed Oud (unisex) ~ 2024
Elbrince Al Majed Oud (male) ~ 2024
Nude Coral Diamond Ibrahim Al Qurashi (unisex) ~ 2024
White Regent Diamond Ibrahim Al Qurashi (unisex) ~ 2025
Emerald Soul Diamond Ibrahim Al Qurashi (unisex) ~ 2024
Black Carbon Diamond Ibrahim Al Qurashi (unisex) ~ 2025
Madawi Gold Edition Arabian Oud (unisex) ~ 2024
Sultani Amberwood Arabian Oud (unisex) ~ 2025
Nobles Arabian Oud (male) ~ 2024
Eau d'Oud Ajmal (unisex) ~ 2024
Fawah Midnight Edition Nusuk (male) ~ 2025
Ateeq Nusuk (male) ~ 2025
Mango Punch PARIS CORNER (unisex) ~ 2025
Virilis PARIS CORNER (male) ~ 2024
Qissa Blue PARIS CORNER (unisex) ~ 2024
Perseviron Fig Hug PARIS CORNER (unisex) ~ 2025
Zodiac PARIS CORNER (unisex) ~ 2024
Prodigy PARIS CORNER (unisex) ~ 2024
Rifaaqat Adorn PARIS CORNER (unisex) ~ 2024
Mawj Appletini PARIS CORNER (unisex) ~ 2024
AOMAK Loumari (unisex) ~ 2025
Amber Malatya Loumari (unisex) ~ 2025
Arora Hazar Canal (unisex) ~ 2025
Barbaros Hazar Canal (unisex) ~ 2024
Gate 17 Morph (unisex) ~ 2024
Velvet Spices Muscent (unisex) ~ 2025
Purple Star Muscent (unisex) ~ 2025
Boozy Tonka Muscent (unisex) ~ 2025
Himeros Elyon Dubai (unisex) ~ 2025
Infinity Elyon Dubai (unisex) ~ 2025
Varna Ghalati (unisex) ~ 2024
AQVAMARE Malikhan (unisex) ~ 2025
AERVM Malikhan (unisex) ~ 2025
Black Diamond Zaraya (unisex) ~ 2025
ORA Mallo (unisex) ~ 2025
Moonwalk SeaCoco FOMOWA Paris (unisex) ~ 2025
Akatsuki Melba FOMOWA Paris (unisex) ~ 2025
LYNCH smoked styrax Spiritica (unisex) ~ 2025
Yuzuyakuza Spiritica (unisex) ~ 2025
Atmayatra Spiritica (unisex) ~ 2024
Mangomacumba Spiritica (unisex) ~ 2024
Weon Spiritica (unisex) ~ 2024
Suscepto Spiritica (unisex) ~ 2024
Hectic Bujairami (unisex) ~ 2024
Cool Elixir Davidoff (male) ~ 2025
Cool Water Reborn Eau de Parfum Intense Davidoff (male) ~ 2024
Pacific Rock Flower Goldfield & Banks Australia (unisex) ~ 2025
Tales of Amber Goldfield & Banks Australia (unisex) ~ 2025
The Red Wedding Anomalous Parfum (unisex) ~ 2024
M-04 Normal Estate (unisex) ~ 2025
Samawat Maison Vey (unisex) ~ 2024
Layali Maison Vey (unisex) ~ 2024
Dead or Alive Statik Olfactive (male) ~ 2025
Immortal Shade Seven Gates (unisex) ~ 2024
Cocopan Nusa Art Of Scent (unisex) ~ 2024
Aether Corvian Parfums (unisex) ~ 2025
Summer Caravana Luxury (unisex) ~ 2025
Metallic Rose's Alex Perfume (unisex) ~ 2025
Black Dog d.grayi (unisex) ~ 2024
Ink Mark Louis Vuitton (unisex) ~ 2025
Pur Ambre Louis Vuitton (unisex) ~ 2024
Vanille de Minuit Maison Tahite Officine Creative Profumi (unisex) ~ 2024
Hermessence Oud Alezan Hermes (unisex) ~ 2024
New Look 2024 Dior (unisex) ~ 2024
Bois Talisman Dior (unisex) ~ 2025
Cuir Saddle Dior (unisex) ~ 2025
Ambre Nuit Esprit De Parfum Dior (unisex) ~ 2024
Gris Dior Esprit De Parfum Dior (unisex) ~ 2024
Rouge Trafalgar Esprit De Parfum Dior (unisex) ~ 2024
Cuir Saddle Dior (unisex) ~ 2025
Lune Feline Extrait Gold Craftsmanship Limited Edition Atelier des Ors (unisex) ~ 2025
502 Iris Cartagena Bon Parfumeur (unisex) ~ 2024
403 Myrrh Shadow Bon Parfumeur (unisex) ~ 2025
303 Marbre Rouge Bon Parfumeur (unisex) ~ 2024
Oriental Saffron Bohoboco (unisex) ~ 2024
Orange Crush Extrait de Parfum Fugazzi (unisex) ~ 2025
Vanilla Haze Fugazzi (unisex) ~ 2024
Purple Fugazzi (unisex) ~ 2025
Magic Mango Fugazzi (unisex) ~ 2025
Passionfroudh Fugazzi (unisex) ~ 2025
Tulum Junglescape Simone Andreoli (unisex) ~ 2025
Kite in Crystal Reef Simone Andreoli (unisex) ~ 2025
Notre Dame Notte di Natale Filippo Sorcinelli (unisex) ~ 2024
Pioggia Debole Extrait de Parfum Filippo Sorcinelli (unisex) ~ 2025
Ruah Extrait de Parfum Filippo Sorcinelli (unisex) ~ 2025
Pont. Max. Filippo Sorcinelli (unisex) ~ 2024
Fango e Pesca Filippo Sorcinelli (unisex) ~ 2025
Pioggia Moderata Extrait de Parfum Filippo Sorcinelli (unisex) ~ 2025
Incenso Notturno Extrait de Parfum Lorenzo Pazzaglia (unisex) ~ 2024
Sun-gria Lorenzo Pazzaglia (unisex) ~ 2024
Speachless Lorenzo Pazzaglia (unisex) ~ 2025
Vesuviuur Lorenzo Pazzaglia (unisex) ~ 2025
Never-ending Summer Maison Martin Margiela (unisex) ~ 2025
Jazz Club 2025 Holiday Limited Edition Maison Martin Margiela (male) ~ 2025
Afternoon Delight Maison Martin Margiela (unisex) ~ 2024
Myrrh & Tonka Limited Edition Jo Malone London (unisex) ~ 2024
Red Hibiscus Jo Malone London (unisex) ~ 2024
Hinoki & Cedarwood Jo Malone London (unisex) ~ 2024
Amber Labdanum Cologne Intense Jo Malone London (unisex) ~ 2025
Radical Rose Extrait Matiere Premiere (unisex) ~ 2024
Santal Austral Extrait Matiere Premiere (unisex) ~ 2024
Musk Therapy Hair Perfume Initio Parfums Prives (unisex) ~ 2024
Narcotic Delight Initio Parfums Prives (unisex) ~ 2024
Atomic Rose Hair Perfume Initio Parfums Prives (unisex) ~ 2024
Power Self Initio Parfums Prives (unisex) ~ 2025
Can't Get Enough Initio Parfums Prives (unisex) ~ 2025
Lift Me Up Initio Parfums Prives (unisex) ~ 2025
Oud for Greatness Neo Initio Parfums Prives (unisex) ~ 2024
Absolute Chill Atralia (unisex) ~ 2025
Elixir Atralia (unisex) ~ 2024
Mojave Ghost Absolu Byredo (unisex) ~ 2024
Bal d'Afrique Absolu Byredo (unisex) ~ 2025
Rose of No Man's Land Absolu Byredo (unisex) ~ 2025
Blanche Absolu Byredo (unisex) ~ 2025
Alto Astral Byredo (unisex) ~ 2025
Fleur de Peau Eau de Toilette Diptyque (unisex) ~ 2025
Lazulio Diptyque (unisex) ~ 2025
Do Son Limited Edition Diptyque (unisex) ~ 2024
L'Eau Papier Hair Mist Diptyque (unisex) ~ 2024
Torino25 Xerjoff (unisex) ~ 2025
Louis XV 1722 Xerjoff (unisex) ~ 2024
Duran Duran Black Moonlight Xerjoff (unisex) ~ 2025
Duran Duran NeoRio Xerjoff (unisex) ~ 2025
Alexandria II Anniversary Xerjoff (unisex) ~ 2024
7 Parfum Xerjoff (unisex) ~ 2025
Purple Accento Xerjoff (unisex) ~ 2025
Homme Anniversary Xerjoff (unisex) ~ 2024
Deified Tony Iommi Parfum Xerjoff (unisex) ~ 2024
Isola Sol Roja Dove (unisex) ~ 2024
Elysium Noir Roja Dove (unisex) ~ 2025
Harry Potter Burlington 1819 Limited Edition Roja Dove (unisex) ~ 2025
Oceania Parfum Roja Dove (unisex) ~ 2025
Apex Eau Intense Roja Dove (unisex) ~ 2025
Parfum De La Nuit Roja Dove (unisex) ~ 2025
Roja Neiman Marcus Roja Dove (unisex) ~ 2025
Roja Dove Haute Parfumerie 20th Anniversary Roja Dove (unisex) ~ 2024
Aoud Extraordinaire Roja Dove (unisex) ~ 2024
Story of Your Life Etat Libre d'Orange (unisex) ~ 2024
Above the Waves Etat Libre d'Orange (unisex) ~ 2025
Uruk Chronicles Etat Libre d'Orange (unisex) ~ 2025
Point Du Jour Serge Lutens (unisex) ~ 2024
Sidi Bel-Abbes Serge Lutens (unisex) ~ 2025
Le perce-vent Serge Lutens (unisex) ~ 2025
L'Orpheline Edition Limitee Serge Lutens (unisex) ~ 2024
Hope Frederic Malle (unisex) ~ 2024
Synthetic Nature Frederic Malle (unisex) ~ 2024
Acne Studios Frederic Malle (unisex) ~ 2024
Curve Frederic Malle (unisex) ~ 2024
Baccarat Rouge 540 Edition Millesime Maison Francis Kurkdjian (unisex) ~ 2025
Le Beau Parfum 2025 Maison Francis Kurkdjian (unisex) ~ 2025
Absolue Pour Le Soir 2024 Maison Francis Kurkdjian (unisex) ~ 2024
Absolue Pour Le Matin 2024 Maison Francis Kurkdjian (unisex) ~ 2024
Kurky Maison Francis Kurkdjian (unisex) ~ 2025
Oud Nebula The Harmonist (unisex) ~ 2024
Cuir de Russie II Areej Le Dore (unisex) ~ 2025
War and Peace III Areej Le Dore (unisex) ~ 2025
Inverno Russo II Areej Le Dore (unisex) ~ 2025
Kun Amo Jeroboam (unisex) ~ 2025
Lune Feline Vintage Atelier des Ors (unisex) ~ 2024
Lune Feline Extrait Gold Craftsmanship Limited Edition Atelier des Ors (unisex) ~ 2025
A Grove by The Sea Arquiste (unisex) ~ 2024
Almond Suede Arquiste (unisex) ~ 2024
Fall of Phaeton Argos (unisex) ~ 2024
Neptune's Trident Argos (unisex) ~ 2025
Sacred Flame Argos (unisex) ~ 2024
Tilia Marc-Antoine Barrois (unisex) ~ 2024
Aldebaran Marc-Antoine Barrois (unisex) ~ 2025
Fortuitous Finley Penhaligon (male) ~ 2025
The Cut Penhaligon (male) ~ 2025
AIUla Penhaligon (unisex) ~ 2024
Osmanthus 19 Kyoto Le Labo (unisex) ~ 2024
Eucalyptus 20 Le Labo (unisex) ~ 2025
Absolue de Mousse Rogue Perfumery (unisex) ~ 2024
Bonded Rogue Perfumery (unisex) ~ 2025
L'Air du Desert Marocain Noir Tauer Perfumes (unisex) ~ 2025
Oud Cadenza Maison Crivelli (unisex) ~ 2024
Safran Secret Maison Crivelli (unisex) ~ 2025
Tubereuse Astrale Maison Crivelli (unisex) ~ 2024
Cuir InfraRouge Maison Crivelli (unisex) ~ 2024
Molecule 01 + Cistus Escentric Molecules (unisex) ~ 2025
Escentric 02 Extrait Escentric Molecules (unisex) ~ 2025
Mango Aoud Gritti (unisex) ~ 2024
Pomelo Assoluto Gritti (unisex) ~ 2025
Biassanot Gritti (unisex) ~ 2024
Super Nova Gritti (unisex) ~ 2024
Starry Nights Intense Montale (unisex) ~ 2025
Arabians Musk Montale (unisex) ~ 2024
Rendez-Vous Chez Harrods Montale (unisex) ~ 2024
Dallachai Montale (unisex) ~ 2024
Intense French Riviera Mancera (unisex) ~ 2025
Eternal Wood Mancera (unisex) ~ 2024
Intense Instant Crush Mancera (unisex) ~ 2025
Amberful Mancera (unisex) ~ 2024
Ombre Tonka Mancera (unisex) ~ 2025
Fig Me Up Mancera (unisex) ~ 2024
Xplicit Vanilla Mancera (unisex) ~ 2025
Fleur de Peau Eau de Toilette Diptyque (unisex) ~ 2025
Palais Bourbon Memo Paris (unisex) ~ 2024
Abu Dhabi Memo Paris (unisex) ~ 2024
Cassiopeia Rose Memo Paris (unisex) ~ 2024
Indian Leather Memo Paris (unisex) ~ 2024
Oud Voyager Tom Ford (unisex) ~ 2025
Bois Pacifique Tom Ford (male) ~ 2024
Neroli Portofino Parfum Tom Ford (unisex) ~ 2024
Fabulous Parfum Tom Ford (unisex) ~ 2025
Black Orchid Reserve Tom Ford (unisex) ~ 2025
Black Lacquer Tom Ford (unisex) ~ 2024
Vanille Fatale 2024 Tom Ford (unisex) ~ 2024
Eau de Soleil Blanc 2025 Tom Ford (unisex) ~ 2025
Rose Exposed Tom Ford (unisex) ~ 2025
Soleil Neige 2025 Tom Ford (unisex) ~ 2025
Soleil Neige Parfum Tom Ford (unisex) ~ 2024
Figue Erotique Tom Ford (unisex) ~ 2025
Cuir Sublime Oud Yves Saint Laurent (unisex) ~ 2025
Muse Yves Saint Laurent (unisex) ~ 2025
Baccarat Rouge 540 Edition Millesime Maison Francis Kurkdjian (unisex) ~ 2025
Reception Amouage (unisex) ~ 2025
Opus XVI Timber Amouage (unisex) ~ 2025
Lustre Amouage (unisex) ~ 2024
Guidance 46 Amouage (unisex) ~ 2024
Decision Amouage (unisex) ~ 2025
Outlands Amouage (unisex) ~ 2024
Reasons Amouage (unisex) ~ 2024
Purpose 50 Amouage (unisex) ~ 2025
Purpose 50 Royal Drop Amouage (unisex) ~ 2025
Existence Amouage (unisex) ~ 2025
Sindbad Amouage (unisex) ~ 2025
Hommage Alain Delon Lalique (male) ~ 2024
Pour Homme 2024 Givenchy (male) ~ 2024
Pour Homme Blue Label 2024 Givenchy (male) ~ 2024
L'Enfant Terrible Givenchy (unisex) ~ 2025
Gentleman Original 2024 Givenchy (male) ~ 2024
Fantasque Givenchy (unisex) ~ 2024
Santal Intense Floris (male) ~ 2024
Sandalwood Floris (unisex) ~ 2024
Platinum Blend Atkinsons (unisex) ~ 2025
Born for Eternity Atkinsons (unisex) ~ 2024
Shine Despite Everything Atkinsons (unisex) ~ 2024
Instinct 20th Anniversary Edition David Beckham (male) ~ 2025
Ceternity Aromatic Essence for Men Calvin Klein (male) ~ 2024
Eternity Amber Essence For Men Calvin Klein (male) ~ 2025
CK One Essence Calvin Klein (unisex) ~ 2024
Oud Esprit de Voyage Tom Ford (unisex) ~ 2025
Loewe 7 Elixir Loewe (male) ~ 2024
Solo Elixir Loewe (male) ~ 2025
Solo Vulcan Loewe (male) ~ 2024
Prado Loewe (unisex) ~ 2024
Paula's Ibiza Cosmic Loewe (unisex) ~ 2024
Joop! Homme Eau de Parfum Intense Joop! (male) ~ 2025
Lacoste Original Parfum Lacoste Fragrances (male) ~ 2025
Lacoste Original Lacoste Fragrances (male) ~ 2024
L.12.12 Silver Grey Lacoste Fragrances (male) ~ 2025
Impact Parfum Tommy Hilfiger (male) ~ 2025
Tommy Summer 2025 Tommy Hilfiger (male) ~ 2025
Jimmy Choo Man Extreme Jimmy Choo (male) ~ 2024
John Varvatos XX Intense John Varvatos (male) ~ 2024
John Varvatos XX Elixir John Varvatos (male) ~ 2025
Artisan Forest John Varvatos (male) ~ 2025
Silver Scent Aqua Jacques Bogart (male) ~ 2024
Polo Red Racing Edition Ralph Lauren (male) ~ 2025
Tabarome Millesime Creed (male) ~ 2025
Original Vetiver 2024 Creed (unisex) ~ 2024
Original Santal 2024 Creed (unisex) ~ 2024
Royal Mayfair 2024 Creed (unisex) ~ 2024
Voyage Intense Nautica (unisex) ~ 2025
Guess Uomo Intenso Guess (male) ~ 2024
Kenzo Homme Santal Marin Kenzo (male) ~ 2024
Kenzo Homme Indigo Kenzo (male) ~ 2025
Toy Boy 2 Moschino (male) ~ 2025
A*Men Stellar Mugler (male) ~ 2025
A*Men Fantasm Mugler (male) ~ 2024
Ferragamo Red Leather Salvatore Ferragamo (male) ~ 2024
Uomo Gisada (male) ~ 2025
Titanium Gisada (male) ~ 2024
Brioni Eau de Parfum Suave Brioni (male) ~ 2024
Drakkar Bleu Guy Laroche (male) ~ 2025
100% Passion Man Abercrombie & Fitch (male) ~ 2025
Noir Kogane Giorgio Armani (unisex) ~ 2024
Iris Bleu Giorgio Armani (unisex) ~ 2025
Cuir Nu Giorgio Armani (unisex) ~ 2025
K by Dolce & Gabbana Parfum Dolce&Gabbana (male) ~ 2025
Velvet Passion Oud Dolce&Gabbana (unisex) ~ 2025
Velvet Zafferano Dolce&Gabbana (unisex) ~ 2024
Devotion Pour Homme Parfum Dolce&Gabbana (male) ~ 2025
The One Pour Homme Eau de Parfum Dolce&Gabbana (male) ~ 2025
The One Pour Homme Parfum Dolce&Gabbana (male) ~ 2025
Star For Men Mauboussin (male) ~ 2024
Chrome Azure Azzaro (male) ~ 2024
The Most Wanted Intense Azzaro (male) ~ 2024
Forever Wanted Elixir Azzaro (male) ~ 2025
Invictus Parfum Rabanne (male) ~ 2024
Invictus Victory Absolu Rabanne (male) ~ 2025
Invictus Aqua 2024 Rabanne (male) ~ 2024
Invictus Aqua 2025 Rabanne (male) ~ 2025
Phantom Elixir Rabanne (male) ~ 2025
Million Gold Rabanne (male) ~ 2024
Million Gold Elixir Rabanne (male) ~ 2025
After Club Rabanne (unisex) ~ 2024
Oud Montaigne Rabanne (unisex) ~ 2024
Explorer Extreme Montblanc (male) ~ 2025
Black Meisterstuck Montblanc (male) ~ 2024
Vetiver Glacier Montblanc (male) ~ 2024
Patchouli Ink Montblanc (male) ~ 2024
Star Oud Montblanc (unisex) ~ 2025
Legend Blue Montblanc (male) ~ 2024
Declaration Eau de Parfum Cartier (male) ~ 2024
Pasha de Cartier Noir Absolu Limited-Edition Cartier (male) ~ 2024
Luna Rossa Ocean Le Parfum Prada (male) ~ 2024
Luna Rossa 2024 Prada (male) ~ 2024
Infusion de Gingembre Prada (unisex) ~ 2024
Paradigme Prada (male) ~ 2025
Bvlgari Man In Black Parfum Bvlgari (male) ~ 2024
Sahare Bvlgari (unisex) ~ 2024
Eau Parfumee The Vert 2025 Bvlgari (unisex) ~ 2025
Pour Homme Eau De Parfum Bvlgari (male) ~ 2024
Le Gemme Tygar Extrait Bvlgari (unisex) ~ 2025
Tygar x Refik Anadol Bvlgari (male) ~ 2025
Born in Roma Extradose Uomo Valentino (male) ~ 2025
Valentino Uomo Born in Roma Green Stravaganza Valentino (male) ~ 2024
Valentino Uomo Born in Roma Ivory Valentino (male) ~ 2025
Born in Roma The Gold Uomo Valentino (male) ~ 2024
Sogno In Rosso Valentino (unisex) ~ 2024
Hero Parfum Burberry (male) ~ 2024
Hero Parfum Intense Burberry (male) ~ 2025
Spicebomb Metallic Musk Viktor&Rolf (male) ~ 2025
Spicebomb Dark Leather Viktor&Rolf (male) ~ 2024
Polo 67 Eau de Parfum Ralph Lauren (male) ~ 2025
Polo 67 Ralph Lauren (male) ~ 2024
Ralph's Club New York Ralph Lauren (male) ~ 2025
Ralph's Club Eau de Toilette Ralph Lauren (male) ~ 2024
Polo Red Racing Edition Ralph Lauren (male) ~ 2025
CH Birds Of Paradise For Him Carolina Herrera (male) ~ 2024
Bad Boy Elixir Carolina Herrera (male) ~ 2025
Bad Boy Cobalt Elixir Carolina Herrera (male) ~ 2024
212 VIP Black Elixir Carolina Herrera (male) ~ 2025
CH Men Wild Love Carolina Herrera (male) ~ 2025
Cedar Chic Carolina Herrera (unisex) ~ 2025
Stallion Leather Suede Carolina Herrera (unisex) ~ 2025
Amazonian Rose Carolina Herrera (unisex) ~ 2024
Gucci Guilty Absolu de Parfum Pour Homme Gucci (male) ~ 2025
Gucci Guilty Love Edition Pour Homme 2024 Gucci (male) ~ 2024
Gucci Guilty Essence Pour Homme Gucci (male) ~ 2024
The Heart of Leo Gucci (unisex) ~ 2024
Fiori di Neroli Gucci (unisex) ~ 2025
Vanille Havane Cuir des Abysses Les Indemodables (unisex) ~ 2025
Vanille Havane Coeur de Oud Les Indemodables (unisex) ~ 2024
Oranger Sirocco Les Indemodables (unisex) ~ 2024
Sands Of Time Extrait de Parfum Azha Perfumes (unisex) ~ 2025
Plum on Fire Soko Parfums (unisex) ~ 2025
Mating Roar Albatross (male) ~ 2025
Principalities Caeleste Parfums (unisex) ~ 2024
Risala Autograph Le Falcone Perfumes (unisex) ~ 2025
Mirsaal Valentine Le Falcone Perfumes (unisex) ~ 2025
Mirsaal Passion Le Falcone Perfumes (unisex) ~ 2025
Tulum Junglescape Simone Andreoli (unisex) ~ 2025
Voyage Intense Nautica (unisex) ~ 2025
Fervo Intenso Granado (unisex) ~ 2024
Homem Absoluto Natura (male) ~ 2025
Amire Imperial Le Parfum Van Cleef & Arpels (unisex) ~ 2024
Encens Precieux Van Cleef & Arpels (unisex) ~ 2024
Pour Homme 2025 Van Cleef & Arpels (male) ~ 2025
Polo Red Racing Edition Ralph Lauren (male) ~ 2025`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const lines = [...new Set(
    RAW_DATA.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && /\((male|female|unisex)\)\s*~\s*\d{4}/.test(l))
  )];

  console.log(`Parsed ${lines.length} unique fragrance lines.`);

  const entries = [];
  const skipped = [];

  for (const line of lines) {
    const entry = parseEntry(line);
    if (entry) {
      entries.push(entry);
    } else {
      skipped.push(line);
    }
  }

  console.log(`Matched: ${entries.length} | Skipped (unknown house): ${skipped.length}`);
  if (skipped.length > 0) {
    console.log('\nSkipped entries:');
    skipped.forEach(s => console.log(' -', s));
  }

  if (entries.length === 0) {
    console.log('Nothing to insert.');
    return;
  }

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  let conflicts = 0;

  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from('fragrances')
      .upsert(batch, { onConflict: 'slug', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
    } else {
      inserted += data ? data.length : 0;
      conflicts += batch.length - (data ? data.length : 0);
      process.stdout.write(`\rInserting... ${Math.min(i + BATCH, entries.length)}/${entries.length}`);
    }
  }

  console.log(`\n\nDone! Inserted: ${inserted} new | Skipped duplicates: ${conflicts}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
