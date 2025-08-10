import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetETicketByIdInput, type ETicket } from '../schema';

export async function getETicketById(input: GetETicketByIdInput): Promise<ETicket | null> {
  try {
    // Query the database for the e-ticket with the specified ticket_id
    const results = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.ticket_id, input.ticket_id))
      .execute();

    // Return null if no ticket found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) result
    // Note: travel_date comes as string from date column, need to convert to Date
    const ticket = results[0];
    return {
      ...ticket,
      travel_date: new Date(ticket.travel_date)
    };
  } catch (error) {
    console.error('E-ticket retrieval failed:', error);
    throw error;
  }
}