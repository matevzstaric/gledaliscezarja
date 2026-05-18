-- ============================================================
-- Rename "polna" → "redna" everywhere
-- (in shows.pricing JSON key + site_settings ticket label key)
-- ============================================================

-- Rename the JSON key inside every show's pricing column.
-- jsonb '- key' removes; '|| ...' merges.
update public.shows
set pricing = (pricing - 'polna') || jsonb_build_object('redna', pricing->'polna')
where pricing ? 'polna';

-- Rename the site_settings entry & update its display value
update public.site_settings
set key = 'ticket_label_redna',
    value = 'Redna cena',
    description = 'Redna (polna) cena vstopnice'
where key = 'ticket_label_polna';

-- If the row didn't exist yet, insert it
insert into public.site_settings (key, value, description)
values ('ticket_label_redna', 'Redna cena', 'Redna (polna) cena vstopnice')
on conflict (key) do nothing;
