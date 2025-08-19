/**
 * Utility functions for handling guest users
 */

// Generate a guest number based on IP or session ID
export function generateGuestNumber(identifier?: string): string {
  if (!identifier) {
    // Fallback to random number if no identifier
    return `Guest${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  }
  
  // Simple hash function to convert IP/session to guest number
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive 4-digit number
  const guestNum = Math.abs(hash) % 10000;
  return `Guest${guestNum.toString().padStart(4, '0')}`;
}

// Generate guest email for internal tracking
export function generateGuestEmail(guestNumber: string): string {
  return `${guestNumber.toLowerCase()}@guest.local`;
}

// Check if an email is a guest email
export function isGuestEmail(email: string): boolean {
  return email.endsWith('@guest.local');
}

// Extract guest number from guest email
export function getGuestNumberFromEmail(email: string): string | null {
  if (!isGuestEmail(email)) return null;
  const match = email.match(/^(guest\d{4})@guest\.local$/i);
  return match ? match[1] : null;
}

// Check if two guest emails belong to the same guest
export function isSameGuest(email1: string, email2: string): boolean {
  if (!isGuestEmail(email1) || !isGuestEmail(email2)) return false;
  return email1.toLowerCase() === email2.toLowerCase();
}

// Get user identifier from request (IP-based for now)
export function getUserIdentifier(request: Request): string {
  // In production, you might want to use:
  // - X-Forwarded-For header
  // - CF-Connecting-IP header (Cloudflare)
  // - Session ID from cookies
  
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  // Fallback to user-agent + current hour (for demo purposes)
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hour = new Date().getHours();
  return `${userAgent.substring(0, 20)}-${hour}`;
}
