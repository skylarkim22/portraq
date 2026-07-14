import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";

const AppLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <Sidebar />
      <main className="md:ml-60">{children}</main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex items-center gap-2 rounded-xl bg-[#1c1c1e] px-5 py-3 text-[13px] font-semibold text-white shadow-lg",
          },
        }}
      />
    </>
  );
};

export default AppLayout;
