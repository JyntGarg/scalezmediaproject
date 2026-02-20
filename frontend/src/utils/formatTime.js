export const formatDate = (dateString) => {
  if (dateString == null || dateString === "") return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return d.toLocaleDateString(undefined, options);
};

export const formatDate2 = (dateString) => {
  const options = { month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatDate3 = (dateString) => {
  const options = { day: "numeric", month: "numeric", year: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatDate4 = (dateString) => {
  const options = { day: "numeric", month: "short" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatTime = (time) => {
  if (time == null || time === "") return "—";
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return "—";
  let date = formatDate(d);

  let hours = d.getHours();

  if (hours.toString().length === 1) {
    hours = "0" + hours.toString();
  }

  hours = hours.toString();

  let minutes = d.getMinutes();

  if (minutes.toString().length === 1) {
    minutes = "0" + minutes.toString();
  }

  minutes = minutes.toString();

  return date || "—";
  // return date + " " + hours + ":" + minutes;
};

export const extraProcessHumanize = (str) => {
  if (str === "a day") return "1 Day";
  if (str === "a month") return "1 Month";
  if (str === "a year") return "1 Year";
  return str;
};
