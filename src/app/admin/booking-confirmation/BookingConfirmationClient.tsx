"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import "../../components/BookingConfirmation.css";

interface EventDetails {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  description: string;
  totalSeats: number;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

interface SeatDetails {
  seatId: string;
  bookedBy: UserDetails;
}

async function getEventDetails(eventId: string): Promise<EventDetails> {
  if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
    throw new Error(`Invalid eventId format: ${eventId}`);
  }
  const res = await fetch(`https://booking-backend-ecru.vercel.app/api/events/${eventId}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch event details: ${res.statusText} (Status: ${res.status})`
    );
  }
  const event = await res.json();
  if (!event || !event._id) {
    throw new Error(`No event found for eventId: ${eventId}`);
  }
  return event;
}

async function getSeatDetails(
  seatIds: string[],
  bookingDate: string
): Promise<SeatDetails[]> {
  if (!seatIds.every((id) => /^[A-Z][1-9][0-9]?$/.test(id))) {
    throw new Error(`Invalid seatId format in: ${seatIds.join(", ")}`);
  }
  if (
    !bookingDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
    isNaN(new Date(bookingDate).getTime())
  ) {
    throw new Error(
      `Invalid bookingDate format or invalid date: ${bookingDate}`
    );
  }

  const res = await fetch(
    `hhttps://booking-backend-ecru.vercel.app/api/seats/by-ids?seatIds=${seatIds.join(
      ","
    )}&date=${bookingDate}`,
    { cache: "no-store", credentials: "include" }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch seat details: ${res.statusText} (Status: ${res.status})`
    );
  }

  const seats = await res.json();
  if (!seats.length || seats.length !== seatIds.length) {
    throw new Error(
      `Not all seats found for seatIds: ${seatIds.join(
        ", "
      )} and date: ${bookingDate}`
    );
  }
  if (
    !seats.every(
      (seat: SeatDetails) =>
        seat.bookedBy && seat.bookedBy.name && seat.bookedBy.email
    )
  ) {
    throw new Error(
      `Missing bookedBy data for some seats in: ${seatIds.join(", ")}`
    );
  }
  return seats;
}

export default function BookingConfirmationClient() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventDetails | null>(null);
  const [seatData, setSeatData] = useState<SeatDetails[] | null>(null);
  const [seatIdArray, setSeatIdArray] = useState<string[]>([]);
  const [bookingDate, setBookingDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    // Process query parameters using useSearchParams
    const seatIds = searchParams.get("seatIds")?.split(",") || [];
    const bookingDateParam = searchParams.get("bookingDate");
    const selectedEventParam = searchParams.get("selectedEvent");

    console.log("Processed query parameters:", {
      seatIds,
      bookingDate: bookingDateParam,
      selectedEvent: selectedEventParam,
    });

    setSeatIdArray(seatIds);
    setBookingDate(bookingDateParam);
    setSelectedEvent(selectedEventParam);

    const fetchData = async () => {
      if (
        !seatIds.length ||
        !bookingDateParam ||
        !selectedEventParam ||
        !/^[0-9a-fA-F]{24}$/.test(selectedEventParam)
      ) {
        setError(
          "Missing or invalid booking details. Please try booking again."
        );
        setIsLoading(false);
        return;
      }

      try {
        const [event, seats] = await Promise.all([
          getEventDetails(selectedEventParam),
          getSeatDetails(seatIds, bookingDateParam),
        ]);
        console.log("Event data:", event);
        console.log("Seat data:", seats);
        setEventData(event);
        setSeatData(seats);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("Fetch error:", errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (isLoading) {
    return (
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
    );
  }

  if (error || !eventData || !seatData || !bookingDate || !selectedEvent) {
    return (
      <div className="booking-confirmation-wrapper">
        <header className="booking-confirmation-header">
          <h1>Mukesh Bhati Acting School</h1>
        </header>
        <main className="booking-confirmation-main">
          <div className="error-message" aria-live="polite">
            <h2>Error</h2>
            <p>
              {error || "Failed to load booking details. Please try again."}
            </p>
            <a href="/booking">
              <button aria-label="Try booking again">Try Again</button>
            </a>
          </div>
        </main>
      </div>
    );
  }

  const dateObj = new Date(bookingDate);
  const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Group seats by bookedBy email to handle multiple users
  const bookedByUsers = seatData.reduce((acc, seat) => {
    const email = seat.bookedBy.email;
    if (!acc[email]) {
      acc[email] = {
        name: seat.bookedBy.name,
        email,
        seats: [seat.seatId],
      };
    } else {
      acc[email].seats.push(seat.seatId);
    }
    return acc;
  }, {} as Record<string, { name: string; email: string; seats: string[] }>);

  return (
    <div className="booking-confirmation-wrapper">
      <header className="booking-confirmation-header">
        <h1>Mukesh Bhati Acting School</h1>
      </header>
      <main className="booking-confirmation-main">
        <div className="success-message" aria-live="polite">
          <div className="success-icon" aria-label="Booking confirmed">
            <span className="material-icons">check</span>
          </div>
          <h2>
            Congratulations, your ticket
            {seatIdArray.length > 1 ? "s are" : " is"} booked!
          </h2>
          <p>
            Confirmation
            {Object.keys(bookedByUsers).length > 1 ? "s have" : " has"} been
            sent to the registered email
            {Object.keys(bookedByUsers).length > 1 ? "s" : ""}. Please bring a
            valid ID to the event.
          </p>
        </div>
        <div className="booking-details-card">
          <div className="event-header">
            <div className="event-info">
              <h3>{eventData.name}</h3>
              <p>{eventData.venue}</p>
            </div>
            <div className="seat-info">
              <p>Seat{seatIdArray.length > 1 ? "s" : ""}</p>
              <p className="seat-number">{seatIdArray.join(", ")}</p>
            </div>
          </div>
          <div className="divider">
            <div className="dashed-line"></div>
            <div className="divider-circles">
              <span className="circle"></span>
              <span className="circle"></span>
            </div>
          </div>
          <div className="booking-info-grid">
            {Object.values(bookedByUsers).map((user, index) => (
              <div key={user.email}>
                <p className="label">Booked By</p>
                <p className="value">{user.name}</p>
                <p className="label">Email</p>
                <p className="value">{user.email}</p>
                <p className="label">Seats</p>
                <p className="value">{user.seats.join(", ")}</p>
              </div>
            ))}
            <div>
              <p className="label">Date</p>
              <p className="value">{formattedDate}</p>
            </div>
            <div>
              <p className="label">Day</p>
              <p className="value">{dayOfWeek}</p>
            </div>
            <div>
              <p className="label">Time</p>
              <p className="value">{eventData.time}</p>
            </div>
          </div>
        </div>
        <div className="action-section">
          <a href={`/admin/seat-layout?eventId=${selectedEvent}`}>
            <button aria-label="Book another ticket">
              Book another ticket
            </button>
          </a>
        </div>
      </main>
    </div>
  );
}
