export function getRandomBool() {
  return Math.random() < 0.5;
}
export function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function getRandomUserId(users) {
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex]._id;
}
export function getRandomElement(array) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}
