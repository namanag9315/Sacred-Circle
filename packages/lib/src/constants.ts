export const SACRED_KEY_LENGTH = 6;

export const FREE_MEDITATION_CATEGORIES = [
  "Basic Meditation",
  "Healing",
  "Chants",
  "Babaji Wisdom",
  "Manifestation"
];

export function normalizeSacredAccessKey(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, SACRED_KEY_LENGTH);
}

export function isValidSacredAccessKey(value: string) {
  return value.length === SACRED_KEY_LENGTH && /^[0-9]+$/.test(value);
}

export const HOME_SHORTCUTS = [
  "Healing",
  "Guided Meditation",
  "Babaji Wisdom",
  "Manifestation"
];

export const PROGRAM_TITLES = [
  "Healing Body and Mind",
  "Concentration in Studies",
  "Manifestation for Abundance",
  "Resolving Relationship Issues",
  "Removing all Kinds of Fears",
  "Intuition Development",
  "DNA Activations",
  "Past Life Regression",
  "Akashic Records",
  "Guidance from Higher Self / I AM Presence",
  "Merkaba Activation",
  "Great Central Sun",
  "Amrit Shakti",
  "Ascended Masters",
  "Galactic Beings",
  "Ancient Egypt Energy Journey",
  "Tachyon Energy"
];

export const CONTENT_INVENTORY_PAGES = [
  "Home",
  "Programs",
  "Events",
  "Videos",
  "Audio Library",
  "About",
  "Contact",
  "Healing",
  "Blog Posts",
  "Product Pages"
];

export const DISCLAIMER =
  "Sacred Circle provides meditation and spiritual-awareness content for personal reflection and wellbeing. It is not a substitute for medical, psychological, legal or other professional advice.";
