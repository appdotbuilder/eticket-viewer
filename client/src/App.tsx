import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { ETicket } from '../../server/src/schema';
import { Plane, Calendar, Clock, MapPin, User, Hash, QrCode, Ticket } from 'lucide-react';

function App() {
  const [ticketId, setTicketId] = useState<string>('');
  const [ticket, setTicket] = useState<ETicket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) {
      setError('Please enter a ticket ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await trpc.getETicketById.query({ ticket_id: ticketId.trim() });
      if (result) {
        setTicket(result);
      } else {
        setError('No ticket found with this ID. Please check your ticket ID and try again.');
        setTicket(null);
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      setError('Failed to retrieve ticket. Please try again later.');
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setTicketId('');
    setTicket(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ticket className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">E-Ticket Viewer</h1>
          </div>
          <p className="text-gray-600 text-lg">Enter your ticket ID to view your e-ticket details</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Find Your Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter your ticket ID (e.g., DEMO123)"
                  value={ticketId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTicketId(e.target.value)}
                  className="text-lg py-3"
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !ticketId.trim()}
                className="px-8 py-3"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              {ticket && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={clearSearch}
                  className="px-6 py-3"
                >
                  New Search
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* E-Ticket Display */}
        {ticket && (
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Plane className="h-6 w-6" />
                  E-Ticket
                </CardTitle>
                <Badge variant="secondary" className="bg-white text-blue-600 font-semibold">
                  {ticket.ticket_id}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {/* Passenger Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                  <User className="h-5 w-5" />
                  Passenger Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-gray-900">{ticket.passenger_name}</p>
                  <p className="text-gray-600 mt-1">Booking Reference: <span className="font-semibold">{ticket.booking_reference}</span></p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Travel Details */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                    <MapPin className="h-5 w-5" />
                    Journey Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-semibold text-gray-900">From</p>
                        <p className="text-xl text-gray-800">{ticket.origin}</p>
                      </div>
                    </div>
                    <div className="border-l-2 border-gray-300 ml-1.5 h-6"></div>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div>
                        <p className="font-semibold text-gray-900">To</p>
                        <p className="text-xl text-gray-800">{ticket.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                    <Calendar className="h-5 w-5" />
                    Travel Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold text-gray-900">
                          {ticket.travel_date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Departure Time</p>
                        <p className="font-semibold text-gray-900 text-xl">{ticket.travel_time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Seat and QR Code */}
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Seat Assignment</h3>
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-2">Seat Number</p>
                    <p className="text-4xl font-bold text-blue-600">{ticket.seat_number}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
                    <QrCode className="h-5 w-5" />
                    QR Code
                  </h3>
                  <div className="bg-gray-100 rounded-lg p-6 text-center min-h-[140px] flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">QR Code Placeholder</p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">{ticket.qr_code_data}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Please arrive at your departure location at least 30 minutes before scheduled time.</p>
                <p className="mt-1">This e-ticket was issued on {ticket.created_at.toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Information */}
        {!ticket && !error && (
          <Card className="mt-8 bg-amber-50 border-amber-200">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-amber-800 mb-2">Demo Mode</h3>
              <p className="text-amber-700">
                Try these demo ticket IDs: <strong>DEMO123</strong> or <strong>DEMO456</strong>
              </p>
              <p className="text-amber-600 text-sm mt-2">
                Note: This is using stub data for demonstration purposes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;