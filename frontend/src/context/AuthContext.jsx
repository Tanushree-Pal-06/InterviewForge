import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
  JSON.parse(localStorage.getItem("user")) || null
);
  const [token, setToken] = useState(localStorage.getItem("token"));

  function login(authData) {
  localStorage.setItem("token", authData.token);
  localStorage.setItem("user", JSON.stringify(authData.user));

  setToken(authData.token);
  setUser(authData.user);
}

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}