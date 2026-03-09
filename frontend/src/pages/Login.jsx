import { useState } from "react";
import API from "../services/api";

export default function Login() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async () => {

    const res = await API.post("/auth/login",{
      email,
      password
    });

    localStorage.setItem("token",res.data.token);

    window.location.href="/dashboard";
  };

  return (

    <div className="h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-lg w-96">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Smart Onboarding
        </h2>

        <input
        className="border p-2 w-full mb-3 rounded"
        placeholder="Email"
        onChange={(e)=>setEmail(e.target.value)}
        />

        <input
        type="password"
        className="border p-2 w-full mb-4 rounded"
        placeholder="Password"
        onChange={(e)=>setPassword(e.target.value)}
        />

        <button
        onClick={handleLogin}
        className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
        >
        Login
        </button>

      </div>

    </div>

  );
}