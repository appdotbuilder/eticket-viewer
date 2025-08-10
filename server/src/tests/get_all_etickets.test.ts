import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eTicketsTable } from '../db/schema';
import { getAllETickets } from '../handlers/get_all_etickets';

describe('getAllETickets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no e-tickets exist', async () => {
    const result = await getAllETickets();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all e-tickets from the database', async () => {
    // Create test e-tickets
    const testTickets = [
      {
        ticket_id: 'TEST001',
        passenger_name: 'John Doe',
        travel_date: '2024-01-15',
        travel_time: '14:30',
        origin: 'New York',
        destination: 'Boston',
        seat_number: '12A',
        booking_reference: 'ABC123XYZ',
        qr_code_data: 'TICKET:TEST001:ABC123XYZ'
      },
      {
        ticket_id: 'TEST002',
        passenger_name: 'Jane Smith',
        travel_date: '2024-01-20',
        travel_time: '09:15',
        origin: 'Los Angeles',
        destination: 'San Francisco',
        seat_number: '8C',
        booking_reference: 'DEF456UVW',
        qr_code_data: 'TICKET:TEST002:DEF456UVW'
      }
    ];

    // Insert test tickets
    await db.insert(eTicketsTable).values(testTickets).execute();

    const result = await getAllETickets();

    expect(result).toHaveLength(2);
    
    // Verify first ticket
    const ticket1 = result.find(t => t.ticket_id === 'TEST001');
    expect(ticket1).toBeDefined();
    expect(ticket1!.passenger_name).toBe('John Doe');
    expect(ticket1!.travel_date).toBeInstanceOf(Date);
    expect(ticket1!.travel_date.toISOString().split('T')[0]).toBe('2024-01-15');
    expect(ticket1!.travel_time).toBe('14:30');
    expect(ticket1!.origin).toBe('New York');
    expect(ticket1!.destination).toBe('Boston');
    expect(ticket1!.seat_number).toBe('12A');
    expect(ticket1!.booking_reference).toBe('ABC123XYZ');
    expect(ticket1!.qr_code_data).toBe('TICKET:TEST001:ABC123XYZ');
    expect(ticket1!.id).toBeDefined();
    expect(ticket1!.created_at).toBeInstanceOf(Date);
    expect(ticket1!.updated_at).toBeInstanceOf(Date);

    // Verify second ticket
    const ticket2 = result.find(t => t.ticket_id === 'TEST002');
    expect(ticket2).toBeDefined();
    expect(ticket2!.passenger_name).toBe('Jane Smith');
    expect(ticket2!.travel_date).toBeInstanceOf(Date);
    expect(ticket2!.travel_date.toISOString().split('T')[0]).toBe('2024-01-20');
    expect(ticket2!.travel_time).toBe('09:15');
    expect(ticket2!.origin).toBe('Los Angeles');
    expect(ticket2!.destination).toBe('San Francisco');
  });

  it('should return tickets ordered by creation date (newest first)', async () => {
    // Create tickets with slight delays to ensure different timestamps
    await db.insert(eTicketsTable).values({
      ticket_id: 'FIRST',
      passenger_name: 'First Passenger',
      travel_date: '2024-01-15',
      travel_time: '10:00',
      origin: 'City A',
      destination: 'City B',
      seat_number: '1A',
      booking_reference: 'REF001',
      qr_code_data: 'TICKET:FIRST:REF001'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(eTicketsTable).values({
      ticket_id: 'SECOND',
      passenger_name: 'Second Passenger',
      travel_date: '2024-01-16',
      travel_time: '11:00',
      origin: 'City C',
      destination: 'City D',
      seat_number: '2B',
      booking_reference: 'REF002',
      qr_code_data: 'TICKET:SECOND:REF002'
    }).execute();

    const result = await getAllETickets();

    expect(result).toHaveLength(2);
    // Newest should be first (SECOND ticket was created later)
    expect(result[0].ticket_id).toBe('SECOND');
    expect(result[1].ticket_id).toBe('FIRST');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle large number of tickets efficiently', async () => {
    // Create multiple test tickets
    const testTickets = Array.from({ length: 50 }, (_, index) => ({
      ticket_id: `BULK${index.toString().padStart(3, '0')}`,
      passenger_name: `Passenger ${index + 1}`,
      travel_date: '2024-02-01',
      travel_time: '12:00',
      origin: 'Origin City',
      destination: 'Destination City',
      seat_number: `${Math.floor(index / 6) + 1}${String.fromCharCode(65 + (index % 6))}`,
      booking_reference: `REF${index.toString().padStart(3, '0')}`,
      qr_code_data: `TICKET:BULK${index.toString().padStart(3, '0')}:REF${index.toString().padStart(3, '0')}`
    }));

    await db.insert(eTicketsTable).values(testTickets).execute();

    const result = await getAllETickets();

    expect(result).toHaveLength(50);
    // Verify all tickets have proper structure
    result.forEach(ticket => {
      expect(ticket.id).toBeDefined();
      expect(ticket.ticket_id).toMatch(/^BULK\d{3}$/);
      expect(ticket.passenger_name).toMatch(/^Passenger \d+$/);
      expect(ticket.travel_date).toBeInstanceOf(Date);
      expect(ticket.created_at).toBeInstanceOf(Date);
      expect(ticket.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should properly convert date fields to Date objects', async () => {
    await db.insert(eTicketsTable).values({
      ticket_id: 'DATE_TEST',
      passenger_name: 'Date Tester',
      travel_date: '2024-03-15',
      travel_time: '15:30',
      origin: 'Test Origin',
      destination: 'Test Destination',
      seat_number: '1A',
      booking_reference: 'DATE001',
      qr_code_data: 'TICKET:DATE_TEST:DATE001'
    }).execute();

    const result = await getAllETickets();

    expect(result).toHaveLength(1);
    const ticket = result[0];
    
    // Verify date field types
    expect(ticket.travel_date).toBeInstanceOf(Date);
    expect(ticket.created_at).toBeInstanceOf(Date);
    expect(ticket.updated_at).toBeInstanceOf(Date);
    
    // Verify date values
    expect(ticket.travel_date.toISOString().split('T')[0]).toBe('2024-03-15');
    expect(typeof ticket.travel_time).toBe('string');
    expect(ticket.travel_time).toBe('15:30');
  });
});