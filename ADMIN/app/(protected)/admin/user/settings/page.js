import React from "react";
import SettingsPage from "./SettingsPage";
import ProtectedRoute from "@/app/(protected)/lib/protectedRoute";
import { BackgroundProvider } from "@/app/(protected)/context/BackgroundContext";

const page = () => {
  return (
    <ProtectedRoute>
      <BackgroundProvider rotationInterval={900000}>
        <SettingsPage />
      </BackgroundProvider>
    </ProtectedRoute>
  );
};

export default page;
