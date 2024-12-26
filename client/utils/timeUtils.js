// src/utils/timeUtils.js

/**
 * Converts a local Date object to a UTC ISO string.
 * @param {Date} date - The local Date object.
 * @returns {string} - The UTC ISO string.
 */
export const convertLocalToUTC = (date) => {
  return date.toISOString();
};

/**
 * Converts a UTC ISO string to a local Date object.
 * @param {string} utcString - The UTC ISO string.
 * @returns {Date} - The local Date object.
 */
export const convertUTCToLocal = (utcString) => {
  return new Date(utcString);
};
