import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createETicketInputSchema, 
  getETicketByIdInputSchema, 
  updateETicketInputSchema 
} from './schema';

// Import handlers
import { createETicket } from './handlers/create_eticket';
import { getETicketById } from './handlers/get_eticket_by_id';
import { getAllETickets } from './handlers/get_all_etickets';
import { updateETicket } from './handlers/update_eticket';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new e-ticket
  createETicket: publicProcedure
    .input(createETicketInputSchema)
    .mutation(({ input }) => createETicket(input)),

  // Get e-ticket by ticket ID (main user-facing endpoint)
  getETicketById: publicProcedure
    .input(getETicketByIdInputSchema)
    .query(({ input }) => getETicketById(input)),

  // Get all e-tickets (for admin/testing purposes)
  getAllETickets: publicProcedure
    .query(() => getAllETickets()),

  // Update an existing e-ticket
  updateETicket: publicProcedure
    .input(updateETicketInputSchema)
    .mutation(({ input }) => updateETicket(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`E-Tickets TRPC server listening at port: ${port}`);
}

start();