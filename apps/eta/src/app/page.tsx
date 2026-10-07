import { EtaSearch } from "./EtaSearch";

// Static shell: this HTML is generated at build time. Only the search form is JavaScript.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <h1 className="text-2xl font-bold">Trip Tracking</h1>
      <p className="mt-1 text-sm text-slate-500">Look up the estimated arrival time of your ride.</p>
      <EtaSearch />
    </main>
  );
}
