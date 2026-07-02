import React from "react";
import { Img, Section } from "react-email";

// oxlint-disable-next-line node/no-process-env -- react-email preview convention, same as templates
const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export function Logo() {
  return (
    <Section className="mobile:px-4 px-6 py-6">
      <Img
        src={`${baseUrl}/public/logo-white.png`}
        alt=""
        width="32"
        height="32"
        className="block"
      />
    </Section>
  );
}
