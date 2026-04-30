const DEFAULT_ALLOWED_DOMAINS = ["nebwork.id"];

const getAllowedDomains = () => {
  const configured = process.env.ALLOWED_EMAIL_DOMAINS;

  if (!configured) {
    return DEFAULT_ALLOWED_DOMAINS;
  }

  const domains = configured
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  return domains.length > 0 ? domains : DEFAULT_ALLOWED_DOMAINS;
};

const isAllowedEmailDomain = (email = "") => {
  if (!email || !email.includes("@")) {
    return false;
  }

  const domain = email.split("@").pop().trim().toLowerCase();
  return getAllowedDomains().includes(domain);
};

const getAllowedDomainsMessage = () =>
  `Email domain is not allowed. Use one of: ${getAllowedDomains().join(", ")}`;

module.exports = {
  getAllowedDomains,
  getAllowedDomainsMessage,
  isAllowedEmailDomain,
};
