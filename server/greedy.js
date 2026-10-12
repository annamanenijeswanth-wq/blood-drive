// Greedy donor prioritisation.
// At each step pick the donor with the best local score: groups the campaign needs
// come first (in the order the organizer listed them), then earliest registration.
// Picks are never revisited. Complexity: O(n log n) for the sort.
module.exports = function prioritise(donors, groupsNeeded, slots) {
  const rank = g => { const i = groupsNeeded.indexOf(g); return i === -1 ? groupsNeeded.length : i; };
  return donors
    .filter(d => d.status === 'Registered')
    .sort((a, b) => rank(a.bloodGroup) - rank(b.bloodGroup) || a.createdAt - b.createdAt)
    .slice(0, slots);
};
