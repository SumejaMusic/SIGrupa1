import "dotenv/config";
import { posaljiResetPasswordEmail } from "../emailService.js";

const email = process.argv[2];

if (!email) {
  console.error("Upotreba: npm run test:email -- osoba@example.com");
  process.exit(1);
}

try {
  await posaljiResetPasswordEmail(email, "Test", "test-token-za-provjeru-emaila");
  console.log(`Test email zahtjev poslan za: ${email}`);
} catch (error) {
  console.error("Test email nije poslan:", error instanceof Error ? error.message : error);
  process.exit(1);
}
