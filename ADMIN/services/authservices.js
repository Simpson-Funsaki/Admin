"use client";

import { useAuth } from "@/app/(protected)/context/authContext";

export default function useApi() {
  const { apiFetch } = useAuth();
  return apiFetch;
}