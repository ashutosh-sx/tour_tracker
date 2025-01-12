import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordInput from "../../components/Input/PasswordInput";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter the password");
      return;
    }
    setError("");

    // Login API Call
    try {
      const response = await axiosInstance.post("/login", {
        email: email,
        password: password,
      });

      // Handle successful login response
      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }
    } catch (error) {
      // Handle login error
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-cyan-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl flex overflow-hidden">
        {/* Left side with background image */}
        <div className="hidden lg:block lg:w-1/2 relative bg-login-bg-img bg-cover bg-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-12 text-white">
            <h1 className="text-5xl font-bold leading-tight mb-4">
              Capture Your<br />Journeys
            </h1>
            <p className="text-lg text-white/90 max-w-md">
              Record your travel experiences and memories in your personal
              travel journal.
            </p>
          </div>
        </div>

        {/* Right side with form */}
        <div className="w-full lg:w-1/2 p-6 sm:p-8 md:p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Login</h2>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-gray-700"
                  value={email}
                  onChange={({target}) => {
                    setEmail(target.value);
                  }}
                />

                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-xs pb-1">{error}</p>}

              <button 
                type="submit" 
                className="btn-primary"
              >
                LOGIN
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-gray-500 bg-white">Or</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate("/signup")}
              >
                CREATE ACCOUNT
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


