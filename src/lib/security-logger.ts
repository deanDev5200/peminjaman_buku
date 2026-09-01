import { NextRequest } from 'next/server';
import { dbOperations } from '@/lib/db';
import { getClientMetadata } from '@/lib/request-metadata';
import type { SecurityEventType } from '@/lib/db';

export function logSecurityEvent(request: NextRequest, eventType: SecurityEventType): void {
  const metadata = getClientMetadata(request);

  dbOperations.createSecurityLog({
    event_type: eventType,
    ip_address: metadata.ipAddress,
    user_agent: metadata.userAgent,
    device_type: metadata.deviceType,
    device_name: metadata.deviceName,
    browser: metadata.browser,
    os: metadata.os,
  });
}
