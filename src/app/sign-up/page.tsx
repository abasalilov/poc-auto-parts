import Footer from "@/components/footer";
import Header from "@/components/header";
import CreateAccountSection from "@/components/createAccountSection";

export default function SignUpPage() {
  return (
    <div>
      <Header />
      <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm space-y-10">
          <div>
            <h2 className="font-mont mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              Create account
            </h2>
            <CreateAccountSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
