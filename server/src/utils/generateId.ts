import { nanoid } from 'nanoid';

export function generateRoomId(): string {
  return nanoid(8);
}

export function generateSessionId(): string {
  return nanoid(21);
}

export function generateId(): string {
  return nanoid(12);
}
