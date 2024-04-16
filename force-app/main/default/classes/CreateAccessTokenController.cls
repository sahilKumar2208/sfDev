public with sharing class CreateAccessTokenController {

    // Method to generate a JWT token
    @AuraEnabled(cacheable=true)
    public static String generateToken(String email, Integer expirationMinutes) {
        // Get the current timestamp
        Datetime now = Datetime.now();
        
        // Create the JWT header
        Map<String, Object> header = new Map<String, Object> {
            'alg' => 'HS256',
            'typ' => 'JWT'
        };
        
        // Create the JWT payload
        Map<String, Object> payload = new Map<String, Object> {
            'email'=> email,
            'exp' => now.addMinutes(expirationMinutes).getTime() / 1000,
            'iat' => now.getTime() / 1000
        };
        
        // Encode the header and payload
        String encodedHeader = EncodingUtil.base64Encode(Blob.valueOf(JSON.serialize(header, true)));
        String encodedPayload = EncodingUtil.base64Encode(Blob.valueOf(JSON.serialize(payload, true)));

        System.debug('encoded header ->' + encodedHeader);
        System.debug('encoded payload ->' + encodedPayload);
        
        // Create the signature
        Blob secret = Blob.valueOf('dddyegvvdg5');
        Blob signatureBlob = Crypto.generateMac('HmacSHA256', Blob.valueOf(encodedHeader + '.' + encodedPayload), secret);
        String encodedSignature = EncodingUtil.base64Encode(signatureBlob);
        
        // Combine the header, payload, and signature to create the JWT
        return encodedHeader + '.' + encodedPayload + '.' + encodedSignature;
    }
}

