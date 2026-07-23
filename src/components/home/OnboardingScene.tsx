import { sitePath } from "../../utils/paths";
import type { HomeGameId } from "./onboardingState";

const BOAT_PATH = sitePath("/assets/world/boat.png");
const ISLAND_PATH = sitePath("/assets/world/IslandWithChest.png");
const JUNGLE_PATH = sitePath("/assets/world/jungle/jungle-backdrop.png");
const FLOATING_READING_TOKENS = {
  mixed: [
    { text: "A", kind: "letter" },
    { text: "M", kind: "letter" },
    { text: "S", kind: "letter" },
    { text: "BA", kind: "syllable" },
    { text: "LO", kind: "syllable" },
    { text: "MI", kind: "syllable" },
    { text: "MOT", kind: "word" },
    { text: "LIRE", kind: "word" },
    { text: "LUNE", kind: "word" },
    { text: "BATEAU", kind: "word" },
  ],
  letters: [
    { text: "A", kind: "letter" },
    { text: "E", kind: "letter" },
    { text: "M", kind: "letter" },
    { text: "R", kind: "letter" },
    { text: "LA", kind: "syllable" },
    { text: "LU", kind: "syllable" },
    { text: "S", kind: "letter" },
    { text: "LUNE", kind: "word" },
    { text: "MER", kind: "word" },
    { text: "ÉTOILE", kind: "word" },
  ],
  bateau: [
    { text: "B", kind: "letter" },
    { text: "T", kind: "letter" },
    { text: "BA", kind: "syllable" },
    { text: "TO", kind: "syllable" },
    { text: "TEAU", kind: "syllable" },
    { text: "ÎLE", kind: "word" },
    { text: "MER", kind: "word" },
    { text: "BATEAU", kind: "word" },
    { text: "CARTE", kind: "word" },
    { text: "TRÉSOR", kind: "word" },
  ],
  sentier: [
    { text: "MOT", kind: "word" },
    { text: "LIRE", kind: "word" },
    { text: "MOTO", kind: "word" },
    { text: "PANDA", kind: "word" },
    { text: "LAPIN", kind: "word" },
    { text: "TAPIS", kind: "word" },
    { text: "MAISON", kind: "word" },
    { text: "CHEMIN", kind: "word" },
    { text: "GEMME", kind: "word" },
    { text: "TRÉSOR", kind: "word" },
  ],
} as const;
const FLOATING_TOKEN_POSITIONS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
] as const;

type Props = {
  theme: "mixed" | HomeGameId;
  showReadingCurrent: boolean;
};

export function OnboardingScene({ theme, showReadingCurrent }: Props) {
  return (
    <div className="home-onboarding__decor" aria-hidden="true">
      <span className="home-onboarding__moon" />
      <span className="home-onboarding__cloud home-onboarding__cloud--one" />
      <span className="home-onboarding__cloud home-onboarding__cloud--two" />
      <span className="home-onboarding__star home-onboarding__star--one" />
      <span className="home-onboarding__star home-onboarding__star--two" />
      <span className="home-onboarding__star home-onboarding__star--three" />
      <svg className="home-onboarding__constellation" viewBox="0 0 180 92">
        <path d="M12 68 48 36 84 57 119 20 164 48" />
        <circle cx="12" cy="68" r="4" />
        <circle cx="48" cy="36" r="4" />
        <circle cx="84" cy="57" r="4" />
        <circle cx="119" cy="20" r="4" />
        <circle cx="164" cy="48" r="4" />
      </svg>
      <span className="home-onboarding__wave home-onboarding__wave--one" />
      <span className="home-onboarding__wave home-onboarding__wave--two" />

      {showReadingCurrent ? (
        <span className="home-onboarding__reading-current">
          {FLOATING_READING_TOKENS[theme].map((token, index) => (
            <span
              className={`home-onboarding__reading-track home-onboarding__reading-track--${FLOATING_TOKEN_POSITIONS[index]}`}
              key={`${theme}-${token.text}`}
            >
              <span
                className={`home-onboarding__reading-token home-onboarding__reading-token--${token.kind}`}
              >
                <span className="home-onboarding__reading-label">
                  {token.text}
                </span>
              </span>
            </span>
          ))}
        </span>
      ) : null}

      {theme === "bateau" ? (
        <img
          className="home-onboarding__island"
          src={ISLAND_PATH}
          alt=""
          draggable={false}
        />
      ) : null}
      {theme === "sentier" ? (
        <img
          className="home-onboarding__jungle"
          src={JUNGLE_PATH}
          alt=""
          draggable={false}
        />
      ) : null}
      {theme !== "mixed" && theme !== "sentier" ? (
        <img
          className="home-onboarding__boat"
          src={BOAT_PATH}
          alt=""
          draggable={false}
        />
      ) : null}
    </div>
  );
}
