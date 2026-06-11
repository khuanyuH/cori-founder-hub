import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

// Shared chrome for all signed-in app pages. Login and auth routes live outside
// this group and render without the nav.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
