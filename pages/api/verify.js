// pages/api/verify.js - Next.js Pages Router API endpoint
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Reuse a single verifier instance with playground configuration
const selfBackendVerifier = new SelfBackendVerifier(
  "self-playground",
  "https://playground.self.xyz/api/verify",
  true, // mockPassport: false = mainnet, true = staging/testnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [], // Empty array to match playground circuit
    ofac: false, // Disable OFAC to match playground circuit
  }),
  "uuid" // userIdentifierType
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("Verification request received:", {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Extract data from the request
    const { attestationId, proof, publicSignals, userContextData } = req.body;

    console.log("Extracted verification data:", {
      attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      hasUserContextData: !!userContextData
    });

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      console.error("Missing required fields:", {
        proof: !!proof,
        publicSignals: !!publicSignals,
        attestationId: !!attestationId,
        userContextData: !!userContextData
      });
      
      return res.status(400).json({
        status: "error",
        message: "Proof, publicSignals, attestationId and userContextData are required",
        error_code: "MISSING_FIELDS"
      });
    }

    console.log("Starting verification process...");

    // Verify the proof
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data (hex string)
    );

    console.log("Verification result:", result);

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      // Verification successful - process the result
      console.log("Verification successful!");
      return res.status(200).json({
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      });
    } else {
      // Verification failed
      console.log("Verification failed:", result.isValidDetails);
      return res.status(200).json({
        status: "error",
        result: false,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result.isValidDetails,
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
      error_code: "UNKNOWN_ERROR",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
