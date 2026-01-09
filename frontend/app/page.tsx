import Image from "next/image";

export default function Home() {
  return (
    <main className="page">
      <div className="logo-stack">
        <div className="logo-only">
          <Image
            src="/unbounded.jpeg"
            alt="Unbounded"
            width={480}
            height={480}
            priority
          />
        </div>
        <a className="primary waitlist-link" href="/waitlist">
          Join the waitlist
        </a>
      </div>
    </main>
  );
}
