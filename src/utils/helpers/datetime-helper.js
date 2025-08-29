function compareDates(timestring1, timestring2) {
  const d1 = new Date(timestring1);
  const d2 = new Date(timestring2);
  const time1 = d1.getTime();
  const time2 = d2.getTime();
  return time1 < time2;
}

module.exports = compareDates;