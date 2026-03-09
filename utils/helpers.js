// Replaces all {placeholder} tokens in a string with real values.

function parsePlaceholders(str, data = {}) {
  if (!str) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(data, key) ? data[key] : `{${key}}`
  );
}

// Returns DD/MM/YYYY
function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-GB");
}

// Returns HH:MM
function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

module.exports = { parsePlaceholders, formatDate, formatTime };