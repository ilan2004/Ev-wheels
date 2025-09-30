// Alias module for Job Cards that re-exports the existing Service Tickets API
// This keeps internal implementation stable while letting us adopt new terminology in code.
export * from './service-tickets';
export { serviceTicketsApi as jobCardsApi } from './service-tickets';
