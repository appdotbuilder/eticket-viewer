import { serial, text, pgTable, timestamp, date } from 'drizzle-orm/pg-core';

export const eTicketsTable = pgTable('e_tickets', {
  id: serial('id').primaryKey(),
  ticket_id: text('ticket_id').notNull().unique(), // Unique identifier for the ticket
  passenger_name: text('passenger_name').notNull(),
  travel_date: date('travel_date').notNull(), // Date of travel
  travel_time: text('travel_time').notNull(), // Time in HH:MM format
  origin: text('origin').notNull(), // Departure location
  destination: text('destination').notNull(), // Arrival location
  seat_number: text('seat_number').notNull(), // Seat assignment
  booking_reference: text('booking_reference').notNull(), // Booking confirmation code
  qr_code_data: text('qr_code_data').notNull(), // Data for QR code generation
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type ETicket = typeof eTicketsTable.$inferSelect; // For SELECT operations
export type NewETicket = typeof eTicketsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { eTickets: eTicketsTable };