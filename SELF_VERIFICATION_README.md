# Self Protocol Verification Test

This test page allows you to verify identity using the Self Protocol with offchain verification, focusing on extracting the nullifier for verification purposes.

## Setup

1. **Environment Variables**: Make sure your `.env.local` file has the Self Protocol configuration:
   ```
   NEXT_PUBLIC_SELF_APP_NAME=BigBoss Verification
   NEXT_PUBLIC_SELF_SCOPE=bigboss-verification
   NEXT_PUBLIC_SELF_ENDPOINT=https://your-domain.com/api/verify
   ```

2. **Public Endpoint**: The verification endpoint must be publicly accessible (not localhost). For local development, use ngrok to tunnel your localhost endpoint.

## Usage

1. **Access the Test Page**: 
   - Navigate to `/verify` in your browser
   - Or click the "SELF VERIFY" button in the main app

2. **Verification Process**:
   - The page displays a QR code
   - Scan the QR code with the Self app
   - The app will process the verification
   - Results will be displayed on the right side

3. **Key Information**:
   - **Nullifier**: The most important piece of data for verification
   - **Verification Status**: Success/failure status
   - **Timestamp**: When the verification occurred
   - **Other Data**: Additional verification details

## Features

- **Modern UI**: Clean, professional design with Tailwind CSS
- **Real-time Updates**: Live verification status updates
- **Nullifier Focus**: Prominently displays the nullifier value
- **Error Handling**: Comprehensive error reporting
- **Configuration Display**: Shows current Self Protocol settings

## API Endpoint

The verification API endpoint (`/api/verify`) handles:
- Proof verification using SelfBackendVerifier
- Nullifier extraction
- Error handling and logging
- CORS support for frontend integration

## Dependencies

- `@selfxyz/qrcode`: QR code generation and display
- `@selfxyz/core`: Core utilities and verification
- `ethers`: Ethereum utilities for address handling

## Notes

- The verification uses staging/testnet mode (`mockPassport: false`)
- Minimum age requirement: 18 years
- Excluded countries: IRN, PRK, RUS, SYR
- OFAC compliance enabled
