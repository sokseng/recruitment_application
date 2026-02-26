import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

export const FormatTime = ({ time }) => {
  const { t } = useTranslation();

  if (!time) return <span>—</span>;

  let fullText;
  try {
    fullText = formatDistanceToNow(parseISO(time), { addSuffix: true });
  } catch (err) {
    console.error("Invalid date:", time, err);
    return <span>—</span>;
  }

  fullText = fullText.toLowerCase().replace("about ", "").trim();

  if (fullText.includes("less than a minute")) {
    return <span>{t('just_now')}</span>;
  }

  const shortText = fullText
    .replace(" seconds ago", t('seconds_ago'))
    .replace(" second ago", t('second_ago'))
    .replace(" minutes ago", t('minutes_ago'))
    .replace(" minute ago", t('minute_ago'))
    .replace(" hours ago", t('hours_ago'))
    .replace(" hour ago", t('hour_ago'))
    .replace(" days ago", t('days_ago'))
    .replace(" day ago", t('day_ago'))
    .replace(" months ago", t('months_ago'))
    .replace(" month ago", t('month_ago'))
    .replace(" years ago", t('years_ago'))
    .replace(" year ago", t('year_ago'));

  return <span style={{opacity: 0.7}}>{shortText}</span>;
};