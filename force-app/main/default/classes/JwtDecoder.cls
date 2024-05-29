public with sharing class JwtDecoder {

    @AuraEnabled(cacheable=true)
    // Function to decode a JWT token and extract its expiry time
    public static Long getExpiryTime(String jwtToken) {
        // Split the token into its three parts: header, payload, and signature
        List<String> tokenParts = jwtToken.split('\\.');

        
        // JWT tokens have three parts: header, payload, and signature
        if (tokenParts.size() != 3) {
            System.debug('Invalid JWT token format');
            return null;
        }

        // The payload is the second part of the token
        String payload = tokenParts[1];

        // Base64 decode the payload
        String decodedPayload = EncodingUtil.base64Decode(payload).toString();

        // Parse the JSON payload
        Map<String, Object> payloadMap = (Map<String, Object>) JSON.deserializeUntyped(decodedPayload);

        // Extract the expiry time from the payload
        Object expObj = payloadMap.get('exp');
        if (expObj == null) {
            System.debug('Expiry time not found in JWT token');
            return null;
        }

        // Convert expiry time to milliseconds
        Long expiryTimeSeconds = (Long)expObj;
        Long expiryTimeMillis = expiryTimeSeconds * 1000;

        return expiryTimeMillis;
    }
}