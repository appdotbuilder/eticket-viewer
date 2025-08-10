import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { type CreateETicketInput, type ETicket } from '../schema';

export const createETicket = async (input: CreateETicketInput): Promise<ETicket> => {
  try {
    // Generate QR code data if not provided
    const qrCodeData = input.qr_code_data || `TICKET:${input.ticket_id}:${input.booking_reference}`;

    // Insert e-ticket record
    const result = await db.insert(eTicketsTable)
      .values({
        ticket_id: input.ticket_id,
        passenger_name: input.passenger_name,
        travel_date: input.travel_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string for date column
        travel_time: input.travel_time,
        origin: input.origin,
        destination: input.destination,
        seat_number: input.seat_number,
        booking_reference: input.booking_reference,
        qr_code_data: qrCodeData
      })
      .returning()
      .execute();

    // Convert date string back to Date object before returning
    const eTicket = result[0];
    return {
      ...eTicket,
      travel_date: new Date(eTicket.travel_date + 'T00:00:00.000Z') // Convert string back to Date
    };
  } catch (error) {
    console.error('E-ticket creation failed:', error);
    throw error;
  }
};