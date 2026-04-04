"use client";
import React from "react";
import AdminPage from "./admin";
import ProtectedRoute from "../lib/protectedRoute";
import { BackgroundProvider } from "../context/BackgroundContext";

const Page = () => {
  return (
    <>
      <ProtectedRoute>
        <BackgroundProvider rotationInterval={900000}>
          <AdminPage />
        </BackgroundProvider>
      </ProtectedRoute>
    </>
  );
};

export default Page;
