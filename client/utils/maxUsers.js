// Define this helper function (at the top or in a utils file)
export function getMaxUsers(range) {
  if (!range) return 'N/A'

  // e.g. "100+"
  if (range.includes('+')) {
    return 9999
  }

  // e.g. "2-9"
  if (range.includes('-')) {
    const parts = range.split('-')
    if (parts.length === 2) {
      const maxPart = parseInt(parts[1].trim(), 10)
      return isNaN(maxPart) ? 'N/A' : maxPart
    }
  }

  // Single number, e.g. "10"
  const singleVal = parseInt(range.trim(), 10)
  return isNaN(singleVal) ? 'N/A' : singleVal
}