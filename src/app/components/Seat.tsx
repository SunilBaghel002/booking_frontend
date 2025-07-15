import { memo } from "react";
import { MdChair } from "react-icons/md";
import "./SeatLayout.css";

interface BookedBy {
  name: string;
  email: string;
  phone?: string;
}

interface SeatData {
  _id: string;
  seatId: string;
  row: string;
  column: number;
  price: number;
  status: "available" | "booked";
  bookedBy: BookedBy | null;
}

interface SeatProps {
  seat: SeatData;
  onClick: () => void;
  isColumnSix: boolean;
  isSelected: boolean;
}

function Seat({ seat, onClick, isColumnSix, isSelected }: SeatProps) {
  const isAvailable = seat.status === "available";

  const getAriaLabel = () => {
    let label = `Seat ${seat.seatId} is ${seat.status}`;
    if (isAvailable) {
      label += isSelected ? ", selected" : ", press to select";
    } else if (seat.bookedBy) {
      label += `, booked by ${seat.bookedBy.name}`;
    }
    return label;
  };

  return (
    <button
      onClick={isAvailable ? onClick : undefined}
      onKeyDown={(e) => {
        if (isAvailable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`seat ${isAvailable ? "seat-available" : "seat-booked"} ${
        isSelected ? "seat-selected" : ""
      } ${isColumnSix ? "ml-gap" : ""}`}
      disabled={!isAvailable}
      aria-label={getAriaLabel()}
      role="button"
      tabIndex={isAvailable ? 0 : -1}
    >
      <MdChair className="chair-icon" />
      <span className="seat-id">{seat.seatId}</span>
      <div className="tooltip">
        {isAvailable ? (
          <>
            <div>Seat: {seat.seatId}</div>
            <div>Price: ₹{seat.price}</div>
          </>
        ) : (
          seat.bookedBy && (
            <>
              <div>Booked by: {seat.bookedBy.name}</div>
              {seat.bookedBy.phone && <div>Phone: {seat.bookedBy.phone}</div>}
            </>
          )
        )}
      </div>
    </button>
  );
}

export default memo(Seat, (prevProps, nextProps) => {
  return (
    prevProps.seat.seatId === nextProps.seat.seatId &&
    prevProps.seat.status === nextProps.seat.status &&
    prevProps.seat.bookedBy?.name === nextProps.seat.bookedBy?.name &&
    prevProps.seat.bookedBy?.phone === nextProps.seat.bookedBy?.phone &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isColumnSix === nextProps.isColumnSix
  );
});
