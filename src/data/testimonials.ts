/**
 * Producer / engineer testimonials.
 *
 * RULE: never invent quotes. Empty array is fine.
 * When a real person sends praise, capture verbatim, with their permission to publish.
 *
 * Field guide:
 *   credits: 2-3 max, biggest names first
 *   plugin:  optional — links the quote to a specific plugin page
 *   date:    YYYY-MM-DD, helps trust signal stay fresh
 *   rating:  0-5, ONLY if the person actually gave a star score — never invent
 */

export interface Testimonial {
  name: string;
  credits: string;
  quote: string;
  plugin?: string;
  date?: string;
  rating?: number;
}

export const testimonials: Testimonial[] = [
  // EXAMPLE STRUCTURE — DO NOT SHIP. Delete or replace before going live.
  // {
  //   name: 'Jane Producer',
  //   credits: 'Mixed for Artist A, Artist B',
  //   quote: 'RevLimiter became the first stage I reach for on every master.',
  //   plugin: 'revlimiter',
  //   date: '2026-09-15',
  //   rating: 5,
  // },
];
