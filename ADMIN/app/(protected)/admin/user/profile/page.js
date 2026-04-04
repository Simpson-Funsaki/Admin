import React from "react";
import ProfilePage from "./ProfilePage";
import ProtectedRoute from "@/app/(protected)/lib/protectedRoute";
import { BackgroundProvider } from "@/app/(protected)/context/BackgroundContext";

const page = () => {
  return (
    <ProtectedRoute>
      <BackgroundProvider rotationInterval={900000}>
        <ProfilePage />
      </BackgroundProvider>
    </ProtectedRoute>
  );
};

export default page;
