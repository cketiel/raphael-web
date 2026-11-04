import type { Metadata } from "next";

export const metadata: Metadata = { title: "Raphael Driver Privacy Policy" };

/** Public on purpose: Google Play requires the policy at an address anyone can open. */
export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 64px", lineHeight: 1.6 }}>
      <h1>Raphael Driver Privacy Policy</h1>
      <p><strong>Effective date:</strong> November 4, 2026</p>
      <p>
        Raphael Driving Health Corp (&quot;Raphael&quot;, &quot;we&quot;) provides non-emergency medical transportation
        technology. This policy explains how the <strong>Raphael Driver</strong> Android app handles information. The app is
        for drivers working with Raphael or with a transportation provider that uses Raphael. Accounts are issued by the
        driver&apos;s office; it is not intended for the general public or for children.
      </p>

      <h2>Information we collect</h2>
      <p><strong>Account and profile.</strong> Name, username, password (sent to our servers to sign in), role, assigned route and vehicle.</p>
      <p>
        <strong>Precise location.</strong> While a route is in progress the app collects GPS position and speed, including when
        the app is in the background, shown by a persistent notification. We use it to show trip progress, calculate arrival
        times, record trips and report to the office. Collection stops when the route ends or the driver signs out.
      </p>
      <p>
        <strong>Trip information.</strong> The driver&apos;s route and passengers&apos; names, phone numbers, addresses, appointment
        details and trip notes, trip status changes and timestamps, and passenger signatures captured on the device. This may
        include information protected by health privacy laws, handled for transportation only.
      </p>
      <p>
        <strong>Photos and documents.</strong> Vehicle inspection photos and signatures, and compliance documents the driver
        uploads, such as a driver&apos;s license, background check, drug test, medical exam, insurance and course certificates.
        Some of these are sensitive personal and health information.
      </p>
      <p>
        <strong>Messages and device data.</strong> Notifications and messages with the office, text messages sent to passengers
        about their trip, a push notification token, app version and technical information needed to run the service.
      </p>

      <h2>How we use information</h2>
      <p>
        To operate trips and dispatch; to communicate with drivers and passengers; to meet the contractual and regulatory
        document requirements of transportation brokers; to bill and audit trips; and to secure, maintain and support the
        service. We do not sell personal information or use it for advertising.
      </p>

      <h2>Who receives information</h2>
      <ul>
        <li><strong>The driver&apos;s transportation provider and office staff</strong>, according to their role.</li>
        <li><strong>Brokers, clinics and funding sources</strong> involved in a trip, as needed for that trip or contract.</li>
        <li><strong>Service providers working for us:</strong> Microsoft Azure (hosting, storage and monitoring), Google (Firebase push notifications and Google Maps services), and Zonitel (text messages).</li>
        <li><strong>Other navigation apps you open</strong>, such as Google Maps or Waze, which receive the destination and follow their own privacy policies.</li>
        <li><strong>Authorities or other parties</strong> when required by law or to protect rights and safety.</li>
      </ul>

      <h2>Security</h2>
      <p>Information is sent to our servers over encrypted connections, and uploaded files are kept in private storage available only through our service, with access logged. No system is completely secure.</p>

      <h2>Retention</h2>
      <p>We keep information for as long as needed for the purposes above and to meet legal and contractual record-keeping obligations.</p>

      <h2>Your choices and account deletion</h2>
      <p>
        You can deny location, camera or notification permissions in Android settings, but parts of the app may stop working,
        and location is required to perform a route. To access, correct or delete your information or account, write to{" "}
        <a href="mailto:info@raphaeldh.com">info@raphaeldh.com</a>. We may keep records we are legally or contractually required to keep.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy and will post the new version here with its effective date.</p>

      <h2>Contact</h2>
      <p>
        Raphael Driving Health Corp, 5057 Iron Horse Way, Ave Maria, FL 34142-9529, USA<br />
        <a href="mailto:info@raphaeldh.com">info@raphaeldh.com</a> · +1 786 483 6314
      </p>
    </main>
  );
}
