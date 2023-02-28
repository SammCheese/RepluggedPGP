export const PGPCONSTS = {
  INJECTION_NAME_RX: "pgp-plugin-receive",
  INJECTION_NAME_TX: "pgp-plugin-send",
  INJECTION_NAME_UPDATECHID: "pgp-plugin-chidup",
  PGP_MESSAGE_HEADER: "-----BEGIN PGP MESSAGE-----\n\n",
  PGP_MESSAGE_FOOTER: "\n-----END PGP MESSAGE-----",
  PGP_PUBLIC_KEY_HEADER: "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\n",
  PGP_PUBLIC_KEY_FOOTER: "\n-----END PGP PUBLIC KEY BLOCK-----",
  PGP_SIGN_HEADER: "-----BEGIN PGP SIGNED MESSAGE-----\n",
  PGP_SIGNED_FOOTER: "\n-----END PGP SIGNATURE-----",
  PGP_SIGNED_REGEX:
    /(?:`{3}\n?)?(-----BEGIN PGP SIGNED MESSAGE-----)\n(.*Hash[^\r\n]*[\r\n]+)([\s\S]*?)(-----BEGIN PGP SIGNATURE-----[\s\S]*?-----END PGP SIGNATURE-----)(\n\n?`{3})?/gms,
};
