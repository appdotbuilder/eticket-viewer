import { z } from 'zod';

// E-ticket schema with proper type handling
export const eTicketSchema = z.object({
  id: z.number(),
  ticket_id: z.string(), // Unique ticket identifier
  passenger_name: z.string(),
  travel_date: z.coerce.date(),
  travel_time: z.string(), // Time in HH:MM format
  origin: z.string(),
  destination: z.string(),
  seat_number: z.string(),
  booking_reference: z.string(),
  qr_code_data: z.string(), // Placeholder data for QR code generation
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ETicket = z.infer<typeof eTicketSchema>;

// Input schema for creating e-tickets
export const createETicketInputSchema = z.object({
  ticket_id: z.string().min(1, "Ticket ID is required"),
  passenger_name: z.string().min(1, "Passenger name is required"),
  travel_date: z.coerce.date(),
  travel_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  seat_number: z.string().min(1, "Seat number is required"),
  booking_reference: z.string().min(1, "Booking reference is required"),
  qr_code_data: z.string().optional() // Optional, can be generated automatically
});

export type CreateETicketInput = z.infer<typeof createETicketInputSchema>;

// Input schema for retrieving e-ticket by ticket ID
export const getETicketByIdInputSchema = z.object({
  ticket_id: z.string().min(1, "Ticket ID is required")
});

export type GetETicketByIdInput = z.infer<typeof getETicketByIdInputSchema>;

// Input schema for updating e-tickets
export const updateETicketInputSchema = z.object({
  id: z.number(),
  passenger_name: z.string().optional(),
  travel_date: z.coerce.date().optional(),
  travel_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format").optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  seat_number: z.string().optional(),
  booking_reference: z.string().optional(),
  qr_code_data: z.string().optional()
});

export type UpdateETicketInput = z.infer<typeof updateETicketInputSchema>;