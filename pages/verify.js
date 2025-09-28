'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  SelfApp,
} from "@selfxyz/qrcode";

function VerificationPage() {
  const [selfApp, setSelfApp] = useState(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState("0x0000000000000000000000000000000000000000");

  useEffect(() => {
    try {
      // Validate environment variables
      const appName = process.env.NEXT_PUBLIC_SELF_APP_NAME || "BigBoss Verification";
      const scope = "self-playground"; // Use standard playground scope
      const endpoint = "https://playground.self.xyz/api/verify"; // Use official playground endpoint
      
      console.log("Self App Configuration:", {
        appName,
        scope,
        endpoint,
        userId
      });

      const app = new SelfAppBuilder({
        version: 2,
        appName: appName,
        scope: scope,
        endpoint: endpoint,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: "BigBoss Identity Verification",
        disclosures: {
          minimumAge: 18,
          nationality: false, // Disable nationality to match playground
          gender: false, // Disable gender to match playground
        }
      }).build();

      console.log("Self app built successfully:", app);
      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
  }, [userId]);

  const handleSuccessfulVerification = (result) => {
    console.log("Verification successful!", result);
    // You can add additional logic here, like redirecting or updating state
  };

  const handleVerificationError = (error) => {
    console.error("Verification failed:", error);
    // You can add error handling UI here
  };

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app</p>
      
      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={handleVerificationError}
        />
      ) : (
        <div>Loading QR Code...</div>
      )}
    </div>
  );
}

export default VerificationPage;