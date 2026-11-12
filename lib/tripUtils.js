/**
 * Utility functions for Nutty Trip Event Planning
 * - English Date calculations & formatting
 * - Google Calendar URL generator
 * - Google Maps URL generator
 * - Supabase event data serialization & deserialization
 */

export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format YYYY-MM-DD into English friendly string e.g. "Fri, Dec 15, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).trim().split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m - 1, d);
      if (!isNaN(dt.getTime())) {
        const dayName = DAYS[dt.getDay()] || '';
        const monthName = MONTHS[m - 1] || '';
        return `${dayName}, ${monthName} ${d}, ${y}`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Short date e.g. "Dec 15"
 */
export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = String(dateStr).trim().split('-');
    if (parts.length === 3) {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const monthName = MONTHS[m - 1] || '';
      return `${monthName} ${d}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format date range into friendly English string e.g. "Dec 15 - 18, 2026"
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate) return '';
  if (!endDate || startDate === endDate) {
    return formatDate(startDate);
  }
  try {
    const sParts = startDate.split('-').map(Number);
    const eParts = endDate.split('-').map(Number);
    if (sParts.length === 3 && eParts.length === 3) {
      const sMonth = MONTHS[sParts[1] - 1] || '';
      const eMonth = MONTHS[eParts[1] - 1] || '';
      if (sParts[1] === eParts[1] && sParts[0] === eParts[0]) {
        return `${sMonth} ${sParts[2]} - ${eParts[2]}, ${sParts[0]}`;
      }
      return `${sMonth} ${sParts[2]} - ${eMonth} ${eParts[2]}, ${sParts[0]}`;
    }
    return `${startDate} - ${endDate}`;
  } catch (e) {
    return `${startDate} - ${endDate}`;
  }
}

/**
 * Helper to ensure a date string is YYYY-MM-DD
 */
export function ensureValidDate(dateStr, fallbackOffsetDays = 0) {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr).trim())) {
    return String(dateStr).trim();
  }
  const d = new Date();
  d.setDate(d.getDate() + fallbackOffsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get all date strings (YYYY-MM-DD) between startDate and endDate inclusive
 * Always guarantees at least a 3-day array so date picker chips are never empty!
 */
export function getDatesInRange(startDate, endDate) {
  const validStart = ensureValidDate(startDate, 7);
  let validEnd = ensureValidDate(endDate, 10);

  if (validEnd < validStart) {
    validEnd = validStart;
  }

  try {
    const dates = [];
    const [sy, sm, sd] = validStart.split('-').map(Number);
    const [ey, em, ed] = validEnd.split('-').map(Number);
    const cur = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    let count = 0;
    while (cur <= end && count < 31) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
      count++;
    }

    if (dates.length === 0) {
      dates.push(validStart);
    }
    return dates;
  } catch (e) {
    return [validStart];
  }
}

/**
 * Build Google Maps search / pin URL
 */
export function getGoogleMapsUrl(placeName) {
  if (!placeName || !placeName.trim()) {
    return 'https://www.google.com/maps';
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName.trim())}`;
}

/**
 * Build Google Calendar TEMPLATE link
 */
export function getGoogleCalendarUrl({
  title,
  startDate,
  endDate,
  location = '',
  details = '',
}) {
  const tripTitle = title || 'Nutty Trip';
  const startClean = (startDate || '').replace(/-/g, '');
  let endClean = startClean;

  if (endDate) {
    try {
      const [ey, em, ed] = endDate.split('-').map(Number);
      const nextDay = new Date(ey, em - 1, ed + 1);
      const ny = nextDay.getFullYear();
      const nm = String(nextDay.getMonth() + 1).padStart(2, '0');
      const nd = String(nextDay.getDate()).padStart(2, '0');
      endClean = `${ny}${nm}${nd}`;
    } catch (e) {
      endClean = (endDate || '').replace(/-/g, '');
    }
  }

  const queryParams = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(tripTitle)}`,
    `dates=${startClean}/${endClean}`,
    `details=${encodeURIComponent(details || `Trip: ${tripTitle} planned via Nutty Snack`)}`,
    `location=${encodeURIComponent(location || '')}`,
  ];

  return `https://calendar.google.com/calendar/render?${queryParams.join('&')}`;
}

/**
 * Parse an event record fetched from Supabase
 * Handles top-level columns as well as JSON embedded in 'description'
 */
export function parseEventFromSupabase(item) {
  let parsedDesc = {};
  if (item.description && typeof item.description === 'string') {
    try {
      parsedDesc = JSON.parse(item.description);
    } catch (e) {
      parsedDesc = { note: item.description };
    }
  }

  const resolvedCode = item.event_code || item.code || '';

  // Ensure valid date range even for legacy events
  const rawStart = item.start_date || parsedDesc.startDate;
  const rawEnd = item.end_date || parsedDesc.endDate;
  const startDate = ensureValidDate(rawStart, 7);
  const endDate = ensureValidDate(rawEnd || startDate, 10);
  const deadline = parsedDesc.deadline || item.deadline || ensureValidDate(null, 5);

  const finalDate = item.final_date || parsedDesc.finalDate || null;
  const places = Array.isArray(parsedDesc.places) && parsedDesc.places.length > 0
    ? parsedDesc.places
    : (item.place ? [{ id: '1', name: item.place, mapsUrl: getGoogleMapsUrl(item.place) }] : []);

  const memberVotes = parsedDesc.memberVotes || {};

  return {
    id: String(item.id),
    title: item.title || '',
    date: formatDateRange(startDate, endDate),
    startDate,
    endDate,
    deadline,
    finalDate,
    places,
    place: places.length > 0 ? places.map((p) => p.name).join(', ') : (item.place || ''),
    emoji: item.emoji || '🐥',
    members: Number(item.members) || 1,
    code: resolvedCode,
    event_code: resolvedCode,
    host_id: item.host_id || parsedDesc.hostId || null,
    host_name: parsedDesc.hostName || 'Host',
    memberVotes,
    status: finalDate ? 'finalized' : (item.status || 'voting'),
  };
}

/**
 * Format payload to save to Supabase
 */
export function formatEventForSupabase({
  title,
  startDate,
  endDate,
  deadline,
  places = [],
  memberVotes = {},
  finalDate = null,
  hostId = null,
  hostName = 'Host',
  emoji = '🐥',
  code = '',
  status = 'voting',
  membersCount = 1,
}) {
  const displayDate = formatDateRange(startDate, endDate);
  const primaryPlace = places.length > 0 ? places[0].name : '';

  const jsonPayload = {
    startDate,
    endDate,
    deadline,
    places,
    memberVotes,
    finalDate,
    hostId,
    hostName,
  };

  const isNumericHostId =
    hostId !== null &&
    hostId !== undefined &&
    !isNaN(Number(hostId)) &&
    Number.isInteger(Number(hostId));

  return {
    title,
    date: displayDate,
    place: primaryPlace,
    emoji: emoji || '🐥',
    members: membersCount || 1,
    event_code: (code || '').toUpperCase(),
    host_id: isNumericHostId ? Number(hostId) : null,
    status: finalDate ? 'finalized' : status,
    description: JSON.stringify(jsonPayload),
  };
}
