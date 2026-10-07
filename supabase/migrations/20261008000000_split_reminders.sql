-- One daily reminder became separate morning and evening reminders (each at the user's own time),
-- plus built-in streak nudges at fixed times. The spec's streak_at_risk becomes streak_nudge.
alter table public.notification_prefs drop constraint notification_prefs_type_check;

update public.notification_prefs
   set type = case when local_time < '12:00' then 'morning_reminder' else 'evening_reminder' end
 where type = 'daily_reminder';
update public.notification_prefs set type = 'streak_nudge' where type = 'streak_at_risk';

alter table public.notification_prefs add constraint notification_prefs_type_check check (type in (
  'morning_reminder', 'evening_reminder', 'streak_nudge', 'angelus', 'novena_day', 'feast_quest', 'come_back'));
