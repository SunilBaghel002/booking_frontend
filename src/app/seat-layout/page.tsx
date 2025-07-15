"use client";
import "../components/SeatLayout.css";
import { FaChevronLeft } from "react-icons/fa";
import Seat from "../components/Seat";
import BookingModal from "../components/BookingModal";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Loader from "../components/loader";
import { MdChair } from "react-icons/md";
import ProtectedRoute from "../components/ProtectedRoute";
import '../components/BookingModal.css'

interface Event {
  _id: string;
  name?: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  totalSeats?: number;
}

interface SeatDetails {
  _id: string;
  seatId: string;
  row: string;
  column: number;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone?: string } | null;
}

function SeatLayout() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const eventIdFromQuery = searchParams.get("eventId");

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("https://booking-backend-ecru.vercel.app/api/events", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const fetchedEvents = await response.json();
        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0) {
          const initialEventId = eventIdFromQuery || fetchedEvents[0]._id;
          setSelectedEvent(initialEventId);
          const event = fetchedEvents.find(
            (e: Event) => e._id === initialEventId
          );
          if (event) {
            await fetchSeats(event.date);
          }
        }
      } catch (error) {
        setError(`Failed to fetch events: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [eventIdFromQuery]);

  const fetchSeats = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://booking-backend-ecru.vercel.app/api/seats?date=${date}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch seats");
      }
      const data = await response.json();
      setSeats(data);
      setError("");
    } catch (error) {
      setError("Failed to fetch seats");
      console.error("Fetch seats error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = (seat: SeatDetails) => {
    if (seat.status === "available") {
      setSelectedSeats((prev) =>
        prev.includes(seat.seatId)
          ? prev.filter((id) => id !== seat.seatId)
          : [...prev, seat.seatId]
      );
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length > 0) {
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    const event = events.find((evt) => evt._id === selectedEvent);
    if (event) fetchSeats(event.date);
    setSelectedSeats([]);
    setIsBookingModalOpen(false);
  };

  const selectedEventDetails = events.find(
    (event) => event._id === selectedEvent
  );
  const columns = Array.from({ length: 10 }, (_, i) => i + 1);
  const rows = selectedEventDetails
    ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .slice(0, Math.ceil((selectedEventDetails.totalSeats || 10) / 10))
        .split("")
    : [];

  const totalPrice = selectedSeats.reduce((sum, seatId) => {
    const seat = seats.find((s) => s.seatId === seatId);
    return sum + (seat?.price || 200);
  }, 0);

  return (
    <>
      <Loader isLoading={isLoading} />
      {!isLoading && (
        <div
          className="seat-layout-container"
          style={{ "--num-rows": rows.length } as React.CSSProperties}
        >
          <header className="seat-header">
            <Link
              href="/"
              className="back-btn"
              aria-label="Go back to booking page"
            >
              <FaChevronLeft size={18} />
            </Link>
            <h2 className="seat-title">
              CHOOSE YOUR PREFERRED SEATS WITH EASE
            </h2>
            <p className="seat-subtitle">
              Enjoy a seamless booking experience tailored to your comfort
            </p>
          </header>

          {error && <p className="error-text">{error}</p>}
          <div className="seat-back">
            <div className="seat-card">
              <div className="stage-curve">
                <div className="stage-text">STAGE</div>
              </div>
              <div className="door-label">DOOR</div>

              <div className="column-row">
                {columns.map((col) => (
                  <div key={col} className="column-label">
                    {col}
                  </div>
                ))}
              </div>

              <div className="seat-grid">
                {rows.map((row) => (
                  <div key={row} className="seat-row">
                    <div className="row-label">{row}</div>
                    {columns
                      .slice(
                        0,
                        row === rows[rows.length - 1]
                          ? (selectedEventDetails?.totalSeats || 10) % 10 || 10
                          : 10
                      )
                      .map((col) => {
                        const seatId = `${row}${col}`;
                        const seat = seats.find((s) => s.seatId === seatId);
                        return seat ? (
                          <Seat
                            key={seat.seatId}
                            seat={seat}
                            onClick={() => handleSeatClick(seat)}
                            isColumnSix={col === 6}
                            isSelected={selectedSeats.includes(seat.seatId)}
                          />
                        ) : (
                          <div
                            key={seatId}
                            className="seat-placeholder"
                            aria-hidden="true"
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
              <div className="seat-line"></div>

              <div className="seat-legend">
                <div className="legend-item">
                  <MdChair className="chair-icon legend-box avail" />
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <MdChair className="chair-icon legend-box booked" />
                  <span>Booked</span>
                </div>
                <div className="legend-item">
                  <MdChair className="chair-icon legend-box selected" />
                  <span>Selected</span>
                </div>
              </div>
            </div>
          </div>

          {selectedSeats.length > 0 && (
            <div className="proceed-section">
              <p>Selected Seats: {selectedSeats.join(", ")}</p>
              <p>Total Price: ₹{totalPrice}</p>
              <button
                className="proceed-btn"
                onClick={handleProceed}
                disabled={selectedSeats.length === 0}
              >
                Proceed to Book
              </button>
            </div>
          )}

          {isBookingModalOpen && (
            <BookingModal
              seatIds={selectedSeats}
              totalPrice={totalPrice}
              onClose={() => {
                setIsBookingModalOpen(false);
              }}
              bookingDate={
                events.find((evt) => evt._id === selectedEvent)?.date || ""
              }
              onBookingSuccess={handleBookingSuccess}
              eventId={selectedEvent}
            />
          )}
        </div>
      )}
    </>
  );
}

export default function ProtectedSeatLayout() {
  return (
    <ProtectedRoute>
      <SeatLayout />
    </ProtectedRoute>
  );
}
