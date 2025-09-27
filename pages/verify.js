'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import { ethers } from "ethers";
import { QRCodeSVG } from 'qrcode.react';

function VerificationTestPage() {
  const [universalLink, setUniversalLink] = useState("https://redirect.self.xyz?selfApp=%7B%22version%22%3A2%2C%22appName%22%3A%22BigBoss%20Verification%22%2C%22scope%22%3A%22bigboss-verification%22%2C%22endpoint%22%3A%22https%3A%2F%2F1e6f02a12479.ngrok-free.app%2Fapi%2Fverify%22%2C%22logoBase64%22%3A%22https%3A%2F%2Fi.postimg.cc%2FmrmVf9hm%2Fself.png%22%2C%22userId%22%3A%220x0000000000000000000000000000000000000000%22%2C%22endpointType%22%3A%22staging_https%22%2C%22userIdType%22%3A%22hex%22%2C%22userDefinedData%22%3A%22BigBoss%20Test%20Verification%22%2C%22disclosures%22%3A%7B%22minimumAge%22%3A18%2C%22nationality%22%3Atrue%2C%22gender%22%3Atrue%7D%7D");
  const [userId] = useState(ethers.ZeroAddress);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState("https://redirect.self.xyz?selfApp=%7B%22version%22%3A2%2C%22appName%22%3A%22BigBoss%20Verification%22%2C%22scope%22%3A%22bigboss-verification%22%2C%22endpoint%22%3A%22https%3A%2F%2F1e6f02a12479.ngrok-free.app%2Fapi%2Fverify%22%2C%22logoBase64%22%3A%22https%3A%2F%2Fi.postimg.cc%2FmrmVf9hm%2Fself.png%22%2C%22userId%22%3A%220x0000000000000000000000000000000000000000%22%2C%22endpointType%22%3A%22staging_https%22%2C%22userIdType%22%3A%22hex%22%2C%22userDefinedData%22%3A%22BigBoss%20Test%20Verification%22%2C%22disclosures%22%3A%7B%22minimumAge%22%3A18%2C%22nationality%22%3Atrue%2C%22gender%22%3Atrue%7D%7D");

  useEffect(() => {
    // Use the working QR code data directly
    const workingQrData = "https://redirect.self.xyz?selfApp=%7B%22version%22%3A2%2C%22appName%22%3A%22BigBoss%20Verification%22%2C%22scope%22%3A%22bigboss-verification%22%2C%22endpoint%22%3A%22https%3A%2F%2F1e6f02a12479.ngrok-free.app%2Fapi%2Fverify%22%2C%22logoBase64%22%3A%22https%3A%2F%2Fi.postimg.cc%2FmrmVf9hm%2Fself.png%22%2C%22userId%22%3A%220x0000000000000000000000000000000000000000%22%2C%22endpointType%22%3A%22staging_https%22%2C%22userIdType%22%3A%22hex%22%2C%22userDefinedData%22%3A%22BigBoss%20Test%20Verification%22%2C%22disclosures%22%3A%7B%22minimumAge%22%3A18%2C%22nationality%22%3Atrue%2C%22gender%22%3Atrue%7D%7D";
    
    console.log("Setting QR data:", workingQrData);
    setUniversalLink(workingQrData);
    setQrData(workingQrData);
  }, [userId]);

  const handleSuccessfulVerification = (result) => {
    console.log("Verification successful!", result);
    setVerificationResult({
      status: "success",
      data: result,
      timestamp: new Date().toISOString()
    });
    setIsLoading(false);
  };

  const handleVerificationError = (error) => {
    console.error("Verification error:", error);
    setVerificationResult({
      status: "error",
      error: error,
      timestamp: new Date().toISOString()
    });
    setIsLoading(false);
  };

  const handleVerificationStart = () => {
    setIsLoading(true);
    setVerificationResult(null);
  };

  const checkVerificationStatus = async () => {
    setIsLoading(true);
    try {
      // This would typically be called by the Self app after verification
      // For testing purposes, we'll simulate a verification result
      const mockResult = {
        nullifier: "0x" + Math.random().toString(16).substr(2, 64),
        credentialSubject: {
          nationality: "US",
          gender: "Male",
          age: 25,
          verified: true
        },
        timestamp: new Date().toISOString()
      };
      
      setVerificationResult({
        status: "success",
        data: mockResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setVerificationResult({
        status: "error",
        error: error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Self Protocol Verification Test
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            Scan the QR code with the Self app to verify your identity
          </p>
          <p className="text-sm text-gray-300">
            This test focuses on extracting the nullifier for verification purposes
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* QR Code Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Verification QR Code
              </h2>
              
              {qrData ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG 
                      value={qrData} 
                      size={256}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-white text-sm mb-2">Scan with Self app</p>
                    <p className="text-gray-300 text-xs break-all max-w-xs">
                      {universalLink}
                    </p>
                    
                    <button
                      onClick={checkVerificationStatus}
                      className="mt-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-2 px-4 rounded-lg border-2 border-indigo-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50"
                    >
                      Test Verification (Mock)
                    </button>
                  </div>
                  
                  {isLoading && (
                    <div className="mt-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <p className="text-white mt-2">Verifying...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                    <p className="text-white">Loading QR Code...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Verification Results
              </h2>
              
              {verificationResult ? (
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                    verificationResult.status === 'success' 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {verificationResult.status === 'success' ? '✓ Verified' : '✗ Failed'}
                  </div>
                  
                  {/* Timestamp */}
                  <p className="text-sm text-gray-300">
                    {new Date(verificationResult.timestamp).toLocaleString()}
                  </p>
                  
                  {/* Results Data */}
                  <div className="bg-black/20 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-3">
                      {verificationResult.status === 'success' ? 'Verification Data' : 'Error Details'}
                    </h3>
                    
                    {verificationResult.status === 'success' ? (
                      <div className="space-y-3">
                        {/* Nullifier - Most Important */}
                        {verificationResult.data?.nullifier && (
                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <h4 className="text-blue-300 font-medium mb-1">Nullifier</h4>
                            <p className="text-blue-100 font-mono text-sm break-all">
                              {verificationResult.data.nullifier}
                            </p>
                          </div>
                        )}
                        
                        {/* Other verification data */}
                        <div className="space-y-2">
                          {Object.entries(verificationResult.data || {}).map(([key, value]) => (
                            key !== 'nullifier' && (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-300 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="text-white font-mono text-sm">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-300">
                        <p className="font-medium">Error:</p>
                        <p className="text-sm mt-1">
                          {verificationResult.error?.message || 'Unknown error occurred'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-300">
                    Scan the QR code to see verification results here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configuration Info */}
          <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-300">App Name:</span>
                <span className="text-white ml-2">{process.env.NEXT_PUBLIC_SELF_APP_NAME || "BigBoss Verification"}</span>
              </div>
              <div>
                <span className="text-gray-300">Scope:</span>
                <span className="text-white ml-2">{process.env.NEXT_PUBLIC_SELF_SCOPE || "bigboss-verification"}</span>
              </div>
              <div>
                <span className="text-gray-300">Endpoint:</span>
                <span className="text-white ml-2">{process.env.NEXT_PUBLIC_SELF_ENDPOINT || "Not configured"}</span>
              </div>
              <div>
                <span className="text-gray-300">User ID:</span>
                <span className="text-white ml-2 font-mono">{userId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationTestPage;
