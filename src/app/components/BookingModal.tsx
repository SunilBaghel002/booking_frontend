"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

interface BookingModalProps {
  seatIds: string[];
  totalPrice: number;
  onClose: () => void;
  bookingDate: string;
  onBookingSuccess: () => void;
  eventId: string;
}

interface BookingFormData {
  seatId: string;
  name: string;
  email: string;
  phone?: string;
}

interface BookingErrors {
  seatId: string;
  name: string;
  email: string;
  phone: string;
}

export default function BookingModal({
  seatIds,
  totalPrice,
  onClose,
  bookingDate,
  onBookingSuccess,
  eventId,
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Validate initial email to avoid invalid prepopulation
  const initialEmail =
    user?.email &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.email)
      ? user.email
      : "";

  const [formData, setFormData] = useState<BookingFormData[]>(
    seatIds.map((seatId) => ({
      seatId,
      name: "",
      email: initialEmail,
      phone: "",
    }))
  );
  const [errors, setErrors] = useState<BookingErrors[]>(
    seatIds.map((seatId) => ({
      seatId: "",
      name: "",
      email: initialEmail ? "" : "Invalid or missing user email",
      phone: "",
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Log user for debugging
  useEffect(() => {
    console.log("User:", user);
  }, [user]);

  if (!user) {
    console.warn("No user found, redirecting to login");
    router.push("/login");
    return null;
  }

  const validateForm = () => {
    const newErrors = seatIds.map((seatId) => ({
      seatId: "",
      name: "",
      email: "",
      phone: "",
    }));
    let isValid = true;

    formData.forEach((data, index) => {
      const trimmedName = data.name.trim();
      const trimmedEmail = data.email.trim();
      const trimmedPhone = data.phone?.trim();

      if (!trimmedName) {
        newErrors[index].name = "Name is required";
        isValid = false;
      } else if (trimmedName.length < 2) {
        newErrors[index].name = "Name must be at least 2 characters";
        isValid = false;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!trimmedEmail) {
        newErrors[index].email = "Email is required";
        isValid = false;
      } else if (!emailRegex.test(trimmedEmail)) {
        newErrors[index].email = "Invalid email format";
        isValid = false;
      }

      if (trimmedPhone && !/^(\+?\d{1,3}[-.\s]?)?\d{10}$/.test(trimmedPhone)) {
        newErrors[index].phone =
          "Invalid phone number format (10 digits or +[country code][10 digits])";
        isValid = false;
      }
    });

    setErrors(newErrors);
    console.log("Validation errors:", newErrors, "Is valid:", isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    const bookings = formData.map((data) => ({
      seatId: data.seatId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
      bookingDate,
    }));

    console.log("Sending payload:", { eventId, bookings });

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "https://bookingapi.mbactingschool.com/api/seats/book",
        { eventId, bookings },
        { withCredentials: true }
      );
      console.log("Booking response:", response.data);
      onBookingSuccess();
      router.push(
        `/booking-confirmation?seatIds=${seatIds.join(
          ","
        )}&bookingDate=${bookingDate}&selectedEvent=${eventId}`
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error ||
          "Failed to book seats. Please try again.";
        console.error("Booking error:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        setSubmitError(errorMessage);
        if (error.response?.status === 401) {
          console.warn("Redirecting to login due to authentication failure");
          router.push("/login");
        } else if (error.response?.status === 409) {
          setSubmitError("One or more seats are already booked.");
        }
      } else {
        console.error("Unexpected error:", error);
        setSubmitError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newFormData = [...formData];
    newFormData[index] = { ...newFormData[index], [name]: value };
    setFormData(newFormData);

    // Reset errors for this seat and revalidate
    const newErrors = [...errors];
    newErrors[index] = {
      seatId: "",
      name: "",
      email: "",
      phone: "",
    };

    const trimmedValue = value.trim();
    if (name === "name") {
      newErrors[index].name = !trimmedValue
        ? "Name is required"
        : trimmedValue.length < 2
        ? "Name must be at least 2 characters"
        : "";
    } else if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      newErrors[index].email = !trimmedValue
        ? "Email is required"
        : !emailRegex.test(trimmedValue)
        ? "Invalid email format"
        : "";
    } else if (name === "phone") {
      const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{10}$/;
      newErrors[index].phone =
        trimmedValue && !phoneRegex.test(trimmedValue)
          ? "Invalid phone number format (10 digits or +[country code][10 digits])"
          : "";
    }

    setErrors(newErrors);
    console.log("Form data:", newFormData, "Errors:", newErrors);
  };

  // Validate form on initial render and formData changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal show">
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Close modal"
        >
          <FaTimes size={16} />
        </button>
        <h3 className="seat-title-2">Book Seats {seatIds.join(", ")}</h3>
        <div style={{ color: "gray", marginBottom: "15px" }}>
          <p>Total Price: ₹{totalPrice}</p>
          <p>Date: {bookingDate}</p>
        </div>
        {submitError && <p className="error-text active">{submitError}</p>}
        <form onSubmit={handleSubmit} className="seat-booking-form">
          {seatIds.map((seatId, index) => (
            <div key={seatId} className="seat-booking-section">
              <h4>Seat {seatId}</h4>
              <div className="placeholders">
                <div className="input-group">
                  <label htmlFor={`name-${seatId}`} className="input-label">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData[index].name}
                    onChange={(e) => handleInputChange(index, e)}
                    className={`input-field ${
                      errors[index].name ? "input-error" : ""
                    }`}
                    placeholder="Enter name"
                    required
                  />
                  {errors[index].name && (
                    <p className="error-text active">{errors[index].name}</p>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor={`email-${seatId}`} className="input-label">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData[index].email}
                    onChange={(e) => handleInputChange(index, e)}
                    className={`input-field ${
                      errors[index].email ? "input-error" : ""
                    }`}
                    placeholder="Enter email"
                    required
                  />
                  {errors[index].email && (
                    <p className="error-text active">{errors[index].email}</p>
                  )}
                </div>

                <div className="input-group">
                  <label htmlFor={`phone-${seatId}`} className="input-label">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData[index].phone || ""}
                    onChange={(e) => handleInputChange(index, e)}
                    className={`input-field ${
                      errors[index].phone ? "input-error" : ""
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors[index].phone && (
                    <p className="error-text active">{errors[index].phone}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="button-group">
            <button
              type="submit"
              className={`book-btn ${
                isSubmitting || errors.some((e) => e.name || e.email || e.phone)
                  ? "disabled"
                  : ""
              }`}
              disabled={
                isSubmitting || errors.some((e) => e.name || e.email || e.phone)
              }
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel Booking
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
