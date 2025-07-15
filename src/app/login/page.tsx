"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaUserAlt } from "react-icons/fa";
import "../components/Login.css";

const LoginPage: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push(user.isAdmin ? "/admin" : "/");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      // Redirect based on isAdmin after successful login
      router.push(user?.isAdmin ? "/admin" : "/");
    } catch (error: any) {
      setError(`Invalid email or password: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="page">
      <div className="login-box">
        <div className="avatar-circle">
          <FaUserAlt className="user-icon" />
        </div>
        <h2 className="welcome-text">Welcome Back</h2>
        <p className="sub-text">Sign in to your account</p>

        {error && <p className="demo-warning">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon">@</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className="input"
              required
              aria-describedby={error ? "email-error" : undefined}
            />
          </div>

          <label className="label">Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              className="input"
              required
              aria-describedby={error ? "password-error" : undefined}
            />
            {/* <span className="input-icon eye-icon">👁️</span> */}
          </div>

          <div className="options">
            <Link href="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="signin-btn"
            disabled={isSubmitting || isLoading}
            aria-label="Sign In"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <Link href="/register" className="register-btn">
            <button type="button" className="signin-btn" aria-label="Register">
              Register
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
