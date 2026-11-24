"use client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LogoCarousel from "@/components/logoCarousel";

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <Header />
      <main className="isolate">
        {/* Hero section */}
        <div className="relative isolate -z-10">
          <div className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48" aria-hidden="true">
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
            />
          </div>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-6xl">Delete Account</h1>
                  <p className="relative mt-12 text-lg leading-8 text-gray-900 sm:max-w-md lg:max-w-none">
                    In order to delete your account please login{" "}
                    <a className="text-parts-pass-blue hover:text-parts-pass-green" href="/login">
                      {" "}
                      here.
                    </a>{" "}
                    Then navigate to your{" "}
                    <a className="text-parts-pass-blue hover:text-parts-pass-green" href="/account">
                      account page
                    </a>
                    . You can then scroll down to the bottom of your account page and select Delete Account.
                  </p>
                  <p className="mt-6">
                    If you have any trouble deleting your account or have any questions you can reach out to kim@partspass.app or contact us{" "}
                    <a className="text-parts-pass-blue hover:text-parts-pass-green" href="https://share.hsforms.com/1b4LSoip1SD60ZvNq7_OAFwda913">
                      here.
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team section */}
        <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-48 lg:px-8"></div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
