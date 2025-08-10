import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { type CreateETicketInput } from '../schema';
import { createETicket } from '../handlers/create_eticket';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateETicketInput = {
  ticket_id: 'TK001',
  passenger_name: 'John Doe',
  travel_date: new Date('2024-12-25'),
  travel_time: '14:30',
  origin: 'New York',
  destination: 'Boston',
  seat_number: '12A',
  booking_reference: 'BK123456',
  qr_code_data: 'CUSTOM_QR_DATA'
};

describe('createETicket', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an e-ticket with all provided data', async () => {
    const result = await createETicket(testInput);

    // Basic field validation
    expect(result.ticket_id).toEqual('TK001');
    expect(result.passenger_name).toEqual('John Doe');
    expect(result.travel_date).toEqual(new Date('2024-12-25'));
    expect(result.travel_time).toEqual('14:30');
    expect(result.origin).toEqual('New York');
    expect(result.destination).toEqual('Boston');
    expect(result.seat_number).toEqual('12A');
    expect(result.booking_reference).toEqual('BK123456');
    expect(result.qr_code_data).toEqual('CUSTOM_QR_DATA');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save e-ticket to database', async () => {
    const result = await createETicket(testInput);

    // Query database to verify persistence
    const eTickets = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.id, result.id))
      .execute();

    expect(eTickets).toHaveLength(1);
    const savedTicket = eTickets[0];
    expect(savedTicket.ticket_id).toEqual('TK001');
    expect(savedTicket.passenger_name).toEqual('John Doe');
    expect(savedTicket.travel_date).toEqual('2024-12-25'); // Stored as string in DB
    expect(savedTicket.travel_time).toEqual('14:30');
    expect(savedTicket.origin).toEqual('New York');
    expect(savedTicket.destination).toEqual('Boston');
    expect(savedTicket.seat_number).toEqual('12A');
    expect(savedTicket.booking_reference).toEqual('BK123456');
    expect(savedTicket.qr_code_data).toEqual('CUSTOM_QR_DATA');
    expect(savedTicket.created_at).toBeInstanceOf(Date);
    expect(savedTicket.updated_at).toBeInstanceOf(Date);
  });

  it('should generate QR code data when not provided', async () => {
    const inputWithoutQR: CreateETicketInput = {
      ...testInput,
      qr_code_data: undefined
    };

    const result = await createETicket(inputWithoutQR);

    expect(result.qr_code_data).toEqual('TICKET:TK001:BK123456');
  });

  it('should handle different travel dates correctly', async () => {
    const futureDate = new Date('2025-06-15');
    const inputWithFutureDate: CreateETicketInput = {
      ...testInput,
      ticket_id: 'TK002',
      travel_date: futureDate
    };

    const result = await createETicket(inputWithFutureDate);

    expect(result.travel_date).toEqual(futureDate);
    expect(result.travel_date.getTime()).toEqual(futureDate.getTime());

    // Verify in database
    const savedTickets = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.ticket_id, 'TK002'))
      .execute();

    expect(savedTickets).toHaveLength(1);
    expect(savedTickets[0].travel_date).toEqual('2025-06-15');
  });

  it('should handle different time formats correctly', async () => {
    const earlyMorningInput: CreateETicketInput = {
      ...testInput,
      ticket_id: 'TK003',
      travel_time: '06:15'
    };

    const lateEveningInput: CreateETicketInput = {
      ...testInput,
      ticket_id: 'TK004',
      travel_time: '23:45'
    };

    const earlyResult = await createETicket(earlyMorningInput);
    const lateResult = await createETicket(lateEveningInput);

    expect(earlyResult.travel_time).toEqual('06:15');
    expect(lateResult.travel_time).toEqual('23:45');
  });

  it('should fail when creating duplicate ticket_id', async () => {
    // Create first ticket
    await createETicket(testInput);

    // Attempt to create duplicate ticket_id
    const duplicateInput: CreateETicketInput = {
      ...testInput,
      passenger_name: 'Jane Smith' // Different passenger, same ticket_id
    };

    expect(createETicket(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple unique tickets successfully', async () => {
    const ticket1: CreateETicketInput = {
      ...testInput,
      ticket_id: 'TK100'
    };

    const ticket2: CreateETicketInput = {
      ...testInput,
      ticket_id: 'TK200',
      passenger_name: 'Jane Smith',
      seat_number: '15B'
    };

    const result1 = await createETicket(ticket1);
    const result2 = await createETicket(ticket2);

    expect(result1.ticket_id).toEqual('TK100');
    expect(result2.ticket_id).toEqual('TK200');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both are in database
    const allTickets = await db.select()
      .from(eTicketsTable)
      .execute();

    expect(allTickets).toHaveLength(2);
    const ticketIds = allTickets.map(t => t.ticket_id);
    expect(ticketIds).toContain('TK100');
    expect(ticketIds).toContain('TK200');
  });
});