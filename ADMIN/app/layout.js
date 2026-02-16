import "./globals.css";
import UpdateStatus from "@/components/UpdateStatus";

export const metadata = {
  title: "ADMIN PANEL",
  description: "Secure Access Only",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UpdateStatus />
        {children}
      </body>
    </html>
  );
}
