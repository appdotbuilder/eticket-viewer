import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { type ETicket } from '../schema';
import { desc } from 'drizzle-orm';

export const getAllETickets = async (): Promise<ETicket[]> => {
  try {
    // Fetch all e-tickets ordered by creation date (newest first)
    const results = await db.select()
      .from(eTicketsTable)
      .orderBy(desc(eTicketsTable.created_at))
      .execute();

    // Convert database results to schema format
    return results.map(ticket => ({
      ...ticket,
      // Convert string dates back to Date objects
      travel_date: new Date(ticket.travel_date),
      created_at: new Date(ticket.created_at),
      updated_at: new Date(ticket.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch all e-tickets:', error);
    throw error;
  }
};