import { Suspense } from "react";
import BookingConfirmationClient from "./BookingConfirmationClient";
import "../components/BookingConfirmation.css";

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="booking-confirmation-wrapper">
          <header className="booking-confirmation-header">
            <h1>Mukesh Bhati Acting School</h1>
          </header>
          <main className="booking-confirmation-main">
            <div className="loading-message" aria-live="polite">
              <span className="spinner"></span>
              <p>Loading booking details...</p>
            </div>
          </main>
        </div>
      }
    >
      <BookingConfirmationClient />
    </Suspense>
  );
}