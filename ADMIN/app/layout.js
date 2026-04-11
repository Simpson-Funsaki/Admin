import "./globals.css";
import UpdateStatus from "@/components/UpdateStatus";
import CustomDialog from "@/components/CustomDialog";
import ServiceWorker from "../components/ServiceWorker";

export const metadata = {
  title: "",
  description: "Secure Access Only",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorker /> 
        <CustomDialog />
        <UpdateStatus />
        {children}
      </body>
    </html>
  );
}