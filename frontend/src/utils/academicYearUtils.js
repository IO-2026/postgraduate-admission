export function generateValidAcademicYears(count = 10) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const month = today.getMonth() + 1;

  const years = [];
  for (let i = 0; i < count; i++) {
    const year = currentYear + (month >= 10) + i;
    years.push({
      value: year,
      label: `${year}/${year + 1}`,
    });
  }

  return years;
}
