import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { type UpdateETicketInput } from '../schema';
import { updateETicket } from '../handlers/update_eticket';
import { eq } from 'drizzle-orm';

// Helper function to create a test e-ticket
const createTestETicket = async (): Promise<{ id: number; ticket_id: string }> => {
  const testTicket = {
    ticket_id: 'TEST_TICKET_001',
    passenger_name: 'John Doe',
    travel_date: '2024-01-15', // Store as string in database
    travel_time: '10:30',
    origin: 'New York',
    destination: 'Boston',
    seat_number: '12A',
    booking_reference: 'REF123456',
    qr_code_data: 'QR_DATA_ORIGINAL'
  };

  const result = await db.insert(eTicketsTable)
    .values(testTicket)
    .returning()
    .execute();

  return { id: result[0].id, ticket_id: result[0].ticket_id };
};

describe('updateETicket', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an existing e-ticket with all fields', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Update all fields
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      passenger_name: 'Jane Smith',
      travel_date: new Date('2024-02-20'),
      travel_time: '14:45',
      origin: 'Chicago',
      destination: 'Denver',
      seat_number: '15B',
      booking_reference: 'NEW_REF789',
      qr_code_data: 'UPDATED_QR_DATA'
    };

    const result = await updateETicket(updateInput);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(testTicket.id);
    expect(result?.ticket_id).toEqual('TEST_TICKET_001'); // Should not change
    expect(result?.passenger_name).toEqual('Jane Smith');
    expect(result?.travel_date).toEqual(new Date('2024-02-20'));
    expect(result?.travel_time).toEqual('14:45');
    expect(result?.origin).toEqual('Chicago');
    expect(result?.destination).toEqual('Denver');
    expect(result?.seat_number).toEqual('15B');
    expect(result?.booking_reference).toEqual('NEW_REF789');
    expect(result?.qr_code_data).toEqual('UPDATED_QR_DATA');
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Update only passenger name and destination
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      passenger_name: 'Updated Name',
      destination: 'Miami'
    };

    const result = await updateETicket(updateInput);

    expect(result).toBeDefined();
    expect(result?.passenger_name).toEqual('Updated Name');
    expect(result?.destination).toEqual('Miami');
    
    // Other fields should remain unchanged
    expect(result?.origin).toEqual('New York');
    expect(result?.travel_time).toEqual('10:30');
    expect(result?.seat_number).toEqual('12A');
    expect(result?.booking_reference).toEqual('REF123456');
  });

  it('should update the ticket in database', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Update the ticket
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      passenger_name: 'Database Updated Name',
      travel_time: '16:20'
    };

    await updateETicket(updateInput);

    // Verify the update was persisted to database
    const dbTickets = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.id, testTicket.id))
      .execute();

    expect(dbTickets).toHaveLength(1);
    expect(dbTickets[0].passenger_name).toEqual('Database Updated Name');
    expect(dbTickets[0].travel_time).toEqual('16:20');
    expect(dbTickets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Get the original updated_at timestamp
    const originalTicket = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.id, testTicket.id))
      .execute();
    
    const originalUpdatedAt = originalTicket[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the ticket
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      passenger_name: 'Timestamp Test'
    };

    const result = await updateETicket(updateInput);

    expect(result?.updated_at).toBeInstanceOf(Date);
    expect(result?.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should return null for non-existent ticket id', async () => {
    const updateInput: UpdateETicketInput = {
      id: 999999, // Non-existent ID
      passenger_name: 'Should Not Work'
    };

    const result = await updateETicket(updateInput);

    expect(result).toBeNull();
  });

  it('should handle partial updates with date and time validation', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Update with new date and time
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      travel_date: new Date('2024-12-25'),
      travel_time: '23:59'
    };

    const result = await updateETicket(updateInput);

    expect(result).toBeDefined();
    expect(result?.travel_date).toEqual(new Date('2024-12-25'));
    expect(result?.travel_time).toEqual('23:59');
    
    // Verify other fields remain unchanged
    expect(result?.passenger_name).toEqual('John Doe');
    expect(result?.origin).toEqual('New York');
    expect(result?.destination).toEqual('Boston');
  });

  it('should preserve created_at timestamp when updating', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Get the original created_at timestamp
    const originalTicket = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.id, testTicket.id))
      .execute();
    
    const originalCreatedAt = originalTicket[0].created_at;

    // Update the ticket
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      passenger_name: 'Preserve Created At Test'
    };

    const result = await updateETicket(updateInput);

    expect(result?.created_at).toEqual(originalCreatedAt);
    expect(result?.updated_at).not.toEqual(originalCreatedAt);
  });

  it('should handle empty update (only updating timestamp)', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Update with only the ID (no other fields)
    const updateInput: UpdateETicketInput = {
      id: testTicket.id
    };

    const result = await updateETicket(updateInput);

    expect(result).toBeDefined();
    expect(result?.id).toEqual(testTicket.id);
    expect(result?.updated_at).toBeInstanceOf(Date);
    
    // All original fields should remain the same
    expect(result?.passenger_name).toEqual('John Doe');
    expect(result?.ticket_id).toEqual('TEST_TICKET_001');
    expect(result?.origin).toEqual('New York');
  });

  it('should handle date conversion correctly', async () => {
    // Create test e-ticket
    const testTicket = await createTestETicket();

    // Update with a specific date
    const testDate = new Date('2024-06-15');
    const updateInput: UpdateETicketInput = {
      id: testTicket.id,
      travel_date: testDate
    };

    const result = await updateETicket(updateInput);

    expect(result).toBeDefined();
    expect(result?.travel_date).toBeInstanceOf(Date);
    expect(result?.travel_date.toISOString().split('T')[0]).toEqual('2024-06-15');

    // Verify the date was stored correctly in the database
    const dbTickets = await db.select()
      .from(eTicketsTable)
      .where(eq(eTicketsTable.id, testTicket.id))
      .execute();

    expect(dbTickets[0].travel_date).toEqual('2024-06-15');
  });
});