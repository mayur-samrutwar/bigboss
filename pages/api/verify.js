import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Reuse a single verifier instance
const selfBackendVerifier = new SelfBackendVerifier(
  "self-playground",
  "https://playground.self.xyz/api/verify",
  false, // mockPassport: false = mainnet, true = staging/testnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["IRN", "PRK", "RUS", "SYR"],
    ofac: true,
  }),
  "hex" // userIdentifierType
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Extract data from the request
    const { attestationId, proof, publicSignals, userContextData } = req.body;

    console.log('Received verification request:', {
      attestationId,
      hasProof: !!proof,
      hasPublicSignals: !!publicSignals,
      hasUserContextData: !!userContextData,
      userContextDataLength: userContextData?.length
    });

    // Verify all required fields are present
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      console.log('Missing required fields:', {
        proof: !!proof,
        publicSignals: !!publicSignals,
        attestationId: !!attestationId,
        userContextData: !!userContextData
      });
      
      return res.status(200).json({
        message: "Proof, publicSignals, attestationId and userContextData are required",
        status: "error",
        result: false,
        error_code: "MISSING_FIELDS"
      });
    }

    // Verify the proof
    console.log('Starting verification...');
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data (hex string)
    );

    console.log('Verification result:', {
      isValid: result.isValidDetails.isValid,
      hasDiscloseOutput: !!result.discloseOutput,
      discloseOutputKeys: result.discloseOutput ? Object.keys(result.discloseOutput) : []
    });

    // Check if verification was successful
    if (result.isValidDetails.isValid) {
      // Extract nullifier and other important data
      const responseData = {
        nullifier: result.discloseOutput?.nullifier || null,
        credentialSubject: result.discloseOutput,
        isValidDetails: result.isValidDetails,
        timestamp: new Date().toISOString()
      };

      console.log('Verification successful, nullifier:', responseData.nullifier);

      // Verification successful - process the result
      return res.status(200).json({
        status: "success",
        result: true,
        ...responseData
      });
    } else {
      // Verification failed
      console.log('Verification failed:', result.isValidDetails);
      
      return res.status(200).json({
        status: "error",
        result: false,
        reason: "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: result.isValidDetails,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    
    return res.status(200).json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
      error_code: "UNKNOWN_ERROR",
      timestamp: new Date().toISOString()
    });
  }
}
