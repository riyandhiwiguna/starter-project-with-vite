export function showFormattedDate(date, locale = 'id-ID') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function sleep(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
