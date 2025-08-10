import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { type GetETicketByIdInput } from '../schema';
import { getETicketById } from '../handlers/get_eticket_by_id';

// Test e-ticket data
const testETicketData = {
  ticket_id: 'TEST123',
  passenger_name: 'John Doe',
  travel_date: '2024-01-15',
  travel_time: '14:30',
  origin: 'New York',
  destination: 'Boston',
  seat_number: '12A',
  booking_reference: 'ABC123XYZ',
  qr_code_data: 'TICKET:TEST123:ABC123XYZ'
};

const anotherTestETicketData = {
  ticket_id: 'TEST456',
  passenger_name: 'Jane Smith',
  travel_date: '2024-02-20',
  travel_time: '09:15',
  origin: 'Los Angeles',
  destination: 'San Francisco',
  seat_number: '8C',
  booking_reference: 'DEF456UVW',
  qr_code_data: 'TICKET:TEST456:DEF456UVW'
};

describe('getETicketById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return e-ticket when found by ticket_id', async () => {
    // Insert test e-ticket
    const insertResult = await db.insert(eTicketsTable)
      .values(testETicketData)
      .returning()
      .execute();

    const insertedTicket = insertResult[0];

    // Test the handler
    const input: GetETicketByIdInput = { ticket_id: 'TEST123' };
    const result = await getETicketById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(insertedTicket.id);
    expect(result!.ticket_id).toBe('TEST123');
    expect(result!.passenger_name).toBe('John Doe');
    expect(result!.travel_date).toBeInstanceOf(Date);
    expect(result!.travel_date).toEqual(new Date('2024-01-15'));
    expect(result!.travel_time).toBe('14:30');
    expect(result!.origin).toBe('New York');
    expect(result!.destination).toBe('Boston');
    expect(result!.seat_number).toBe('12A');
    expect(result!.booking_reference).toBe('ABC123XYZ');
    expect(result!.qr_code_data).toBe('TICKET:TEST123:ABC123XYZ');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ticket_id not found', async () => {
    // Don't insert any data
    const input: GetETicketByIdInput = { ticket_id: 'NONEXISTENT' };
    const result = await getETicketById(input);

    expect(result).toBeNull();
  });

  it('should return correct ticket when multiple tickets exist', async () => {
    // Insert multiple test e-tickets
    await db.insert(eTicketsTable)
      .values([testETicketData, anotherTestETicketData])
      .execute();

    // Test retrieving the second ticket
    const input: GetETicketByIdInput = { ticket_id: 'TEST456' };
    const result = await getETicketById(input);

    expect(result).not.toBeNull();
    expect(result!.ticket_id).toBe('TEST456');
    expect(result!.passenger_name).toBe('Jane Smith');
    expect(result!.travel_date).toEqual(new Date('2024-02-20'));
    expect(result!.travel_time).toBe('09:15');
    expect(result!.origin).toBe('Los Angeles');
    expect(result!.destination).toBe('San Francisco');
    expect(result!.seat_number).toBe('8C');
    expect(result!.booking_reference).toBe('DEF456UVW');
    expect(result!.qr_code_data).toBe('TICKET:TEST456:DEF456UVW');
  });

  it('should handle case-sensitive ticket_id lookup', async () => {
    // Insert test e-ticket with uppercase ticket_id
    await db.insert(eTicketsTable)
      .values({
        ...testETicketData,
        ticket_id: 'UPPER123'
      })
      .execute();

    // Test with lowercase - should not find anything
    const lowercaseInput: GetETicketByIdInput = { ticket_id: 'upper123' };
    const lowercaseResult = await getETicketById(lowercaseInput);
    expect(lowercaseResult).toBeNull();

    // Test with correct case - should find the ticket
    const uppercaseInput: GetETicketByIdInput = { ticket_id: 'UPPER123' };
    const uppercaseResult = await getETicketById(uppercaseInput);
    expect(uppercaseResult).not.toBeNull();
    expect(uppercaseResult!.ticket_id).toBe('UPPER123');
  });

  it('should handle special characters in ticket_id', async () => {
    // Insert test e-ticket with special characters
    const specialTicketId = 'ABC-123_XYZ@456';
    await db.insert(eTicketsTable)
      .values({
        ...testETicketData,
        ticket_id: specialTicketId
      })
      .execute();

    const input: GetETicketByIdInput = { ticket_id: specialTicketId };
    const result = await getETicketById(input);

    expect(result).not.toBeNull();
    expect(result!.ticket_id).toBe(specialTicketId);
  });
});