import React, { createContext, useContext } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "./authSlice";
import { useSessionAndSocket } from "../hooks/useSessionManager";

const SessionContext = createContext<any>(null);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const rawUser = useSelector(selectUser) as any;
  const token = rawUser?.data?.token ?? rawUser?.token ?? null;
  const userObj = rawUser?.data?.user ?? rawUser?.user ?? null;

  const session = useSessionAndSocket(token, userObj ? { id: userObj.id, email: userObj.email } : null);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
};

export const useSessionContext = () => useContext(SessionContext);
