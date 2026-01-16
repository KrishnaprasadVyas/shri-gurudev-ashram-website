module.exports = (id) => {
  if (id.length <= 4) return "****";
  return "****" + id.slice(-4);
};
