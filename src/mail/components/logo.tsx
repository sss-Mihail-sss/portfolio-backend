import React from "react";
import { Img, Section } from "react-email";

import { baseUrl } from "../config/base-url";

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
