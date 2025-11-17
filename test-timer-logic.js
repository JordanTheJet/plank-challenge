// Simple test script to verify timer calculations
const { calculateTargetDuration, getDayNumber, getNextChallenge } = require('./utils/timerLogic.ts');

console.log('Testing Plank Timer Logic\n');
console.log('=========================\n');

// Test dates
const testDates = [
  new Date(2025, 10, 17), // November 17, 2025 - Day 1 (Sunday - but start day)
  new Date(2025, 10, 18), // November 18, 2025 - Day 2 (Monday)
  new Date(2025, 10, 19), // November 19, 2025 - Day 3 (Tuesday)
  new Date(2025, 10, 23), // November 23, 2025 - REST DAY (Sunday)
  new Date(2025, 10, 24), // November 24, 2025 - After first Sunday
  new Date(2025, 11, 1),  // December 1, 2025 - Multiple Sundays passed
];

testDates.forEach(date => {
  const dayNum = getDayNumber(date);
  const target = calculateTargetDuration(date);
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  if (target === null) {
    console.log(`${dateStr} - REST DAY (Sunday)`);
    const next = getNextChallenge(date);
    console.log(`  Next: Day ${next.dayNumber} on ${next.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - ${next.duration}s\n`);
  } else {
    console.log(`${dateStr} - Day ${dayNum}: ${target} seconds\n`);
  }
});

console.log('\nAll tests complete!');
