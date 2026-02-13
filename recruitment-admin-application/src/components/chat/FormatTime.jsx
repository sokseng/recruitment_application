import { formatDistanceToNow, parseISO } from 'date-fns';

export const FormatTime = ({ time }) => {
  if (!time) return <span>—</span>; // or null, or "unknown"

  let fullText;
  try {
    fullText = formatDistanceToNow(parseISO(time), { addSuffix: true });
  } catch (err) {
    console.error("Invalid date:", time, err);
    return <span>—</span>; // fallback for invalid dates
  }

  fullText = fullText.toLowerCase().replace("about ", "").trim();

  if (fullText.includes("less than a minute")) {
    return <span>Just now</span>;
  }

  const shortText = fullText
    .replace(" seconds ago", "s")
    .replace(" second ago", "s")
    .replace(" minutes ago", "m")
    .replace(" minute ago", "m")
    .replace(" hours ago", "h")
    .replace(" hour ago", "h")
    .replace(" days ago", "d")
    .replace(" day ago", "d")
    .replace(" months ago", "mo")
    .replace(" month ago", "mo")
    .replace(" years ago", "y")
    .replace(" year ago", "y");

  return <span style={{opacity: 0.7,}}>{shortText}</span>;
};
