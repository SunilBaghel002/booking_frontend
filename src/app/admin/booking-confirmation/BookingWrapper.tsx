'use client';
import { Suspense } from 'react';
import BookingConfirmation from './page'

export default function BookingWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingConfirmation />
    </Suspense>
  );
}