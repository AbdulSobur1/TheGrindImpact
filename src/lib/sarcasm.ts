// Sarcasm Engine - The brutally honest voice of The Grind Pact

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 1. Missed session messages
const missedMessages = [
  "Couldn't make it? Shocking. Actually no — it's not.",
  "A whole session. Gone. Just like your discipline.",
  "Is this your villain origin story or are you just lazy?",
  "We held a moment of silence for your gains. It was long.",
  "Skipped again. The couch thanks you for your loyalty.",
  "Weak. But honestly, expected.",
  "You had one job. Two actually. You did zero.",
  "The grind didn't miss you. Why'd you miss it?",
  "Another session down the drain. Consistent, at least.",
  "Your streak called. It's disappointed.",
  "Guess who's on fraud watch? You. Always you.",
  "Abs make excuses. You made one too many.",
  "The Pact expected nothing. You delivered.",
  "That session is in a better place. Unlike your dedication.",
  "Missing sessions is a skill at this point. Hats off.",
];

// 2. Late check-in messages (within last 15% of window)
const lateMessages = [
  "Cutting it close. As expected.",
  "You almost didn't. We noticed.",
  "Barely counts. But sure, take the W.",
  "Last minute as always. At least you showed up. Barely.",
  "Fashionably late is still late. But we'll allow it.",
  "The window was closing. So were your options.",
  "Tick tock. You made it. Don't make it a habit.",
  "Procrastination looks good on you. Said no one ever.",
  "Right on the edge. That's where you live now.",
  "You waited until the last second. Bold strategy.",
];

// 3. Session completed messages (70% roast, 30% hype)
const completedRoast = [
  "You did it. Don't expect applause.",
  "Is that all you've got? Well… not like I expected more.",
  "Showed up. Gold star. Now go cry about how hard it was.",
  "Completed. The bar was on the floor and you stepped over it.",
  "A session was logged. History will not remember this.",
  "Congratulations. You've reached the bare minimum.",
  "One session down. The mountain called. It's laughing.",
  "You moved. Great. Boring, but great.",
  "Don't let this one win fool you. You're still behind.",
  "Sweat is just fat crying. Hope you cried a lot.",
];

const completedHype = [
  "Actually decent. Don't let it get to your head.",
  "Locked in. The boys would be proud. Maybe.",
  "Okay. Respect. Don't make it weird.",
  "Not bad. Not bad at all. Don't let it become a thing.",
  "Alright, that was solid. But I said what I said.",
];

// 4. Both sessions done for the day
const bothSessionsMessages = [
  "Full day. Respect. Begrudgingly.",
  "Two sessions. You're either disciplined or you have no life. Either way.",
  "Clean sweep. The Grind Pact approves. Reluctantly.",
  "Double duty. We're impressed. Don't let it show.",
  "Both sessions. The Pact is slightly less disappointed today.",
  "Morning and evening. That's called commitment. Or a problem. We respect either.",
  "Back-to-back. The grind is grinding. Shut up and take the credit.",
  "Two for two. The bar was low but you cleared it. Twice.",
];

// 5. Callout messages
const calloutMessages = [
  "{target} has been called out. The silence is deafening.",
  "{target} got called out by {caller}. No further questions.",
  "Oi {target}. {caller} sees you. Do better.",
  "{target} is on notice. {caller} made sure of it.",
  "{caller} called out {target}. We're all watching. No pressure.",
  "The Pact has eyes. {caller} just used them on {target}.",
];

// 6. Badge earned messages
const badgeEarnedMessages = [
  "Look who finally earned something. {name} got {badge}. Took long enough.",
  "{name} unlocked {badge}. The bar was low but they cleared it.",
  "Hold the applause. {name} earned {badge}. Actually hold it.",
  "{name} just earned {badge}. We're all shocked. Keep scrolling.",
  "A badge for {name}. The grind is paying off. Unfortunately.",
];

// 7. Weekly MVP messages
const mvpMessages = [
  "This week's MVP is {name}. Don't get comfortable.",
  "MVP of the week: {name}. The rest of you should take notes.",
  "{name} is this week's MVP. Try to keep up next week.",
  "The crown goes to {name}. It's heavy. Hope your neck is ready.",
];

// 8. Workout-specific roasts
const missedWorkoutMessages = [
  "Skipped your workout? Your future self just sighed.",
  "That exercise isn't going to do itself. Actually, apparently neither are you.",
  "Your program called. It's disappointed. Again.",
  "Missed a day. Your gains are in mourning.",
  "You had one job: move your body. You chose not to. Bold.",
  "The barbell is waiting. Are you? No, clearly not.",
  "'Rest day' is a concept. 'Lazy day' is a lifestyle. You're choosing the latter.",
  "Your workout program has a 100% attendance rate. You? Not so much.",
  "Skipping today? Every rep you didn't do is a rep someone else did.",
  "Tomorrow you'll say 'I'll start fresh.' Tomorrow you is tired of your excuses.",
];

const goalSpecificRoasts: Record<string, string[]> = {
  greek_physique: [
    "Skipping? That Greek god physique isn't going to sculpt itself.",
    "Michelangelo didn't take days off. Neither should you.",
    "Your V-taper called. It's feeling neglected.",
    "Abs are made in the kitchen and the gym. You're skipping both.",
  ],
  bulk: [
    "Skipping a bulk day? That's how you stay 'skinny bulk' forever.",
    "Mass doesn't build itself. But apparently neither do you.",
    "You're supposed to be an anvil. Right now you're more of a pebble.",
  ],
  cut: [
    "Skipping on a cut? Those abs aren't going to reveal themselves.",
    "Every missed session is fat saying 'thank you'.",
    "The blade is sharp. You? Not so much today.",
  ],
  curves: [
    "Skipping? Your hourglass just lost some sand.",
    "Curves come from consistency. You just chose inconsistency.",
    "That perfect silhouette needs work. Not rest.",
  ],
  glutes: [
    "Skipping glute day? Hope you didn't want to sit comfortably ever again.",
    "Your glutes called. They're feeling abandoned.",
    "Every squat you skip is a squat someone else is doing for that round lift.",
    "No pain, no gain. You chose no pain. So no gain. Simple math.",
  ],
  sculpt: [
    "Skipping sculpt day? Michelangelo didn't take breaks either.",
    "A sculpture takes daily chiseling. You just put down the chisel.",
  ],
};

// 9. Watchout roasts
const watchoutRoasts: Record<string, string[]> = {
  sleeping: [
    "Still sleeping? Bold choice.",
    "Session 1 window is open. So are your excuses.",
    "Morning came. Did you?",
  ],
  closing: [
    "Session 2 window closing. Tick tock.",
    "Sun's setting. So is your chance.",
    "Last call for Session 2. Don't miss it.",
  ],
  streak_risk: [
    "One session away from a reset. Choose wisely.",
    "Streak on life support. Your move.",
    "You're about to lose it all. Over one session. Think.",
  ],
};

export const SarcasmEngine = {
  missedSession: (): string => pickRandom(missedMessages),
  lateCheckIn: (): string => pickRandom(lateMessages),
  sessionCompleted: (): string => {
    // 70% roast, 30% hype
    const roll = Math.random();
    if (roll < 0.7) return pickRandom(completedRoast);
    return pickRandom(completedHype);
  },
  bothSessionsDone: (): string => pickRandom(bothSessionsMessages),
  callout: (caller: string, target: string): string => {
    const msg = pickRandom(calloutMessages);
    return msg.replace('{caller}', caller).replace('{target}', target);
  },
  badgeEarned: (name: string, badge: string): string => {
    const msg = pickRandom(badgeEarnedMessages);
    return msg.replace('{name}', name).replace('{badge}', badge);
  },
  weeklyMvp: (name: string): string => {
    const msg = pickRandom(mvpMessages);
    return msg.replace('{name}', name);
  },
  watchout: (type: keyof typeof watchoutRoasts): string => {
    return pickRandom(watchoutRoasts[type] || watchoutRoasts.sleeping);
  },
  missedWorkout: (): string => pickRandom(missedWorkoutMessages),
  goalRoast: (goal: string): string => {
    const roasts = goalSpecificRoasts[goal];
    if (roasts && roasts.length > 0) return pickRandom(roasts);
    return pickRandom(missedWorkoutMessages);
  },
  adminKick: (name: string): string => {
    return `${name} has left The Grind Pact. Voluntarily or not.`;
  },
  forceRestDay: (date: string, reason: string): string => {
    return `Rest day declared for ${date}. ${reason}. Don't get used to it.`;
  },
};
