import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Contact } from "@/components/sections";
import CertificateWall from "@/components/certificate-wall";
import CertificatesHeader from "@/components/certificates-header";
import { listCertificates } from "@/lib/db";
import {
  certificateOrgs,
  certificateSkills,
  certificateStatus,
} from "@/lib/certificate-utils";

export const metadata = {
  title: "Certificates",
  description:
    "Verified certifications earned by Shib Sankar Das across AI, data science, robotics, embedded systems and software engineering — browse, filter and verify each credential.",
};

export default function CertificatesPage() {
  const certificates = listCertificates();
  const orgs = certificateOrgs(certificates);
  const skills = certificateSkills(certificates);

  const stats = [
    { value: certificates.length, label: "Certificates" },
    { value: orgs.length, label: "Organisations" },
    { value: skills.length, label: "Skills covered" },
    {
      value: certificates.filter((c) => certificateStatus(c) !== "expired").length,
      label: "Currently valid",
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        <CertificatesHeader stats={stats} />
        <section className="cert-wall relative overflow-hidden">
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <CertificateWall certificates={certificates} orgs={orgs} skills={skills} />
          </div>
        </section>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
