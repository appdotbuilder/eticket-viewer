import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { type UpdateETicketInput, type ETicket } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateETicket(input: UpdateETicketInput): Promise<ETicket | null> {
  try {
    // Build the update object with only the fields that are provided
    const updateData: Partial<typeof eTicketsTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are provided in the input
    if (input.passenger_name !== undefined) {
      updateData.passenger_name = input.passenger_name;
    }
    if (input.travel_date !== undefined) {
      // Convert Date to string format for the date column
      updateData.travel_date = input.travel_date.toISOString().split('T')[0];
    }
    if (input.travel_time !== undefined) {
      updateData.travel_time = input.travel_time;
    }
    if (input.origin !== undefined) {
      updateData.origin = input.origin;
    }
    if (input.destination !== undefined) {
      updateData.destination = input.destination;
    }
    if (input.seat_number !== undefined) {
      updateData.seat_number = input.seat_number;
    }
    if (input.booking_reference !== undefined) {
      updateData.booking_reference = input.booking_reference;
    }
    if (input.qr_code_data !== undefined) {
      updateData.qr_code_data = input.qr_code_data;
    }

    // Update the e-ticket and return the updated record
    const result = await db.update(eTicketsTable)
      .set(updateData)
      .where(eq(eTicketsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no ticket was found and updated
    if (result.length === 0) {
      return null;
    }

    // Convert the database result to match the schema expectations
    const ticket = result[0];
    return {
      ...ticket,
      travel_date: new Date(ticket.travel_date), // Convert string back to Date
      created_at: new Date(ticket.created_at),
      updated_at: new Date(ticket.updated_at)
    };
  } catch (error) {
    console.error('E-ticket update failed:', error);
    throw error;
  }
}