import "./globals.css";
import UpdateStatus from "@/components/UpdateStatus";
import CustomDialog from "@/components/CustomDialog";

export const metadata = {
  title: "",
  description: "Secure Access Only",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CustomDialog />
        <UpdateStatus />
        {children}
      </body>
    </html>
  );
}
