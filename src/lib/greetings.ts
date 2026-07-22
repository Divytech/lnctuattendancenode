export type GreetingItem = {
  greeting: string;
  subtitle: string;
};

export const TIME_GREETINGS = [
  // 5:00 AM – 7:59 AM
  {
    startMin: 5 * 60,
    endMin: 8 * 60 - 1,
    options: [
      { greeting: "🌅 Rise and shine!", subtitle: "Let's make today awesome." },
      { greeting: "☀️ Early bird!", subtitle: "You're off to a great start." },
      { greeting: "🌞 Good morning!", subtitle: "Fresh day, fresh goals." },
    ],
  },
  // 8:00 AM – 11:59 AM
  {
    startMin: 8 * 60,
    endMin: 12 * 60 - 1,
    options: [
      { greeting: "👋 Good morning!", subtitle: "Hope you're having a productive day." },
      { greeting: "☕ Morning champion!", subtitle: "Ready to get things done?" },
    ],
  },
  // 12:00 PM – 3:59 PM
  {
    startMin: 12 * 60,
    endMin: 16 * 60 - 1,
    options: [
      { greeting: "🌞 Good afternoon!", subtitle: "Hope your day is going well." },
      { greeting: "🍽️ Lunch break explorer!", subtitle: "Don't forget to recharge." },
    ],
  },
  // 4:00 PM – 5:59 PM
  {
    startMin: 16 * 60,
    endMin: 18 * 60 - 1,
    options: [
      { greeting: "🌤️ Good afternoon!", subtitle: "Finish strong!" },
      { greeting: "🚀 Keep the momentum!", subtitle: "You're doing great." },
    ],
  },
  // 6:00 PM – 8:59 PM
  {
    startMin: 18 * 60,
    endMin: 21 * 60 - 1,
    options: [
      { greeting: "🌇 Good evening!", subtitle: "Time to unwind or keep building." },
      { greeting: "✨ Evening explorer!", subtitle: "Glad you're here." },
    ],
  },
  // 9:00 PM – 10:59 PM
  {
    startMin: 21 * 60,
    endMin: 23 * 60 - 1,
    options: [
      { greeting: "🌙 Night owl!", subtitle: "Burning the midnight oil?" },
      { greeting: "🌌 Evening hacker!", subtitle: "Great ideas often come at night." },
      { greeting: "💻 Late-night builder!", subtitle: "Let's create something amazing." },
    ],
  },
  // 11:00 PM – 1:59 AM
  {
    startMin: 23 * 60,
    endMin: 2 * 60 - 1,
    options: [
      { greeting: "🦉 Hello, night owl!", subtitle: "The quiet hours are the best." },
      { greeting: "🌠 Midnight adventurer!", subtitle: "Still going strong?" },
      { greeting: "🌙 Moonlight coder!", subtitle: "The night is yours." },
      { greeting: "☕ Midnight fuel!", subtitle: "Don't forget to stay hydrated." },
    ],
  },
  // 2:00 AM – 4:59 AM
  {
    startMin: 2 * 60,
    endMin: 5 * 60 - 1,
    options: [
      { greeting: "😴 Still awake?", subtitle: "Hope you're taking care of yourself." },
      { greeting: "🌃 Midnight legend!", subtitle: "That's some serious dedication." },
      { greeting: "⭐ Sleepless genius?", subtitle: "Remember to get some rest too." },
    ],
  },
];

export function getDynamicGreeting(date: Date = new Date()): GreetingItem {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMin = hours * 60 + minutes;

  for (const slot of TIME_GREETINGS) {
    if (slot.startMin === 23 * 60) {
      if (currentMin >= 23 * 60 || currentMin < 2 * 60) {
        const index = (date.getDate() + hours) % slot.options.length;
        return slot.options[index];
      }
    } else if (currentMin >= slot.startMin && currentMin <= slot.endMin) {
      const index = (date.getDate() + hours) % slot.options.length;
      return slot.options[index];
    }
  }

  return { greeting: "👋 Hello!", subtitle: "Welcome back." };
}
