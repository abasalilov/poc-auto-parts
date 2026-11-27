import Header from "@/components/header";

export default function ProductLoading() {
  return (
    <div className="bg-white">
      <Header />
      <main
        className="mx-auto max-w-7xl animate-pulse px-4 pb-16 pt-6 sm:px-6 lg:px-8"
        aria-busy="true"
        aria-label="Loading part"
      >
        <div className="mb-6 h-4 w-48 rounded bg-gray-200" />
        <div className="grid gap-8 md:grid-cols-12 md:gap-10 lg:gap-12">
          <div className="aspect-square rounded-lg bg-gray-100 md:col-span-7 md:aspect-[4/3]" />
          <div className="space-y-4 md:col-span-5">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-56 rounded-xl border border-gray-200 bg-gray-50" />
          </div>
        </div>
      </main>
    </div>
  );
}
