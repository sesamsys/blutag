import React from "react";

type FooterLinkProps = {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
};

export default function FooterLink({
  href,
  children,
  ariaLabel,
}: FooterLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="text-foreground hover:text-primary transition-colors"
    >
      {children}
    </a>
  );
}