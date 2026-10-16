const GOOD = [
  "WOW {name}! You're a SUPERSTAR!",
  "High five, {name}! Amazing job!",
  "Yay! {name} is on fire today!",
  "Boom! More stars for {name}!",
  "You did it, {name}! So proud of you!",
  "Woohoo! {name} is a champion!",
  "Super duper, {name}! Keep going!",
  "Fantastic, {name}! The stars love you!",
  "Hooray! {name} is a real hero!",
  "Awesome sauce, {name}!",
];

const GOOD_TITLES = ["AWESOME!", "SUPER!", "WOW!", "YAY!", "HOORAY!", "BRILLIANT!", "AMAZING!", "STAR POWER!"];

const BAD = [
  "Oh no, {name}... Let's try better next time.",
  "Uh oh! It's okay, {name}, tomorrow is a new day.",
  "Oops! Thank you for being honest, {name}.",
  "Aww, {name}. Big hug! You can do better!",
  "Hmm... the stars feel a little sad, {name}.",
  "That's okay, {name}. Everyone makes mistakes.",
];

const BAD_TITLES = ["Oh no...", "Uh oh!", "Oopsie...", "Aww..."];

const MILESTONE = [
  "INCREDIBLE, {name}! You unlocked a treasure!",
  "WOW WOW WOW! {name} reached a new level!",
  "Treasure time, {name}! You earned it!",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const fill = (s: string, name: string) => s.replaceAll("{name}", name);

export const goodMessage = (name: string) => ({ title: pick(GOOD_TITLES), text: fill(pick(GOOD), name) });
export const badMessage = (name: string) => ({ title: pick(BAD_TITLES), text: fill(pick(BAD), name) });
export const milestoneMessage = (name: string) => fill(pick(MILESTONE), name);
