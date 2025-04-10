import React, { useState } from "react";
import CryptoJS from "crypto-js";

const UserAuthForm = ({ onLoginSuccess, onLogout }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "login" : "register";

    try {
      const hashedPassword = hashPassword(password);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PC-Deals-App": "true"
        },
        body: JSON.stringify({ email, password: hashedPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify({ user_id: data.user_id, email: data.email }));
        localStorage.setItem("token", data.token);
        setMessage(isLogin ? "Login successful" : "Registration successful");
        setMessageType("success");
        onLoginSuccess();
      } else {
        setMessage(data.message || `${isLogin ? "Login" : "Registration"} failed`);
        setMessageType("error");
      }
      
    } catch (err) {
      console.error("Auth error:", err);
      setMessage("Something went wrong");
      setMessageType("error");
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    setMessage("Logged out successfully");
    setMessageType("success");
  };

  const loggedInUser = JSON.parse(localStorage.getItem("user"));

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setMessage("");
  };

  const switchMode = (mode) => {
    if (mode !== isLogin) {
      setIsLogin(mode);
      resetForm();
    }
  };

  return (
    <div className="flex items-center">
      {loggedInUser ? (
        <div className="flex items-center space-x-4">
          <p className="text-gray-700">
            <span className="mr-1">👤</span>
            <span className="font-medium">{loggedInUser.email}</span>
          </p>
          <button
            onClick={handleLogoutClick}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-center space-x-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => switchMode(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 -mb-px ${
                  isLogin
                    ? "text-primary-DEFAULT border-b-2 border-primary-DEFAULT"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => switchMode(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 -mb-px ${
                  !isLogin
                    ? "text-primary-DEFAULT border-b-2 border-primary-DEFAULT"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center space-x-3">
              <div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                />
              </div>

              <div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-28 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 border border-transparent"
              >
                {isLogin ? "Login" : "Register"}
              </button>
            </form>
          </div>
        </div>
      )}
      {message && (
        <p 
          className={`ml-3 text-sm ${
            messageType === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default UserAuthForm;
