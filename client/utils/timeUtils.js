// src/utils/timeUtils.js

import { format } from "date-fns";

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

export function getDaysInCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

export function isWeekday(date) {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

export function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export const combineDateTime = (date, time) => {
  const dateTimeString = `${date}T${time}Z`
  const dateObj = new Date(dateTimeString)
  return !isNaN(dateObj) ? dateObj : null
}

export const formatDateWithDay = dateObj => format(dateObj, 'EEEE, MMMM d, yyyy')
export const formatTime = dateObj => format(dateObj, 'p')

export const formatTotalDuration = durationMs => {
  const hrs = Math.floor(durationMs / 3600000)
  const mins = Math.floor((durationMs % 3600000) / 60000)
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
}
