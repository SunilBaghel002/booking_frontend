"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./components/AuthContext";
import BookingLayout from "./components/BookingLayout";
import Loader from "./components/loader";

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.isAdmin) {
        router.push("/admin");
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return <Loader isLoading={true} />;
  }

  if (!user) {
    return null;
  }

  return <BookingLayout />;
}
