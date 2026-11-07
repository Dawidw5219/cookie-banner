// Browser-only data for the real WordPress admin UI. Never written to its database.
const cookie = { domain: 'example.test', source: 'cookie', category: 'Functional', platform: 'Example provider', description: 'Stores a visitor preference.', retention: '6 months', privacy_link: '', wp_scope: 'external', auto: true, first_seen: '2026-11-06 12:00:00', last_seen: '2026-11-06 12:00:00', pages: ['/'] };
export const cookies = [
 { ...cookie, name: 'cookie_preferences', description: 'Remembers the visitor’s consent choices for the next visit.', retention: '180 days' },
 { ...cookie, name: '_ga', category: 'Analytics', platform: 'Google Analytics', description: 'Measures visits only after analytics consent.', privacy_link: 'https://policies.google.com/privacy', retention: '2 years' },
 { ...cookie, name: '_fbp', category: 'Marketing', platform: 'Meta Pixel', description: 'Marketing attribution after explicit permission.', retention: '3 months' },
 { ...cookie, name: 'widget_session_identifier_for_embedded_appointment_calendar', category: 'Unknown', source: 'sessionStorage', platform: 'Appointment calendar', description: 'A newly discovered storage entry. Review its purpose with the provider before categorizing it.', retention: 'Session' },
 { ...cookie, name: 'preferred_theme', source: 'localStorage', category: 'Personalization', description: 'Stores the visitor’s chosen website theme.', retention: 'Until removed' },
];
export const trackers = [
 { tracker_id: 'ga4', name: 'Google Analytics', category: 'Analytics', description: 'Website visit statistics and conversion measurement.', privacy_link: 'https://policies.google.com/privacy', detected_via: 'script', detected_urls: [], pages: ['/', '/contact'], first_seen: '', last_seen: '', audit_status: 'ok' },
 { tracker_id: 'meta', name: 'Meta Pixel', category: 'Marketing', description: 'Advertising attribution and audience measurement.', privacy_link: 'https://www.facebook.com/privacy/policy/', detected_via: 'script', detected_urls: [], pages: ['/'], first_seen: '', last_seen: '', audit_status: 'violation' },
 { tracker_id: 'calendar', name: 'Appointment calendar with an intentionally longer provider name', category: 'Functional', description: 'An embedded calendar used to book an appointment.', privacy_link: '', detected_via: 'iframe', detected_urls: [], pages: ['/contact'], first_seen: '', last_seen: '', audit_status: '' },
];
export const services = [
 { id: 'design-calendar', name: 'Appointment calendar', description: 'Lets visitors choose a date and book an appointment through an external provider.', privacyUrl: 'https://calendar.example.test/privacy', urls: ['https://calendar.example.test/embed/', 'https://cdn.example.test/calendar/'] },
 { id: 'design-customer-support-widget', name: 'Customer support widget for booking questions', description: 'Loads the support conversation only after the visitor allows this service.', privacyUrl: '', urls: ['https://support.example.test/widget/'] },
];
